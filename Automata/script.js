/* ════════════════════════════════════════════════════════
   DFA + PDA VISUALIZER — script.js
   Faithfully reproduces professor's PDA diagrams on canvas
════════════════════════════════════════════════════════ */

// ═══════════════════════════════════════════════
// ① DFA DEFINITIONS
// ═══════════════════════════════════════════════
const DFA_AB = {
  alphabet: ["a", "b"],
  regex: "<em>(aa+bb)</em>(a+b)*<em>(a+b+ab+ba)</em>(a+b+ab+ba)*<em>(aa+bab)*</em>(a+b+aa)(a+b+bb+aa)*",
  placeholder: "e.g. aab", defaultInput: "aab",
  states: {
    start: { label: "−", isStart: true, isAccept: false, isTrap: false },
    q1: { label: "−", isStart: false, isAccept: false, isTrap: false },
    q2: { label: "−", isStart: false, isAccept: false, isTrap: false },
    q3: { label: "−", isStart: false, isAccept: false, isTrap: false },
    q4: { label: "−", isStart: false, isAccept: false, isTrap: false },
    q6: { label: "−", isStart: false, isAccept: false, isTrap: false },
    q7: { label: "−", isStart: false, isAccept: false, isTrap: false },
    trap: { label: "T", isStart: false, isAccept: false, isTrap: true },
    final1: { label: "+", isStart: false, isAccept: true, isTrap: false },
    final2: { label: "+", isStart: false, isAccept: true, isTrap: false },
  },
  transitions: {
    start: { a: "q1", b: "q2" },
    q1: { a: "q3", b: "trap" },
    q2: { a: "trap", b: "q4" },
    q3: { a: "q6", b: "q6" },
    q4: { a: "q7", b: "q7" },
    q6: { a: "final1", b: "final1" },
    q7: { a: "final2", b: "final2" },
    trap: { a: "trap", b: "trap" },
    final1: { a: "final1", b: "final1" },
    final2: { a: "final2", b: "final2" },
  },
  positions: {
    start: { x: 80, y: 235 }, q1: { x: 230, y: 110 }, q2: { x: 230, y: 360 },
    q3: { x: 390, y: 110 }, q4: { x: 390, y: 360 }, q6: { x: 560, y: 110 },
    q7: { x: 560, y: 360 }, trap: { x: 560, y: 235 },
    final1: { x: 740, y: 110 }, final2: { x: 740, y: 360 },
  },
};

const DFA_01 = {
  alphabet: ["0", "1"],
  regex: "((101) + (111)* + 100) + (1+0+11)*(1+0+01)*<em>(111+000+101)</em>(1+0)*",
  placeholder: "e.g. 101", defaultInput: "101",
  states: {
    start: { label: "−", isStart: true, isAccept: false, isTrap: false },
    sA: { label: "−", isStart: false, isAccept: false, isTrap: false },
    sB: { label: "−", isStart: false, isAccept: false, isTrap: false },
    sC: { label: "−", isStart: false, isAccept: false, isTrap: false },
    sD: { label: "−", isStart: false, isAccept: false, isTrap: false },
    sE: { label: "−", isStart: false, isAccept: false, isTrap: false },
    final: { label: "+", isStart: false, isAccept: true, isTrap: false },
  },
  transitions: {
    start: { 0: "sA", 1: "sB" }, sA: { 0: "sC", 1: "sB" }, sB: { 0: "sD", 1: "sE" },
    sC: { 0: "final", 1: "sB" }, sD: { 0: "final", 1: "final" }, sE: { 0: "sD", 1: "final" },
    final: { 0: "final", 1: "final" },
  },
  positions: {
    start: { x: 80, y: 270 }, sA: { x: 290, y: 100 }, sB: { x: 290, y: 270 },
    sC: { x: 530, y: 100 }, sD: { x: 530, y: 270 }, sE: { x: 530, y: 430 },
    final: { x: 820, y: 270 },
  },
};

// ═══════════════════════════════════════════════
// ② PDA — Canvas-drawn diagram matching professor's exact layout
//    We bypass the node/edge system and draw directly
// ═══════════════════════════════════════════════

// PDA_AB simulation states (for tape/log)
// Step pattern: each step = { node: currentNode, charIdx: charBeingRead, log: description }
// charIdx points at the character currently being READ (highlighted on tape).
// After all chars consumed, charIdx = str.length (tape shows "end").
const PDA_AB_SIM = {
  alphabet: ["a", "b"],
  simulate(str) {
    const steps = [];
    const push = (node, charIdx, log) => steps.push({ node, charIdx, log });

    // Step 1: arrive at r1 (first READ node), about to read char[0]
    push("r1", 0, `At READ node — waiting for char 1 (or ^)`);

    // Empty string → reject immediately
    if (str.length === 0) {
      push("rej1", 0, `Read ^ (empty) at READ → REJECT`);
      return steps;
    }

    // Read char 1
    const c1 = str[0];
    if (c1 === "a") {
      // Move to ra, now about to read char[1]
      push("ra", 1, `Read '${c1}' → left branch (need 'a','a' prefix) — now at READ (need 'a')`);
      if (str.length < 2) {
        push("rejL", 1, `Read ^ — need 'a' but string ended → REJECT`);
        return steps;
      }
      if (str[1] !== "a") {
        push("rejL", 1, `Read '${str[1]}' ≠ 'a' → REJECT`);
        return steps;
      }
    } else {
      // Move to rb, now about to read char[1]
      push("rb", 1, `Read '${c1}' → right branch (need 'b','b' prefix) — now at READ (need 'b')`);
      if (str.length < 2) {
        push("rejR", 1, `Read ^ — need 'b' but string ended → REJECT`);
        return steps;
      }
      if (str[1] !== "b") {
        push("rejR", 1, `Read '${str[1]}' ≠ 'b' → REJECT`);
        return steps;
      }
    }

    // char[1] confirmed — move to r3, about to read char[2]
    push("r3", 2, `Read '${str[1]}' ✓ prefix confirmed — at READ (char 3 mandatory)`);

    if (str.length < 3) {
      push("rejM", 2, `Read ^ — need ≥ 4 chars, only ${str.length} given → REJECT`);
      return steps;
    }

    // Read char[2] — loop on r3, move toward r4; r3 accepts any symbol
    // r3 reads char 3 (mandatory) then optionally more via self-loop
    // For simplicity: read char[2] at r3, then transition toward r4
    push("r3", 3, `Read '${str[2]}' ✓ at READ — checking for char 4`);

    if (str.length < 4) {
      push("rejM", 3, `Read ^ — need ≥ 4 chars, only ${str.length} given → REJECT`);
      return steps;
    }

    // Move to r4, read char[3]
    push("r4", 3, `Moving to READ (char 4 mandatory) — reading char 4`);
    push("r4", 4, `Read '${str[3]}' ✓ at READ (char 4)`);

    // Any remaining chars loop on r4 then finally move to r5
    for (let i = 4; i < str.length; i++) {
      push("r4", i + 1, `Read '${str[i]}' ✓ — looping at READ`);
    }

    // All chars consumed — move to r5, read ^ (end)
    push("r5", str.length, `Read ^ → all chars consumed — at final READ`);

    // Accept
    push("accept", str.length, `Read ^ at final READ → ACCEPT ✓`);
    return steps;
  }
};

