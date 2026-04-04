# DFA Visualizer — Project Guide

## Project Structure

```
dfa-project/
├── index.html   ← Page structure, HTML layout, tab buttons
├── styles.css   ← All visual styling, colors, animations
├── script.js    ← DFA logic, canvas drawing, spaceship animation
└── README.md    ← This file
```

---

## How the Files Connect

```
index.html
  │
  ├── <link rel="stylesheet" href="styles.css">   (loaded in <head>)
  │     └── Styles all elements: header, tabs, canvas, tape, side panel
  │
  └── <script src="script.js">                    (loaded before </body>)
        ├── Defines DFA_AB  (alphabet {a,b})
        ├── Defines DFA_01  (alphabet {0,1})
        ├── Draws on <canvas id="dfaCanvas">
        ├── Controls the tape, log, status cards
        └── Handles tab switching, play/step/reset
```

---

## How to Run Locally

### Option A — Open directly (simplest)
1. Place all three files in the **same folder**
2. Double-click `index.html` — it opens in your browser
3. No server needed

### Option B — Local dev server (recommended for Chrome)
If you have Node.js installed:
```bash
cd dfa-project
npx serve .
```
Then open `http://localhost:3000` in your browser.

Or with Python:
```bash
cd dfa-project
python -m http.server 8080
```
Then open `http://localhost:8080`.

---

## Tabs

| Tab | Alphabet | Regex |
|-----|----------|-------|
| Σ = {a, b} | `a`, `b` | (aa+bb)(a+b)*(a+b+ab+ba)... |
| Σ = {0, 1} | `0`, `1` | ((101)+(111)*+100) + ... |

Switching tabs:
- Resets the current simulation
- Loads the default example string for that tab
- Updates the regex shown in the header
- Validates input against the new alphabet

---

## Controls

| Button | Action |
|--------|--------|
| **▶ Play** | Auto-steps through the string |
| **⏸ Pause** | Pauses auto-play |
| **Step ⏭** | Advances one symbol at a time |
| **↺ Reset** | Returns to start state |
| **Load** | Loads the typed input string |
| Speed slider | Controls delay between auto-steps |

---

## Adding a New DFA

To add a third tab (e.g., Σ = {x, y}):

1. **script.js** — Add a new `DFA_XY` object following the same structure as `DFA_AB` and `DFA_01`
2. **index.html** — Add a new `<button class="tab-btn" data-tab="xy">Σ = {x, y}</button>` inside `.tab-nav`
3. **script.js** — Update `switchTab()` to handle `tabId === 'xy'`

---

## Animation Notes

- Each **state** is drawn as a **planet** with a ring and radial gradient
- Each **transition** shows a **spaceship** flying along the edge path
- Self-loops show the spaceship orbiting the planet
- The coral pulse ring fires when the DFA lands on a new state
- Stars in the background are randomly placed on each resize/tab switch
