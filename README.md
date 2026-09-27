# 🦘 Sprite Fighters: Outback Brawl 🐨

A cartoon fighting game starring Aussie animals, suitable for all ages. Play **1 player vs CPU**, **2 players on one device**, battle through **Arcade** mode, or **🌏 play online** against a friend on another device. It runs in the browser on computers, iPads and phones, with no install needed.

## Fighters (16!)

| Fighter | Style | ⭐ Special | ⚡ Ultimate |
|---|---|---|---|
| 🦘 **Kip the Kangaroo** | All-rounder | Tail-Balance Double Kick | **Boomer Bounce**: leaps off-screen and crashes down with a shockwave (jump to dodge!) |
| 🐨 **Koko the Koala** | Sleepy tank. Crouch still to power-nap and heal a little | Eucalyptus Leaf Toss | **Gumtree Grumble**: a giant gum tree drops on the opponent |
| 🐦 **Kooka the Kookaburra** | Aerial ace. Double jump and slow fall | Dive-Bomb Peck (works in the air) | **Laugh Attack**: a laugh that makes foes dizzy, then three swoops |
| 🐊 **Captain Croc** | Grappler. Takes less damage | Tail Sweep (hits both sides) | **Death Roll... of Fun!**: an unblockable grab, roll and throw |
| 🦔 **Spike the Echidna** | Prickly defender. Attackers get pricked when he blocks | Spiky Ball Roll | **Quill Storm**: hovers in a spinning ball firing quills, then a quill burst |
| 🦆 **Dotty the Platypus** | Tricky swimmer. Can crawl while crouching | Bill Slap Splash (a ground wave that trips) | **Billabong Blast**: dives underground, erupts as a geyser, then bill-slaps in mid-air |
| 🟫 **Wombo the Wombat** | Heavy bruiser. Bum Bump powers through small hits | Bum Bump | **Cube Crusher**: giant square wombat poos rain from the sky |
| 🪶 **Dash the Emu** | Speedster with extra-long kicks | Zoomie Dash (runs straight through the opponent) | **Emu Stampede**: a whole mob of emus charges across the screen |
| 🌪️ **Taz the Tassie Devil** | Wild spinner. Hits harder when his health is low | Growl Scare (blasts the foe backwards) | **Devil Whirlwind**: a tornado that chases the foe, then flings them (and leaves Taz dizzy) |
| 🐢 **Shelly the Sea Turtle** | Shell defender. Blocking barely hurts her | Bubble Blast (a floating bubble that traps) | **Great Barrier Wave**: a giant wave full of fish that she surfs across the screen |
| 🦎 **Lizzie the Frill-neck** | Trickster. Her frill scares attackers back when she blocks | Frill Scare (leaves the foe dizzy) | **Desert Dash Dazzle**: sprints back and forth in a blur, then a dazzling frill flash |
| 🦜 **Cheeky the Cockatoo** | Noisy ranger. Double jump and slow fall | Screech (a sound wave; works in the air) | **Sulphur Crest Storm**: a flock of cockatoos dive-bombs from the sky, then a giant one |

**Designed by the kids:**