const PDA_01_SIM = {
  alphabet: ["0", "1"],
  simulate(str) {
    const steps = [];
    // push(node, charIdx, log)
    // node    = diagram node key to highlight
    // charIdx = index of character currently being read (tape highlight)
    //           charIdx === str.length means "read ^" (end of input)
    const push = (node, charIdx, log) => steps.push({ node, charIdx, log });

    // Maps internal state name → diagram node key
    const stateToNode = {
      "q0":  "q0",
      "q_0": "r_0",
      "q_1": "r_1",
      "q_00":"r_00",
      "q_10":"r_10",
      "q_11":"r_11",
      "loop":"loop",
    };
    const stateToReject = {
      "q0":  "rej1",
      "q_0": "rejL0",
      "q_1": "rejR1",
      "q_00":"rejL00",
      "q_10":"rej10",
      "q_11":"rejR11",
    };
    const nodeLabel = {
      "q0":  "READ (start)",
      "q_0": "READ (saw '0')",
      "q_1": "READ (saw '1')",
      "q_00":"READ (saw '00')",
      "q_10":"READ (saw '10')",
      "q_11":"READ (saw '11')",
      "loop":"LOOP",
    };

    // ── Step 0: arrive at q0, about to read char[0] ──
    push("q0", 0, `At READ (start) — waiting for char 1`);

    // Empty string
    if (str.length === 0) {
      push("rej1", 0, `Read ^ (empty string) → REJECT`);
      return steps;
    }

    let state = "q0";

    for (let i = 0; i < str.length; i++) {
      const ch = str[i];

      // Determine next state from current state + char
      let nextState = null;
      if (state === "q0") {
        nextState = ch === "0" ? "q_0" : "q_1";
      } else if (state === "q_0") {
        nextState = ch === "0" ? "q_00" : "q_1";
      } else if (state === "q_1") {
        nextState = ch === "0" ? "q_10" : "q_11";
      } else if (state === "q_00") {
        nextState = ch === "0" ? "loop" : "q_11";
      } else if (state === "q_10") {
        nextState = ch === "0" ? "q_00" : "loop";
      } else if (state === "q_11") {
        nextState = ch === "0" ? "q_10" : "loop";
      } else if (state === "loop") {
        // Already in loop — keep looping, reading remaining suffix
        push("loop", i + 1, `Read '${ch}' at ${i + 1} → looping (suffix)`);
        continue;
      }

      // Emit step: we are NOW at nextState, having just read ch at position i.
      // charIdx = i+1 means the tape advances past char i (char i is now "done").
      const foundPattern =
        (state === "q_00" && ch === "0") ? "000" :
        (state === "q_10" && ch === "1") ? "101" :
        (state === "q_11" && ch === "1") ? "111" : null;

      if (foundPattern) {
        push(stateToNode[nextState], i + 1,
          `Read '${ch}' at pos ${i + 1} — pattern '${foundPattern}' found! → entering LOOP`);
      } else {
        push(stateToNode[nextState], i + 1,
          `Read '${ch}' at pos ${i + 1} → now at ${nodeLabel[nextState]}`);
      }

      state = nextState;
      if (state === "loop") {
        // Read remaining suffix chars in loop
        for (let j = i + 1; j < str.length; j++) {
          push("loop", j + 1, `Read '${str[j]}' at pos ${j + 1} → looping (suffix)`);
        }
        // End of input in loop state → accept
        push("loop", str.length, `Read ^ (end of input) — still in LOOP`);
        push("accept", str.length, `ACCEPT ✓ — pattern found and all input consumed`);
        return steps;
      }
    }

    // Exhausted input without reaching loop → REJECT
    const rejNode = stateToReject[state] || "rej1";
    push(rejNode, str.length,
      `Read ^ at ${nodeLabel[state] || state} — no pattern (000/101/111) found → REJECT`);
    return steps;
  }
};

// ═══════════════════════════════════════════════
// ③ CANVAS & GLOBALS
// ═══════════════════════════════════════════════
const canvas = document.getElementById("dfaCanvas");
const pdaCanvas = document.getElementById("pdaCanvas");
const ctx = canvas.getContext("2d");
const pdaCtx = pdaCanvas ? pdaCanvas.getContext("2d") : null;

const W = 940, H = 520;
let DFA = DFA_AB;
let currentAutomaton = "dfa";
const NODE_R = 34;

let inputStr = "";
let currentStep = -1;
let executionSteps = [];
let isPlaying = false;
let playTimer = null;
let activeState = "start";
let activeEdge = null;
let visitedStates = new Set();
let visitedEdges = new Set();

let particleT = 0, pulseT = 0, animRaf = null, lastTime = 0;
let activeTabId = "ab";

// PDA-specific state
let pdaSteps = [];
let pdaCurStep = -1;
let pdaIsPlaying = false;
let pdaPlayTimer = null;
let pdaActiveNode = null;
let pdaVisitedNodes = new Set();
let pdaInputStr = "";

// ═══════════════════════════════════════════════
// ④ BUILD-UP ANIMATION
// ═══════════════════════════════════════════════
const BUILDUP = {
  nodeProgress: {}, nodeStart: {}, edgeProgress: {}, edgeStart: {},
  active: false, startTime: 0,
  NODE_STAGGER: 90, NODE_DURATION: 520, EDGE_DELAY: 420, EDGE_STAGGER: 70, EDGE_DURATION: 480,
};
function easeInOut(t) { return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2; }
function startBuildup() {
  const now = performance.now();
  BUILDUP.active = true; BUILDUP.startTime = now;
  BUILDUP.nodeProgress = {}; BUILDUP.nodeStart = {}; BUILDUP.edgeProgress = {}; BUILDUP.edgeStart = {};
  const sorted = [...Object.keys(DFA.states)].sort((a,b) => DFA.positions[a].x - DFA.positions[b].x);
  sorted.forEach((id,i) => { BUILDUP.nodeStart[id] = now + i*BUILDUP.NODE_STAGGER; BUILDUP.nodeProgress[id] = 0; });
  getAllEdges().forEach((e,i) => {
    const key = `${e.from}→${e.to}`;
    BUILDUP.edgeStart[key] = now + BUILDUP.EDGE_DELAY + i*BUILDUP.EDGE_STAGGER;
    BUILDUP.edgeProgress[key] = 0;
  });
}
function tickBuildup(now) {
  if (!BUILDUP.active) return;
  let allDone = true;
  for (const id of Object.keys(DFA.states)) {
    const raw = Math.min(Math.max((now - BUILDUP.nodeStart[id]) / BUILDUP.NODE_DURATION, 0), 1);
    BUILDUP.nodeProgress[id] = easeInOut(raw);
    if (raw < 1) allDone = false;
  }
  for (const e of getAllEdges()) {
    const key = `${e.from}→${e.to}`;
    const raw = Math.min(Math.max((now - BUILDUP.edgeStart[key]) / BUILDUP.EDGE_DURATION, 0), 1);
    BUILDUP.edgeProgress[key] = easeInOut(raw);
    if (raw < 1) allDone = false;
  }
  if (allDone) BUILDUP.active = false;
}
function nodeAlpha(id) { if (!BUILDUP.active && Object.keys(BUILDUP.nodeProgress).length === 0) return 1; return BUILDUP.nodeProgress[id] ?? 1; }
function edgeProg(from, to) { if (!BUILDUP.active && Object.keys(BUILDUP.edgeProgress).length === 0) return 1; return BUILDUP.edgeProgress[`${from}→${to}`] ?? 1; }

// ═══════════════════════════════════════════════
// ⑤ GEOMETRY
// ═══════════════════════════════════════════════
function bezierPt(sx,sy,cpx,cpy,ex,ey,t) { return { x:(1-t)*(1-t)*sx+2*(1-t)*t*cpx+t*t*ex, y:(1-t)*(1-t)*sy+2*(1-t)*t*cpy+t*t*ey }; }
function bezierTangent(sx,sy,cpx,cpy,ex,ey,t) { return Math.atan2(2*(1-t)*(cpy-sy)+2*t*(ey-cpy), 2*(1-t)*(cpx-sx)+2*t*(ex-cpx)); }
function getEdgeCurve(from, to, automaton) {
  if (from === to) return null;
  const pFrom = automaton.positions[from], pTo = automaton.positions[to];
  const hasReverse = automaton.transitions[to] && Object.values(automaton.transitions[to]).includes(from);
  const angle = Math.atan2(pTo.y - pFrom.y, pTo.x - pFrom.x);
  if (!hasReverse) {
    return { sx: pFrom.x + NODE_R*Math.cos(angle), sy: pFrom.y + NODE_R*Math.sin(angle), cpx: (pFrom.x+pTo.x)/2, cpy: (pFrom.y+pTo.y)/2, ex: pTo.x - NODE_R*Math.cos(angle), ey: pTo.y - NODE_R*Math.sin(angle) };
  }
  const CURVE_BOW = 42, EDGE_OFF = 16;
  const perp = angle + Math.PI/2, nx = Math.cos(perp), ny = Math.sin(perp);
  const sx = pFrom.x + NODE_R*Math.cos(angle) + EDGE_OFF*nx, sy = pFrom.y + NODE_R*Math.sin(angle) + EDGE_OFF*ny;
  const ex = pTo.x - NODE_R*Math.cos(angle) + EDGE_OFF*nx, ey = pTo.y - NODE_R*Math.sin(angle) + EDGE_OFF*ny;
  const mx = (sx+ex)/2, my = (sy+ey)/2;
  return { sx, sy, cpx: mx+nx*CURVE_BOW, cpy: my+ny*CURVE_BOW, ex, ey };
}

