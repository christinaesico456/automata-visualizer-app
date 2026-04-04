/* ════════════════════════════════════════════════════════
   DFA VISUALIZER — script.js
   Two tabs: {a,b} and {0,1}
   Spaceship/planet animation for transitions
════════════════════════════════════════════════════════ */

// ═══════════════════════════════════════════════
// ① DFA DEFINITIONS — one per tab
// ═══════════════════════════════════════════════

const DFA_AB = {
  alphabet: ["a", "b"],
  regex:
    "<em>(aa+bb)</em>(a+b)*<em>(a+b+ab+ba)</em>(a+b+ab+ba)*<em>(aa+bab)*</em>(a+b+aa)(a+b+bb+aa)*",
  placeholder: "e.g. aab",
  defaultInput: "aab",

  states: {
    start: { label: "−", isStart: true, isAccept: false, isTrap: false },
    read_a: { label: "r(a)", isStart: false, isAccept: false, isTrap: false },
    read_b: { label: "r(b)", isStart: false, isAccept: false, isTrap: false },
    got_aa_wait: {
      label: "aa?",
      isStart: false,
      isAccept: false,
      isTrap: false,
    },
    got_bb_wait: {
      label: "bb?",
      isStart: false,
      isAccept: false,
      isTrap: false,
    },
    trap: { label: "T", isStart: false, isAccept: false, isTrap: true },
    final1: { label: "+", isStart: false, isAccept: true, isTrap: false },
    final2: { label: "+", isStart: false, isAccept: true, isTrap: false },
  },

  transitions: {
    start: { a: "read_a", b: "read_b" },
    read_a: { a: "got_aa_wait", b: "trap" },
    read_b: { a: "trap", b: "got_bb_wait" },
    got_aa_wait: { a: "trap", b: "final1" },
    got_bb_wait: { a: "final2", b: "trap" },
    trap: { a: "trap", b: "trap" },
    final1: { a: "final1", b: "final1" },
    final2: { a: "final2", b: "final2" },
  },

  // Logical canvas size: 860 x 460
  positions: {
    start: { x: 90, y: 230 },
    read_a: { x: 250, y: 120 },
    read_b: { x: 250, y: 340 },
    got_aa_wait: { x: 440, y: 120 },
    got_bb_wait: { x: 440, y: 340 },
    trap: { x: 610, y: 230 },
    final1: { x: 760, y: 130 },
    final2: { x: 760, y: 330 },
  },
};

// {0,1} DFA — based on provided image
// States from image: start, read_1, read_0, read_11, read_00, fixed, read_10, final
const DFA_01 = {
  alphabet: ["0", "1"],
  regex:
    "<em>((101)+(111)*+100)</em> + (1+0+11)*<em>(1+0+01)*</em>(111+000+101)(1+0)",
  placeholder: "e.g. 101",
  defaultInput: "101",

  states: {
    start: { label: "−", isStart: true, isAccept: false, isTrap: false },
    read_1: { label: "r(1)", isStart: false, isAccept: false, isTrap: false },
    read_0: { label: "r(0)", isStart: false, isAccept: false, isTrap: false },
    read_11: { label: "r(11)", isStart: false, isAccept: false, isTrap: false },
    read_00: { label: "r(00)", isStart: false, isAccept: false, isTrap: false },
    fixed: { label: "FIX", isStart: false, isAccept: false, isTrap: false },
    read_10: { label: "r(10)", isStart: false, isAccept: false, isTrap: false },
    final: { label: "+", isStart: false, isAccept: true, isTrap: false },
  },

  // Transitions read from the diagram image
  transitions: {
    start: { 0: "read_0", 1: "read_1" },
    read_1: { 0: "read_10", 1: "read_11" },
    read_0: { 0: "read_00", 1: "fixed" },
    read_11: { 0: "fixed", 1: "read_1" },
    read_00: { 0: "read_0", 1: "read_10" },
    fixed: { 0: "read_10", 1: "final" },
    read_10: { 0: "final", 1: "final" },
    final: { 0: "final", 1: "final" },
  },

  positions: {
    start: { x: 80, y: 230 },
    read_1: { x: 230, y: 120 },
    read_0: { x: 230, y: 340 },
    read_11: { x: 390, y: 80 },
    read_00: { x: 390, y: 370 },
    fixed: { x: 530, y: 190 },
    read_10: { x: 620, y: 330 },
    final: { x: 780, y: 230 },
  },
};

// ═══════════════════════════════════════════════
// ② CANVAS & GLOBAL STATE
// ═══════════════════════════════════════════════
const canvas = document.getElementById("dfaCanvas");
const ctx = canvas.getContext("2d");

// Logical canvas dimensions (we scale to fit)
const W = 880,
  H = 470;

// Active DFA config
let DFA = DFA_AB;
const NODE_R = 30; // node radius (logical)

// Execution state
let inputStr = "";
let currentStep = -1;
let executionSteps = [];
let isPlaying = false;
let playTimer = null;
let activeState = "start";
let activeEdge = null; // { from, to }

