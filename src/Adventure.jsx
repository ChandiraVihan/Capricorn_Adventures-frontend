import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import './Adventure.css';

// ─── Grid constants (original nika.agency values) ────────────────────────────
const TILE_W   = 280;
const TILE_H   = 360;
const GAP      = 50;
const COL_STEP = TILE_W + GAP; // 330
const ROW_STEP = TILE_H + GAP; // 410
const RADIUS   = 14;

const COL_OFFSETS = [0, 180, 90, 270];
function colOff(col) {
  return COL_OFFSETS[((col % 4) + 4) % 4];
}

// ─── Image pool ──────────────────────────────────────────────────────────────
const IMAGES = [
  'photo-1558618666-fcd25c85cd64',
  'photo-1547658719-da2b51169166',
  'photo-1499951360447-b19be8fe80f5',
  'photo-1542038784456-1ea8e935640e',
  'photo-1603791440384-56cd371ee9a7',
  'photo-1531746020798-e6953c6e8e04',
  'photo-1618005182384-a83a8bd57fbe',
  'photo-1541701494587-cb58502866ab',
  'photo-1614854262318-831574f15f1f',
  'photo-1622547748225-3fc4abd2cca0',
  'photo-1557672172-298e090bd0f1',
  'photo-1583394838336-acd977736f90',
  'photo-1561070791-2526d30994b5',
  'photo-1535223289429-462f7b0f4492',
  'photo-1574169208507-84376144848b',
  'photo-1616400619175-5beda3a17896',
  'photo-1511367461989-f85a21fda167',
  'photo-1469474968028-56623f02e42e',
  'photo-1550745165-9bc0b252726f',
  'photo-1523275335684-37898b6baf30',
  'photo-1491553895911-0055eca6402d',
  'photo-1634017839464-5c339ebe3cb4',
  'photo-1611532736597-de2d4265fba3',
  'photo-1504805572947-34fad45aed93',
].map(id => `https://images.unsplash.com/${id}?w=560&q=75&auto=format&fit=crop`);

const LABELS = [
  ['Close Quest',    'Branding / Campaign'],
  ['Ethical Life',   'Identity / Interactive'],
  ['Atmosic',        'Web Design'],
  ['BasedAI',        'Branding'],
  ['Cryptography',   'Motion / UX'],
  ['Core Athletics', 'Campaign / Identity'],
  ['Language I/O',   'Web & App'],
  ['List Labs',      'Identity'],
  ['Finity Beyond',  'Branding / Film'],
  ['Dip Pools',      'Web Design'],
  ['BHN Group',      'Branding'],
  ['Coffee Group',   'Identity / Campaign'],
  ['Augustana',      'Web Design'],
  ['Coredine',       'Identity'],
  ['Zara Editorial', 'Campaign'],
  ['HVAC ERZ',       'Branding / Web'],
];

function getTileImage(col, row, cache) {
  const key = `${col},${row}`;
  if (!cache.has(key)) {
    const idx = Math.abs((col * 73856093) ^ (row * 19349663)) % IMAGES.length;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = IMAGES[idx];
    const entry = { img, loaded: false };
    img.onload = () => { entry.loaded = true; };
    cache.set(key, entry);
  }
  return cache.get(key);
}

function getLabel(col, row) {
  return LABELS[Math.abs((col * 37 + row * 59)) % LABELS.length];
}