// ═══════════════════════════════════════════════
// ⑥ SPACESHIP
// ═══════════════════════════════════════════════
const TRAIL_MAX = 28;
let shipTrail = [], shipPos = null;
function updateShipPos() {
  if (!activeEdge) { shipPos = null; shipTrail = []; return; }
  const { from, to } = activeEdge; const t = particleT % 1;
  if (from === to) {
    const p = DFA.positions[from]; const loopR = 23, loopCY = p.y - NODE_R - 28;
    const startA = Math.PI + 0.42, endA = Math.PI - 0.42 + 2*Math.PI;
    const a = startA + (endA - startA)*t;
    shipPos = { x: p.x + loopR*Math.cos(a), y: loopCY + loopR*Math.sin(a), angle: a + Math.PI/2 };
  } else {
    const curve = getEdgeCurve(from, to, DFA);
    if (!curve) { shipPos = null; return; }
    const { sx,sy,cpx,cpy,ex,ey } = curve;
    shipPos = { ...bezierPt(sx,sy,cpx,cpy,ex,ey,t), angle: bezierTangent(sx,sy,cpx,cpy,ex,ey,Math.min(t,0.999)) };
  }
  shipTrail.push({ x: shipPos.x, y: shipPos.y });
  if (shipTrail.length > TRAIL_MAX) shipTrail.shift();
}
function drawTrail(c=ctx) {
  if (shipTrail.length < 2) return;
  for (let i = 1; i < shipTrail.length; i++) {
    const frac = i/shipTrail.length; const alpha = frac*frac*0.9; const lw = 1.0+frac*3.0;
    const color = frac > 0.55 ? "#e0a830" : "#e06b45";
    c.save(); c.globalAlpha = alpha; c.strokeStyle = color; c.lineWidth = lw; c.lineCap = "round";
    c.shadowColor = color; c.shadowBlur = 8*frac; c.beginPath();
    c.moveTo(shipTrail[i-1].x, shipTrail[i-1].y); c.lineTo(shipTrail[i].x, shipTrail[i].y); c.stroke(); c.restore();
  }
}
function drawShipBody(x,y,angle,c=ctx) {
  c.save(); c.translate(x,y); c.rotate(angle); const S=9;
  const exG = c.createRadialGradient(-S*0.8,0,0,-S*0.8,0,S);
  exG.addColorStop(0,"rgba(255,200,60,0.95)"); exG.addColorStop(0.45,"rgba(224,107,69,0.6)"); exG.addColorStop(1,"rgba(224,107,69,0)");
  c.save(); c.shadowColor="#ffcc44"; c.shadowBlur=20; c.beginPath(); c.ellipse(-S*0.8,0,S,S*0.5,0,0,2*Math.PI); c.fillStyle=exG; c.fill(); c.restore();
  c.save(); c.shadowColor="#e06b45"; c.shadowBlur=14; c.beginPath(); c.moveTo(S,0); c.lineTo(-S*0.55,-S*0.55); c.lineTo(-S*0.25,-S*0.18); c.lineTo(-S*0.7,0); c.lineTo(-S*0.25,S*0.18); c.lineTo(-S*0.55,S*0.55); c.closePath();
  const hullG = c.createLinearGradient(S,0,-S*0.7,0); hullG.addColorStop(0,"#f5f0e8"); hullG.addColorStop(0.45,"#c8bfb0"); hullG.addColorStop(1,"#8a7f74");
  c.fillStyle=hullG; c.fill(); c.strokeStyle="rgba(224,107,69,0.55)"; c.lineWidth=0.7; c.stroke(); c.restore();
  c.save(); c.shadowColor="#3ab8a8"; c.shadowBlur=8; c.beginPath(); c.ellipse(S*0.28,0,S*0.3,S*0.19,0,0,2*Math.PI); c.fillStyle="#3ab8a8"; c.fill(); c.restore();
  c.restore();
}

