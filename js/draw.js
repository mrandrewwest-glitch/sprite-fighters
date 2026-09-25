// Cartoon drawing helpers shared by every fighter.
// Local coordinates: origin at the fighter's feet, +x is "forward", -y is up.
// Limb angles: 0 = pointing straight down, +PI/2 = pointing forward, PI = up.
SF.D = (() => {
  const OUT = '#2a1a12';
  const LW = 3;

  function ell(ctx, x, y, rx, ry, fill, rot = 0, stroke = true) {
    ctx.beginPath();
    ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.lineWidth = LW;
      ctx.strokeStyle = OUT;
      ctx.stroke();
    }
  }

  function line(ctx, x1, y1, x2, y2, w, col) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineWidth = w;
    ctx.strokeStyle = col;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  function limb(ctx, x, y, ang, len, w, col) {
    const ex = x + Math.sin(ang) * len;
    const ey = y + Math.cos(ang) * len;
    line(ctx, x, y, ex, ey, w + LW * 2, OUT);
    line(ctx, x, y, ex, ey, w, col);
    return { x: ex, y: ey };
  }

  function poly(ctx, pts, fill, stroke = true) {
    ctx.beginPath();
    ctx.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.lineWidth = LW;
      ctx.lineJoin = 'round';
      ctx.strokeStyle = OUT;
      ctx.stroke();
    }
  }

  function eye(ctx, x, y, r, face, t, brow = true) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = OUT;
    ctx.lineWidth = 3;
    if (face === 'ko') {
      line(ctx, x - r, y - r, x + r, y + r, 3, OUT);
      line(ctx, x + r, y - r, x - r, y + r, 3, OUT);
    } else if (face === 'dizzy') {
      ctx.beginPath();
      for (let a = 0; a < Math.PI * 4; a += 0.3) {
        const rr = (a / (Math.PI * 4)) * r;
        const px = x + Math.cos(a + t * 0.3) * rr;
        const py = y + Math.sin(a + t * 0.3) * rr;
        if (a === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (face === 'hurt') {
      ctx.beginPath();
      ctx.moveTo(x - r, y - r * 0.7);
      ctx.lineTo(x + r * 0.6, y);
      ctx.lineTo(x - r, y + r * 0.7);
      ctx.stroke();
    } else if (face === 'happy' || face === 'laugh') {
      ctx.beginPath();
      ctx.arc(x, y + r * 0.3, r * 0.8, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
    } else {
      const blink = face !== 'attack' && face !== 'grumpy' && t % 210 < 6;
      if (blink) {
        line(ctx, x - r, y, x + r, y, 3, OUT);
      } else {
        ell(ctx, x, y, r, r * 1.15, '#fff', 0, true);
        ell(ctx, x + r * 0.3, y + r * 0.1, r * 0.55, r * 0.65, '#1a1a1a', 0, false);
        ell(ctx, x + r * 0.45, y - r * 0.2, r * 0.2, r * 0.2, '#fff', 0, false);
        if (face === 'sleepy') {
          ctx.beginPath();
          ctx.ellipse(x, y, r + 1.5, r * 1.15 + 1.5, 0, Math.PI, Math.PI * 2);
          ctx.lineTo(x + r + 1.5, y + r * 0.2);
          ctx.lineTo(x - r - 1.5, y + r * 0.2);
          ctx.closePath();
          ctx.fillStyle = ctx.__lid || '#888';
          ctx.fill();
          line(ctx, x - r - 1, y + r * 0.2, x + r + 1, y + r * 0.2, 2.5, OUT);
        }
      }
      if (brow && (face === 'attack' || face === 'grumpy')) {
        line(ctx, x - r * 1.1, y - r * 1.9, x + r * 1.2, y - r * 1.1, 4, OUT);
      }
    }
    ctx.restore();
  }

  function mouth(ctx, x, y, w, face) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = OUT;
    ctx.lineWidth = 2.5;
    if (face === 'attack' || face === 'laugh' || face === 'happy') {
      ctx.beginPath();
      ctx.moveTo(x - w * 0.6, y - 2);
      ctx.quadraticCurveTo(x, y + w * (face === 'attack' ? 0.8 : 1.0), x + w * 0.6, y - 2);
      ctx.closePath();
      ctx.fillStyle = '#7a1f1f';
      ctx.fill();
      ctx.stroke();
      ell(ctx, x, y + w * 0.35, w * 0.3, w * 0.15, '#e86a6a', 0, false);
    } else if (face === 'hurt') {
      ell(ctx, x, y + 2, w * 0.25, w * 0.35, '#7a1f1f');
    } else if (face === 'ko' || face === 'dizzy') {
      ctx.beginPath();
      ctx.moveTo(x - w * 0.5, y);
      for (let i = 1; i <= 4; i++) ctx.lineTo(x - w * 0.5 + (w / 4) * i, y + (i % 2 ? 3 : -1));
      ctx.stroke();
    } else if (face === 'grumpy') {
      ctx.beginPath();
      ctx.arc(x, y + w * 0.5, w * 0.45, Math.PI * 1.2, Math.PI * 1.8);
      ctx.stroke();
    } else if (face === 'sleepy') {
      line(ctx, x - w * 0.2, y, x + w * 0.2, y, 2.5, OUT);
    } else {
      ctx.beginPath();
      ctx.arc(x, y - w * 0.3, w * 0.45, Math.PI * 0.2, Math.PI * 0.8);
      ctx.stroke();
    }
    ctx.restore();
  }

  function star(ctx, x, y, r, fill, rot = 0) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = rot + (i * Math.PI) / 5 - Math.PI / 2;
      const rr = i % 2 ? r * 0.45 : r;
      ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = OUT;
    ctx.stroke();
  }

  return { OUT, LW, ell, line, limb, poly, eye, mouth, star };
})();