// Animation timers
let particleT = 0; // 0→1 along current edge
let pulseT = 0; // 0→1 for node pulse ring
let animRaf = null;
let lastTime = 0;

// Spaceship animation (managed by updateShipPos)
// shipTrail and shipPos are declared near the spaceship section below

// ═══════════════════════════════════════════════
// BUILD-UP ANIMATION SYSTEM
// ═══════════════════════════════════════════════
// Plays on load and on every tab switch.
// Phase 1 — planets fade+scale in, staggered.
// Phase 2 — edges draw themselves (path trace), staggered.

const BUILDUP = {
  // Per-node entrance: { alpha 0→1, scale 0.4→1 }
  nodeProgress: {}, // stateId → 0..1 (eased)
  nodeStart: {}, // stateId → timestamp when this node starts

  // Per-edge draw: fraction of path length drawn 0..1
  edgeProgress: {}, // "from→to" → 0..1
  edgeStart: {}, // "from→to" → timestamp when this edge starts

  active: false, // true while build-up is running
  startTime: 0, // performance.now() when sequence began

  // Timing constants (ms)
  NODE_STAGGER: 90, // delay between each successive node appearing
  NODE_DURATION: 520, // how long each node takes to fully appear
  EDGE_DELAY: 420, // ms after first node before edges start drawing
  EDGE_STAGGER: 70, // delay between each successive edge
  EDGE_DURATION: 480, // how long each edge takes to fully draw
};