// ═══════════════════════════════════════════════
// ⑦ DFA DRAW HELPERS
// ═══════════════════════════════════════════════
function drawArrow(x,y,angle,color,sz=7,c=ctx) {
  c.save(); c.translate(x,y); c.rotate(angle); c.beginPath(); c.moveTo(0,0); c.lineTo(-sz,-sz*0.45); c.lineTo(-sz*0.6,0); c.lineTo(-sz,sz*0.45); c.closePath(); c.fillStyle=color; c.fill(); c.restore();
}
function getAllEdges(automaton=DFA) {
  const map = {};
  for (const [from, targets] of Object.entries(automaton.transitions)) {
    for (const [sym, to] of Object.entries(targets)) {
      const key = `${from}→${to}`;
      if (!map[key]) map[key] = { from, to, syms: [] };
      map[key].syms.push(sym);
    }
  }
  return Object.values(map);
}
function drawEdge(e, isActive, automaton=DFA, c=ctx) {
  const { from, to, syms } = e; const label = syms.join(", ");
  const prog = edgeProg(from, to); if (prog <= 0) return;
  const edgeKey = `${from}→${to}`; const isVisited = visitedEdges.has(edgeKey);
  let edgeColor = "#9a9088", lblColor = "#6b6258", lw = 1.8;
  if (isActive) { edgeColor = "#c95f3f"; lblColor = "#c95f3f"; lw = 2.5; }
  else if (isVisited) { edgeColor = "#b07d2a"; lblColor = "#b07d2a"; lw = 2.1; }
  c.save(); c.globalAlpha = Math.min(prog*2,1); c.strokeStyle = edgeColor; c.lineWidth = lw;
  if (from === to) {
    const p = automaton.positions[from]; const loopR=23, loopCY=p.y-NODE_R-28;
    const startA=Math.PI+0.42, endDraw=startA+(2*Math.PI-0.84)*prog;
    c.beginPath(); c.arc(p.x,loopCY,loopR,startA,endDraw,false); c.stroke();
    if (prog > 0.88) {
      c.globalAlpha = Math.min((prog-0.88)/0.12,1)*Math.min(prog*2,1);
      const arcEX=p.x+loopR*Math.cos(Math.PI-0.42), arcEY=loopCY+loopR*Math.sin(Math.PI-0.42);
      const aAng=Math.atan2(p.y-arcEY,p.x-arcEX);
      drawArrow(p.x+NODE_R*Math.cos(aAng-Math.PI),p.y+NODE_R*Math.sin(aAng-Math.PI),aAng,edgeColor,7,c);
      c.font='400 10px "DM Mono",monospace'; const tw=c.measureText(label).width;
      c.fillStyle="rgba(245,240,232,0.92)"; c.beginPath(); c.roundRect(p.x-tw/2-6,loopCY-loopR-13,tw+12,14,2); c.fill();
      c.fillStyle=lblColor; c.textAlign="center"; c.textBaseline="bottom"; c.fillText(label,p.x,loopCY-loopR-1);
    }
    c.restore(); return;
  }
  const curve = getEdgeCurve(from,to,automaton); const {sx,sy,cpx,cpy,ex,ey}=curve;
  const STEPS=40, drawSteps=Math.floor(prog*STEPS);
  c.beginPath(); c.moveTo(sx,sy);
  for (let i=1;i<=drawSteps;i++) { const pt=bezierPt(sx,sy,cpx,cpy,ex,ey,i/STEPS); c.lineTo(pt.x,pt.y); }
  c.stroke();
  if (prog > 0.88) {
    c.globalAlpha = Math.min((prog-0.88)/0.12,1)*Math.min(prog*2,1);
    drawArrow(ex,ey,bezierTangent(sx,sy,cpx,cpy,ex,ey,0.999),edgeColor,7,c);
    const lpt=bezierPt(sx,sy,cpx,cpy,ex,ey,0.5); const tang=bezierTangent(sx,sy,cpx,cpy,ex,ey,0.5);
    const lx=lpt.x+-Math.sin(tang)*13, ly=lpt.y+Math.cos(tang)*13;
    c.font='400 10px "DM Mono",monospace'; const tw2=c.measureText(label).width;
    c.fillStyle="rgba(245,240,232,0.92)"; c.beginPath(); c.roundRect(lx-tw2/2-5,ly-8,tw2+10,15,2); c.fill();
    c.fillStyle=lblColor; c.textAlign="center"; c.textBaseline="middle"; c.fillText(label,lx,ly);
  }
  c.restore();
}
function drawNode(id,isActive,automaton=DFA,c=ctx) {
  const p=automaton.positions[id]; const s=automaton.states[id]; const prog=nodeAlpha(id); if(prog<=0)return;
  const isVisited=visitedStates.has(id);
  const accent=s.isTrap?"#c95f3f":s.isAccept?"#2e7d78":s.isStart?"#2e7d78":"#6b6258";
  c.save(); c.globalAlpha=prog;
  const sc=0.35+0.65*prog; c.translate(p.x,p.y); c.scale(sc,sc); c.translate(-p.x,-p.y);
  if(s.isAccept){c.beginPath();c.arc(p.x,p.y,NODE_R+7,0,2*Math.PI);c.strokeStyle=isActive?"#2e7d78":"rgba(46,125,120,0.45)";c.lineWidth=1.2;c.stroke();}
  const grad=c.createRadialGradient(p.x-NODE_R*0.3,p.y-NODE_R*0.3,2,p.x,p.y,NODE_R);
  if(isActive){if(s.isTrap){grad.addColorStop(0,"rgba(201,95,63,0.35)");grad.addColorStop(1,"rgba(201,95,63,0.08)");}else if(s.isAccept){grad.addColorStop(0,"rgba(46,125,120,0.35)");grad.addColorStop(1,"rgba(46,125,120,0.08)");}else{grad.addColorStop(0,"rgba(176,125,42,0.25)");grad.addColorStop(1,"rgba(176,125,42,0.05)");}}
  else if(isVisited){grad.addColorStop(0,"rgba(176,125,42,0.12)");grad.addColorStop(1,"rgba(176,125,42,0.02)");}
  else{grad.addColorStop(0,"#f5f0e8");grad.addColorStop(1,"#e4ddd0");}
  c.beginPath();c.arc(p.x,p.y,NODE_R,0,2*Math.PI);c.fillStyle=grad;c.fill();
  c.beginPath();c.arc(p.x,p.y,NODE_R,0,2*Math.PI);
  c.strokeStyle=isActive?accent:isVisited?"#b07d2a":s.isTrap?"rgba(201,95,63,0.9)":s.isAccept?"rgba(46,125,120,0.9)":"#8a8278";
  c.lineWidth=isActive?3.5:isVisited?2.4:2.8;c.stroke();
  c.textAlign="center";c.textBaseline="middle";c.font='700 15px "DM Sans",sans-serif';
  c.fillStyle=isActive?accent:isVisited?"#b07d2a":s.isTrap?"#c95f3f":s.isAccept?"#2e7d78":"#4a4540";
  if(s.isStart||s.isTrap||s.isAccept)c.fillText(s.label,p.x,p.y);
  c.font='300 7.5px "DM Mono",monospace';c.fillStyle="#a09588";
  c.fillText(id.startsWith("final")?"final":id,p.x,p.y+NODE_R+11);
  c.restore();
}
function drawStartArrow(automaton=DFA,c=ctx) {
  const p=automaton.positions["start"];
  c.save();c.strokeStyle="#d8d0c4";c.lineWidth=1.2;c.setLineDash([3,4]);
  c.beginPath();c.moveTo(p.x-NODE_R-32,p.y);c.lineTo(p.x-NODE_R,p.y);c.stroke();
  c.setLineDash([]);drawArrow(p.x-NODE_R,p.y,0,"#a09588",7,c);c.restore();
}
let stars=[];
function initStars(cw,ch){stars=[];for(let i=0;i<55;i++)stars.push({x:Math.random()*cw,y:Math.random()*ch,r:Math.random()*1.2+0.3,a:Math.random()*0.35+0.08});}
function drawStars(c=ctx){for(const s of stars){c.beginPath();c.arc(s.x,s.y,s.r,0,2*Math.PI);c.fillStyle=`rgba(160,149,136,${s.a})`;c.fill();}}

// ═══════════════════════════════════════════════
// ⑧ PDA CANVAS DRAWING
// ═══════════════════════════════════════════════

const PDA_COLORS = {
  normal:   { fill: "#f5f0e8", stroke: "#8a8278", text: "#4a4540" },
  active:   { fill: "#B5D4F4", stroke: "#185FA5", text: "#0C447C" },
  visited:  { fill: "#f0e8d0", stroke: "#b07d2a", text: "#7a5a1a" },
  accept:   { fill: "#C0DD97", stroke: "#3B6D11", text: "#27500A" },
  reject:   { fill: "#F7C1C1", stroke: "#A32D2D", text: "#791F1F" },
  start:    { fill: "#f5f0e8", stroke: "#8a8278", text: "#4a4540" },
};

function pdaColor(nodeKey) {
  if (pdaActiveNode === nodeKey) {
    if (nodeKey === "accept") return PDA_COLORS.accept;
    if (nodeKey.startsWith("rej")) return PDA_COLORS.reject;
    return PDA_COLORS.active;
  }
  if (pdaVisitedNodes.has(nodeKey)) {
    if (nodeKey === "accept") return PDA_COLORS.accept;
    if (nodeKey.startsWith("rej")) return PDA_COLORS.reject;
    return PDA_COLORS.visited;
  }
  if (nodeKey === "accept") return { fill: "#e8f5e0", stroke: "#3B6D11", text: "#3B6D11" };
  if (nodeKey.startsWith("rej")) return { fill: "#faeaea", stroke: "#c07070", text: "#c07070" };
  return PDA_COLORS.normal;
}

function pdaDiamond(c, x, y, hw, hh, col) {
  c.save();
  c.beginPath();
  c.moveTo(x, y - hh); c.lineTo(x + hw, y); c.lineTo(x, y + hh); c.lineTo(x - hw, y);
  c.closePath();
  c.fillStyle = col.fill; c.fill();
  c.strokeStyle = col.stroke; c.lineWidth = col === PDA_COLORS.active ? 2.5 : 1.5; c.stroke();
  c.fillStyle = col.text; c.font = '600 11px "DM Sans",sans-serif';
  c.textAlign = "center"; c.textBaseline = "middle";
  c.fillText("READ", x, y);
  c.restore();
}

function pdaEllipse(c, x, y, rx, ry, label, col, double_ring=false) {
  c.save();
  c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 2*Math.PI);
  c.fillStyle = col.fill; c.fill();
  c.strokeStyle = col.stroke; c.lineWidth = col === PDA_COLORS.active ? 2.5 : 1.5; c.stroke();
  if (double_ring) {
    c.beginPath(); c.ellipse(x, y, rx-5, ry-5, 0, 0, 2*Math.PI);
    c.strokeStyle = col.stroke; c.lineWidth = 1; c.stroke();
  }
  c.fillStyle = col.text; c.font = '600 10px "DM Sans",sans-serif';
  c.textAlign = "center"; c.textBaseline = "middle";
  c.fillText(label, x, y);
  c.restore();
}

function pdaRect(c, x, y, w, h, label) {
  c.save();
  c.beginPath(); c.roundRect(x - w/2, y - h/2, w, h, 5);
  c.fillStyle = "#f5f0e8"; c.fill();
  c.strokeStyle = "#8a8278"; c.lineWidth = 1.5; c.stroke();
  c.fillStyle = "#4a4540"; c.font = '600 11px "DM Sans",sans-serif';
  c.textAlign = "center"; c.textBaseline = "middle";
  c.fillText(label, x, y);
  c.restore();
}

