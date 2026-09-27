// Backup relay for online play.
//
// When two devices can't link up directly (common on mobile data, where
// carriers block device-to-device connections), the game passes its messages
// through a free public MQTT server instead. Only button presses and game
// setup messages travel this way, addressed to a topic named after the room
// code; each side also locks onto the other's random id, so nobody else can
// join a room in progress.
//
// This file is a tiny MQTT 3.1.1 client over secure WebSockets: just enough
// to connect, subscribe, publish (QoS 0) and keep the connection alive.
(() => {
  const enc = new TextEncoder();
  const dec = new TextDecoder();

  function str(s) {
    const b = enc.encode(s);
    return [b.length >> 8, b.length & 255, ...b];
  }

  function packet(type, body) {
    const head = [type];
    let x = body.length;
    do {
      let byte = x % 128;
      x = Math.floor(x / 128);
      if (x > 0) byte |= 128;
      head.push(byte);
    } while (x > 0);
    const out = new Uint8Array(head.length + body.length);
    out.set(head, 0);
    out.set(body, head.length);
    return out;
  }

  SF.Mqtt = class {
    constructor(url) {
      this.url = url;
      this.buf = new Uint8Array(0);
      this.pid = 1;
      this.ready = false;
      this.onmessage = null;
      this.onclose = null;
    }

    connect(timeout = 6000) {
      return new Promise((resolve, reject) => {
        let ws;
        try {
          ws = new WebSocket(this.url, ['mqtt']);
        } catch (e) {
          reject(e);
          return;
        }
        this.ws = ws;
        ws.binaryType = 'arraybuffer';
        const timer = setTimeout(() => {
          reject(new Error('timeout'));
          this.close();
        }, timeout);
        this.connected = () => {
          clearTimeout(timer);
          resolve(this);
        };
        this.refused = () => {
          clearTimeout(timer);
          reject(new Error('refused'));
          this.close();
        };
        ws.onopen = () => {
          const r = SF.realRandom || Math.random;
          const id = 'sf' + Math.floor(r() * 1e16).toString(36) + Date.now().toString(36).slice(-5);
          // CONNECT: protocol "MQTT" level 4, clean session, keep-alive 45s
          ws.send(packet(0x10, [...str('MQTT'), 4, 2, 0, 45, ...str(id.slice(0, 23))]));
        };
        ws.onmessage = (e) => this.feed(new Uint8Array(e.data));
        ws.onerror = () => {
          clearTimeout(timer);
          reject(new Error('socket error'));
        };
        ws.onclose = () => {
          clearTimeout(timer);
          clearInterval(this.pinger);
          const was = this.ready;
          this.ready = false;
          reject(new Error('closed'));
          if (was && this.onclose) this.onclose();
        };
      });
    }

    feed(bytes) {
      const b = new Uint8Array(this.buf.length + bytes.length);
      b.set(this.buf, 0);
      b.set(bytes, this.buf.length);
      this.buf = b;
      for (;;) {
        if (this.buf.length < 2) return;
        let len = 0;
        let mul = 1;
        let i = 1;
        let byte;
        do {
          if (i >= this.buf.length) return;
          byte = this.buf[i++];
          len += (byte & 127) * mul;
          mul *= 128;
        } while (byte & 128);
        if (this.buf.length < i + len) return;
        const type = this.buf[0];
        const body = this.buf.subarray(i, i + len);
        this.buf = this.buf.slice(i + len);
        this.handle(type, body);
      }
    }

    handle(type, body) {
      const kind = type >> 4;
      if (kind === 2) {
        // CONNACK
        if (body[1] === 0) {
          this.ready = true;
          this.pinger = setInterval(() => this.send(new Uint8Array([0xc0, 0])), 25000);
          this.connected();
        } else this.refused();
      } else if (kind === 3) {
        // PUBLISH
        const qos = (type >> 1) & 3;
        const tlen = (body[0] << 8) | body[1];
        const topic = dec.decode(body.subarray(2, 2 + tlen));
        const payload = dec.decode(body.subarray(2 + tlen + (qos ? 2 : 0)));
        if (this.onmessage) this.onmessage(topic, payload);
      }
      // SUBACK / PINGRESP need no action.
    }

    send(bytes) {
      if (this.ws && this.ws.readyState === 1) this.ws.send(bytes);
    }

    subscribe(topic) {
      const id = this.pid++;
      this.send(packet(0x82, [id >> 8, id & 255, ...str(topic), 0]));
    }

    publish(topic, text) {
      this.send(packet(0x30, [...str(topic), ...enc.encode(text)]));
    }

    close() {
      clearInterval(this.pinger);
      try {
        this.send(new Uint8Array([0xe0, 0]));
        if (this.ws) this.ws.close();
      } catch (e) {
        /* already closed */
      }
    }
  };

  SF.Relay = {
    // Free public MQTT servers, tried in this order. The room maker listens on
    // all of them, so the friend can use whichever one they can reach.
    brokers: ['wss://broker.hivemq.com:8884/mqtt', 'wss://broker.emqx.io:8084/mqtt', 'wss://test.mosquitto.org:8081/mqtt'],
    topic: (code, who) => 'sprite-fighters/v1/' + code + '/' + who,
  };
})();