| Fighter | Style | ⭐ Special | ⚡ Ultimate |
|---|---|---|---|
| 🦈 **Sly the Shark** (great white, with sunnies) | Bruiser. Frenzy: faster when his foe is nearly beaten | Fin Dive (sinks so only his fin shows, then bursts up with a CHOMP) | **Jaws of the Deep**: *dun-dun…* a fin circles the foe, then a giant shark leaps out of the ground |
| ✨ **Cry the Dragonfly** | Flyer. Can flap 3 times in the air | Teardrop Toss (lobs a big tear; works in the air) | **Sob Storm**: "WAAAAH!" A rain cloud follows the foe pouring tears, then a big splash |
| 🦘 **Greg the Wallaby** (Kip's cousin, backwards cap) | Bouncer. Wall-jumps off the sides | Pogo Stomp (springs up and stomps down) | **Pinball Hop**: ricochets off the walls, floor and sky, then a flying hop-kick |
| 🐐 **Bud the Billy Goat** | Tank. Eats anything, so snacks give double power | Ram Charge (a head-down charge that nothing stops) | **Mega Butt**: a rock pillar shoots up under him, then a spinning mega headbutt |

**Stages:** Uluru Sunset, Bondi Beach BBQ, Rainforest Canopy, Sydney Harbour Night, The Billabong, The Outback Dunny, Great Barrier Reef, Cradle Mountain and ❄️ Mt Kosciuszko (with falling snow, snow gums and a ski lift).

## 🌏 Play Online with a Friend

Play against a friend on another device (iPad, phone or computer), on the same wifi or far away over the internet.

1. One player taps **🌏 Play Online → Make a Room** and gets a code like **KOALA-42**.
2. The other player taps **🌏 Play Online** on their own device, types the code and taps **Join**.
3. You each pick a fighter on your own device, then the room maker picks the stage. Fight! Afterwards you can rematch or change fighters.

**Friends only:** there's no matchmaking with strangers and no chat. Only someone you give the code to can join, and a room holds just two players.

**How it works:**
- The devices first try to connect directly to each other (WebRTC), using the free public [PeerJS](https://peerjs.com) server only to introduce them. The PeerJS library (MIT licence) is bundled in `js/vendor/`.
- **📡 Backup relay:** mobile data (and some strict wifi) often blocks direct device-to-device links. If the direct link hasn't connected after about 5 seconds, the joining device also tries a backup route. Button presses then travel through a free public MQTT server (HiveMQ, EMQX or Mosquitto, tried in turn; the code is in `js/relay.js`). The fighter select screen shows which route you got: 🔗 direct link or 📡 backup relay. Only button presses and game setup go through the relay. There's no chat and no personal info, and the room locks to the two devices once they've linked.
- It uses *lockstep* netcode. Both devices run the same fight and send only button presses, each scheduled a few frames ahead so it has time to arrive. The delay is measured when the match starts: about 4 frames on a direct link, more on the relay. Recent presses are re-sent with every message, and a device that misses one asks for it again, so a dropped message just causes a short wait. Random events (snacks, Drop Bears) use a shared seed so both screens match exactly. As a safety net, the host sends a small check every second and the guest quietly corrects any tiny drift.
- If a press is late, the game briefly waits and shows "Waiting for your friend…". Online games can't be paused.
- If neither route works, the joining device shows tips and a small diagnostic line (`direct / ice / paths / relay`). The host's room stays open so the friend can try again.

**Optional: your own TURN server (smoothest on mobile data).** A TURN server relays the direct WebRTC link itself, which is faster than the backup relay. A free [metered.ca](https://www.metered.ca/stun-turn) account works:
1. Sign up for the free plan and create a TURN app/credential.
2. Copy the TURN server addresses, username and password it shows (use the `turn:` / `turns:` entries).
3. Add them to `EXTRA_TURN` in `js/net.js`, for example:
   ```js
   const EXTRA_TURN = [
     { urls: ['turn:global.relay.metered.ca:80', 'turn:global.relay.metered.ca:443', 'turns:global.relay.metered.ca:443?transport=tcp'],
       username: 'YOUR-USERNAME', credential: 'YOUR-PASSWORD' },
   ];
   ```
4. Bump the version (see below) and redeploy.

## How to play

- Move left and right, **up** to jump and **down** to crouch. **Hold away** from your opponent to block.
- 👊 Punch (fast), 🦶 Kick (strong). Hold down for low attacks; a low kick trips your opponent.
- ⭐ Special: each fighter's signature move.
- ⚡ **Hard Yakka meter**: fills when you hit, get hit or block. **Hold ⚡** to charge it faster, but you can't move or block while charging. When it glows gold, **tap ⚡** to unleash your **Ultimate**.
- 🥧 **Power-up snacks** parachute into the fight. Race to grab them! **Meat Pie** restores health, **Vegemite** fills half your ⚡ meter, and a **Lamington** gives a sugar rush of extra speed.
- 🐨 Watch out for **Drop Bears** falling from the sky.
- 🎺 Winning a round plays a jingle, and winning the match plays a victory fanfare.
- Snacks, Drop Bears and music can each be switched off in Settings.

| | Player 1 | Player 2 |
|---|---|---|
| Move / jump | W A S D | Arrow keys |
| 👊 Punch | F | K or , |
| 🦶 Kick | G | L or . |
| ⭐ Special | H | ; or / |
| ⚡ Charge / Ultimate | R | P or Right Shift |
| Pause | Esc | Esc |

**Touch screens** get an on-screen joystick and buttons automatically. In 2-player mode each player gets their own side. **Gamepads** also work: A = Punch, B = Kick, X = Special, Y/RB = ⚡, Start = Pause.

**Difficulty levels:** 🟢 Easy, 🟡 Medium, 🔴 Hard, 🏆 Champion.

## Running it

It's plain HTML, CSS and JavaScript with no build step. Serve the folder with any web server:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

Opening `index.html` directly also works. The offline and home-screen install features need it served over http(s).

### Putting it online (GitHub Pages)

1. On GitHub, go to **Settings → Pages**.
2. Under **Source**, choose **Deploy from a branch**, then pick the branch and the `/ (root)` folder.
3. After a minute the game is live at `https://<your-username>.github.io/sprite-fighters/`. Open it on an iPad or phone and choose **Add to Home Screen** to play it full-screen like an app, even offline.

## Project layout

```
index.html          page + menu screens
css/style.css       menus, touch controls, responsive scaling
js/util.js          constants, helpers, saved settings
js/audio.js         synthesised sound effects + victory music
js/input.js         keyboard, gamepad and touch controls
js/net.js           online play: room codes (PeerJS), linking up and lockstep netcode
js/relay.js         backup relay for online play (tiny MQTT-over-WebSocket client)
js/vendor/          bundled PeerJS library (MIT)
js/draw.js          cartoon drawing helpers
js/fighters.js      roster pack 1 (Kip, Koko, Kooka, Croc) + shared move helpers
js/fighters2.js     roster pack 2 (Spike, Dotty, Wombo, Dash)
js/fighters3.js     roster pack 3 (Taz, Shelly, Lizzie, Cheeky)
js/fighters4.js     roster pack 4, designed by the kids (Sly, Cry, Greg, Bud)
js/stages.js        the nine stages
js/effects.js       particles, pop-up words, screen shake
js/fighter.js       fighter state machine, physics and animation
js/ai.js            CPU opponent and difficulty levels
js/game.js          a match: rounds, hits, Drop Bears, power-up snacks, HUD
js/ui.js            menus, game flow and main loop
sw.js               offline support
tools/              headless test and screenshot scripts
```

### Releasing a new version

The version number shows in the bottom-right corner of the title screen. For each release, bump `SF.VERSION` in `js/util.js` and `CACHE` in `sw.js` to the same number. Changing `CACHE` tells installed copies to fetch the update.

### Adding a new fighter

Add an entry to `SF.FIGHTERS` (see `js/fighters2.js` for an example) with a `draw` function, stats, a `special` move and an `ult` object (`start` and `update`). Then add its id to `SF.ROSTER` and remove it from `SF.COMING_SOON`.

### Tests

With the game served on port 8123:

```sh
node tools/smoke-test.js http://localhost:8123/ /tmp    # every matchup CPU vs CPU + menu flow
node tools/ult-shots.js http://localhost:8123/ /tmp     # screenshots of every special/ultimate
node tools/device-shots.js http://localhost:8123/ /tmp  # phone / iPad touch layouts
node tools/balance.js http://localhost:8123/ 8          # CPU-vs-CPU win rates per fighter
node tools/net-test.js http://localhost:8123/           # online: two copies of a match must stay in exact sync
PEER_SERVER=127.0.0.1:9000/sf MQTT_BROKER=ws://127.0.0.1:8883 node tools/online-test.js http://localhost:8123/ /tmp
                                                        # online: two real browser windows (needs a local `peerjs` server
                                                        # and a local MQTT-over-WebSocket broker, e.g. aedes + ws)
PEER_SERVER=127.0.0.1:9000/sf MQTT_BROKER=ws://127.0.0.1:8883 FORCE_RELAY=1 node tools/online-test.js http://localhost:8123/ /tmp
                                                        # online: direct link blocked -> must play through the backup relay
PEER_SERVER=127.0.0.1:9000/sf MQTT_BROKER=ws://127.0.0.1:8883 node tools/online-fail-test.js http://localhost:8123/ /tmp
                                                        # online: no route works -> retries, tips, room stays open
```