function pdaArrow(c, x1, y1, x2, y2, label="", labelSide="right", color="#6b6258") {
  const dx = x2-x1, dy = y2-y1, len = Math.sqrt(dx*dx+dy*dy);
  const ux = dx/len, uy = dy/len;
  const angle = Math.atan2(dy, dx);
  c.save();
  c.strokeStyle = color; c.lineWidth = 1.2; c.fillStyle = color;
  c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
  c.save(); c.translate(x2, y2); c.rotate(angle);
  c.beginPath(); c.moveTo(0,0); c.lineTo(-8,-4); c.lineTo(-5,0); c.lineTo(-8,4); c.closePath();
  c.fill(); c.restore();
  if (label) {
    const mx = (x1+x2)/2, my = (y1+y2)/2;
    const ox = labelSide === "right" ? -uy*18 : uy*18;
    const oy = labelSide === "right" ? ux*18 : -ux*18;
    c.font = '500 10px "DM Mono",monospace';
    const tw = c.measureText(label).width;
    c.fillStyle = "rgba(245,240,232,0.92)";
    c.beginPath();
    c.roundRect(mx+ox-tw/2-3, my+oy-7, tw+6, 14, 3);
    c.fill();
    c.fillStyle = color === "#6b6258" ? "#6b6258" : color;
    c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText(label, mx+ox, my+oy);
  }
  c.restore();
}

function pdaSelfLoop(c, x, y, hw, hh, label, side="right") {
  const loopR = 16;
  const cx2 = side === "right" ? x + hw + loopR*2 : x - hw - loopR*2;
  const cy2 = y;
  c.save();
  c.strokeStyle = "#6b6258"; c.lineWidth = 1.2;
  c.beginPath();
  c.arc(cx2, cy2, loopR, 0, 2*Math.PI);
  c.stroke();
  const ax = cx2, ay = cy2 + loopR;
  c.fillStyle = "#6b6258";
  c.save(); c.translate(ax, ay); c.rotate(Math.PI/2);
  c.beginPath(); c.moveTo(0,0); c.lineTo(-6,-3); c.lineTo(-4,0); c.lineTo(-6,3); c.closePath(); c.fill(); c.restore();
  c.font = '500 10px "DM Mono",monospace';
  c.fillStyle = "#6b6258"; c.textAlign = "center"; c.textBaseline = "middle";
  c.fillText(label, cx2 + (side==="right"?loopR+8:-loopR-8), cy2);
  c.restore();
}

// ─────────────────────────────────────────────
// DRAW PDA_AB (a,b regex)
// ─────────────────────────────────────────────
function drawPDA_AB(c, cw, ch) {
  const diagramW = 600, diagramH = 680;
  const scale = Math.min(cw / diagramW, ch / diagramH);
  const offX = (cw - diagramW*scale)/2;
  const offY = (ch - diagramH*scale)/2;

  c.save();
  c.translate(offX, offY);
  c.scale(scale, scale);

  const CX = 300;

  const nodes = {
    start: { x: CX, y: 30 },
    r1:    { x: CX, y: 95 },
    ra:    { x: CX-110, y: 190 },
    rb:    { x: CX+110, y: 190 },
    rejL:  { x: CX-220, y: 190 },
    rejR:  { x: CX+220, y: 190 },
    rej1:  { x: CX+150, y: 95 },
    rejM:  { x: CX+150, y: 305 },
    r3:    { x: CX, y: 305 },
    rejL2: { x: CX-130, y: 415 },
    r4:    { x: CX, y: 415 },
    r5:    { x: CX, y: 515 },
    accept:{ x: CX, y: 620 },
  };

  const D = (key, x, y) => pdaDiamond(c, x, y, 50, 28, pdaColor(key));
  const E = (key, x, y, label, dbl=false) => pdaEllipse(c, x, y, 40, 18, label, pdaColor(key), dbl);
  const A = (x1,y1,x2,y2,lbl="",side="right") => pdaArrow(c,x1,y1,x2,y2,lbl,side);

  pdaRect(c, nodes.start.x, nodes.start.y, 80, 26, "START");
  A(CX, nodes.start.y+13, CX, nodes.r1.y-28);
  D("r1", nodes.r1.x, nodes.r1.y);
  A(nodes.r1.x+50, nodes.r1.y, nodes.rej1.x-40, nodes.rej1.y, "^");
  E("rej1", nodes.rej1.x, nodes.rej1.y, "REJECT");
  A(nodes.r1.x-20, nodes.r1.y+28, nodes.ra.x+20, nodes.ra.y-28, "a", "left");
  A(nodes.r1.x+20, nodes.r1.y+28, nodes.rb.x-20, nodes.rb.y-28, "b", "right");
  D("ra", nodes.ra.x, nodes.ra.y);
  A(nodes.ra.x-50, nodes.ra.y, nodes.rejL.x+40, nodes.rejL.y, "b,^");
  E("rejL", nodes.rejL.x, nodes.rejL.y, "REJECT");
  D("rb", nodes.rb.x, nodes.rb.y);
  A(nodes.rb.x+50, nodes.rb.y, nodes.rejR.x-40, nodes.rejR.y, "a,^");
  E("rejR", nodes.rejR.x, nodes.rejR.y, "REJECT");
  E("rejM", nodes.rejM.x+150, nodes.rejM.y, "REJECT");
  A(nodes.ra.x+20, nodes.ra.y+28, nodes.r3.x-20, nodes.r3.y-28, "a", "left");
  A(nodes.rb.x-20, nodes.rb.y+28, nodes.r3.x+20, nodes.r3.y-28, "b", "right");
  D("r3", nodes.r3.x, nodes.r3.y);
  A(nodes.r3.x+50, nodes.r3.y, nodes.rejM.x+110, nodes.rejM.y, "^");
  pdaSelfLoop(c, nodes.r3.x, nodes.r3.y, 50, 28, "a,b", "right");
  A(CX, nodes.r3.y+28, CX, nodes.r4.y-28, "a,b");
  D("r4", nodes.r4.x, nodes.r4.y);
  A(nodes.r4.x-50, nodes.r4.y, nodes.rejL2.x+40, nodes.rejL2.y, "^");
  E("rejL2", nodes.rejL2.x, nodes.rejL2.y, "REJECT");
  pdaSelfLoop(c, nodes.r4.x, nodes.r4.y, 50, 28, "a,b", "right");
  A(CX, nodes.r4.y+28, CX, nodes.r5.y-28, "a,b");
  D("r5", nodes.r5.x, nodes.r5.y);
  pdaSelfLoop(c, nodes.r5.x, nodes.r5.y, 50, 28, "a,b", "right");
  A(CX, nodes.r5.y+28, CX, nodes.accept.y-22, "^");
  pdaEllipse(c, nodes.accept.x, nodes.accept.y, 48, 22, "ACCEPT", pdaColor("accept"), true);

  c.restore();
}