// Smooth ease-in-out (cubic)
function easeInOut(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Kick off a fresh build-up sequence for the current DFA
function startBuildup() {
  const now = performance.now();

  BUILDUP.active = true;
  BUILDUP.startTime = now;
  BUILDUP.nodeProgress = {};
  BUILDUP.nodeStart = {};
  BUILDUP.edgeProgress = {};
  BUILDUP.edgeStart = {};

  // Assign staggered start times to nodes (left→right, by x position)
  const stateIds = Object.keys(DFA.states);
  const sorted = [...stateIds].sort(
    (a, b) => DFA.positions[a].x - DFA.positions[b].x,
  );
  sorted.forEach((id, i) => {
    BUILDUP.nodeStart[id] = now + i * BUILDUP.NODE_STAGGER;
    BUILDUP.nodeProgress[id] = 0;
  });

  // Assign staggered start times to edges
  const edges = getAllEdges();
  edges.forEach((e, i) => {
    const key = `${e.from}→${e.to}`;
    BUILDUP.edgeStart[key] =
      now + BUILDUP.EDGE_DELAY + i * BUILDUP.EDGE_STAGGER;
    BUILDUP.edgeProgress[key] = 0;
  });
}

// Called every frame from animLoop — advances progress values
function tickBuildup(now) {
  if (!BUILDUP.active) return;

  let allDone = true;

  for (const id of Object.keys(DFA.states)) {
    const elapsed = now - BUILDUP.nodeStart[id];
    const raw = Math.min(Math.max(elapsed / BUILDUP.NODE_DURATION, 0), 1);
    BUILDUP.nodeProgress[id] = easeInOut(raw);
    if (raw < 1) allDone = false;
  }

  for (const e of getAllEdges()) {
    const key = `${e.from}→${e.to}`;
    const elapsed = now - BUILDUP.edgeStart[key];
    const raw = Math.min(Math.max(elapsed / BUILDUP.EDGE_DURATION, 0), 1);
    BUILDUP.edgeProgress[key] = easeInOut(raw);
    if (raw < 1) allDone = false;
  }

  if (allDone) BUILDUP.active = false;
}

// How much of a node is visible right now (0..1)
function nodeAlpha(id) {
  if (!BUILDUP.active && Object.keys(BUILDUP.nodeProgress).length === 0)
    return 1;
  return BUILDUP.nodeProgress[id] ?? 1;
}

// How much of an edge is drawn right now (0..1)
function edgeProg(from, to) {
  if (!BUILDUP.active && Object.keys(BUILDUP.edgeProgress).length === 0)
    return 1;
  const key = `${from}→${to}`;
  return BUILDUP.edgeProgress[key] ?? 1;
}

// ═══════════════════════════════════════════════
// ③ RESIZE
// ═══════════════════════════════════════════════
function resizeCanvas() {
  const wrap = canvas.parentElement;
  const dpr = window.devicePixelRatio || 1;
  const rect = wrap.getBoundingClientRect();
  const tapeH = 56;
  const gap = 11;
  const h = rect.height - tapeH - gap;

  canvas.width = rect.width * dpr;
  canvas.height = h * dpr;
  canvas.style.width = rect.width + "px";
  canvas.style.height = h + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function getViewport() {
  const dpr = window.devicePixelRatio || 1;
  const cw = canvas.width / dpr;
  const ch = canvas.height / dpr;
  const scale = Math.min(cw / W, ch / H);
  return {
    scale,
    offX: (cw - W * scale) / 2,
    offY: (ch - H * scale) / 2,
    cw,
    ch,
  };
}

// ═══════════════════════════════════════════════
// ④ GEOMETRY
// ═══════════════════════════════════════════════
function angleBetween(aId, bId) {
  const a = DFA.positions[aId],
    b = DFA.positions[bId];
  return Math.atan2(b.y - a.y, b.x - a.x);
}

function straightEdgePts(from, to, offset = 0) {
  const angle = angleBetween(from, to);
  const perp = angle + Math.PI / 2;
  const a = DFA.positions[from],
    b = DFA.positions[to];
  return {
    sx: a.x + NODE_R * Math.cos(angle) + offset * Math.cos(perp),
    sy: a.y + NODE_R * Math.sin(angle) + offset * Math.sin(perp),
    ex: b.x - NODE_R * Math.cos(angle) + offset * Math.cos(perp),
    ey: b.y - NODE_R * Math.sin(angle) + offset * Math.sin(perp),
  };
}

function bezierPt(sx, sy, cpx, cpy, ex, ey, t) {
  return {
    x: (1 - t) * (1 - t) * sx + 2 * (1 - t) * t * cpx + t * t * ex,
    y: (1 - t) * (1 - t) * sy + 2 * (1 - t) * t * cpy + t * t * ey,
  };
}

function bezierTangent(sx, sy, cpx, cpy, ex, ey, t) {
  return Math.atan2(
    2 * (1 - t) * (cpy - sy) + 2 * t * (ey - cpy),
    2 * (1 - t) * (cpx - sx) + 2 * t * (ex - cpx),
  );
}

// For a given edge, return its curve control point
function getEdgeCurve(from, to) {
  if (from === to) return null; // self-loop handled separately

  const hasReverse =
    DFA.transitions[to] && Object.values(DFA.transitions[to]).includes(from);
  const offset = hasReverse ? 14 : 0;
  const { sx, sy, ex, ey } = straightEdgePts(from, to, offset);

  const mx = (sx + ex) / 2,
    my = (sy + ey) / 2;
  const dx = ex - sx,
    dy = ey - sy;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const nx = -dy / len,
    ny = dx / len;
  const curveAmt = hasReverse ? 20 : 7;

  return {
    sx,
    sy,
    cpx: mx + nx * curveAmt,
    cpy: my + ny * curveAmt,
    ex,
    ey,
  };
}

// ═══════════════════════════════════════════════
// ⑤ SPACESHIP — TRAIL + BODY
// ═══════════════════════════════════════════════

const TRAIL_MAX = 28;
let shipTrail = []; // array of {x,y} world positions, oldest first
let shipPos = null; // { x, y, angle } current

// Called every frame while activeEdge != null
function updateShipPos() {
  if (!activeEdge) {
    shipPos = null;
    shipTrail = [];
    return;
  }

  const { from, to } = activeEdge;
  const t = particleT % 1;

  if (from === to) {
    const p = DFA.positions[from];
    const loopR = 23;
    const loopCY = p.y - NODE_R - 28;
    const startA = Math.PI + 0.42;
    const endA = Math.PI - 0.42 + 2 * Math.PI;
    const a = startA + (endA - startA) * t;
    shipPos = {
      x: p.x + loopR * Math.cos(a),
      y: loopCY + loopR * Math.sin(a),
      angle: a + Math.PI / 2,
    };
  } else {
    const curve = getEdgeCurve(from, to);
    if (!curve) {
      shipPos = null;
      return;
    }
    const { sx, sy, cpx, cpy, ex, ey } = curve;
    shipPos = {
      ...bezierPt(sx, sy, cpx, cpy, ex, ey, t),
      angle: bezierTangent(sx, sy, cpx, cpy, ex, ey, Math.min(t, 0.999)),
    };
  }

  shipTrail.push({ x: shipPos.x, y: shipPos.y });
  if (shipTrail.length > TRAIL_MAX) shipTrail.shift();
}

// Glowing fading trail of particles + line
function drawTrail() {
  if (shipTrail.length < 2) return;

  // Draw line segments oldest→newest with increasing opacity & width
  for (let i = 1; i < shipTrail.length; i++) {
    const frac = i / shipTrail.length; // 0=oldest, 1=newest
    const alpha = frac * frac * 0.9;
    const lw = 1.0 + frac * 3.0;
    const color = frac > 0.55 ? "#e0a830" : "#e06b45";

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.lineCap = "round";
    ctx.shadowColor = color;
    ctx.shadowBlur = 8 * frac;
    ctx.beginPath();
    ctx.moveTo(shipTrail[i - 1].x, shipTrail[i - 1].y);
    ctx.lineTo(shipTrail[i].x, shipTrail[i].y);
    ctx.stroke();
    ctx.restore();
  }

  // Particle blobs every few trail points
  for (let i = 2; i < shipTrail.length; i += 3) {
    const frac = i / shipTrail.length;
    ctx.save();
    ctx.globalAlpha = frac * 0.55;
    ctx.beginPath();
    ctx.arc(shipTrail[i].x, shipTrail[i].y, 1.5 + frac * 2, 0, 2 * Math.PI);
    ctx.fillStyle = frac > 0.5 ? "#ffcc44" : "#e06b45";
    ctx.shadowColor = "#ffcc44";
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.restore();
  }
}

// The visible spaceship body
function drawShipBody(x, y, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle); // nose points in direction of travel

  const S = 9;

  // Engine exhaust glow (behind body)
  const exG = ctx.createRadialGradient(-S * 0.8, 0, 0, -S * 0.8, 0, S);
  exG.addColorStop(0, "rgba(255,200,60,0.95)");
  exG.addColorStop(0.45, "rgba(224,107,69,0.6)");
  exG.addColorStop(1, "rgba(224,107,69,0)");
  ctx.save();
  ctx.shadowColor = "#ffcc44";
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.ellipse(-S * 0.8, 0, S, S * 0.5, 0, 0, 2 * Math.PI);
  ctx.fillStyle = exG;
  ctx.fill();
  ctx.restore();

  // Hull
  ctx.save();
  ctx.shadowColor = "#e06b45";
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.moveTo(S, 0); // nose
  ctx.lineTo(-S * 0.55, -S * 0.55); // left wing
  ctx.lineTo(-S * 0.25, -S * 0.18); // left wing root
  ctx.lineTo(-S * 0.7, 0); // tail notch
  ctx.lineTo(-S * 0.25, S * 0.18); // right wing root
  ctx.lineTo(-S * 0.55, S * 0.55); // right wing
  ctx.closePath();
  const hullG = ctx.createLinearGradient(S, 0, -S * 0.7, 0);
  hullG.addColorStop(0, "#f5f0e8");
  hullG.addColorStop(0.45, "#c8bfb0");
  hullG.addColorStop(1, "#8a7f74");
  ctx.fillStyle = hullG;
  ctx.fill();
  ctx.strokeStyle = "rgba(224,107,69,0.55)";
  ctx.lineWidth = 0.7;
  ctx.stroke();
  ctx.restore();

  // Cockpit window
  ctx.save();
  ctx.shadowColor = "#3ab8a8";
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.ellipse(S * 0.28, 0, S * 0.3, S * 0.19, 0, 0, 2 * Math.PI);
  ctx.fillStyle = "#3ab8a8";
  ctx.fill();
  // highlight
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.ellipse(S * 0.21, -S * 0.05, S * 0.11, S * 0.07, -0.4, 0, 2 * Math.PI);
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

// ═══════════════════════════════════════════════
// ⑥ DRAW ARROWHEAD
// ═══════════════════════════════════════════════
function drawArrow(x, y, angle, color, sz = 7) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-sz, -sz * 0.45);
  ctx.lineTo(-sz * 0.6, 0);
  ctx.lineTo(-sz, sz * 0.45);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

// ═══════════════════════════════════════════════
// ⑦ COLLECT EDGES
// ═══════════════════════════════════════════════
function getAllEdges() {
  const map = {};
  for (const [from, targets] of Object.entries(DFA.transitions)) {
    for (const [sym, to] of Object.entries(targets)) {
      const key = `${from}→${to}`;
      if (!map[key]) map[key] = { from, to, syms: [] };
      map[key].syms.push(sym);
    }
  }
  return Object.values(map);
}

// ═══════════════════════════════════════════════
// ⑧ DRAW EDGE
// ═══════════════════════════════════════════════
function drawEdge(e, isActive) {
  const { from, to, syms } = e;
  const label = syms.join(", ");
  const prog = edgeProg(from, to); // 0..1 build-up draw progress
  if (prog <= 0) return; // not yet started

  const edgeColor = isActive ? "#c95f3f" : "#d8d0c4";
  const lblColor = isActive ? "#c95f3f" : "#a09588";
  const lw = isActive ? 1.8 : 1.2;

  // During build-up, add a soft leading glow
  const buildGlow = BUILDUP.active && prog < 1;

  ctx.save();
  ctx.globalAlpha = Math.min(prog * 2, 1); // fade in the first half of draw
  ctx.strokeStyle = edgeColor;
  ctx.lineWidth = lw;

  // ── SELF-LOOP ──
  if (from === to) {
    const p = DFA.positions[from];
    const loopR = 23;
    const loopCY = p.y - NODE_R - 28;
    const startA = Math.PI + 0.42;
    const fullSpan = 2 * Math.PI - 0.84; // endA - startA
    const endDraw = startA + fullSpan * prog;

    if (buildGlow) {
      ctx.shadowColor = edgeColor;
      ctx.shadowBlur = 8;
    }

    ctx.beginPath();
    ctx.arc(p.x, loopCY, loopR, startA, endDraw, false);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw arrow and label only when nearly complete
    if (prog > 0.88) {
      const arrowAlpha = (prog - 0.88) / 0.12;
      ctx.globalAlpha = Math.min(arrowAlpha, 1) * Math.min(prog * 2, 1);
      const arcEX = p.x + loopR * Math.cos(Math.PI - 0.42);
      const arcEY = loopCY + loopR * Math.sin(Math.PI - 0.42);
      const arrowAngle = Math.atan2(p.y - arcEY, p.x - arcEX);
      const arrowX = p.x + NODE_R * Math.cos(arrowAngle - Math.PI);
      const arrowY = p.y + NODE_R * Math.sin(arrowAngle - Math.PI);
      drawArrow(arrowX, arrowY, arrowAngle, edgeColor, 7);

      ctx.font = '400 10px "DM Mono", monospace';
      const tw = ctx.measureText(label).width;
      ctx.fillStyle = isActive
        ? "rgba(201,95,63,0.1)"
        : "rgba(245,240,232,0.92)";
      ctx.beginPath();
      ctx.roundRect(p.x - tw / 2 - 6, loopCY - loopR - 13, tw + 12, 14, 2);
      ctx.fill();
      ctx.fillStyle = lblColor;
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(label, p.x, loopCY - loopR - 1);
    }

    ctx.restore();
    return;
  }

  // ── REGULAR EDGE ──
  const curve = getEdgeCurve(from, to);
  const { sx, sy, cpx, cpy, ex, ey } = curve;

  // Trace the bezier path up to `prog` using many tiny segments
  const STEPS = 40;
  const drawSteps = Math.floor(prog * STEPS);

  if (buildGlow) {
    ctx.shadowColor = edgeColor;
    ctx.shadowBlur = 8;
  }

  ctx.beginPath();
  ctx.moveTo(sx, sy);
  for (let i = 1; i <= drawSteps; i++) {
    const t = i / STEPS;
    const pt = bezierPt(sx, sy, cpx, cpy, ex, ey, t);
    ctx.lineTo(pt.x, pt.y);
  }
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Soft leading dot at the drawing frontier (only during build-up)
  if (buildGlow && drawSteps < STEPS) {
    const frontT = drawSteps / STEPS;
    const frontPt = bezierPt(sx, sy, cpx, cpy, ex, ey, frontT);
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(frontPt.x, frontPt.y, 3, 0, 2 * Math.PI);
    ctx.fillStyle = edgeColor;
    ctx.shadowColor = edgeColor;
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.restore();
  }

  // Arrow & label — appear only when edge is nearly fully drawn
  if (prog > 0.88) {
    const revealA = (prog - 0.88) / 0.12;
    ctx.globalAlpha = Math.min(revealA, 1) * Math.min(prog * 2, 1);

    const arrowDir = bezierTangent(sx, sy, cpx, cpy, ex, ey, 0.999);
    drawArrow(ex, ey, arrowDir, edgeColor);

    const lpt = bezierPt(sx, sy, cpx, cpy, ex, ey, 0.5);
    const tang = bezierTangent(sx, sy, cpx, cpy, ex, ey, 0.5);
    const hasReverse =
      DFA.transitions[to] && Object.values(DFA.transitions[to]).includes(from);
    const dx = ex - sx,
      dy = ey - sy;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = -dy / len,
      ny = dx / len;
    const lx = lpt.x + (hasReverse ? nx * 17 : -Math.sin(tang) * 13);
    const ly = lpt.y + (hasReverse ? ny * 17 : Math.cos(tang) * 13);

    ctx.font = '400 10px "DM Mono", monospace';
    const tw2 = ctx.measureText(label).width;
    ctx.fillStyle = isActive ? "rgba(201,95,63,0.1)" : "rgba(245,240,232,0.92)";
    ctx.beginPath();
    ctx.roundRect(lx - tw2 / 2 - 5, ly - 8, tw2 + 10, 15, 2);
    ctx.fill();
    ctx.fillStyle = lblColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, lx, ly);
  }

  ctx.restore();
}

