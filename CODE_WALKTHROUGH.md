# Days Together — How the Code Works

A line-by-line guide for someone who doesn't know much about code yet.

This explains everything happening across every file in this project, in
plain English. It doesn't replace reading the actual files — think of it
as a tour guide you read side by side with the real code, open in a
second window.

> **Tip:** every file that's meant to be hand-edited has a comment marked
> `EDIT THIS` (or `EDIT THESE`) right where you should type. You never
> need to touch anything else to make this page your own.

---

## Table of contents

0. [The 30-second big picture](#part-0)
1. [A few words you'll see everywhere](#part-1)
2. [Project structure — what lives where](#part-2)
3. [`index.html` — the page's content](#part-3)
4. [`css/style.css` — the page's appearance](#part-4)
5. [`js/icons.js` — the hand-drawn icon library](#part-5)
6. [`js/scenery.js` — the living background scene](#part-6)
7. [`js/interactive-objects.js` — things you can hold and throw](#part-7)
8. [`js/script.js` — the counter, the drag, the effects, the calendar, the letters](#part-8)
9. [Making it yours](#part-9)
10. [Glossary](#part-10)

---

<a id="part-0"></a>
## Part 0 — The 30-second big picture

A webpage is built from three languages, each with a different job:

1. **HTML** — the **content and structure**. "There's a button here,"
   "there's a paragraph there." The skeleton.
2. **CSS** — the **appearance**. "Make that button pink," "put a shadow
   under that card," "make this wiggle forever." The skin and clothing.
3. **JavaScript (JS)** — the **behavior**. "When someone clicks here, do
   this." "Count the days and put the number on the screen." The muscles
   and the brain — it's what makes the page actually *do* things.

Older, simpler versions of pages like this one cram all three into a
single `.html` file. This project instead splits them into separate
files — the same three jobs, just organized the way a real GitHub project
usually is, so each piece is easier to find, read, and edit on its own.

```
index.html                    ← loads the CSS and JS files below, and holds the content
css/style.css                  ← all the appearance
js/icons.js                     ← a library of small hand-drawn pictures (see Part 5)
js/scenery.js                   ← the animated background scene (see Part 6)
js/interactive-objects.js        ← the things you can pick up and throw (see Part 7)
js/letters-content.js             ← just the words: the reasons and love letters (see Part 3.3)
js/script.js                       ← the counter, the drag, the clicks, the calendar, the letters (see Part 8)
```

`index.html` pulls the other files in with ordinary HTML tags:

```html
<link rel="stylesheet" href="css/style.css">
...
<script src="js/icons.js"></script>
<script src="js/scenery.js"></script>
<script src="js/interactive-objects.js"></script>
<script src="js/letters-content.js"></script>
<script src="js/script.js"></script>
```

`<link rel="stylesheet">` loads a CSS file. `<script src="...">` loads and
runs a JavaScript file. **Order matters for the five scripts** — each one
runs top-to-bottom the moment the browser reaches it, and `script.js`
uses things defined in the other four, so those must load *first*
(`letters-content.js` just needs to load before `script.js`, since that's
the only file that reads `window.LettersContent`).

---

<a id="part-1"></a>
## Part 1 — A few words you'll see everywhere

Skim once, refer back later.

- **Element / tag** — one piece of HTML, like `<button>...</button>`.
- **Attribute** — extra info inside a tag's opening bracket, like
  `<button id="heartBtn" class="heart-btn">`.
- **id vs. class** — both are labels so CSS/JS can find an element.
  `id="x"` should be **unique** (only one element on the page). `class="x"`
  can be reused on **many** elements at once.
- **CSS selector** — a pattern saying *which* elements to style. `.count`
  styles anything with `class="count"`. `#dayCount` styles the one element
  with `id="dayCount"`.
- **CSS custom property ("CSS variable")** — a named, reusable value,
  defined as `--wine: #6E1E2E;` and used as `var(--wine)`. Change the
  definition once, everything using it updates. This project leans on
  these heavily — it's how a whole special-day theme is just one short
  block of color values.
- **z-index / stacking order** — when elements overlap on screen, the one
  with the higher `z-index` is drawn on top. This page uses it a lot to
  decide what's allowed to cover what (Part 4.3 has the full map).
- **SVG (Scalable Vector Graphics)** — pictures drawn with mathematical
  shapes (paths, circles, gradients) instead of a grid of pixels, so they
  stay crisp at any size. The heart, wings, and every small icon on this
  page are SVG, not image files.
- **Canvas** — a different way to draw pictures: instead of describing
  shapes in HTML/SVG, JavaScript calls functions like "draw a curved line
  from here to there" directly onto a rectangular `<canvas>` element,
  frame by frame if needed. The background tree/harp/helix/snow, and
  every huggable/throwable object, are drawn this way — see Parts 6 & 7.
- **DOM (Document Object Model)** — the live, in-memory version of the
  HTML that JavaScript can read and change while the page is open.
  `document.getElementById(...)` reaches into it to grab one element.
- **Function** — a named, reusable block of instructions, called by
  writing its name with parentheses: `updateCounter()`. Functions can take
  inputs ("parameters") and be called from many places.
- **Variable** — a labeled box holding a value, declared with `var`.
- **Event listener** — code that watches an element and reacts when
  something happens to it: `el.addEventListener('click', function(e){...})`.
  The `e` carries details about what happened (like a click's exact x/y).
- **Event bubbling** — after an event fires on the exact element you
  interacted with, it also fires again on that element's parent, then
  *its* parent, and so on, all the way up to `window`. This means a
  listener on a distant ancestor (even `window` itself) still hears about
  something that happened deep inside a specific button, unless some code
  in between explicitly stops it. Part 7 leans on this directly.
- **`@keyframes` animation** — motion described as checkpoints over a
  timeline (0% = start, 100% = end, with stops in between); the browser
  fills in the motion smoothly between them.
- **CSS transition** — simpler than `@keyframes`: "whenever this
  property's value changes, glide there instead of snapping."

---

<a id="part-2"></a>
## Part 2 — Project structure: what lives where

```
days-together/
├── index.html                    the page itself — content + which files to load
├── css/
│   └── style.css                  every visual rule, animation, and per-day theme
├── js/
│   ├── icons.js                    a library of small hand-drawn SVG icons
│   ├── scenery.js                   the animated background canvas
│   ├── interactive-objects.js        the foreground canvas — huggable/throwable objects and physics
│   ├── letters-content.js             just the words: reasons + love letters, nothing else
│   └── script.js                       the day counter, drag physics, click effects, calendar logic, letters
├── CODE_WALKTHROUGH.md            this file
├── LICENSE                        Unlicense (public domain) — see the file itself
└── README.md                      the project's front page on GitHub
```

Nothing here needs a build step, a package manager, or an internet
connection to run (aside from the one line that loads Google Fonts) —
opening `index.html` in a browser, or serving the folder with any static
file server (GitHub Pages included), just works.

---

<a id="part-3"></a>
## Part 3 — `index.html`: the page's content

### 3.1 The `<head>`

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Days Together</title>
<link rel="stylesheet" href="css/style.css">
</head>
```

`<!DOCTYPE html>` tells the browser "render this in modern standards
mode" — every HTML file should start with it. `lang="en"` tells
browsers/screen readers the page's language. `charset="UTF-8"` makes sure
special characters display correctly. The `viewport` meta tag is what
makes the page size correctly on a phone instead of rendering tiny. The
`<link>` loads all the CSS from Part 4.

### 3.2 The two canvases and the preview toggle

```html
<canvas id="bgScenery" aria-hidden="true"></canvas>
<canvas id="fgInteractive" aria-hidden="true"></canvas>

<div class="scene-toggle" id="sceneToggle">
  <button class="scene-toggle-handle" id="sceneToggleHandle" aria-haspopup="true" aria-label="Preview other occasions"></button>
  <div class="scene-panel" id="scenePanel"></div>
</div>
```

Both `<canvas>` elements start completely blank. `js/scenery.js` paints
the tree/harp/helix/moon/particles onto `#bgScenery`, which sits *behind*
everything else (Part 4.3). `js/interactive-objects.js` paints the
huggable/throwable objects (the snowman, the jack-o'-lantern, cake,
chocolate, lanterns, the big heart, candle flames) onto the separate
`#fgInteractive` canvas, which sits *above* the card and the love panels
— see Part 7 for exactly why these needed two different canvases instead
of one.

The `.scene-toggle` is the small sparkle button in the top-right corner.
`scenePanel` starts **empty** in the HTML — `js/script.js` builds its
list of buttons in JavaScript (Part 8.8), rather than them being
hand-typed here, so adding a new special day only ever needs a change in
one place.

### 3.3 The "why I love you" panels and their letters

```html
<aside class="love-panel" aria-label="Tessa's letter and reasons, for Uncertainty">
  <h2 class="love-panel-title">
    <svg ...heart icon.../>
    <span>Why I Love You My Beloved Uncertainty</span>
    <button class="envelope-btn" data-person="tessa" aria-label="Open Tessa's love letter" aria-haspopup="dialog">
      <svg ...envelope icon.../>
    </button>
  </h2>
  <!-- The reasons below are filled in by script.js from js/letters-content.js
       (window.LettersContent.tessa.reasons) — edit the words there, not here. -->
  <ul class="love-list" id="loveListTessa"></ul>
</aside>
```

One of these sits on each side of the main card — Tessa's panel (left)
addressed *to* Uncertainty, Uncertainty's panel (right) addressed *to*
Tessa (see `index.html` for the mirrored block, using `id="loveListUncertainty"`
and `data-person="uncertainty"`). Notice the `<ul>` is **empty** in the
HTML: unlike most of this page, the reasons and letters aren't hand-typed
here at all. They live in one place, `js/letters-content.js`, as a plain
data object:

```js
window.LettersContent = {
  tessa: {
    reasons: [ "He tries to be better for me~ 🌸", ... ],
    letterTitle: "To My Beloved Uncertainty",
    letterParagraphs: [ "Dear Uncertainty, My Love, ...", ..., "...forever yours, Tessa <3" ]
  },
  uncertainty: { reasons: [...], letterTitle: "...", letterParagraphs: [...] }
};
```

This split exists purely so the actual **words** — the most personal,
most-often-edited part of the whole page — can be found and changed
without touching any HTML, CSS, or the rest of the JavaScript. `js/script.js`
(Part 8.10) reads this object on page load and builds both the `<li>`
reason bullets and the letter paragraphs from it in JavaScript, matching
the exact same look the old hand-typed markup had (`<li>` = one small
inline heart `<svg>` plus a `<span>` of text). If the list gets long, it
doesn't push the page taller: `css/style.css` gives `.love-list` a
maximum height and lets it scroll internally (Part 4.11) — so add as
many reasons as you want.

`<aside>` is a semantic HTML tag meaning "content related to, but
separate from, the main content" — exactly what these side panels are.

The `.envelope-btn` in each title opens that person's love letter.
`data-person="tessa"` tells `js/script.js` which key to look up in
`window.LettersContent` — `letterTitle` becomes the letter's heading and
each string in `letterParagraphs` becomes one `<p>` — so the JavaScript
never needs to know there are exactly two letters; it just reacts to
whichever envelope was clicked.

```html
<div class="letter-modal" id="letterModal" aria-hidden="true">
  <div class="letter-backdrop" id="letterBackdrop"></div>
  <div class="letter-peek" role="dialog" aria-modal="true" aria-labelledby="letterModalTitle">
    <button class="letter-close" id="letterClose" aria-label="Close letter">&times;</button>
    <h3 class="letter-title" id="letterModalTitle"></h3>
    <div class="letter-body" id="letterModalBody"></div>
  </div>
</div>
```

There's only **one** `.letter-modal` in the whole page, reused for both
letters — `js/script.js` builds a fresh `<p>` per paragraph into
`#letterModalBody` and sets `#letterModalTitle`'s text each time an
envelope opens it, rather than building two separate modals. `role="dialog"
aria-modal="true"` tells assistive technology "this is a modal dialog";
`aria-labelledby` points it at the heading that names the dialog.

*(Earlier versions of this page used a pair of `<template id="letterTessa">`
/ `<template id="letterUncertainty">` tags here instead, with the letter
text hand-typed as inert HTML. That worked, but it put two very different
kinds of content — page structure and personal words — in the same file,
which made it easy to accidentally paste text into the wrong spot. The
`letters-content.js` data-file approach replaced it: same look, same
`.letter-modal`/`.love-list` behavior, but the words now live somewhere
they can't collide with markup.)*

### 3.4 The heart, the wings, and the hidden "ingredients" SVG

```html
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <defs>
    <linearGradient id="featherGold" ...>...</linearGradient>
    <linearGradient id="featherRose" ...>...</linearGradient>
    <linearGradient id="heartFill" ...>...</linearGradient>
    <radialGradient id="impactFlashGrad" ...>...</radialGradient>
    <g id="wingShape"> ... five feather <path> shapes ... </g>
  </defs>
</svg>
```

This SVG is invisible on purpose (`width="0" height="0"`) — it's a pantry
of reusable ingredients, not something meant to be looked at directly.
`<linearGradient>`/`<radialGradient>` define smooth color blends, each
given an `id` so other shapes can say "fill yourself with **that**
gradient" via `fill="url(#featherGold)"`. `<g id="wingShape">` groups five
overlapping feather `<path>` shapes (each just a string of "move here,
curve there" drawing instructions in its `d="..."` attribute) into one
reusable wing drawing, stamped down twice later with `<use href="#wingShape">`
— once per side, with the right one flipped via CSS (Part 4.6).

```html
<div class="heart-stage" id="heartStage">
  <div class="heart-drag" id="heartDrag">
    <span class="wing-wrap wing-left" aria-hidden="true">
      <svg class="wing" viewBox="0 0 100 100"><use href="#wingShape"></use></svg>
    </span>
    <button class="heart-btn" id="heartBtn" aria-label="Send some love">
      <span class="heart-shine-wrap">
        <svg class="heart-glyph" id="heartGlyph" viewBox="0 0 32 29" aria-hidden="true">
          <path d="..." fill="url(#heartFill)"/>
          <path d="..." stroke="rgba(255,255,255,.65)" .../>
        </svg>
      </span>
    </button>
    <span class="wing-wrap wing-right" aria-hidden="true">...</span>
  </div>
</div>
```

`#heartDrag` is the piece JavaScript physically drags around (Part 8.4) —
it wraps both wings and the heart button together as one unit. The heart
button is a real `<button>` (not a plain `<div>`), so it's automatically
keyboard-focusable and screen-reader friendly; `aria-label` gives it a
description since there's no visible text label. `aria-hidden="true"` on
the decorative wing wrappers tells screen readers to skip them.

### 3.5 The counter text and the effects layer

```html
<div class="occasion-banner" id="occasionBanner" aria-live="polite"></div>

<p class="eyebrow">together for</p>
<div class="count" id="dayCount">0</div>
<div class="label">days, and counting</div>
<div class="divider"></div>
<p class="breakdown" id="breakdown"></p>
<p class="since" id="sinceLine"></p>
```

None of these (aside from the two static labels) have real text baked
in — `js/script.js` fills them in the instant the page loads, and keeps
them updated. Giving each an `id` is what lets the JavaScript find and
update exactly that element. `aria-live="polite"` on the banner means "if
this text changes while the page is open, politely announce it" — useful
since a special-day banner can appear at midnight while the page stays
open.

```html
<div class="float-heart-layer" id="floatLayer" aria-hidden="true"></div>
```

A big, invisible, full-screen `<div>` that starts empty. JavaScript uses
it as a "stage" to spawn every temporary click/impact effect into. It's
given the highest `z-index` of anything on the page (Part 4.3), so those
hearts are always visible on top of absolutely everything — the card, the
love panels, even an open love letter.

---

<a id="part-4"></a>
## Part 4 — `css/style.css`: the page's appearance

### 4.1 Fonts

```css
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Homemade+Apple&family=Karla:wght@400;600&family=Parisienne&family=Cinzel:wght@600;700&family=UnifrakturCook:wght@700&family=Baloo+2:wght@600;700&display=swap');
```

One line, several font families. **Playfair Display** is the default
elegant serif for the big day-count number. **Homemade Apple** is the
handwriting-style "since ..." line. **Karla** is the regular body text.
The other four — **Parisienne** (flowing script), **Cinzel** (regal
serif), **UnifrakturCook** (gothic blackletter), and **Baloo 2** (round
and playful) — only get used on specific special days (Part 4.12).

### 4.2 `:root` — the color and font "control panel"

```css
:root{
  --wine:#6E1E2E;
  --rose:#C2626F;
  --blush:#F3DCD9;
  --paper:#FDF6F0;
  --gold:#BD9257;
  --ink:#3B1A22;
  --crater:#9C6B3E;
  --heading-color:var(--wine);
  --card-bg:rgba(253,246,240,0.92);
  --card-border:rgba(189,146,87,.4);
  --card-shadow:rgba(110,30,46,.18);
  --font-count:'Playfair Display',serif;
  --font-since:'Homemade Apple',cursive;
}
```

`:root` targets the whole document. Every `--name: value;` line defines a
CSS custom property. Nothing is drawn yet — this is the paint palette on
the table. `--heading-color:var(--wine);` shows a variable can be
*defined in terms of another variable* — most text just says "use
`--heading-color`," which normally quietly resolves to `--wine`'s color,
but a theme can override `--heading-color` directly to something else
entirely (useful on dark backgrounds — see Part 4.12) without touching
every element that uses it.

Everywhere else in this file, instead of `color: #6E1E2E;` you'll see
`color: var(--wine);`. That's the whole trick: change a value once up
here (or in a theme block), everything using it updates everywhere at
once — including things drawn on the two `<canvas>` elements, which read
these same variables in JavaScript (Part 6.3).

### 4.3 Layout and the stacking order (z-index) of everything

```css
body{
  display:flex; flex-wrap:wrap; align-items:center; justify-content:center;
  gap:22px;
  min-height:100vh; padding:16px;
  background:var(--paper);
}
```

`display:flex` on `<body>` lines its direct children (the two "why I love
you" panels and the main card) up in a row and centers them.
`flex-wrap:wrap` is what lets them gracefully drop to a stacked column on
narrow/phone screens instead of squeezing sideways forever — try resizing
the browser window to see it happen.

This page layers quite a few overlapping full-screen and near-full-screen
elements, so here's the complete stacking order, back to front (lowest
`z-index` first):

| Layer | z-index | Why |
|---|---:|---|
| `#bgScenery` (background canvas) | `0` | The unmoving art — tree, sky, moon, ambient particles |
| `.love-panel` (×2) | `2` | The letter/reasons panels |
| `.card` | `3` | The main counter card, and the draggable heart inside it |
| `#fgInteractive` (foreground canvas) | `12` | Every huggable/throwable object — see Part 7 |
| `.scene-toggle` | `20` | The preview toggle, always reachable |
| `.letter-modal` | `10000` | An open love letter, above the whole page |
| `.float-heart-layer` | `99999` | Click-anywhere heart bursts — always on top of *everything* |

Two things are worth understanding about why it's arranged this way:

> **Why does `.card` need a *higher* z-index than `.love-panel`?**
> Both are direct children of `<body>`, and when two elements share a
> `z-index`, the one that comes *later* in the HTML wins ties — and
> Uncertainty's panel happens to come after the card in the markup. Early
> on, both were left at the same z-index, and the result was exactly what
> you'd expect from that tie-breaking rule: dragging the heart near that
> panel made it disappear behind it. Giving `.card` a clearly higher
> number (`3` vs. `2`) fixed it for good, rather than relying on HTML
> order to happen to work out.

> **Why does `#fgInteractive` need its own layer above the panels, with
> `pointer-events:none`?**
> See Part 7's introduction for the full story — short version: objects
> drawn there need to always be *visible* above the card/panels, but the
> canvas itself must never *block clicks* meant for a button or the
> scrollable letter list sitting visually beneath it at that same spot.

### 4.4 The card and the love panels

```css
.card{
  width:100%; max-width:380px;
  background:var(--card-bg);
  border:1px solid var(--card-border);
  border-radius:22px;
  box-shadow:0 18px 40px var(--card-shadow);
  position:relative;
  z-index:3;
  transition:border-color .8s ease, box-shadow .8s ease;
}
```

The rounded card everything sits inside. Notice `background` is **not**
in the `transition` list — see the box below for why.

> **Why isn't the card's background color animated?**
> An earlier version tried `transition:background .8s ease` so switching
> special-day themes would fade smoothly. In testing, rapidly clicking
> through the preview toggle (exactly what that toggle is *for*) could
> get this transition permanently "stuck" on a stale color in some
> browsers — a known rough edge in how CSS transitions interact with
> `var()`-sourced values when retriggered faster than they can finish.
> The color now switches instantly instead. Less fancy, always correct —
> a good reminder that a flashier animation isn't worth it if it can
> break.

```css
.love-panel{
  width:100%; max-width:260px;
  background:var(--card-bg);
  border:1px solid var(--card-border);
  border-radius:20px;
  box-shadow:0 16px 34px var(--card-shadow);
  padding:24px 22px;
  text-align:left;
}
.love-panel-title{ display:flex; align-items:center; gap:9px; }
.envelope-btn{ margin:0 0 0 auto; width:30px; height:30px; border-radius:50%; ... }
```

Styled the same way as `.card` (same variables, so it re-themes right
alongside it), just narrower and left-aligned for a list of short lines
instead of centered headline text. `.love-panel-title` is a flex row
(heart icon, then the heading text, then the envelope button); the
envelope's `margin:0 0 0 auto` is what pushes *just that one element* all
the way to the right-hand end of the row, regardless of how long the
heading text is.

### 4.5 The draggable heart group

```css
.heart-drag{
  position:relative;
  z-index:5;
  cursor:grab;
  touch-action:none;
  user-select:none;
  -webkit-user-drag:none;
  will-change:transform;
  transition:transform 1.8s cubic-bezier(.22,1.05,.32,1);
}
.heart-drag.dragging{
  cursor:grabbing;
  transition:none;
}
```

- `cursor:grab`/`grabbing` show an open/closed-hand mouse pointer — a
  visual hint that this is draggable.
- `touch-action:none` stops the browser's own touchscreen scroll gesture
  from fighting with the custom drag on phones.
- `user-select:none` / `-webkit-user-drag:none` stop the browser from
  trying to select text or start its own native drag — the custom
  JavaScript drag (Part 8.4) should be the only thing happening.
- `transition:transform 1.8s cubic-bezier(...)` is the "glide home"
  behavior: whenever `transform` changes, animate smoothly over 1.8
  seconds along a gentle overshoot-and-settle curve, instead of snapping.
- `.dragging{ transition:none; }` — **while** actively dragged, that
  transition is off, so the heart follows the pointer with zero lag. The
  glide only kicks in once you let go, because `script.js` removes the
  `dragging` class at that exact moment.

(Note: `z-index:5` here only matters *within* `.card`'s own stacking
context — see the box in 4.3 about why `.card` itself needed a higher
z-index than the love panels, since a child can never visually escape
above whatever its parent is stacked below.)

### 4.6 The wings

```css
.wing-right{ margin-left:-16px; transform:scaleX(-1); }
```

Instead of hand-drawing a mirror-image wing, `scaleX(-1)` simply flips the
*same* wing drawing horizontally.

```css
@keyframes flutter{
  0%{ transform:rotate(-6deg) translateY(0); animation-timing-function:cubic-bezier(.6,.02,.85,.25); }
  30%{ transform:rotate(24deg) translateY(2px); animation-timing-function:cubic-bezier(.3,.6,.4,1); }
  44%{ transform:rotate(16deg) translateY(1px); animation-timing-function:cubic-bezier(.4,0,.6,1); }
  100%{ transform:rotate(-6deg) translateY(0); }
}
```

A list of checkpoints along a timeline. At 0% the wing sits tilted up
slightly. By 30% it has swept down fast (a sharp `cubic-bezier` easing
makes that jump quick — a powerful downstroke). By 44% it eases back a
touch, then from 44% all the way to 100% it *slowly* drifts back up — a
long, gentle recovery. That fast-down/slow-up asymmetry is what reads as
a real wingbeat instead of a robotic back-and-forth swing.

```css
.feather.f1{
  transform-box:fill-box;
  transform-origin:75% 75%;
  animation:featherLag 1.9s ease-in-out infinite;
  animation-delay:.07s;
}
```

A *second*, smaller animation layered on top of the first, only on the
largest outer feather, starting 0.07s late with its own smaller rotation.
Because it lags slightly behind the main wing motion, the wingtip appears
to flex — the same trick used to make hair or cloth animation look less
stiff.

```css
.heart-drag.dragging .wing{ animation-name:flutterFast; animation-duration:.34s; }
.heart-drag.returning .wing{ animation-name:flutterFast; animation-duration:.46s; }
```

These only apply when `.heart-drag` *also* has the class `dragging`
(while actively held) or `returning` (while gliding home after release) —
`script.js` adds/removes those class names at the right moments. While
either is active, the wings swap to a faster, wider flap — full-effort
flapping, like the heart is genuinely working to fly.

### 4.7 The heart glyph's pulse and periodic shine

```css
.heart-glyph{ animation:pulse 1.8s ease-in-out infinite; }
@keyframes pulse{ 0%,100%{ transform:scale(1); } 50%{ transform:scale(1.18); } }
```

The heart gently grows to 118% size and back, forever — a heartbeat.

```css
.heart-shine-wrap::after{
  content:'';
  clip-path:path('M16 28 C16 28 1 18.5 1 9.5 ...');
  background:linear-gradient(115deg, transparent 32%, rgba(255,255,255,.9) 48%, ...);
  background-position:-130% -130%;
  animation:heartShine 6.5s ease-in-out infinite;
  mix-blend-mode:screen;
}
```

`::after` conjures an invisible extra layer glued onto the heart without
needing any extra HTML tag. It's clipped into the *exact* heart shape via
`clip-path:path(...)`, so a diagonal white gradient bar can sweep across
it like a glint of light. The `@keyframes heartShine` spends the first
55% of every 6.5-second cycle doing nothing (parked off-screen,
invisible), then briefly sweeps across and parks again — the "shines
every so often" effect. `mix-blend-mode:screen` makes the white blend
like real light hitting a glossy surface instead of flat white paint.

### 4.8 The drag trail and click "impact"

```css
.drag-trail{
  position:fixed;
  z-index:4;
  animation:trailFade .55s ease-out forwards;
}
@keyframes trailFade{
  0%{ opacity:.85; transform:translate(-50%,-50%) scale(1); }
  100%{ opacity:0; transform:translate(calc(-50% + var(--driftX,0px)), calc(-50% + var(--driftY,0px))) scale(.25); }
}
```

Each little spark left behind while dragging is one of these.
`var(--driftX,0px)` isn't a `:root` variable — it's set **individually on
each element** by JavaScript (Part 8.4), so every spark drifts a slightly
different direction as it shrinks and fades. `z-index:4` deliberately
sits *below* the heart's `z-index:5`, so the trail visually trails behind
it rather than covering it.

`translate(-50%,-50%)` shows up constantly in this file — it's a common
centering trick: position an element's top-left corner exactly where you
want its *center*, then shift back by half its own width/height.

The click-anywhere "heart-shaped impact" is four layered pieces, each
with its own animation:

- **`.impact-flash`** — a quick bright heart-shaped flash that pops and
  fades (`impactFlash`).
- **`.impact-ring`** — a heart-shaped *outline* that expands from small to
  2.3× its size while fading (`impactRing`) — the shockwave.
- **`.impact-fracture`** — the cracked lines, drawn using a classic CSS
  trick: `stroke-dasharray:60; stroke-dashoffset:60;` turns a line into
  one long "dash" that's initially slid entirely out of view; animating
  `stroke-dashoffset` down to `0` makes it look hand-drawn, stroke by
  stroke.
- **`.impact-debris`** — small chips flying outward and dropping
  (`debrisFly`) — notice its *last* keyframe only changes the Y position
  again (`--endY` → `--endY2`), a small extra downward slide, like
  gravity finally catching the debris after it's already flown outward.

All four read per-element custom properties (`--rot0`, `--endX`, etc.)
set individually by `script.js`, so no two impacts ever look identical.

### 4.9 Special-day banner and falling ambient particles

```css
.occasion-banner{ display:none; animation:bannerPop .6s ease; }
.occasion-banner.show{ display:inline-flex; }
```

Normally invisible and taking up no space. `script.js` adds the `show`
class only when today is a special day.

```css
@keyframes ambientFall{
  0%{ opacity:0; transform:translate(0,0) rotate(0deg); }
  100%{ opacity:0; transform:translate(var(--driftX,40px), 108vh) rotate(var(--spin,180deg)); }
}
```

The themed icons that gently rain down the screen on a special day. `vh`
means "percent of the browser window's height" — `108vh` guarantees each
one travels well past the bottom no matter the window size, while
`var(--driftX)` (set per-icon, randomly, by JavaScript) gives it a little
side-to-side sway on the way down.

### 4.10 The preview toggle

```css
.scene-toggle-handle{
  opacity:.32;
  transition:opacity .25s ease, transform .4s ease;
}
.scene-toggle:hover .scene-toggle-handle,
.scene-toggle:focus-within .scene-toggle-handle{ opacity:1; transform:rotate(90deg); }
```

The handle sits mostly-invisible (32% opacity) until hovered — or, for
keyboard users, until something inside `.scene-toggle` receives focus
(`:focus-within`), so Tab-key navigation reveals it too, not just a
mouse.

```css
.scene-panel{
  opacity:0; pointer-events:none;
  transition:opacity .2s ease, transform .2s ease;
}
.scene-toggle:hover .scene-panel,
.scene-toggle:focus-within .scene-panel{ opacity:1; pointer-events:auto; }
```

The dropdown list of occasions is always present in the DOM but invisible
*and* click-through (`pointer-events:none`) until hovered/focused — that
second part matters: without it, an invisible-but-still-clickable panel
would silently swallow clicks meant for whatever's behind it. (This is
the same tool used far more aggressively for `#fgInteractive` — Part 7.)

### 4.11 The love-panel and love-letter scroll areas

```css
.love-list{
  max-height:38vh;
  overflow-y:auto;
  scrollbar-width:thin;
  scrollbar-color:var(--rose) transparent;
}
.love-list::-webkit-scrollbar{ width:6px; }
.love-list::-webkit-scrollbar-thumb{ background:var(--rose); border-radius:3px; opacity:.6; }
```

`max-height` caps how tall the list is allowed to grow; `overflow-y:auto`
tells the browser "if the content is taller than that, give it its own
scrollbar instead of pushing the rest of the page down." The rest is just
styling *that* scrollbar to match the theme — `scrollbar-width`/
`scrollbar-color` are the modern standard properties (Firefox and recent
Chrome/Edge), and the `::-webkit-scrollbar*` selectors are the
older-but-still-needed equivalent for Safari and some Chrome versions.
This is why you can paste a long, heartfelt paragraph into a `<li>` and
the panel will scroll internally instead of growing to take over the
page.

```css
.letter-modal{
  position:fixed; inset:0;
  z-index:10000;
  display:flex; align-items:center; justify-content:center;
  opacity:0; pointer-events:none;
  transition:opacity .3s ease;
}
.letter-modal.show{ opacity:1; pointer-events:auto; }
.letter-peek{
  max-height:82vh;
  transform:scale(.92) translateY(10px);
  transition:transform .3s cubic-bezier(.22,1.2,.36,1);
}
.letter-modal.show .letter-peek{ transform:scale(1) translateY(0); }
.letter-body{ overflow-y:auto; ... same scrollbar styling as .love-list ... }
```

The whole modal is `display:flex; align-items:center; justify-content:center;`
on a full-screen `position:fixed` box — the standard recipe for centering
anything regardless of its size. It fades and gently scales in together
(`opacity` on the backdrop wrapper, `scale`+`translateY` on the actual
letter card) rather than just popping into place, which is what makes it
feel like a "peek" instead of a jump-cut. `.letter-body` reuses the exact
same `max-height` + `overflow-y:auto` idea as `.love-list`, so a long
letter scrolls in place too.

### 4.12 Special-day color and font themes

```css
body[data-occasion="valentine"]{
  --wine:#7A1030; --rose:#E23F63; --gold:#D98A9A; --blush:#FBDCE3; --paper:#FFF3F5;
  --card-bg:rgba(255,243,245,.93); ...
  --font-since:'Parisienne',cursive;
}
```

`body[data-occasion="valentine"]` is an **attribute selector** — it only
matches `<body>` when it currently has `data-occasion="valentine"` set.
`script.js` is what adds/changes/removes that attribute (Part 8.9), and
the instant it does, this whole block of variable overrides kicks in —
repainting nearly the entire page, because so much of the rest of this
file was written using `var(--wine)`, `var(--gold)`, etc. instead of
hardcoded colors. This is the payoff of Part 4.2's whole
define-everything-as-a-variable approach: a special day is just *one*
small block of "here are new values for these names" — nothing else
needed to change.

Halloween and New Year's each also override `--ink` and `--heading-color`
directly (not just `--wine`) — those two use a **dark** card background,
so body/heading text needs to switch to a *light* color to stay readable;
the light-background themes don't need that.

Both birthdays use a purple palette (a nod to it being each person's
favorite color) with a shared, slightly different lean each — Tessa's
leans warmer/orchid, Uncertainty's leans cooler/indigo — so the two stay
visually distinct from each other even though both are "purple."

### 4.13 Respecting "reduce motion"

```css
@media (prefers-reduced-motion:reduce){
  .heart-glyph, .heart-glyph.pop{ animation:none; }
  .wing, .heart-drag.dragging .wing, ...{ animation:none; }
  ...
}
```

Some visitors turn on an OS-level "reduce motion" setting (often because
animation causes discomfort or distraction). A `@media` block only
applies its rules when a condition holds — here, that the visitor's
system asked for reduced motion. When active, this turns off every
pulsing/flapping/flying-particle animation, leaving a calm, static page.
`js/scenery.js`, `js/interactive-objects.js`, and `js/script.js` all
check the same condition in JavaScript (via `window.matchMedia`) before
starting up anything purely decorative or physics-driven.

---

<a id="part-5"></a>
## Part 5 — `js/icons.js`: the hand-drawn icon library

Every small flying/falling thing on this page — hearts, roses, balloons,
pumpkins, bats, snowflakes, fireworks, musical notes, a DNA strand — is
drawn here as a tiny inline SVG string. **No emoji anywhere.** Emoji
render differently (sometimes wildly differently) across operating
systems and browsers; hand-drawn vector icons look identical everywhere
and can be recolored to match the active theme.

```js
function svg(inner, viewBox){
  return '<svg viewBox="' + (viewBox || '0 0 24 24') + '" width="1em" height="1em" ' +
         'style="display:block;overflow:visible" aria-hidden="true">' + inner + '</svg>';
}

var Icons = {
  heartSolid: svg('<path d="M12 21S2.4 15.6 2.4 8.8...Z" fill="currentColor"/>'),
  rose: svg('<path .../><path .../>'),
  ...
};

window.Icons = Icons;
```

A few things worth understanding:

- **`width="1em" height="1em"`** is the trick that lets these drop into
  the particle system with zero other code changes. `1em` means "the
  same size as this element's own font-size" — and `script.js` already
  sets `el.style.fontSize = size+'px'` on every particle it spawns
  (that's how the *old*, emoji-based version sized things). So sizing an
  icon is just... already handled.
- **`fill="currentColor"`** means "use whatever CSS `color` is set on the
  element this SVG lives inside." `script.js` sets `el.style.color` on
  each spawned particle (often to a random themed color), which
  automatically tints the icon — again, no extra code needed.
- **`window.Icons = Icons;`** is what makes this object reachable from
  `script.js`. Any variable assigned onto the global `window` object like
  this becomes available to every script that loads afterward, which is
  why `icons.js` must load *before* the scripts that use it (see Part 3's
  `<script>` order, or `index.html` directly).

Using one of these elsewhere just means:

```js
el.innerHTML = Icons.heartSolid;
```

`innerHTML` replaces an element's contents with parsed HTML (here: one
`<svg>`) — compare that to the older `el.textContent = '♥'`, which just
inserted a text character. Everything downstream (positioning, CSS
animation, color) works exactly the same either way.

---

<a id="part-6"></a>
## Part 6 — `js/scenery.js`: the living background

A full-screen `<canvas>` (`#bgScenery`) that's redrawn to match whatever's
happening: a cherry tree in bloom by default, a bare twisted tree on
Halloween, a harp for Tessa's birthday, a DNA helix for Uncertainty's, and
so on. Everything in it is plain **Canvas 2D drawing** — arcs, bezier
curves, gradients — no images. This file owns the parts of the scene that
*don't* respond to a mouse or finger; the huggable/throwable objects
layered on top of it live in `js/interactive-objects.js` (Part 7).

### 6.1 Two canvases: one cached, one live

```js
var canvas, ctx, staticCanvas, staticCtx;
```

There are two `<canvas>` elements at play *within this one file* (don't
confuse this with the separate `#fgInteractive` canvas from Part 7 — this
is purely an internal performance trick for the background art):

- `canvas` (`ctx` is its drawing context) is the one actually visible on
  the page — the `#bgScenery` element from `index.html`.
- `staticCanvas` is created purely in JavaScript
  (`document.createElement('canvas')`) and **never added to the page** —
  it only ever exists in memory, as a place to pre-render the *unmoving*
  parts of the scene (the tree, the sky, the moon...).

Every animation frame, the main loop does the cheap version of "redraw
everything":

```js
function loop(now){
  rafId = requestAnimationFrame(loop);
  ...
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(staticCanvas, 0, 0, W, H);   // stamp the cached picture...
  ...
  for (var i = 0; i < particles.length; i++){
    stepParticle(particles[i], dt);
    drawParticle(ctx, particles[i], currentColors);  // ...then draw the moving bits on top
  }

  if (window.SceneInteractive){
    if (!reducedMotion) SceneInteractive.update(dt);
    SceneInteractive.draw(currentColors);           // ...and let Part 7 draw its own canvas
  }
}
```

`drawImage(staticCanvas, ...)` copies the *entire pre-rendered picture* of
the tree/sky/moon in one cheap operation, instead of regrowing a whole
tree 60 times a second. Only the falling petals/snow/fireflies/bats
actually get redrawn every frame on *this* canvas. This is a standard,
important performance technique any time part of a scene doesn't change
from frame to frame. Notice this same loop is also what drives
`interactive-objects.js`'s physics and drawing each frame (Part 7) — there
is only ever one `requestAnimationFrame` loop for the whole page, this
one, to keep everything in sync.

`requestAnimationFrame(loop)` is the browser's built-in "call this again
right before the next repaint" — the standard way to drive smooth
animation in JavaScript, instead of a fixed `setInterval` that could drift
out of sync with the screen's actual refresh rate.

### 6.2 Why there's a `waitForSize` retry loop

```js
function resize(){
  W = window.innerWidth || document.documentElement.clientWidth || 0;
  H = window.innerHeight || document.documentElement.clientHeight || 0;
  if (!W || !H) return;
  canvas.width = W * DPR;
  ...
}

function waitForSize(attemptsLeft){
  if (attemptsLeft <= 0) return;
  requestAnimationFrame(function(){
    resize();
    if (W && H){ buildStaticScene(); startLoop(); return; }
    waitForSize(attemptsLeft - 1);
  });
}
```

In a few environments, a page's very first rendered frame can briefly
report a `0×0` viewport before the browser finishes laying things out —
and `drawImage` throws an error if you ever try to use a `0×0` canvas as
a source. `waitForSize` is a defensive retry: instead of assuming the
size is always ready immediately, it checks, and if not, tries again on
the next frame (up to 90 times) *before* the animation loop is ever
allowed to start. This is a good general pattern any time code depends on
layout information that might not be available the instant a script
runs.

### 6.3 Reading the active theme's colors

```js
function readThemeColors(){
  var cs = getComputedStyle(document.body);
  function v(name, fallback){
    var val = cs.getPropertyValue(name);
    return (val && val.trim()) || fallback;
  }
  return {
    wine: v('--wine', '#6E1E2E'),
    rose: v('--rose', '#C2626F'),
    ...
  };
}
```

`getComputedStyle(document.body)` asks the browser "what are all of this
element's *final*, resolved CSS values right now?" — including custom
properties. Since `script.js` sets `data-occasion` on `<body>` *before*
asking the scenery to redraw, whatever theme is active in the CSS
(Part 4.12) is exactly what gets read here — the canvas drawing and the
CSS colors are always in sync automatically, with no colors duplicated
between the files. `js/interactive-objects.js` never calls this itself —
`scenery.js` passes the same `currentColors` object straight into
`SceneInteractive.draw(colors)` each frame, so the foreground objects are
always painted with the exact same palette, for free.

`hexToRgba(hex, alpha)` is a small helper that converts a hex color like
`#6E1E2E` into a `rgba(110,30,46,alpha)` string, since Canvas gradients
need an explicit alpha (transparency) channel to fade smoothly, and CSS
hex colors don't carry one. (`interactive-objects.js` keeps its own tiny
copy of this same helper — a little duplication, on purpose, to avoid the
two files needing to know about each other's internals.)

### 6.4 The tree — a recursive branching algorithm

```js
function branch(c, x, y, len, angle, width, depth, maxDepth, trunkColor, canopyPoints){
  var x2 = x + Math.cos(angle) * len;
  var y2 = y + Math.sin(angle) * len;
  ...
  c.beginPath();
  c.moveTo(x, y);
  c.quadraticCurveTo(cx, cy, x2, y2);   // a slightly bent line segment
  c.stroke();

  if (depth <= 0 || len < 7){
    canopyPoints.push({ x: x2, y: y2, gen: maxDepth - depth });
    return;   // stop recursing — this tip becomes a blossom cluster
  }

  var count = depth > 4 ? 2 : (Math.random() < 0.55 ? 2 : 1);
  for (var i = 0; i < count; i++){
    var newAngle = angle + /* some spread */;
    branch(c, x2, y2, len * 0.7ish, newAngle, width * 0.68, depth - 1, maxDepth, trunkColor, canopyPoints);
  }
}
```

This is a **recursive function** — one that calls *itself* — and it's the
classic technique for growing a believable, non-repetitive tree without
hand-placing a single branch. Read it as: "draw one curved segment, then
— unless we've gone deep enough already — draw one or two smaller
segments branching off from its end, each calling this same function
again." Every branch is a little shorter (`len * 0.7ish`), a little
thinner (`width * 0.68`), and angled a little differently than its
parent, with some randomness mixed in so no two trees (and no two
branches on the *same* tree) look identical.

`Math.cos(angle)` / `Math.sin(angle)` are the standard way to convert "an
angle and a distance" into an (x, y) offset — the same math behind a
clock's hands or a compass needle. Canvas measures angles in *radians*
(not degrees), and angle `0` points right, increasing *clockwise*
(because y grows downward on a canvas, unlike a normal graph). This exact
same math reappears, used a different way, for the jack-o'-lantern's
pendulum swing in Part 7.3.

Once a branch stops (`depth <= 0`), its endpoint is remembered in
`canopyPoints` instead of being drawn immediately — those points are
where the soft, cloud-like blossom clusters get painted afterward, back
in `drawTree`:

```js
canopyPoints.forEach(function(p){
  var clusters = 2 + Math.floor(Math.random() * 3);
  for (var i = 0; i < clusters; i++){
    var g = c.createRadialGradient(p.x + ox, p.y + oy, 0, p.x + ox, p.y + oy, r);
    g.addColorStop(0, hexToRgba(col, .8));
    g.addColorStop(1, hexToRgba(col, 0));   // fades to fully transparent at the edge
    c.fillStyle = g;
    c.beginPath(); c.arc(p.x + ox, p.y + oy, r, 0, Math.PI * 2); c.fill();
  }
});
```

Each branch tip gets 2–4 overlapping soft circles (a radial gradient
fading from a solid color to fully transparent), randomly offset and
sized, in a small palette of blossom colors. Many overlapping soft blobs
is what reads as a fluffy, cloud-like canopy instead of a hard-edged
shape — the same trick digital painters use for foliage, clouds, or
smoke.

`opts.bare` (used for Halloween and New Year) simply **skips** this whole
blossom-painting step, leaving just the bare branch skeleton.
`opts.snow` adds small white half-ellipses along the top of each branch
tip afterward, like a light dusting.

### 6.5 The harp and the DNA helix

`drawHarp` builds one filled silhouette (the body) using
`bezierCurveTo` — a curve defined by a start point, an end point, and two
"control points" that pull the curve's shape toward them without the
curve actually touching them — then fans a set of thin string lines
between two edges of that same curve. `cubicPoint(...)` is a small helper
that calculates "the point at some fraction `t` along this exact bezier
curve," used so the strings visually originate from the harp's own curved
edge instead of a separate, disconnected shape.

`drawHelix` is more directly mathematical — a DNA double helix is
genuinely just two [sine waves](https://en.wikipedia.org/wiki/Sine_wave)
offset from each other by half a cycle (`phase = 0` and `phase = Math.PI`,
i.e. 180° apart):

```js
function strandPoint(phase, t){
  var y = top + t * (bottom - top);
  var x = cx + Math.sin(t * Math.PI * 2 * turns + phase) * amp;
  return { x: x, y: y };
}
```

As `t` goes from 0 to 1 (top to bottom), `x` oscillates back and forth
`turns` times with a width of `amp` — draw that path twice, once per
strand, and connect them with short "rung" lines wherever they're far
enough apart to look like a real base-pair rung, and you get a
recognizable double helix with only a few lines of math.

### 6.6 The particle engine

One shared, generic system drives every ambient moving thing — petals,
snow, musical notes, fireflies, bats, drifting leaves — rather than
separate bespoke systems for each. Each particle is just a plain
JavaScript object with whatever properties its `type` needs
(`resetParticle`), a way to move it forward by one frame
(`stepParticle`), and a way to draw it (`drawParticle`) — all three
`switch`-statements keyed on `p.type`.

The one repeating idea worth understanding: **positions are computed from
elapsed time, not accumulated frame-by-frame.**

```js
x = p.baseX + Math.sin(p.swayPhase + p.t * p.swaySpeed) * p.swayAmp;
```

Instead of nudging `p.x` sideways by a little bit each frame (which
accumulates small rounding/timing errors over a long-running page), this
recomputes the *exact* sideways offset fresh every frame directly from
`p.t` (total elapsed seconds for this particle). That guarantees a clean,
correct sine-wave sway no matter how long the page has been open or how
irregular the frame timing has been — a good habit for any animation that
needs to run indefinitely.

`resetParticle(p, initial)` doubles as both "create a new particle" *and*
"recycle an existing one back to the top/bottom of the screen" — when a
petal falls past the bottom edge (`stepParticle`'s `if (p.y > H + 20)`
check), it doesn't get deleted and replaced; it just gets its properties
reassigned as if it were brand new. Reusing objects like this instead of
constantly creating and discarding them is lighter work for the browser
over a long-running animation.

> **Fireflies react to you.** The `firefly` case in `drawParticle` reads
> `SceneInteractive.getPointer()` (exposed by Part 7) each frame and
> measures the distance from that point to the firefly. Close enough
> (under 90px), and its glow radius and brightness both boost smoothly —
> the "halo" effect on half-anniversary. This is the one place
> `scenery.js` reaches *into* `interactive-objects.js`, the mirror image
> of the reach in the other direction described in Part 7's intro.

### 6.7 Scenes: tying it all together

```js
var SCENES = {
  'default':              { feature: 'cherryTree', particle: 'petal' },
  'valentine':            { feature: 'cherryTree', particle: 'petal',   extras: ['candles'] },
  'halfAnniversary':      { feature: 'cherryTree', particle: 'firefly',  extras: ['garland'] },
  'anniversary':          { feature: 'cherryTree', particle: 'petal',   extras: ['garland'] },
  'tessaBirthday':        { feature: 'harp',       particle: 'note',    extras: ['balloons'] },
  'uncertaintyBirthday':  { feature: 'helix',      particle: 'leaf',    extras: ['balloons'] },
  'halloween':            { feature: 'bareTree',   particle: 'bat',    extras: ['moon', 'fog', 'pumpkins'] },
  'newYear':               { feature: 'snowTree',   particle: 'snow',   extras: ['moon', 'stars'] }
};
```

One small object per occasion, naming: which big background drawing to
use (`feature`), which ambient particle type keeps drifting through the
*background* scene (`particle`), and any extra unmoving decorations to
paint (`extras` — a lit candle row, balloons, a fairy-light garland, a
moon, fog, ground pumpkins). Notice this list is shorter than it used to
be: the snowman, the jack-o'-lantern, birthday cakes, chocolate, and the
anniversary lanterns *used* to be drawn here too, back when they were
just unmoving decoration — they've all since moved to
`interactive-objects.js` (Part 7), because they're things you can pick up
now. `buildStaticScene()` (below) still tells that file which scene is
active, via `SceneInteractive.setup(...)`, so it knows which of *its own*
objects to create.

```js
function buildStaticScene(){
  currentColors = readThemeColors();
  var cfg = SCENES[currentSceneKey] || SCENES['default'];
  var candlePositions = [];

  drawSky(staticCtx, currentColors);
  drawGround(staticCtx, currentColors);

  switch (cfg.feature){
    case 'cherryTree': drawTree(staticCtx, currentColors, {}); break;
    ...
  }

  (cfg.extras || []).forEach(function(extra){
    if (extra === 'moon') drawMoon(staticCtx, currentColors);
    if (extra === 'candles') candlePositions = drawCandlesStatic(staticCtx, currentColors);
    ...
  });

  populateParticles(reducedMotion ? null : cfg.particle);

  if (window.SceneInteractive) SceneInteractive.setup(currentSceneKey, { W: W, H: H }, candlePositions);
}
```

This runs once whenever the scene changes (a new special day begins, or
the preview toggle picks a different one) and once on every window
resize — never on every animation frame, which is exactly why the
two-canvas caching from 6.1 matters. `drawCandlesStatic` paints the
candle *wax bodies* into the cached picture (they never move) and returns
their `{x, y, size}` positions — it deliberately does **not** decide
whether their flames are lit; that's handed off to
`SceneInteractive.setup(...)` as the very last line, so `interactive-objects.js`
can own the clickable, toggleable, flickering flame on top of each one
(Part 7.6).

---

<a id="part-7"></a>
## Part 7 — `js/interactive-objects.js`: things you can hold and throw

This is the newest, biggest system in the project: the three snowballs
that make up the New Year's snowman, the jack-o'-lantern swinging from
its hook, birthday cakes, Valentine's chocolate, the anniversary paper
lanterns, and the big heart on the default page — every one of them
individually grabbable, throwable, and governed by real (if simplified)
physics — plus candles you can light and extinguish by clicking their
flame.

### 7.0 Why this needed its *own* canvas

Before reading any of the physics, it's worth understanding one decision
that shapes the whole file: these objects are drawn on a **separate**
canvas, `#fgInteractive`, layered *above* the card and the love panels
(Part 4.3) — not mixed into `scenery.js`'s background canvas underneath
everything.

Two real problems forced this:

> **Problem 1 — objects need to be *visible* above the panels.**
> The "why I love you" panels are real, opaque page elements. Anything
> painted on a canvas that sits *behind* them (like the background
> canvas, `z-index:0`) is invisible wherever it happens to overlap one —
> covered up, exactly like a photograph half-covered by an index card.
> An object positioned or thrown into that space would simply vanish.

> **Problem 2 — objects still need to be *clickable* there.**
> Layering a second canvas on top fixes the visibility... but if that
> canvas is a normal, full-screen element sitting *above* the panels,
> it would also **block every click meant for them** — the envelope
> button, the scrollable reasons list, all of it, since the browser
> always routes a click to whatever's visually on top at that pixel.

The fix is two CSS/JS decisions working together:

1. `#fgInteractive` is given `pointer-events:none` in CSS (Part 4.3). That
   makes the canvas element completely transparent to clicks — the
   browser behaves as if it isn't there at all, and routes every click
   straight through to whatever's actually underneath (a panel, the
   card, empty page). This solves Problem 2, but *reintroduces* Problem
   1's opposite: now nothing on this canvas can ever directly receive a
   `pointerdown`.
2. So instead of listening on the canvas element, this file listens on
   `window` itself:

   ```js
   window.addEventListener('pointerdown', onPointerDown);
   window.addEventListener('pointermove', onPointerMove, { passive: false });
   window.addEventListener('pointerup', onPointerUp);
   ```

   Thanks to **event bubbling** (Part 1), a pointer event fired on
   *any* element — a love-panel button, the scrollable list, empty page,
   anything — still travels all the way up through its ancestors to
   `window`, where this file is listening. So every pointer event reaches
   this code with an accurate `clientX`/`clientY`, *regardless* of which
   DOM element visually happened to receive it first. The code then does
   its own simple **distance check** (`hitTest`, below) to decide whether
   that point actually landed on one of its own objects — completely
   independent of the browser's own "what element is at this pixel"
   routing, which is exactly what makes an object work identically
   whether it's sitting in open space or visually overlapping a panel.

The result: objects are always drawn on top (solves Problem 1) and are
always still grabbable, anywhere on the page (solves Problem 2) — without
ever blocking a single click meant for something else.

### 7.1 The generic "throwable" physics

Most of these objects (the snowballs, the cake, the chocolate, the
lanterns, the big heart) share one small physics engine:

```js
function makeThrowable(kind, x, y, radius, groundOffset, extra){
  var o = {
    kind: kind, x: x, y: y, vx: 0, vy: 0, rot: 0, vrot: 0,
    radius: radius, groundOffset: groundOffset == null ? radius : groundOffset,
    grabRadius: radius + 16,
    floatMode: false, floatBaseX: x, floatPhase: ..., floatTime: 0,
    settled: true
  };
  for (var k in extra) if (extra.hasOwnProperty(k)) o[k] = extra[k];
  return o;
}
```

Every object is a plain JavaScript object holding its position (`x, y`),
velocity (`vx, vy` — pixels per second in each direction), rotation
(`rot`) and spin speed (`vrot`), and a `settled` flag. `grabRadius` is
slightly larger than the object's visual `radius`, so it's a little more
forgiving to click than its exact drawn edge.

```js
function stepThrowable(o, dt){
  if (drag && drag.obj === o) return;          // being held — position follows the pointer instead
  if (o.floatMode){ /* gentle rise, see 7.5 */ return; }
  if (o.settled) return;                        // resting — nothing to compute

  o.vy += GRAVITY * dt;                          // gravity: constant downward acceleration
  o.x += o.vx * dt;
  o.y += o.vy * dt;
  o.rot += o.vrot * dt;

  if (o.y < -60){ o.y = -60; o.vy = Math.abs(o.vy) * 0.4; }              // soft ceiling
  if (o.x < o.radius){ o.x = o.radius; o.vx = Math.abs(o.vx) * 0.5; }    // side walls
  if (o.x > W - o.radius){ o.x = W - o.radius; o.vx = -Math.abs(o.vx) * 0.5; }

  var gy = groundYAt(o.x) - o.groundOffset;
  if (o.y > gy){
    o.y = gy;
    if (Math.abs(o.vy) > 60){
      o.vy = -o.vy * GROUND_BOUNCE;              // bounce, losing some energy
      o.vx *= 0.7; o.vrot *= 0.55;
    } else {
      o.vy = 0; o.vrot *= 0.8; o.vx *= 0.5;
      if (Math.abs(o.vx) < 4) o.settled = true;   // slow enough — stop simulating
    }
  }
  o.vx *= (1 - AIR_DRAG * dt);
}
```

This is a small, from-scratch physics simulation, one frame at a time:
gravity constantly pulls `vy` (vertical velocity) downward; position is
just "old position + velocity × time elapsed"; and when the object's
bottom edge reaches the ground (found via `groundYAt`, 7.2), it either
**bounces** (loses some speed and reverses direction, if it was still
moving fast) or **settles** (stops being simulated at all, once it's
slow enough). `GROUND_BOUNCE` (0.36) and `AIR_DRAG` are just tuning
numbers — how "bouncy" and how much speed bleeds off over time.

> **Why `settled` instead of a countdown timer?**
> An earlier version gave every throw a fixed 1.6-second timer, after
> which gravity simply stopped being applied — simpler to write, but it
> had a real bug: throw something hard enough (straight up, say), and if
> the timer ran out *while it was still airborne*, it would freeze there
> forever, stranded off-screen with no way back down. Switching to a
> `settled` flag means gravity keeps applying for as long as it takes —
> one bounce or fifty — and the object only ever stops once it has
> genuinely come to rest on visible ground. Combined with the wall/ceiling
> bounces above, a thrown object can no longer get permanently lost, no
> matter how hard it's thrown.

### 7.2 `groundYAt` — a shortcut curve, shared with `scenery.js`

```js
// in scenery.js:
function groundYAt(x){
  var groundY = H * 0.87;
  var pts = [[0, groundY + 16], [0.25 * W, groundY - 12], [0.55 * W, groundY + 8], [0.8 * W, groundY + 20], [W, groundY - 6]];
  ...smoothly interpolate between the nearest two points...
}
window.Scenery = { ..., groundYAt: groundYAt };
```

`scenery.js`'s `drawGround` paints a gently wavy ground line using bezier
curves — precise, but awkward to ask "what's the exact height at this
one specific x?" (that requires inverting the curve). `groundYAt`
sidesteps that by defining the *same* rough shape as a handful of key
points and smoothly blending between whichever two straddle a given `x`
(using a common ease curve called "smoothstep": `t*t*(3-2*t)`). It isn't
pixel-identical to the drawn curve, but it's close enough that thrown
objects visibly land right on the ground, and — crucially — it's cheap
enough to call every single frame for every object. `interactive-objects.js`
calls it through `window.Scenery.groundYAt(x)` rather than redefining the
ground shape a second time.

### 7.3 The jack-o'-lantern's pendulum

The lantern doesn't use the generic throwable physics above at all — it's
tied to a fixed point (its hook), so it needs genuine **pendulum**
physics instead: an angle that swings back toward "hanging straight down"
under gravity, rather than a position that falls freely.

```js
function jackPosition(j){
  return { x: j.anchorX + Math.sin(j.angle) * j.length, y: j.anchorY + Math.cos(j.angle) * j.length };
}

function stepJack(j, dt){
  if (drag && drag.obj === j) return;
  var accel = -(GRAVITY / j.length) * Math.sin(j.angle) - 1.4 * j.angVel;   // the pendulum equation
  j.angVel += accel * dt;
  j.angle += j.angVel * dt;
  j.spinVel *= (1 - 1.6 * dt);
  j.spin += j.spinVel * dt;
}
```

`j.angle` is measured from "hanging straight down" (`angle = 0`); Part
6.4 already introduced `Math.cos`/`Math.sin` for turning an angle into an
(x, y) offset, and this is the same idea, just now the *distance* is
fixed (`j.length`, the rope) and only the *angle* changes. The line
`accel = -(GRAVITY/length) * Math.sin(angle) - damping*angVel` **is** the
real physics equation for a simple pendulum: the further it's swung from
straight-down, the harder gravity pulls it back (that's the `Math.sin`
term); the `- 1.4 * j.angVel` term is damping (friction), which is what
makes a real swing gradually settle instead of swinging forever.

Grabbing it works the other way around — instead of computing the angle
*from* physics, the angle is computed *from where the pointer is*:

```js
function updateDragJack(px, py){
  var dx = px - j.anchorX, dy = py - j.anchorY;
  var newAngle = Math.atan2(dx, dy);   // the angle that points from the anchor toward (dx, dy)
  ...
  j.angVel = clamp(j.angVel * 0.5 + (dAngle / dt) * 0.5, -20, 20);
  j.angle = newAngle;
}
```

`Math.atan2(dx, dy)` is the inverse of the `sin`/`cos` trick above: given
an (x, y) offset, it returns the matching angle — the exact question
`jackPosition` answers in reverse. While the swing is being dragged, the
code also keeps a running estimate of `angVel` (how fast the angle is
changing) from the last couple of pointer positions, so that:

```js
function endDragJack(){
  j.spinVel = clamp(j.spinVel + j.angVel * 1.6, -16, 16);
}
```

...letting go while it's swinging fast kicks `spinVel` — a *second*,
independent rotation (`j.spin`, drawn as the lantern's own tilt, separate
from the swing angle) — giving the lantern its "flip" when thrown hard,
on top of the pendulum swing continuing naturally.

### 7.4 Dragging: velocity tracking, and why it's clamped

```js
var MAX_THROW_SPEED = 2600; // px/s

function updateDrag(px, py){
  var o = drag.obj;
  var dt = Math.max((performance.now() - drag.lastT) / 1000, 0.012);
  var newX = px - drag.offsetX, newY = py - drag.offsetY;
  var vx = clamp((newX - o.x) / dt, -MAX_THROW_SPEED, MAX_THROW_SPEED);
  var vy = clamp((newY - o.y) / dt, -MAX_THROW_SPEED, MAX_THROW_SPEED);
  o.vx = o.vx * 0.6 + vx * 0.4;   // smoothed, not just the latest sample
  o.vy = o.vy * 0.6 + vy * 0.4;
  o.x = newX; o.y = newY;
}
```

While an object is held, its position is set directly from the pointer
every frame — no physics needed, it just *is* wherever your mouse/finger
is (minus the offset from where you first grabbed it, so it doesn't jump
to be centered under the cursor). Velocity — needed for the *throw*, once
you let go — is estimated from how far it moved since the last frame,
divided by how much time that took.

> **Why is that velocity clamped to a maximum?**
> `dt` (time since the last pointer update) is measured in real
> milliseconds, and two pointer events can, in rare cases, be reported
> only a fraction of a millisecond apart. Dividing a normal pixel
> distance by a *near-zero* time produces an enormous, unrealistic
> velocity — exactly the kind of bug that only shows up under unusual
> timing. It happened during testing: a quick, tightly-spaced drag
> produced a velocity in the *hundreds of thousands* of pixels per
> second, launching an object far off-screen instantly. The fix is two
> small guards working together — a floor under `dt` (`0.012`, roughly
> one 80fps frame, so it can never be divided by something tinier) *and*
> a hard ceiling on the resulting velocity (`MAX_THROW_SPEED`) as a
> second line of defense. A "hard flick" still throws something
> convincingly fast; a timing fluke just can't send it flying at
> physically absurd speed anymore.

### 7.5 Paper lanterns: throwable *and* buoyant

Anniversary's lanterns are throwable like everything else in 7.1, but
they also have a resting behavior none of the others do: drifting slowly
*upward*, since they're meant to be gently rising into the sky.

```js
if (o.floatMode){
  o.floatTime += dt;
  o.y -= 13 * dt;
  o.x = o.floatBaseX + Math.sin(o.floatPhase + o.floatTime * 0.4) * 15;
  if (o.y < -30){ /* wrap back around to the bottom of the screen */ }
  return;
}
```

This is the exact same "compute position from elapsed time, not
accumulated frame-by-frame" idea from `scenery.js`'s particle engine
(Part 6.6) — a sideways sine-wave sway layered on a steady rise. A
lantern starts in `floatMode`; grabbing it (`beginDrag`) turns that off;
and once it's thrown and eventually settles back onto the ground (the
`Math.abs(o.vx) < 4` moment in 7.1's `stepThrowable`), the code switches
`floatMode` back on right there for lanterns specifically — so a thrown
lantern falls, lands, and then calmly resumes rising, rather than sitting
on the ground forever like a cake would.

### 7.6 Candles: a lit/unlit toggle, not a throwable

Candles (the Valentine's row, *and* each birthday cake's four candles)
aren't objects you drag at all — just a flame you can click to toggle:

```js
candles = (candlePositions || []).map(function(c){
  return { x: c.x, y: c.y, size: c.size, lit: true, seed: Math.random() * 10 };
});
```

`candlePositions` comes from `scenery.js`'s `drawCandlesStatic` (Part
6.7) — that function paints the wax *body* once into the cached
background picture, and this file owns everything about the *flame*:
whether it's currently `lit`, and (if so) drawing it fresh every frame
with a flicker:

```js
function flicker(seed){ return Math.sin(flickerT * 9 + seed * 3.1) * 1.4 + Math.sin(flickerT * 23 + seed) * 0.6; }
```

Two out-of-sync sine waves (one slow, one fast) added together reads as a
much more organic flicker than either alone — the same trick this file's
cake-candle drawing and the old `scenery.js` candle system both use.
Clicking one just flips `candle.lit`; when `false`, `draw()` renders a
small dark, un-glowing wick instead of a flame.

### 7.7 Picking the *closest* match, not the first one checked

```js
function hitTest(px, py){
  var best = null, bestDist = Infinity;
  if (jackLantern){ /* check distance, remember if closer than bestDist so far */ }
  for (var i = 0; i < candles.length; i++){ /* same */ }
  for (var j = 0; j < objects.length; j++){ /* same */ }
  return best;
}
```

Every category of grabbable thing (the jack-o'-lantern, the candles, the
regular objects) is checked, and whichever one is *closest* to the click
wins — not whichever category happened to be checked first.

> **A real bug this caught.** Valentine's chocolate originally sat close
> enough to one of the five candles that their two hit-zones overlapped.
> An earlier version of this function checked candles before objects and
> simply returned the first match — meaning a click that landed in that
> overlap always "hit" the candle, and the chocolate right next to it
> became permanently unclickable, even though it was clearly visible.
> Comparing *distances* across every category and keeping only the
> nearest one fixes that in general, for any future object that happens
> to end up near another — not just this one specific case (chocolate
> was also moved further from the candle row for clearer visual
> separation, but the hit-testing fix is the part that matters for
> *every* object, forever).

### 7.8 Choosing spawn positions that avoid the love panels

```js
function getSideClearance(){
  var cardRect = document.querySelector('.card').getBoundingClientRect();
  var clearance = { left: 0, right: W };
  var panels = document.querySelectorAll('.love-panel');
  for (var i = 0; i < panels.length; i++){
    var r = panels[i].getBoundingClientRect();
    var besideCard = r.top < cardRect.bottom && r.bottom > cardRect.top;
    if (!besideCard) continue;   // panels *stacked* above/below the card (narrow screens) don't constrain anything
    if (r.left < cardRect.left) clearance.left = Math.max(clearance.left, r.right + 18);
    else clearance.right = Math.min(clearance.right, r.left - 18);
  }
  return clearance;
}
```

`getBoundingClientRect()` asks the browser for an element's *actual*
on-screen position and size, right now — which is what makes this
approach correct at *any* window size, rather than guessing with fixed
percentages. It only treats a panel as something to avoid if it's
currently sitting *beside* the card (`besideCard`, checking that their
vertical ranges overlap) — on a narrow phone screen, the panels stack
above and below the card instead, and don't block anything, so this
function quietly returns the full width in that case. Every object's
starting X position (7.9) is `clamp`ed into whatever horizontal band this
returns, so nothing ever spawns hidden underneath a panel in the first
place.

> **A second real bug this fixes.** Even with Part 7.0's "grabbable
> anywhere" architecture, a spawn position that started out visually
> hidden behind a panel was still a bad first impression — better to
> never place one there to begin with. Before this function existed, the
> big heart, cake, jack-o'-lantern, and snowman were positioned as a
> fixed percentage of the window's width (`W * 0.87`, etc.), with no idea
> the love panels existed. On typical laptop-width windows, several of
> those percentages landed *exactly* where a panel sits.

### 7.9 Scene setup: which objects exist for which occasion

```js
function setup(key, dims, candlePositions){
  sceneKey = key || 'default';
  W = dims.W; H = dims.H;
  objects = []; jackLantern = null;
  candles = (candlePositions || []).map(...);
  var clear = getSideClearance();

  if (sceneKey === 'default'){
    var hx = clamp(W * 0.13, clear.left + 34, clear.right - 34);
    objects.push(makeThrowable('bigheart', hx, groundYAt(hx) - 34, 34, 34, { grabRadius: 52 }));
  } else if (sceneKey === 'newYear'){
    /* three makeThrowable('snowball', ...) calls, stacked to form the snowman */
  } else if (sceneKey === 'halloween'){
    jackLantern = makeJackLantern(jx, H * 0.42, 62);
  }
  ...
}
```

Called by `scenery.js`'s `buildStaticScene()` every time the scene
changes (Part 6.7) — this completely rebuilds the `objects` array (and
`jackLantern`, and `candles`) from scratch each time, so switching from,
say, Halloween to the default scene cleanly removes the lantern and
brings back the big heart, with no leftover state from the previous
occasion. The three snowballs share one `role` idea worth knowing: the
scarf and arms are drawn attached to whichever position the *middle*
ball currently has, and the face to wherever the *head* ball currently
is — so if you drag the head away from the rest of the snowman, its face
goes with it, rather than staying pinned to the snowman's original spot.

### 7.10 The big heart: both a tap *and* a throw

The big heart is the one object that does two different things depending
on how you interact with it — reusing the exact tap-vs-drag pattern
`script.js` already uses for the main heart (Part 8.4):

```js
function endDrag(){
  var o = drag.obj;
  var wasTap = !drag.moved;   // did the pointer move more than 6px before releasing?
  drag = null;

  if (wasTap && o.kind === 'bigheart' && window.triggerBigHeartBurst){
    window.triggerBigHeartBurst(o.x, o.y);   // defined in script.js — see Part 8.5
    return;
  }
  o.settled = false;   // otherwise, let it fly
  o.vrot = clamp(o.vx * 0.012, -7, 7);
}
```

`window.triggerBigHeartBurst` is defined over in `script.js`, not here —
this file calls it by name without needing to know anything about how it
works, the same way it reaches into `window.Scenery.groundYAt` in 7.2.
Since `script.js` loads *after* this file (Part 0), that function doesn't
exist yet at the exact moment this file first runs — but that's fine,
because it's only actually *called* later, in response to a tap, by
which point every script has finished loading. A plain tap sends a big
burst of hearts flying (Part 8.5); an actual drag-and-release throws it
like everything else in this file.

---

<a id="part-8"></a>
## Part 8 — `js/script.js`: counter, drag, effects, calendar, letters

Runs top-to-bottom the instant the browser reaches its `<script>` tag —
except anything wrapped in a `function`, which is only *defined* there
and actually *runs* later, when something calls it by name.

### 8.1 The start date and the "since ..." line

```js
var startDate = new Date('2026-03-07T00:00:00');   // ← the one line meant to be edited

var MONTH_NAMES = ['January', 'February', ..., 'December'];
function formatSinceDate(date){
  return MONTH_NAMES[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear();
}
```

`date.getMonth()` returns a number from **0 to 11** (0 = January — a
classic source of off-by-one bugs, so watch for it in your own code).
Looking the number up in `MONTH_NAMES` — a plain JavaScript array written
by hand, not asked from the browser — is what guarantees the date always
prints in English no matter the visitor's language settings.

### 8.2 Counting the days

```js
var totalDays = Math.max(0, Math.floor((now - startDate) / 86400000));
```

Subtracting one `Date` from another gives the difference in
**milliseconds** (every `Date` is secretly a giant number of milliseconds
since Jan 1, 1970). `86400000` is the number of milliseconds in a day
(1000 × 60 × 60 × 24). `Math.floor` rounds down to a whole number;
`Math.max(0, ...)` guards against a negative number if a clock is wrong.

The "X years, Y months, Z days" breakdown afterward is trickier, since
months don't all have the same length — it subtracts naively first, then
**borrows** from the previous month/year if the day-of-month subtraction
went negative, using a neat trick: `new Date(year, month, 0)` — passing
day **zero** for a given month returns the *last day of the previous
month* in JavaScript, exactly the "how many days to borrow" answer
needed.

### 8.3 Checking for "reduce motion" and starting both canvases

```js
var prefersReducedMotion = window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

var bgCanvas = document.getElementById('bgScenery');
if (bgCanvas && window.Scenery){
  Scenery.init(bgCanvas);
  Scenery.setReducedMotion(prefersReducedMotion);
}

var fgCanvas = document.getElementById('fgInteractive');
if (fgCanvas && window.SceneInteractive){
  SceneInteractive.init(fgCanvas);
}
```

The JavaScript-side twin of the CSS `@media` block from Part 4.13.
`window.matchMedia('...')` asks the browser "does this condition
currently hold?" and `.matches` gives a plain `true`/`false` answer. This
same check gates every purely-decorative bit of motion added afterward —
sparkles, the drag trail, ambient particles, and (inside
`interactive-objects.js` itself) whether physics updates run at all each
frame. Note the two initialization calls are independent and parallel —
`Scenery.init` and `SceneInteractive.init` each get handed their *own*
canvas element (`#bgScenery` and `#fgInteractive` respectively, Part 7.0)
and manage it entirely separately.

### 8.4 Dragging the heart

```js
heartDrag.addEventListener('pointerdown', function(e){
  if (e.button !== undefined && e.button !== 0) return;
  try { heartDrag.setPointerCapture(e.pointerId); } catch (err){}
  var rect = heartDrag.getBoundingClientRect();
  dragState = { startX: e.clientX, startY: e.clientY, centerX: ..., centerY: ..., moved: false, pointerId: e.pointerId, lastTrailTime: 0 };
  heartDrag.classList.remove('returning');
  heartDrag.classList.add('dragging');
});
```

"pointerdown" fires the instant a mouse button (or a touch) presses the
heart. One event type handles mouse, touch, *and* stylus input at once —
that's the whole point of the modern Pointer Events API, instead of
separate mouse and touch code paths. `setPointerCapture` tells the
browser "keep sending me this exact finger/mouse's future move/release
events even if the pointer strays outside this element while dragging."
(This is a *different* strategy from `interactive-objects.js`'s
window-level listening in Part 7.0 — the heart is a single, always-visible
DOM element that's never covered by anything else, so listening directly
on it, with capture, is simpler and works fine here.)
`getBoundingClientRect()` asks "where on screen is this element right
now, and how big?" — used to find its center point.

```js
heartDrag.addEventListener('pointermove', function(e){
  ...
  var dx = e.clientX - dragState.startX;
  var dy = e.clientY - dragState.startY;
  if (!dragState.moved && Math.hypot(dx, dy) > DRAG_THRESHOLD) dragState.moved = true;
  var tilt = Math.max(-16, Math.min(16, dx * 0.12));
  heartDrag.style.transform = 'translate(' + dx + 'px,' + dy + 'px) rotate(' + tilt + 'deg) scale(1.08)';
  ...
});
```

`Math.hypot(dx, dy)` is the straight-line distance moved (Pythagoras'
theorem). Once that passes `DRAG_THRESHOLD` (6px), `dragState.moved`
becomes permanently `true` for this drag — used later to tell a real drag
apart from a simple tap-in-place. `Math.max(-16, Math.min(16, ...))`
*clamps* a value between two bounds — here, a playful sideways tilt that
never exceeds ±16°. Setting `heartDrag.style.transform` directly moves,
rotates, and slightly enlarges the group instantly (the `dragging`
CSS class has already turned the transition off, so there's zero lag
following the pointer).

```js
function endDrag(e){
  var wasTap = !dragState.moved;
  heartDrag.classList.remove('dragging');
  if (!wasTap){
    heartDrag.classList.add('returning');
    heartDrag.addEventListener('transitionend', function onEnd(ev){
      if (ev.propertyName !== 'transform') return;
      heartDrag.classList.remove('returning');
      heartDrag.removeEventListener('transitionend', onEnd);
    });
  }
  heartDrag.style.transform = 'translate(0px,0px) rotate(0deg) scale(1)';
  dragState = null;
  if (wasTap) triggerHeartClickEffect(e.clientX, e.clientY);
}
```

On release: if it *was* a real drag, add `returning` (turning the fast
wing-flap back on) and listen — just once — for the browser's own
`transitionend` event, which fires automatically the moment the 1.8s
glide finishes, to switch the wings back to their calm idle flutter.
Setting `style.transform` back to the identity values is what actually
starts that glide (since `dragging`, which disabled the transition, was
just removed a line above). If it *wasn't* a real drag (no meaningful
movement happened), the heart just gets tapped — same heart-shaped impact
effect as clicking anywhere else on the page. (`interactive-objects.js`'s
big heart, Part 7.10, uses this exact same `moved`-flag idea for its own
tap-vs-throw decision.)

### 8.5 Click anywhere: the heart-shaped impact

```js
function spawnHeartImpact(x, y){
  spawnImpactFlash(x, y);
  spawnImpactRing(x, y);
  spawnImpactFractures(x, y, 6);
  spawnImpactDebris(x, y, 8);
}

function triggerHeartClickEffect(x, y){
  if (prefersReducedMotion) return;
  spawnHeartImpact(x, y);
  var icons = (currentOccasion && occasionConfig[currentOccasion]) ? occasionConfig[currentOccasion].icons : ['heartSolid', 'heartOutline'];
  spawnBurstParticles(x, y, 9 + Math.floor(Math.random() * 4), icons);
}

window.triggerBigHeartBurst = function(x, y){
  if (prefersReducedMotion) return;
  spawnHeartImpact(x, y);
  spawnBurstParticles(x, y, 26 + Math.floor(Math.random() * 10), ['heartSolid', 'heartOutline']);
};

document.addEventListener('click', function(e){
  if (heartDrag.contains(e.target)) return;
  if (window.SceneInteractive && SceneInteractive.wasInteracted()) return;
  triggerHeartClickEffect(e.clientX, e.clientY);
});
```

The click listener is attached to the whole `document`, not one specific
element — that's what makes it fire for a click *anywhere*. `e.target`
is whichever exact element was actually clicked; if it was the heart (or
something inside it), this listener politely steps aside, since `endDrag`
(8.4) already handles a tap on the heart directly. The second guard is
newer: `SceneInteractive.wasInteracted()` (Part 7) reports whether the
pointer gesture that just finished actually grabbed, threw, swung, or
toggled something in the foreground canvas — if so, this listener steps
aside too, so picking up a snowball doesn't *also* trigger a heart
bursting at that spot.

`window.triggerBigHeartBurst` is the function `interactive-objects.js`
calls by name when the big heart is tapped (Part 7.10) — it's just a
bigger version of the same burst, defined here because this file already
owns `spawnHeartImpact`/`spawnBurstParticles`, so there was no reason to
duplicate that logic in the other file.

Each spawn function (`spawnImpactFlash`, `spawnImpactRing`, ...) follows
the same repeating pattern used for *every* temporary visual effect in
this file, worth understanding once:

1. `document.createElementNS(SVG_NS, 'svg')` — build a blank SVG element
   in memory (SVG shapes need this special namespaced version of
   `createElement`, not the plain one).
2. Set its `d` (shape), position, and size.
3. `floatLayer.appendChild(...)` — insert it into the page, which is the
   moment its CSS animation starts playing.
4. `setTimeout(function(){ ... }, someMs)` — schedule its removal once
   the animation has had time to finish, so the page doesn't slowly fill
   with thousands of invisible leftover elements.

`spawnBurstParticles(x, y, count, icons)` is the one that reads
`Icons[iconKey]` from Part 5 — swap the `icons` list passed in (plain
hearts by default, or a special day's themed set) and the *same*
animation code produces a completely different-looking burst, for free.

### 8.6 Sparkle twinkles and the drag trail

```js
function scheduleSparkle(){
  var delay = 2600 + Math.random() * 2600;
  setTimeout(function(){
    spawnSparkle();
    if (Math.random() < 0.4) setTimeout(spawnSparkle, 180 + Math.random() * 220);
    scheduleSparkle();
  }, delay);
}
```

A **self-scheduling function** — it calls itself again at the very end,
forever, which is the standard pattern for "something that should keep
happening at random (not perfectly regular) intervals." Each cycle: wait
a random 2.6–5.2s, spawn one sparkle, have a 40% chance of sneaking in a
second one shortly after, then queue up the next round. `spawnDragTrail`
(8.4's companion) uses the exact same "create → position randomly →
append → clean up later" shape as the impact effects above, just with a
much shorter lifetime and following the pointer instead of a fixed point.

### 8.7 Special-day detection

```js
function detectOccasion(now, start){
  var m = now.getMonth(), d = now.getDate();
  if (m === 1 && d === 14) return 'valentine';
  if (m === 9 && d === 31) return 'halloween';
  if ((m === 0 && d === 1) || (m === 11 && d === 31)) return 'newYear';
  if (m === 1 && d === 7) return 'tessaBirthday';
  if (m === 11 && d === 12) return 'uncertaintyBirthday';
  if (m === start.getMonth() && d === start.getDate() && now.getFullYear() > start.getFullYear()) return 'anniversary';
  var half = halfAnniversaryDate(start);
  if (m === half.getMonth() && d === half.getDate()) return 'halfAnniversary';
  return null;
}
```

A straightforward chain of `if` checks, each comparing month (remember:
0 = January!) and day-of-month, returning that occasion's name the
moment one matches, or `null` if none do. New Year's checks *two* dates
at once with `||` ("or") so both Dec 31 and Jan 1 count. The anniversary
check *also* requires the current year to be later than the start year —
otherwise the very first day of the relationship would immediately,
incorrectly, count as an anniversary too. `halfAnniversaryDate` works out
"6 months after the start date" — JavaScript's `Date` constructor
automatically carries a month number past 11 into the following year, so
this doesn't need any special handling for that.

### 8.8 Applying an occasion (and the preview toggle)

```js
var previewOverride; // undefined = follow the real date; null = force "no occasion"; a key = force that occasion

function applyOccasion(now, start){
  var key = (previewOverride !== undefined) ? previewOverride : detectOccasion(now, start);
  if (key === currentOccasion) return;
  currentOccasion = key;

  if (key){
    var cfg = occasionConfig[key];
    document.body.setAttribute('data-occasion', key);
    occasionBanner.innerHTML = '<span class="banner-icon">' + Icons[cfg.icon] + '</span><span>' + label + '</span>...';
    occasionBanner.classList.add('show');
    if (!prefersReducedMotion){ startAmbient(cfg.icons); celebrateBurst(cfg.icons); }
  } else {
    document.body.removeAttribute('data-occasion');
    occasionBanner.classList.remove('show');
    stopAmbient();
  }

  if (window.Scenery) Scenery.setScene(key);
}
```

`if (key === currentOccasion) return;` matters a lot: without it, since
this function gets called once every minute (below), it would keep
re-triggering the celebration burst and restarting the falling icons over
and over, all day, instead of only once when the day *begins*.
`document.body.setAttribute('data-occasion', key)` is what flips the CSS
theme (Part 4.12) on; `Scenery.setScene(key)` — called *after* that
attribute is set — is what repaints the background *and* rebuilds the
foreground objects to match (it internally calls `SceneInteractive.setup`,
see Part 6.7 and Part 7.9), which is why the ordering here matters.

```js
var PREVIEW_LABELS = [ ['__live__', 'Today (live)'], ['', 'Default'], ['valentine', "Valentine's Day"], ... ];
PREVIEW_LABELS.forEach(function(entry){
  var btn = document.createElement('button');
  btn.setAttribute('data-preview', entry[0]);
  btn.textContent = entry[1];
  scenePanel.appendChild(btn);
});

scenePanel.addEventListener('click', function(e){
  var btn = e.target.closest ? e.target.closest('button[data-preview]') : null;
  if (!btn) return;
  var val = btn.getAttribute('data-preview');
  previewOverride = (val === '__live__') ? undefined : (val === '' ? null : val);
  ...
  currentOccasion = undefined; // force applyOccasion to re-evaluate even if the key repeats
  applyOccasion(new Date(), startDate);
});
```

This is the preview toggle from Part 3.2/4.10. The buttons are built in
JavaScript from one small list (`PREVIEW_LABELS`) rather than typed out
by hand in the HTML, so the toggle and the actual `occasionConfig` never
drift out of sync. One click handler is attached to the whole panel
(`scenePanel`, not each individual button) — this is called **event
delegation**: since every click inside the panel bubbles up to it
(the same bubbling idea explained in Part 1 and used much more heavily in
Part 7.0), `e.target.closest('button[data-preview]')` finds the actual
button that was clicked (even if the click technically landed on an icon
*inside* it) without needing a separate listener per button. Setting
`previewOverride` and forcing `currentOccasion = undefined` (so the
"already showing this" guard above doesn't block the re-application) is
what lets clicking through several occasions in a row always take effect
immediately.

### 8.9 Keeping it all correct over time

```js
function refreshAll(){
  updateCounter();
  applyOccasion(new Date(), startDate);
}
refreshAll();
setInterval(refreshAll, 60000);
```

`refreshAll()` runs once immediately, so the page shows correct
information the instant it loads rather than a blank/zero state for a
moment; `setInterval(refreshAll, 60000)` calls it again every 60 seconds,
forever, for as long as the page stays open. That's why the counter stays
accurate across midnight, and why a special-day theme switches itself on
automatically at midnight with no page refresh required.

### 8.10 Love letters: one modal, reused for both

```js
var loveListHeartPath = 'M12 21S2.4 15.6 2.4 8.8C2.4 5.4 5 3 8.1 3c1.9 0 3.5 1 4.4 2.5A5.2 5.2 0 0 1 16.9 3c3.1 0 5.6 2.4 5.6 5.8 0 6.8-9.6 12.2-9.6 12.2z';
var SVG_NS = 'http://www.w3.org/2000/svg';

function populateLoveList(listId, reasons){
  var list = document.getElementById(listId);
  if (!list || !reasons) return;
  reasons.forEach(function(reason){
    var li = document.createElement('li');
    var svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    var path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', loveListHeartPath);
    path.setAttribute('fill', 'currentColor');
    svg.appendChild(path);
    var span = document.createElement('span');
    span.textContent = reason;
    li.appendChild(svg);
    li.appendChild(span);
    list.appendChild(li);
  });
}

if (window.LettersContent){
  populateLoveList('loveListTessa', LettersContent.tessa && LettersContent.tessa.reasons);
  populateLoveList('loveListUncertainty', LettersContent.uncertainty && LettersContent.uncertainty.reasons);
}
```

This runs once, as soon as `js/letters-content.js` (Part 3.3) has loaded
(its `<script>` tag comes before this file's, so `window.LettersContent`
already exists by the time this line runs). For each reason string, it
builds the exact same `<li><svg>...</svg><span>text</span></li>` shape
the old hand-typed HTML used — `document.createElementNS` is needed
instead of the normal `document.createElement` specifically for the
`<svg>` and `<path>` tags, because SVG elements belong to a different XML
namespace than regular HTML elements; creating them the normal way would
produce a dead, unstyled element that never actually renders as a shape.
`span.textContent = reason` (rather than `.innerHTML`) is what makes this
safe against anything unusual in the text itself — an apostrophe, an
emoji, even a stray `<` character — since `.textContent` always treats
its input as plain text, never as HTML to be parsed.

```js
function openLetter(personKey){
  var data = window.LettersContent && window.LettersContent[personKey];
  if (!data || !letterModal) return;
  letterModalBody.innerHTML = '';
  data.letterParagraphs.forEach(function(paragraph){
    var p = document.createElement('p');
    p.textContent = paragraph;
    letterModalBody.appendChild(p);
  });
  letterModalTitle.textContent = data.letterTitle;
  letterModal.classList.add('show');
  letterModal.setAttribute('aria-hidden', 'false');
  document.addEventListener('keydown', onLetterKeydown);
  letterCloseBtn.focus();
}

function closeLetter(){
  letterModal.classList.remove('show');
  letterModal.setAttribute('aria-hidden', 'true');
  document.removeEventListener('keydown', onLetterKeydown);
  letterOpenerEl.focus();
}
```

`personKey` is `'tessa'` or `'uncertainty'`; `window.LettersContent[personKey]`
looks that person up directly in the data object from `js/letters-content.js`.
One `<p>` element is built per string in `letterParagraphs` and appended
into `#letterModalBody` — again using `.textContent`, for the same reason
as above (Tessa's letter, for instance, signs off with a literal `<3`,
which would otherwise risk being misread as the start of an HTML tag).
Clearing `letterModalBody.innerHTML` first means opening a second letter
after the first cleanly replaces its content rather than appending
underneath it.

Moving focus to the close button when the letter opens, and back to
whichever envelope opened it when it closes, is a small but important
accessibility habit for anything that behaves like a modal dialog —
keyboard and screen-reader users need to land somewhere sensible in both
directions, not stay wherever focus happened to be before.

```js
Array.prototype.forEach.call(document.querySelectorAll('.envelope-btn[data-person]'), function(btn){
  btn.addEventListener('click', function(e){
    e.stopPropagation();
    letterOpenerEl = btn;
    openLetter(btn.getAttribute('data-person'));
  });
});
```

One listener is attached to *every* envelope button found on the page
(there happen to be two, but this code doesn't need to know that — it
would work identically with one, or five). Each button's own
`data-person` attribute (Part 3.3) tells `openLetter` which key to look
up — the same data-attributes-instead-of-hardcoded-logic idea used for
the preview toggle buttons in 8.8. `e.stopPropagation()` here matters:
without it, this click would also bubble up to the document-wide "click
anywhere" listener from Part 8.5 and trigger a heart burst at the same
spot, which isn't what opening a letter should also do.

```js
if (letterBackdrop) letterBackdrop.addEventListener('click', closeLetter);
if (letterCloseBtn) letterCloseBtn.addEventListener('click', closeLetter);
```

```js
function onLetterKeydown(e){
  if (e.key === 'Escape') closeLetter();
}
```

Three separate ways to close the same modal — clicking the dimmed
backdrop behind it, clicking its own close button, or pressing Escape —
all converging on the one `closeLetter()` function, which is a good
pattern any time there's more than one legitimate way for a user to
express "I'm done with this."

---

<a id="part-9"></a>
## Part 9 — Making it yours

Small, low-risk edits to try once you're comfortable reading the files
above. Keep a backup before editing, just in case.

- **Change the start date** — `js/script.js`:
  ```js
  var startDate = new Date('2026-03-07T00:00:00');
  ```
  Keep the exact `'YYYY-MM-DDT00:00:00'` format.

- **Write your own love letters** — `js/letters-content.js`, inside
  `tessa.letterParagraphs` and `uncertainty.letterParagraphs` — each entry
  in the list becomes one paragraph. Add as many as you like; the letter
  scrolls internally if it runs long (Part 4.11). `letterTitle` on the
  same object is the heading shown at the top of the peek.

- **Edit the "why I love you" reasons** — `js/letters-content.js`, inside
  `tessa.reasons` and `uncertainty.reasons` — each string in the list
  becomes one bullet, safe to rewrite freely, add to, or remove. The list
  scrolls on its own if it gets long (Part 4.11). You never need to touch
  `index.html` for either of these — see Part 3.3.

- **Change a birthday's date** — `js/script.js`, inside `detectOccasion`:
  ```js
  if (m === 1 && d === 7) return 'tessaBirthday';   // month is 0-indexed! 1 = February
  ```

- **Add a brand new special day** — a few small additions, across three
  files:
  1. `js/script.js` → add a line to `detectOccasion` returning a new key.
  2. `js/script.js` → add a matching entry to `occasionConfig` (icons,
     label, banner icon) and to `PREVIEW_LABELS` (so it shows up in the
     toggle).
  3. `css/style.css` → optionally add a `body[data-occasion="yourKey"]{...}`
     color block (Part 4.12), copying an existing one as a template.
  4. `js/scenery.js` → optionally add an entry to `SCENES` (Part 6.7)
     picking an existing `feature`/`particle`/`extras`, or write new
     drawing functions for something entirely new.
  5. `js/interactive-objects.js` → optionally add an `else if
     (sceneKey === 'yourKey'){ ... }` branch to `setup()` (Part 7.9) if
     you want a new huggable/throwable object for that day too.

- **Add a new huggable/throwable object** — in `js/interactive-objects.js`:
  add it with `objects.push(makeThrowable('yourKind', x, y, radius, groundOffset, { grabRadius: ... }))`
  inside `setup()` (Part 7.9), then add an `else if (o.kind === 'yourKind')`
  branch to `draw()` with your own drawing code (Parts 7.1 and the
  drawing functions right above `draw()` are good templates to copy from)
  — the physics, dragging, throwing, and settling all come for free from
  the shared engine in Part 7.1.

- **Change a color** — almost everything traces back to the handful of
  `:root` variables in `css/style.css` (Part 4.2); change `--rose` or
  `--wine` there and reload to see how far the ripple reaches. To change
  one *occasion's* palette instead, edit that occasion's
  `body[data-occasion="..."]{...}` block.

- **Speed up or slow down an animation** — search for the relevant
  `animation:` or `transition:` line in `css/style.css` and change the
  time value (e.g. `1.9s`, `1.8s`).

After any edit, save and reload the page in your browser. If something
looks broken, undo the last change and try again — a single missing
bracket can silently stop a whole section from working, so it's easiest
to change one small thing at a time and check it before moving on.

---

<a id="part-10"></a>
## Part 10 — Glossary (alphabetical)

| Term | Meaning |
|---|---|
| animation-delay | How long to wait before a CSS animation starts. |
| animation-duration | How long one full cycle of a CSS animation takes. |
| attribute | Extra info inside a tag, like `class="..."` or `id="..."`. |
| bezier curve | A curve defined by a start point, end point, and "control points" that shape it without being touched by it. |
| calc() | Lets CSS do math, e.g. `calc(-50% + 10px)`. |
| canvas | An HTML element JavaScript can draw directly onto, pixel by pixel/shape by shape. |
| class | A reusable label on an element for styling/scripting. |
| clamp (in code) | Force a number to stay within a minimum and maximum, e.g. `Math.max(min, Math.min(max, v))`. |
| CSS | The language that controls a page's appearance. |
| CSS variable | A named, reusable value: `--name: value;`, used as `var(--name)`. |
| DOM | The live, in-browser version of the HTML that JS can read and change. |
| element | A single piece of HTML content, like `<button>` or `<p>`. |
| event bubbling | After an event fires on its exact target, it fires again on every ancestor up to `window`, unless stopped. |
| event delegation | Listening for an event on a parent element instead of every individual child, and figuring out which child was involved from the event itself. |
| event listener | JS code that waits for something to happen, then reacts. |
| function | A named, reusable block of instructions. |
| gradient | A smooth blend between two or more colors. |
| gravity (in this code) | A constant added to an object's downward velocity every frame, simulating being pulled toward the ground. |
| HTML | The language that defines a page's content/structure. |
| id | A unique label on one specific element. |
| JavaScript (JS) | The language that makes a page interactive/dynamic. |
| keyframes (`@keyframes`) | A CSS animation described as checkpoints over time. |
| loop (`for`) | Code that repeats itself a set number of times. |
| object (in JS) | A bundle of named, related values grouped together. |
| pendulum | Something swinging from a fixed point; its swing angle is pulled back toward hanging straight down by gravity. |
| pointer events | Modern JS events covering mouse, touch, and stylus input at once. |
| `pointer-events:none` (CSS) | Makes an element invisible to clicks/taps — they pass straight through to whatever's beneath it. |
| radians | The unit Canvas/JS angle math uses instead of degrees (a full circle is `2 * Math.PI`). |
| recursion | A function that calls itself, typically to build something with repeating, self-similar structure (like a tree's branches). |
| selector | A CSS pattern describing which elements to style. |
| stacking context / z-index | How the browser decides which overlapping element is drawn on top of which. |
| SVG | Drawings made of math-based shapes instead of pixels. |
| transform | A CSS property for moving/rotating/resizing an element. |
| transition | CSS's "animate smoothly whenever this value changes" tool. |
| variable (in JS) | A named box holding a value you can use/change later. |
| velocity | Speed *and* direction — in this code, usually two numbers, `vx` and `vy`, for horizontal and vertical speed. |

---

Take your time — nobody understands a whole codebase on the first read. A
good way to build confidence is to open `index.html` in a browser, then
tweak one small number at a time (an animation duration, a color, a
particle count) and reload to see exactly what changed. That kind of
"poke it and see" experimenting is genuinely how most people learn to
read code fluently.