// ─────────────────────────────────────────────
// DRAW PDA_01 — FIXED: no overlapping nodes
// ─────────────────────────────────────────────
function drawPDA_01(c, cw, ch) {
  const diagramW = 780, diagramH = 820;
  const scale = Math.min(cw / diagramW, ch / diagramH);
  const offX = (cw - diagramW * scale) / 2;
  const offY = (ch - diagramH * scale) / 2;
  c.save();
  c.translate(offX, offY);
  c.scale(scale, scale);

  const DW = 58, DH = 33, ERX = 46, ERY = 21;

  // Three well-separated columns
  const CX  = 390;   // centre spine: q0, q_10, loop, accept
  const X_L = 180;   // left col:     q_0, q_00
  const X_R = 600;   // right col:    q_1, q_11

  // REJECT nodes pushed far outside the diagram columns
  const REJ_L = 40;   // far-left REJECT centre x
  const REJ_R = 740;  // far-right REJECT centre x
  const REJ_C_R = CX + DW + 90; // centre-right REJECT for q0 and q_10

  const Y = {
    start:  20,
    q0:    110,
    q_0:   240,   // row 2 — left
    q_1:   240,   // row 2 — right  (same Y, different X — now well-separated)
    q_00:  370,   // row 3 — left
    q_10:  370,   // row 3 — centre
    q_11:  370,   // row 3 — right
    loop:  500,
    accept:630,
  };

  const D  = (k,x,y) => pdaDiamond(c, x, y, DW, DH, pdaColor(k));
  const E  = (k,x,y,l) => pdaEllipse(c, x, y, ERX, ERY, l, pdaColor(k), false);
  const A  = (x1,y1,x2,y2,l="",s="right") => pdaArrow(c, x1, y1, x2, y2, l, s);
  const SL = () => pdaSelfLoop(c, CX, Y.loop, DW, DH, "0,1", "right");

  // ════ ARROWS (drawn first, behind nodes) ════

  // START → q0
  A(CX, Y.start + 13, CX, Y.q0 - DH, "");

  // q0 → REJECT (^) — right side
  A(CX + DW, Y.q0, REJ_C_R - ERX, Y.q0, "^", "left");

  // q0 → q_0 on 0 (diagonal down-left)
  A(CX - 16, Y.q0 + DH, X_L + 16, Y.q_0 - DH, "0", "left");

  // q0 → q_1 on 1 (diagonal down-right)
  A(CX + 16, Y.q0 + DH, X_R - 16, Y.q_1 - DH, "1", "right");

  // q_0 → REJECT (^) — far left
  A(X_L - DW, Y.q_0, REJ_L + ERX, Y.q_0, "^", "right");

  // q_0 → q_00 on 0 (straight down)
  A(X_L, Y.q_0 + DH, X_L, Y.q_00 - DH, "0", "left");

  // q_0 → q_1 on 1 (horizontal right)
  A(X_L + DW, Y.q_0, X_R - DW, Y.q_1, "1", "left");

  // q_1 → REJECT (^) — far right
  A(X_R + DW, Y.q_1, REJ_R - ERX, Y.q_1, "^", "left");

  // q_1 → q_10 on 0 (diagonal down-left to centre)
  A(X_R - 16, Y.q_1 + DH, CX + 16, Y.q_10 - DH, "0", "right");

  // q_1 → q_11 on 1 (straight down)
  A(X_R, Y.q_1 + DH, X_R, Y.q_11 - DH, "1", "right");

  // q_00 → REJECT (^) — far left
  A(X_L - DW, Y.q_00, REJ_L + ERX, Y.q_00, "^", "right");

  // q_00 → loop on 0 (found 000! diagonal down-right to centre)
  A(X_L + 16, Y.q_00 + DH, CX - 16, Y.loop - DH, "0", "left");

  // q_00 → q_11 on 1 (horizontal right)
  A(X_L + DW, Y.q_00, X_R - DW, Y.q_11, "1", "left");

  // q_10 → REJECT (^) — centre-right
  A(CX + DW, Y.q_10, REJ_C_R - ERX, Y.q_10, "^", "left");

  // q_10 → q_00 on 0 (horizontal left)
  A(CX - DW, Y.q_10, X_L + DW, Y.q_00, "0", "right");

  // q_10 → loop on 1 (found 101! straight down)
  A(CX, Y.q_10 + DH, CX, Y.loop - DH, "1", "right");

  // q_11 → REJECT (^) — far right
  A(X_R + DW, Y.q_11, REJ_R - ERX, Y.q_11, "^", "left");

  // q_11 → q_10 on 0 (horizontal left to centre)
  A(X_R - DW, Y.q_11, CX + DW, Y.q_10, "0", "right");

  // q_11 → loop on 1 (found 111! diagonal down-left to centre)
  A(X_R - 16, Y.q_11 + DH, CX + 16, Y.loop - DH, "1", "right");

  // loop → accept (^)
  A(CX, Y.loop + DH, CX, Y.accept - 22, "^", "right");

  // self-loop on loop node
  SL();

  // ════ NODES (drawn on top of arrows) ════

  pdaRect(c, CX, Y.start, 80, 26, "START");

  D("q0",  CX,  Y.q0);
  E("rej1", REJ_C_R, Y.q0, "REJECT");

  D("r_0",  X_L, Y.q_0);
  E("rejL0", REJ_L, Y.q_0, "REJECT");

  D("r_1",  X_R, Y.q_1);
  E("rejR1", REJ_R, Y.q_1, "REJECT");

  D("r_00", X_L, Y.q_00);
  E("rejL00", REJ_L, Y.q_00, "REJECT");

  D("r_10", CX,  Y.q_10);
  E("rej10", REJ_C_R, Y.q_10, "REJECT");

  D("r_11", X_R, Y.q_11);
  E("rejR11", REJ_R, Y.q_11, "REJECT");

  D("loop", CX,  Y.loop);

  pdaEllipse(c, CX, Y.accept, 48, 22, "ACCEPT", pdaColor("accept"), true);

  c.restore();
}

// ═══════════════════════════════════════════════
// ⑨ RENDER
// ═══════════════════════════════════════════════
function resizeCanvas() {
  const wrap = canvas.parentElement; const dpr = window.devicePixelRatio||1;
  const rect = wrap.getBoundingClientRect(); const h = rect.height-56-11;
  canvas.width=rect.width*dpr; canvas.height=h*dpr;
  canvas.style.width=rect.width+"px"; canvas.style.height=h+"px";
  ctx.setTransform(dpr,0,0,dpr,0,0);
}
function resizePDACanvas() {
  if(!pdaCanvas)return;
  const wrap=pdaCanvas.parentElement; const dpr=window.devicePixelRatio||1;
  const rect=wrap.getBoundingClientRect();
  if(rect.width<10||rect.height<10)return;
  const h=Math.max(rect.height-11, 200);
  pdaCanvas.width=rect.width*dpr; pdaCanvas.height=h*dpr;
  pdaCanvas.style.width=rect.width+"px"; pdaCanvas.style.height=h+"px";
  pdaCtx.setTransform(dpr,0,0,dpr,0,0);
}
function getViewport(cnv=canvas) {
  const dpr=window.devicePixelRatio||1; const cw=cnv.width/dpr, ch=cnv.height/dpr;
  const scale=Math.min(cw/W,ch/H); return {scale,offX:(cw-W*scale)/2,offY:(ch-H*scale)/2,cw,ch};
}

function renderDFA() {
  const {scale,offX,offY,cw,ch}=getViewport(canvas);
  ctx.clearRect(0,0,cw,ch); ctx.fillStyle="#f5f0e8"; ctx.fillRect(0,0,cw,ch);
  drawStars(ctx); ctx.save(); ctx.translate(offX,offY); ctx.scale(scale,scale);
  for(const e of getAllEdges(DFA)) drawEdge(e,activeEdge&&activeEdge.from===e.from&&activeEdge.to===e.to,DFA,ctx);
  drawStartArrow(DFA,ctx);
  for(const id of Object.keys(DFA.states)) drawNode(id,id===activeState,DFA,ctx);
  if(activeEdge&&shipPos){drawTrail(ctx);drawShipBody(shipPos.x,shipPos.y,shipPos.angle,ctx);}
  ctx.restore();
}

function renderPDA() {
  if(!pdaCanvas||!pdaCtx)return;
  if(currentAutomaton!=="pda")return;
  const dpr=window.devicePixelRatio||1;
  const cw=pdaCanvas.width/dpr, ch=pdaCanvas.height/dpr;
  if(cw<10||ch<10){
    resizePDACanvas();
    return;
  }
  pdaCtx.clearRect(0,0,cw,ch); pdaCtx.fillStyle="#f5f0e8"; pdaCtx.fillRect(0,0,cw,ch);
  pdaCtx.save();
  for(const s of stars){pdaCtx.beginPath();pdaCtx.arc(s.x%cw,s.y%ch,s.r,0,2*Math.PI);pdaCtx.fillStyle=`rgba(160,149,136,${s.a*0.5})`;pdaCtx.fill();}
  pdaCtx.restore();
  if(activeTabId==="ab") drawPDA_AB(pdaCtx,cw,ch);
  else drawPDA_01(pdaCtx,cw,ch);
}

function render() {
  if(currentAutomaton==="dfa") renderDFA();
  else if(currentAutomaton==="pda") renderPDA();
}

function animLoop(ts) {
  const dt=Math.min((ts-lastTime)/1000,0.05); lastTime=ts;
  if(BUILDUP.active)tickBuildup(performance.now());
  if(activeEdge)particleT+=dt*1.3;
  if(pulseT>0)pulseT=Math.max(0,pulseT-dt*1.9);
  updateShipPos(); render();
  animRaf=requestAnimationFrame(animLoop);
}