// ═══════════════════════════════════════════════
// ⑨ DRAW NODE (PLANET)
// ═══════════════════════════════════════════════
function drawNode(id, isActive) {
  const p = DFA.positions[id];
  const s = DFA.states[id];
  const prog = nodeAlpha(id); // 0..1 from build-up
  if (prog <= 0) return;

  // accent color per state type
  const accent = s.isTrap
    ? "#c95f3f"
    : s.isAccept
      ? "#2e7d78"
      : s.isStart
        ? "#2e7d78"
        : "#6b6258";

  ctx.save();
  ctx.globalAlpha = prog;

  // Scale from 0.35 → 1 as prog goes 0 → 1 (origin = planet center)
  const sc = 0.35 + 0.65 * prog;
  ctx.translate(p.x, p.y);
  ctx.scale(sc, sc);
  ctx.translate(-p.x, -p.y);

  // Soft build-up glow on arrival
  if (BUILDUP.active && prog < 0.98) {
    const glowAmt = (1 - prog) * 18;
    ctx.shadowColor = accent;
    ctx.shadowBlur = glowAmt;
  }

  // Accept double ring
  if (s.isAccept) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, NODE_R + 7, 0, 2 * Math.PI);
    ctx.strokeStyle = isActive ? "#2e7d78" : "rgba(46,125,120,0.45)";
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  // Pulse ring on state entry (traversal)
  if (isActive && pulseT > 0) {
    const pR = NODE_R + pulseT * 18;
    const pA = Math.floor((1 - pulseT) * 200);
    ctx.beginPath();
    ctx.arc(p.x, p.y, pR, 0, 2 * Math.PI);
    ctx.strokeStyle = accent + pA.toString(16).padStart(2, "0");
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  ctx.shadowBlur = 0;

  // Planet body — radial gradient for 3D feel
  const grad = ctx.createRadialGradient(
    p.x - NODE_R * 0.3,
    p.y - NODE_R * 0.3,
    2,
    p.x,
    p.y,
    NODE_R,
  );

  if (isActive) {
    if (s.isTrap) {
      grad.addColorStop(0, "rgba(201,95,63,0.35)");
      grad.addColorStop(1, "rgba(201,95,63,0.08)");
    } else if (s.isAccept) {
      grad.addColorStop(0, "rgba(46,125,120,0.35)");
      grad.addColorStop(1, "rgba(46,125,120,0.08)");
    } else {
      grad.addColorStop(0, "rgba(176,125,42,0.25)");
      grad.addColorStop(1, "rgba(176,125,42,0.05)");
    }
  } else {
    grad.addColorStop(0, "#f5f0e8");
    grad.addColorStop(1, "#e4ddd0");
  }

  ctx.beginPath();
  ctx.arc(p.x, p.y, NODE_R, 0, 2 * Math.PI);
  ctx.fillStyle = grad;
  ctx.fill();

  // Planet equatorial ring
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(p.x, p.y, NODE_R + 10, 5, 0, Math.PI * 0.15, Math.PI * 0.85);
  ctx.strokeStyle = isActive ? accent + "55" : "#d8d0c488";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  // Border stroke
  ctx.beginPath();
  ctx.arc(p.x, p.y, NODE_R, 0, 2 * Math.PI);
  ctx.strokeStyle = isActive
    ? accent
    : s.isTrap
      ? "rgba(201,95,63,0.55)"
      : s.isAccept
        ? "rgba(46,125,120,0.55)"
        : "#d8d0c4";
  ctx.lineWidth = isActive ? 2 : 1.2;
  ctx.stroke();

  // Label
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `500 11px "DM Sans", sans-serif`;
  ctx.fillStyle = isActive
    ? accent
    : s.isTrap
      ? "#c95f3f"
      : s.isAccept
        ? "#2e7d78"
        : "#6b6258";
  ctx.fillText(s.label, p.x, p.y);

  // State name below
  ctx.font = `300 7.5px "DM Mono", monospace`;
  ctx.fillStyle = "#a09588";
  const lbl = id.startsWith("final") ? "final" : id;
  ctx.fillText(lbl, p.x, p.y + NODE_R + 11);

  ctx.restore();
}

