# Days Together 💕

A little single-page site that counts the days since a date that matters,
under a hand-drawn cherry tree that changes with the seasons — literally.
No frameworks, no build step, no images: everything you see, including
the tree, is drawn live with CSS and JavaScript.

Built as a personal gift with [Claude Code](https://claude.com/claude-code).

## Features

- **A living background** — a procedurally-grown cherry tree with drifting
  blossom petals by default, redrawn as a harp, a DNA helix, a snow-dusted
  bare tree, or other scenes depending on the day (see below).
- **A draggable, winged, pulsing heart** — pick it up and fling it anywhere
  on screen; it flaps hard while held and glides back home when you let go,
  leaving a little trail of sparks behind it.
- **A heart-shaped "impact" on click** — click (or tap) anywhere for a
  heart-shaped shockwave, cracked fracture lines, flying debris, and a
  burst of small hearts (or themed icons, on a special day).
- **Things you can actually pick up and throw** — a big heart on the
  default page (tap it for a burst of hearts, or hold and throw it), the
  three snowballs that make up the New Year's snowman, a jack-o'-lantern
  that swings and spins on its hook, birthday cakes, Valentine's
  chocolate, and the paper lanterns drifting on your anniversary — all
  with real gravity, bounce, and momentum. Candles light and extinguish
  on click, and fireflies glow into a halo as your cursor or finger gets
  close.
- **Love letters** — an envelope button in each "why I love you" panel's
  header opens a centered, scrollable letter to the other person.
- **Special-day dress-up** — Valentine's Day, your anniversary and
  half-anniversary, two birthdays, Halloween, and New Year's each get
  their own color palette, display font, and background scene.
- **A preview toggle** — hover the small sparkle in the top-right corner
  to preview any of those special days without changing your system clock.
- **Every icon is hand-drawn** — no emoji anywhere; every heart, rose,
  balloon, pumpkin, snowflake, and firework is a small inline SVG (see
  `js/icons.js`), so the look stays consistent across every device and OS.
- Respects `prefers-reduced-motion`, and the day count/date always render
  in English regardless of the visitor's browser language.

## Project structure

```
days-together/
├── index.html                 the page itself
├── css/
│   └── style.css              all styling, animations, and per-day themes
├── js/
│   ├── icons.js                 the hand-drawn SVG icon library
│   ├── scenery.js                the background canvas (tree/harp/helix/particles)
│   ├── interactive-objects.js    the huggable/throwable foreground objects and their physics
│   ├── letters-content.js        just the words — the love letters and "why I love you" reasons
│   └── script.js                  the day counter, drag physics, click effects, special-day logic, letters
├── CODE_WALKTHROUGH.md         a line-by-line explanation of every file, written for beginners
├── LICENSE                     Unlicense (public domain)
└── README.md                   this file
```

## Running it

There's no build step. Either:

- Open `index.html` directly in a browser, or
- Serve the folder with any static file server (e.g. `python -m http.server`
  from this folder) and visit it — this also works out of the box with
  **GitHub Pages** (enable Pages on this repo, pointing at the root of the
  `main` branch).

## Making it yours

Open `js/script.js` and edit the one line near the top:

```js
var startDate = new Date('2026-03-07T00:00:00');
```

That's the only thing you *need* to change. A few other easy, common edits:

- **The love letters and "why I love you" reasons** — both live in
  `js/letters-content.js`, one plain data file with nothing but the words:
  `tessa`/`uncertainty` each have a `reasons` list and a `letterTitle` +
  `letterParagraphs` list. Edit the strings there; `index.html` and the
  other scripts never need to change. The letter panel and reasons list
  both scroll on their own if you write a lot.
- **Birthdays, colors, fonts, the background art, or adding a whole new
  huggable object** — `CODE_WALKTHROUGH.md` explains exactly where
  everything lives and how it works, in plain language, even if you've
  never written code before.

## License

Public domain — see [LICENSE](LICENSE). Do whatever you'd like with it.