// ═══════════════════════════════════════════════
// ⑩ TAPE
// ═══════════════════════════════════════════════
function renderTape(str, activeIdx, tapeId="tape", ptrId="tapePointer") {
  const tape=document.getElementById(tapeId); const ptr=document.getElementById(ptrId);
  tape.innerHTML="";
  for(let i=0;i<str.length;i++){
    const cell=document.createElement("div"); cell.className="tape-cell"; cell.textContent=str[i];
    if(i<activeIdx)cell.classList.add("done"); else if(i===activeIdx)cell.classList.add("active"); else cell.classList.add("unread");
    tape.appendChild(cell);
  }
  if(!str.length)ptr.innerHTML="pos <span>—</span>";
  else if(activeIdx>=str.length)ptr.innerHTML="pos <span>end</span>";
  else ptr.innerHTML=`pos <span>${activeIdx}</span>`;
}

// ═══════════════════════════════════════════════
// ⑪ LOG
// ═══════════════════════════════════════════════
function addLog(msg,cls="",listId="logList"){
  const list=document.getElementById(listId);
  for(const el of list.querySelectorAll(".current"))el.classList.remove("current");
  const el=document.createElement("div"); el.className=`log-entry ${cls}`; el.textContent=msg; list.appendChild(el);
  if(!cls)el.classList.add("current"); list.scrollTop=list.scrollHeight;
}
function clearLog(listId="logList"){document.getElementById(listId).innerHTML="";}
function updateStatus(stateId,symbol,step,total,stateEl="infoState",symEl="infoSymbol",stepEl="infoStep",barEl="stepBar"){
  const sv=document.getElementById(stateEl); sv.textContent=stateId; sv.className="stat-value";
  document.getElementById(symEl).textContent=symbol;
  document.getElementById(stepEl).textContent=`${step} / ${total}`;
  document.getElementById(barEl).style.width=(total>0?(step/total)*100:0)+"%";
}

// ═══════════════════════════════════════════════
// ⑫ DFA SIMULATION
// ═══════════════════════════════════════════════
function buildTraceDFA(str) {
  let state="start"; const steps=[];
  for(let i=0;i<str.length;i++){
    const sym=str[i]; const next=DFA.transitions[state]?.[sym]||"trap";
    steps.push({from:state,symbol:sym,to:next,idx:i}); state=next;
  }
  return steps;
}
function applyStep(stepIdx) {
  const step=executionSteps[stepIdx]; activeState=step.to; activeEdge={from:step.from,to:step.to};
  visitedStates.add(step.from); visitedStates.add(step.to); visitedEdges.add(`${step.from}→${step.to}`);
  particleT=0; pulseT=1; shipTrail=[]; shipPos=null;
  renderTape(inputStr,step.idx+1);
  updateStatus(step.to,`"${step.symbol}"`,stepIdx+1,executionSteps.length);
  addLog(`δ(${step.from}, '${step.symbol}') → ${step.to}`);
}
function applyReset() {
  activeState="start"; activeEdge=null; visitedStates.clear(); visitedEdges.clear(); visitedStates.add("start");
  particleT=0; pulseT=0; shipTrail=[]; shipPos=null;
  renderTape(inputStr,0); updateStatus("start","—",0,executionSteps.length);
}
function finalize() {
  const last=executionSteps.length>0?executionSteps[executionSteps.length-1].to:"start";
  const acc=DFA.states[last]?.isAccept; activeEdge=null; shipTrail=[]; shipPos=null;
  const banner=document.getElementById("resultBanner");
  if(acc){banner.className="accepted";banner.textContent="✓  String Accepted";addLog(`Final: ${last} → ACCEPTED ✓`,"accepted");}
  else{banner.className="rejected";banner.textContent="✗  String Rejected";addLog(`Final: ${last} → REJECTED ✗`,"rejected");}
}
function getSpeed(){return[1400,950,600,320,120][parseInt(document.getElementById("speedSlider").value)-1];}
function stopPlay(){isPlaying=false;clearTimeout(playTimer);const pb=document.getElementById("playBtn");pb.textContent="▶ Play";pb.classList.remove("playing");}
function startPlay(){isPlaying=true;const pb=document.getElementById("playBtn");pb.textContent="⏸ Pause";pb.classList.add("playing");tick();}
function tick(){
  if(!isPlaying)return;
  if(currentStep>=executionSteps.length-1){currentStep++;finalize();stopPlay();updateBtns();return;}
  currentStep++;applyStep(currentStep);updateBtns();playTimer=setTimeout(tick,getSpeed());
}
function stepForward(){
  if(currentStep>=executionSteps.length)return;
  if(currentStep===executionSteps.length-1){currentStep++;finalize();updateBtns();return;}
  currentStep++;applyStep(currentStep);updateBtns();
}
function resetAll(){
  stopPlay();currentStep=-1;
  document.getElementById("resultBanner").className="";document.getElementById("resultBanner").textContent="";
  clearLog();applyReset();updateBtns();
}
function loadInput(){
  const raw=document.getElementById("inputString").value.trim();
  const re=new RegExp(`^[${DFA.alphabet.join("")}]*$`);
  if(!re.test(raw)){alert(`Only: ${DFA.alphabet.map(c=>`"${c}"`).join(", ")}`);return;}
  inputStr=raw; executionSteps=buildTraceDFA(inputStr); resetAll();
  addLog(`Loaded: "${inputStr}" (${inputStr.length} symbols)`); applyReset();
}
function updateBtns(){
  const done=currentStep>=executionSteps.length;
  document.getElementById("stepBtn").disabled=done;
  document.getElementById("playBtn").disabled=done&&!isPlaying;
}

// ═══════════════════════════════════════════════
// ⑬ PDA SIMULATION
// ═══════════════════════════════════════════════
function pdaGetSpeed(){return[1400,950,600,320,120][parseInt(document.getElementById("pdaSpeedSlider").value)-1];}

function pdaApplyStep(si) {
  const step = pdaSteps[si];
  pdaActiveNode = step.node;
  pdaVisitedNodes.add(step.node);

  // charIdx = number of chars consumed so far.
  // renderTape highlights cell at charIdx as "active" (the next char to read).
  // Chars before charIdx are marked "done".
  renderTape(pdaInputStr, step.charIdx, "pdaTape", "pdaTapePointer");

  // Symbol: show the char that was just consumed to arrive at this node,
  // or "—" at step 0 (haven't read anything yet), or "^" at end-of-input.
  const readChar = step.charIdx === 0 ? "—"
    : step.charIdx <= pdaInputStr.length ? `'${pdaInputStr[step.charIdx - 1]}'`
    : "^";

  updateStatus(
    step.node, readChar,
    si + 1, pdaSteps.length,
    "pdaInfoState", "pdaInfoSymbol", "pdaInfoStep", "pdaStepBar"
  );
  addLog(step.log, "", "pdaLogList");
  renderPDA();
}

function pdaApplyReset(){
  pdaActiveNode = null;
  pdaVisitedNodes.clear();
  renderTape(pdaInputStr, 0, "pdaTape", "pdaTapePointer");
  updateStatus("—", "—", 0, pdaSteps.length, "pdaInfoState", "pdaInfoSymbol", "pdaInfoStep", "pdaStepBar");
}

function pdaFinalize(){
  const last=pdaSteps.length>0?pdaSteps[pdaSteps.length-1].node:"start";
  const acc=last==="accept";
  const banner=document.getElementById("pdaResultBanner");
  if(acc){banner.className="accepted";banner.textContent="✓  String Accepted";addLog("ACCEPTED ✓","accepted","pdaLogList");}
  else{banner.className="rejected";banner.textContent="✗  String Rejected";addLog("REJECTED ✗","rejected","pdaLogList");}
}

function pdaLoadInput(){
  const sim=activeTabId==="ab"?PDA_AB_SIM:PDA_01_SIM;
  const raw=document.getElementById("pdaInputString").value.trim();
  const re=new RegExp(`^[${sim.alphabet.join("")}]*$`);
  if(!re.test(raw)){alert(`Only: ${sim.alphabet.map(c=>`"${c}"`).join(", ")}`);return;}
  pdaInputStr=raw;
  pdaSteps=sim.simulate(pdaInputStr);
  pdaCurStep=-1;pdaIsPlaying=false;
  document.getElementById("pdaResultBanner").className="";document.getElementById("pdaResultBanner").textContent="";
  clearLog("pdaLogList");pdaApplyReset();pdaUpdateBtns();
  addLog(`Loaded: "${pdaInputStr}" (${pdaInputStr.length} symbols)`,"","pdaLogList");
}