// ═══════════════════════════════════════════════
// ⑩ DRAW START ARROW
// ═══════════════════════════════════════════════
function drawStartArrow() {
  const p = DFA.positions["start"];
  ctx.save();
  ctx.strokeStyle = "#d8d0c4";
  ctx.lineWidth = 1.2;
  ctx.setLineDash([3, 4]);
  ctx.beginPath();
  ctx.moveTo(p.x - NODE_R - 32, p.y);
  ctx.lineTo(p.x - NODE_R, p.y);
  ctx.stroke();
  ctx.setLineDash([]);
  drawArrow(p.x - NODE_R, p.y, 0, "#a09588", 7);
  ctx.restore();
}

// ═══════════════════════════════════════════════
// ⑪ DRAW STARS (background)
// ═══════════════════════════════════════════════
let stars = [];
function initStars(cw, ch) {
  stars = [];
  for (let i = 0; i < 55; i++) {
    stars.push({
      x: Math.random() * cw,
      y: Math.random() * ch,
      r: Math.random() * 1.2 + 0.3,
      a: Math.random() * 0.35 + 0.08,
    });
  }
}

function drawStars() {
  for (const s of stars) {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, 2 * Math.PI);
    ctx.fillStyle = `rgba(160,149,136,${s.a})`;
    ctx.fill();
  }
}