function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y,     x + w, y + r,     r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x,     y + h, x,     y + h - r, r);
  ctx.lineTo(x,     y + r);
  ctx.arcTo(x,     y,     x + r, y,         r);
  ctx.closePath();
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function Adventure() {
  const canvasRef   = useRef(null);
  const overlayRef  = useRef(null);
  const textRef     = useRef(null);
  const line1Ref    = useRef(null);
  const line2Ref    = useRef(null);
  const line3Ref    = useRef(null);
  const navRef      = useRef(null);
  const tooltipRef  = useRef(null);
  const rafRef      = useRef(null);

  useEffect(() => {
    const canvas   = canvasRef.current;
    const ctx      = canvas.getContext('2d');
    const overlay  = overlayRef.current;
    const textEl   = textRef.current;
    const navEl    = navRef.current;
    const tooltip  = tooltipRef.current;
    const lines    = [line1Ref.current, line2Ref.current, line3Ref.current];

    // ── Tile image cache (persists for component lifetime) ──
    const tileCache = new Map();
    const hovMap    = new Map();

    // ── Intro animation proxy (matches original nika.agency) ──
    const introProxy = { scale: 0.2, y: -1200 };

    // ── Scroll / pan state ──
    let offsetX = 0, offsetY = -1200;
    let targetX = 0, targetY = -1200;
    let interactable = false;
    let hovCol = null, hovRow = null;
    let drag = false, dsx = 0, dsy = 0, dtx = 0, dty = 0;

    // ── Resize ──
    function resize() {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // ── Render loop ──
    function draw() {
      // Intentional lerp — creates smooth trailing follow-through
      offsetX += (targetX - offsetX) * 0.1;
      offsetY += (targetY - offsetY) * 0.1;

      const W  = canvas.width;
      const H  = canvas.height;
      const cx = W / 2;
      const cy = H / 2;
      const sc = introProxy.scale;

      ctx.clearRect(0, 0, W, H);

      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(sc, sc);
      ctx.translate(-cx, -cy);

      const hw  = (W / sc) / 2 + COL_STEP;
      const hh  = (H / sc) / 2 + ROW_STEP;
      const wcx = offsetX + cx;
      const wcy = offsetY + cy;

      const c0 = Math.floor((wcx - hw) / COL_STEP) - 1;
      const c1 = Math.floor((wcx + hw) / COL_STEP) + 1;

      for (let col = c0; col <= c1; col++) {
        const off = colOff(col);
        const r0  = Math.floor((wcy - hh - off) / ROW_STEP) - 1;
        const r1  = Math.floor((wcy + hh - off) / ROW_STEP) + 1;

        for (let row = r0; row <= r1; row++) {
          const tx = col * COL_STEP - offsetX;
          const ty = row * ROW_STEP + off - offsetY;

          const key   = `${col},${row}`;
          const isHov = (col === hovCol && row === hovRow) && interactable;
          let hp = hovMap.get(key) || 0;
          hp += ((isHov ? 1 : 0) - hp) * 0.14;
          if (Math.abs(hp) < 0.001) hp = 0;
          hovMap.set(key, hp);

          const hs = 1 + hp * 0.025;
          const dw = TILE_W * hs;
          const dh = TILE_H * hs;
          const dx = tx + (TILE_W - dw) / 2;
          const dy = ty + (TILE_H - dh) / 2;

          const tile = getTileImage(col, row, tileCache);

          ctx.save();
          drawRoundedRect(ctx, dx, dy, dw, dh, RADIUS);
          ctx.clip();

          if (tile.loaded) {
            ctx.globalAlpha = 0.75 + hp * 0.25;
            ctx.drawImage(tile.img, dx, dy, dw, dh);
          } else {
            ctx.fillStyle = `hsl(${Math.abs((col * 37 + row * 59) % 360)},12%,13%)`;
            ctx.fillRect(dx, dy, dw, dh);
          }

          if (hp > 0.001) {
            ctx.globalAlpha = hp * 0.12;
            ctx.fillStyle   = '#fff';
            ctx.fillRect(dx, dy, dw, dh);
          }
          ctx.restore();

          if (hp > 0.01) {
            const [name, type] = getLabel(col, row);
            ctx.save();
            ctx.globalAlpha = hp;
            ctx.fillStyle   = '#fff';
            ctx.font        = `600 13px "Helvetica Neue",sans-serif`;
            ctx.fillText(name, tx, ty + TILE_H + 22);
            ctx.globalAlpha = hp * 0.5;
            ctx.font        = `400 11px "Helvetica Neue",sans-serif`;
            ctx.fillText(type, tx, ty + TILE_H + 38);
            ctx.restore();
          }
        }
      }

      ctx.restore();
      rafRef.current = requestAnimationFrame(draw);
    }

    // ── Input handlers ──
    function onWheel(e) {
      if (!interactable) return;
      e.preventDefault();
      targetX += e.deltaX;
      targetY += e.deltaY;
    }

    function onMouseDown(e) {
      if (!interactable) return;
      drag = true;
      dsx = e.clientX; dsy = e.clientY;
      dtx = targetX;   dty = targetY;
      canvas.classList.add('grabbing');
    }

    function onMouseUp() {
      drag = false;
      canvas.classList.remove('grabbing');
    }

    function onMouseMove(e) {
      if (drag && interactable) {
        targetX = dtx - (e.clientX - dsx);
        targetY = dty - (e.clientY - dsy);
        return;
      }
      if (!interactable) return;

      const sc  = introProxy.scale;
      const cx  = canvas.width  / 2;
      const cy  = canvas.height / 2;
      const wx  = cx + (e.clientX - cx) / sc + offsetX;
      const wy  = cy + (e.clientY - cy) / sc + offsetY;
      const col = Math.floor(wx / COL_STEP);
      const tx  = wx - col * COL_STEP;

      if (tx >= 0 && tx <= TILE_W) {
        const off = colOff(col);
        const row = Math.floor((wy - off) / ROW_STEP);
        const ty  = wy - off - row * ROW_STEP;

        if (ty >= 0 && ty <= TILE_H) {
          hovCol = col; hovRow = row;
          canvas.classList.remove('grabbing');
          canvas.style.cursor = 'pointer';
          tooltip.style.opacity  = '1';
          tooltip.style.left     = (e.clientX + 14) + 'px';
          tooltip.style.top      = (e.clientY + 14) + 'px';
          tooltip.textContent    = getLabel(col, row)[0];
          return;
        }
      }

      hovCol = null; hovRow = null;
      canvas.style.cursor   = 'grab';
      tooltip.style.opacity = '0';
    }

    window.addEventListener('wheel',     onWheel,     { passive: false });
    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup',   onMouseUp);
    window.addEventListener('mousemove', onMouseMove);

    // ── GSAP intro timeline ──
    // Sequence (matching nika.agency frame-by-frame):
    // 1. Lines stagger IN
    // 2. Hold 0.9s
    // 3. Lines stagger OUT — overlay stays solid black
    // 4. 0.3s beat of pure black
    // 5. DROP: overlay + canvas + scale + y all fire simultaneously
    // 6. Interaction unlock + navbar in

    gsap.set(lines, { opacity: 0, y: 40 });

    const tl = gsap.timeline({ delay: 0.8 });

    // 1+2. Lines in
    tl.to(lines, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      stagger: 0.1,
      ease: 'power3.out',
    });

    // 3. Lines out — overlay stays solid
    tl.to(lines, {
      opacity: 0,
      y: -40,
      duration: 0.8,
      stagger: 0.1,
      ease: 'power3.inOut',
      onComplete: () => {
        if (textEl) textEl.style.display = 'none';
      },
    }, '+=0.9');

    // 5a. Overlay dissolves
    tl.to(overlay, {
      opacity: 0,
      duration: 1.2,
      ease: 'power2.inOut',
      onComplete: () => {
        if (overlay) overlay.style.display = 'none';
      },
    }, '+=0.3');

    // 5b. Canvas to full opacity — same start as overlay
    tl.to(canvas, {
      opacity: 1,
      duration: 1.2,
      ease: 'power2.out',
    }, '<');

    // 5c+d. Scale + Y — expo.out snap, lerp chases targetY
    tl.to(introProxy, {
      scale: 1,
      y: 0,
      duration: 2.5,
      ease: 'expo.out',
      onUpdate() {
        targetY = introProxy.y;
      },
    }, '<');

    // 6. Unlock
    tl.call(() => {
      interactable = true;
      targetY = 0;
      offsetY = 0;
      canvas.style.cursor = 'grab';
    });

    tl.to(navEl, {
      opacity: 1,
      duration: 0.5,
      ease: 'power2.out',
      onStart: () => {
        if (navEl) navEl.classList.add('visible');
      },
    }, '-=0.4');

    // ── Start render loop ──
    draw();

    // ── Cleanup ──
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize',    resize);
      window.removeEventListener('wheel',     onWheel);
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup',   onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      tl.kill();
    };
  }, []);

  return (
    <div className="adventure-root">
      {/* Grid canvas */}
      <canvas ref={canvasRef} className="adventure-canvas" />

      {/* Solid overlay — stays opaque until the drop */}
      <div ref={overlayRef} className="adventure-overlay" />

      {/* Headline text */}
      <div ref={textRef} className="adventure-textlayer">
        <span ref={line1Ref} className="adventure-line adventure-line--1">Capricorn</span>
        <span ref={line2Ref} className="adventure-line adventure-line--2">Adventures</span>
        <span ref={line3Ref} className="adventure-line adventure-line--3">Welcome HERE.</span>
      </div>


      {/* Tooltip */}
      <div ref={tooltipRef} className="adventure-tooltip" />
    </div>
  );
}