function pdaStopPlay(){pdaIsPlaying=false;clearTimeout(pdaPlayTimer);const pb=document.getElementById("pdaPlayBtn");pb.textContent="▶ Play";pb.classList.remove("playing");}
function pdaStartPlay(){pdaIsPlaying=true;const pb=document.getElementById("pdaPlayBtn");pb.textContent="⏸ Pause";pb.classList.add("playing");pdaTick();}
function pdaTick(){
  if(!pdaIsPlaying)return;
  if(pdaCurStep>=pdaSteps.length-1){pdaCurStep++;pdaFinalize();pdaStopPlay();pdaUpdateBtns();return;}
  pdaCurStep++;pdaApplyStep(pdaCurStep);pdaUpdateBtns();pdaPlayTimer=setTimeout(pdaTick,pdaGetSpeed());
}
function pdaStepForward(){
  if(pdaCurStep>=pdaSteps.length)return;
  if(pdaCurStep===pdaSteps.length-1){pdaCurStep++;pdaFinalize();pdaUpdateBtns();return;}
  pdaCurStep++;pdaApplyStep(pdaCurStep);pdaUpdateBtns();
}
function pdaResetAll(){
  pdaStopPlay();pdaCurStep=-1;pdaActiveNode=null;pdaVisitedNodes.clear();
  document.getElementById("pdaResultBanner").className="";document.getElementById("pdaResultBanner").textContent="";
  clearLog("pdaLogList");pdaApplyReset();pdaUpdateBtns();
}
function pdaUpdateBtns(){
  const done=pdaCurStep>=pdaSteps.length;
  document.getElementById("pdaStepBtn").disabled=done;
  document.getElementById("pdaPlayBtn").disabled=done&&!pdaIsPlaying;
}

// ═══════════════════════════════════════════════
// ⑭ PANEL SWITCHING
// ═══════════════════════════════════════════════
function updateInfoPanels(){
  const isAb=activeTabId==="ab";
  ["cfg-ab","cfg-01","pda-ab","pda-01"].forEach(id=>{const el=document.getElementById(id);if(el)el.style.display="none";});
  const show=(id)=>{const el=document.getElementById(id);if(el)el.style.display="";};
  if(isAb){show("cfg-ab");show("pda-ab");}else{show("cfg-01");show("pda-01");}
}

function switchSubTab(subId){
  ["dfa","cfg","pda"].forEach(id=>{const btn=document.getElementById("sub-"+id);if(btn)btn.classList.toggle("active",id===subId);});

  const dfaPanel=document.getElementById("panel-dfa");
  const pdaPanel=document.getElementById("panel-pda");
  const cfgPanel=document.getElementById("panel-cfg");

  if(dfaPanel) dfaPanel.style.display = subId==="dfa" ? "grid" : "none";
  if(pdaPanel) pdaPanel.style.display = subId==="pda" ? "grid" : "none";
  if(cfgPanel){ cfgPanel.style.display = subId==="cfg" ? "flex" : "none"; cfgPanel.classList.toggle("active", subId==="cfg"); }

  if(subId==="dfa"){
    currentAutomaton="dfa";
    resizeCanvas();
  } else if(subId==="pda"){
    currentAutomaton="pda";
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      resizePDACanvas();
      renderPDA();
    }));
  }
  updateInfoPanels();
}

function switchTab(tabId){
  activeTabId=tabId;
  switchSubTab("dfa");
  DFA=tabId==="01"?DFA_01:DFA_AB;
  document.querySelectorAll(".tab-btn").forEach(btn=>btn.classList.toggle("active",btn.dataset.tab===tabId));
  document.getElementById("headerRegex").innerHTML=DFA.regex;
  const inp=document.getElementById("inputString");
  inp.placeholder=DFA.placeholder;inp.value=DFA.defaultInput;
  const {cw,ch}=getViewport();initStars(cw,ch);
  inputStr=DFA.defaultInput;executionSteps=buildTraceDFA(inputStr);
  resetAll();addLog(`Switched to Σ = {${DFA.alphabet.join(",")}} — Loaded: "${inputStr}"`);applyReset();startBuildup();
  const pdaInp=document.getElementById("pdaInputString");
  if(pdaInp){pdaInp.placeholder=DFA.placeholder;pdaInp.value=DFA.defaultInput;pdaInputStr=DFA.defaultInput;}
  pdaActiveNode=null;pdaVisitedNodes.clear();pdaSteps=[];pdaCurStep=-1;
  updateInfoPanels();
}

// ═══════════════════════════════════════════════
// ⑮ EVENT LISTENERS
// ═══════════════════════════════════════════════
document.getElementById("playBtn").addEventListener("click",()=>{if(isPlaying)stopPlay();else startPlay();});
document.getElementById("stepBtn").addEventListener("click",()=>{stopPlay();stepForward();});
document.getElementById("resetBtn").addEventListener("click",resetAll);
document.getElementById("loadBtn").addEventListener("click",loadInput);
document.getElementById("inputString").addEventListener("keydown",(e)=>{if(e.key==="Enter")loadInput();});
document.getElementById("speedSlider").addEventListener("input",function(){document.getElementById("speedVal").textContent=this.value+"×";});

document.getElementById("pdaPlayBtn").addEventListener("click",()=>{if(pdaIsPlaying)pdaStopPlay();else pdaStartPlay();});
document.getElementById("pdaStepBtn").addEventListener("click",()=>{pdaStopPlay();pdaStepForward();});
document.getElementById("pdaResetBtn").addEventListener("click",pdaResetAll);
document.getElementById("pdaLoadBtn").addEventListener("click",pdaLoadInput);
document.getElementById("pdaInputString").addEventListener("keydown",(e)=>{if(e.key==="Enter")pdaLoadInput();});
document.getElementById("pdaSpeedSlider").addEventListener("input",function(){document.getElementById("pdaSpeedVal").textContent=this.value+"×";});

document.querySelectorAll(".tab-btn").forEach(btn=>btn.addEventListener("click",()=>switchTab(btn.dataset.tab)));
["dfa","cfg","pda"].forEach(id=>{const btn=document.getElementById("sub-"+id);if(btn)btn.addEventListener("click",()=>switchSubTab(id));});

window.addEventListener("resize",()=>{
  cancelAnimationFrame(animRaf);
  if(currentAutomaton==="dfa") resizeCanvas();
  else if(currentAutomaton==="pda") resizePDACanvas();
  const{cw,ch}=getViewport();initStars(cw,ch);
  requestAnimationFrame(ts=>{lastTime=ts;animLoop(ts);});
});

// ═══════════════════════════════════════════════
// ⑯ INIT
// ═══════════════════════════════════════════════
setTimeout(()=>{
  const dfaPanel=document.getElementById("panel-dfa");
  const pdaPanel=document.getElementById("panel-pda");
  const cfgPanel=document.getElementById("panel-cfg");
  if(dfaPanel) dfaPanel.style.display="grid";
  if(pdaPanel) pdaPanel.style.display="none";
  if(cfgPanel){ cfgPanel.style.display="none"; cfgPanel.classList.remove("active"); }

  resizeCanvas();
  const{cw,ch}=getViewport();initStars(cw,ch);
  document.getElementById("headerRegex").innerHTML=DFA_AB.regex;
  inputStr=DFA_AB.defaultInput;
  document.getElementById("inputString").value=DFA_AB.defaultInput;
  document.getElementById("pdaInputString").value=DFA_AB.defaultInput;
  pdaInputStr=DFA_AB.defaultInput;
  executionSteps=buildTraceDFA(inputStr);
  applyReset();addLog(`Loaded: "${inputStr}" (${inputStr.length} symbols)`);updateBtns();
  updateInfoPanels();
  requestAnimationFrame(ts=>{lastTime=ts;startBuildup();animLoop(ts);});
},80);