// ═══════════════════════════════════════════════
// ⑫ MAIN RENDER
// ═══════════════════════════════════════════════
function render() {
  const { scale, offX, offY, cw, ch } = getViewport();

  ctx.clearRect(0, 0, cw, ch);
  ctx.fillStyle = "#f5f0e8";
  ctx.fillRect(0, 0, cw, ch);

  // Stars (in screen space — not scaled)
  drawStars();

  ctx.save();
  ctx.translate(offX, offY);
  ctx.scale(scale, scale);

  // All edges
  for (const e of getAllEdges()) {
    const isActive =
      activeEdge && activeEdge.from === e.from && activeEdge.to === e.to;
    drawEdge(e, isActive);
  }

  // Start arrow
  drawStartArrow();

  // Nodes (planets)
  for (const id of Object.keys(DFA.states)) {
    drawNode(id, id === activeState);
  }

  // Spaceship trail + body (drawn last, on top)
  if (activeEdge && shipPos) {
    drawTrail();
    drawShipBody(shipPos.x, shipPos.y, shipPos.angle);
  }

  ctx.restore();
}

// ═══════════════════════════════════════════════
// ⑬ ANIMATION LOOP
// ═══════════════════════════════════════════════
function animLoop(ts) {
  const dt = Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;

  // Build-up animation (page load / tab switch)
  if (BUILDUP.active) tickBuildup(performance.now());

  if (activeEdge) particleT += dt * 1.3;
  if (pulseT > 0) pulseT = Math.max(0, pulseT - dt * 1.9);

  updateShipPos(); // keep ship & trail in sync every frame

  render();
  animRaf = requestAnimationFrame(animLoop);
}

// ═══════════════════════════════════════════════
// ⑭ TAPE
// ═══════════════════════════════════════════════
function renderTape(str, activeIdx) {
  const tape = document.getElementById("tape");
  const ptr = document.getElementById("tapePointer");
  tape.innerHTML = "";
  for (let i = 0; i < str.length; i++) {
    const cell = document.createElement("div");
    cell.className = "tape-cell";
    cell.textContent = str[i];
    if (i < activeIdx) cell.classList.add("done");
    else if (i === activeIdx) cell.classList.add("active");
    else cell.classList.add("unread");
    tape.appendChild(cell);
  }
  if (!str.length) ptr.innerHTML = "pos <span>—</span>";
  else if (activeIdx >= str.length) ptr.innerHTML = "pos <span>end</span>";
  else ptr.innerHTML = `pos <span>${activeIdx}</span>`;
}

// ═══════════════════════════════════════════════
// ⑮ LOG
// ═══════════════════════════════════════════════
function addLog(msg, cls = "") {
  const list = document.getElementById("logList");
  for (const el of list.querySelectorAll(".current"))
    el.classList.remove("current");
  const el = document.createElement("div");
  el.className = `log-entry ${cls}`;
  el.textContent = msg;
  list.appendChild(el);
  if (!cls) el.classList.add("current");
  list.scrollTop = list.scrollHeight;
}

function clearLog() {
  document.getElementById("logList").innerHTML = "";
}

// ═══════════════════════════════════════════════
// ⑯ STATUS UI
// ═══════════════════════════════════════════════
function updateStatus(stateId, symbol, step, total) {
  const sv = document.getElementById("infoState");
  sv.textContent = stateId;
  sv.className = "stat-value";
  const s = DFA.states[stateId] || {};
  if (s.isTrap) sv.classList.add("coral");
  else if (s.isAccept) sv.classList.add("teal");

  document.getElementById("infoSymbol").textContent = symbol;
  document.getElementById("infoStep").textContent = `${step} / ${total}`;
  const pct = total > 0 ? (step / total) * 100 : 0;
  document.getElementById("stepBar").style.width = pct + "%";
}

// ═══════════════════════════════════════════════
// ⑰ TRACE BUILDER
// ═══════════════════════════════════════════════
function buildTrace(str) {
  let state = "start";
  const steps = [];
  for (let i = 0; i < str.length; i++) {
    const sym = str[i];
    const next = DFA.transitions[state]?.[sym] || "trap";
    steps.push({ from: state, symbol: sym, to: next, idx: i });
    state = next;
  }
  return steps;
}

// ═══════════════════════════════════════════════
// ⑱ STEP LOGIC
// ═══════════════════════════════════════════════
function applyStep(stepIdx) {
  const step = executionSteps[stepIdx];
  activeState = step.to;
  activeEdge = { from: step.from, to: step.to };
  particleT = 0;
  pulseT = 1;
  shipTrail = [];
  shipPos = null;
  renderTape(inputStr, step.idx + 1);
  updateStatus(step.to, `"${step.symbol}"`, stepIdx + 1, executionSteps.length);
  addLog(`δ(${step.from}, '${step.symbol}') → ${step.to}`);
}

function applyReset() {
  activeState = "start";
  activeEdge = null;
  particleT = 0;
  pulseT = 0;
  shipTrail = [];
  shipPos = null;
  renderTape(inputStr, 0);
  updateStatus("start", "—", 0, executionSteps.length);
}

function finalize() {
  const last =
    executionSteps.length > 0
      ? executionSteps[executionSteps.length - 1].to
      : "start";
  const acc = DFA.states[last]?.isAccept;
  activeEdge = null;
  shipTrail = [];
  shipPos = null;

  const banner = document.getElementById("resultBanner");
  if (acc) {
    banner.className = "accepted";
    banner.textContent = "✓  String Accepted";
    addLog(`Final: ${last} → ACCEPTED ✓`, "accepted");
  } else {
    banner.className = "rejected";
    banner.textContent = "✗  String Rejected";
    addLog(`Final: ${last} → REJECTED ✗`, "rejected");
  }
}

// ═══════════════════════════════════════════════
// ⑲ CONTROLS
// ═══════════════════════════════════════════════
function getSpeed() {
  const v = parseInt(document.getElementById("speedSlider").value);
  return [1400, 950, 600, 320, 120][v - 1];
}

function stopPlay() {
  isPlaying = false;
  clearTimeout(playTimer);
  const pb = document.getElementById("playBtn");
  pb.textContent = "▶ Play";
  pb.classList.remove("playing");
}

function startPlay() {
  isPlaying = true;
  const pb = document.getElementById("playBtn");
  pb.textContent = "⏸ Pause";
  pb.classList.add("playing");
  tick();
}

function tick() {
  if (!isPlaying) return;
  if (currentStep >= executionSteps.length - 1) {
    currentStep++;
    finalize();
    stopPlay();
    updateBtns();
    return;
  }
  currentStep++;
  applyStep(currentStep);
  updateBtns();
  playTimer = setTimeout(tick, getSpeed());
}

function stepForward() {
  if (currentStep >= executionSteps.length) return;
  if (currentStep === executionSteps.length - 1) {
    currentStep++;
    finalize();
    updateBtns();
    return;
  }
  currentStep++;
  applyStep(currentStep);
  updateBtns();
}

function resetAll() {
  stopPlay();
  currentStep = -1;
  const banner = document.getElementById("resultBanner");
  banner.className = "";
  banner.textContent = "";
  clearLog();
  applyReset();
  updateBtns();
}

function loadInput() {
  const raw = document.getElementById("inputString").value.trim();
  const validChars = DFA.alphabet.join("");
  const re = new RegExp(`^[${validChars}]*$`);
  if (!re.test(raw)) {
    alert(
      `Please enter a string containing only: ${DFA.alphabet.map((c) => `"${c}"`).join(", ")}`,
    );
    return;
  }
  inputStr = raw;
  executionSteps = buildTrace(inputStr);
  resetAll();
  addLog(
    `Loaded: "${inputStr}" (${inputStr.length} symbol${inputStr.length !== 1 ? "s" : ""})`,
  );
  applyReset();
}

function updateBtns() {
  const done = currentStep >= executionSteps.length;
  document.getElementById("stepBtn").disabled = done;
  document.getElementById("playBtn").disabled = done && !isPlaying;
}

// ═══════════════════════════════════════════════
// ⑳ TAB SWITCHING
// ═══════════════════════════════════════════════
function switchTab(tabId) {
  DFA = tabId === "01" ? DFA_01 : DFA_AB;

  // Update tab button styles
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tabId);
  });

  // Update header regex
  document.getElementById("headerRegex").innerHTML = DFA.regex;

  // Update input placeholder & default
  const inp = document.getElementById("inputString");
  inp.placeholder = DFA.placeholder;
  inp.value = DFA.defaultInput;

  // Re-init stars to match new canvas size
  const { cw, ch } = getViewport();
  initStars(cw, ch);

  // Reset and load default
  inputStr = DFA.defaultInput;
  executionSteps = buildTrace(inputStr);
  resetAll();
  addLog(`Switched to Σ = {${DFA.alphabet.join(",")}} — Loaded: "${inputStr}"`);
  applyReset();

  // Kick off the DFA build-up animation for this tab's graph
  startBuildup();
}

// ═══════════════════════════════════════════════
// ㉑ EVENT LISTENERS
// ═══════════════════════════════════════════════
document.getElementById("playBtn").addEventListener("click", () => {
  if (isPlaying) stopPlay();
  else startPlay();
});
document.getElementById("stepBtn").addEventListener("click", () => {
  stopPlay();
  stepForward();
});
document.getElementById("resetBtn").addEventListener("click", resetAll);
document.getElementById("loadBtn").addEventListener("click", loadInput);
document.getElementById("inputString").addEventListener("keydown", (e) => {
  if (e.key === "Enter") loadInput();
});
document.getElementById("speedSlider").addEventListener("input", function () {
  document.getElementById("speedVal").textContent = this.value + "×";
});

document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => switchTab(btn.dataset.tab));
});

window.addEventListener("resize", () => {
  cancelAnimationFrame(animRaf);
  resizeCanvas();
  const { cw, ch } = getViewport();
  initStars(cw, ch);
  requestAnimationFrame((ts) => {
    lastTime = ts;
    animLoop(ts);
  });
});

// ═══════════════════════════════════════════════
// ㉒ INIT
// ═══════════════════════════════════════════════
setTimeout(() => {
  resizeCanvas();

  const { cw, ch } = getViewport();
  initStars(cw, ch);

  // Set header regex for default tab
  document.getElementById("headerRegex").innerHTML = DFA_AB.regex;

  // Load default input
  inputStr = DFA_AB.defaultInput;
  executionSteps = buildTrace(inputStr);
  applyReset();
  addLog(`Loaded: "${inputStr}" (${inputStr.length} symbols)`);
  updateBtns();

  // Start animation loop, then kick off build-up
  requestAnimationFrame((ts) => {
    lastTime = ts;
    startBuildup(); // play the DFA assembly sequence on page load
    animLoop(ts);
  });
}, 80);
