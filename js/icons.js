/*
  icons.js — a tiny library of hand-drawn vector icons.

  Every "little flying thing" on this page (hearts, roses, balloons,
  pumpkins, bats, snowflakes, fireworks...) is drawn here as a small
  inline SVG shape — no emoji, no image files. Each icon uses
  `currentColor` for its main fill/stroke, so whatever CSS `color` is
  set on the element wrapping it "tints" the icon at the moment it's
  created (see spawnBurstParticles / spawnAmbientParticle in script.js).

  Each icon is sized with width="1em" height="1em", so it automatically
  matches whatever font-size is set on its wrapping element — that's
  the trick that lets these drop into the existing particle system
  (which already sizes particles via el.style.fontSize) with no other
  code changes needed.
*/
(function(){
  'use strict';

  function svg(inner, viewBox){
    return '<svg viewBox="' + (viewBox || '0 0 24 24') + '" width="1em" height="1em" ' +
           'style="display:block;overflow:visible" aria-hidden="true">' + inner + '</svg>';
  }

  var Icons = {

    heartSolid: svg(
      '<path d="M12 21S2.4 15.6 2.4 8.8C2.4 5.4 5 3 8.1 3c1.9 0 3.5 1 4.4 2.5A5.2 5.2 0 0 1 16.9 3' +
      'c3.1 0 5.6 2.4 5.6 5.8 0 6.8-9.6 12.2-9.6 12.2z" fill="currentColor"/>' +
      '<path d="M7.5 8.2c1-1.4 2.6-1.7 2.6-1.7" stroke="rgba(255,255,255,.55)" stroke-width="1.1" ' +
      'fill="none" stroke-linecap="round"/>'
    ),

    heartOutline: svg(
      '<path d="M12 21S2.4 15.6 2.4 8.8C2.4 5.4 5 3 8.1 3c1.9 0 3.5 1 4.4 2.5A5.2 5.2 0 0 1 16.9 3' +
      'c3.1 0 5.6 2.4 5.6 5.8 0 6.8-9.6 12.2-9.6 12.2z" fill="none" stroke="currentColor" stroke-width="1.5"/>'
    ),

    rose: svg(
      '<path d="M12 3.2c-2.3 0-3.9 1.7-3.9 3.7 0 2.8 3.9 4.5 3.9 4.5s3.9-1.7 3.9-4.5c0-2-1.6-3.7-3.9-3.7z" fill="currentColor"/>' +
      '<path d="M12 5.6c-1.1 0-1.9.9-1.9 1.9 0 1.4 1.9 2.4 1.9 2.4s1.9-1 1.9-2.4c0-1-.8-1.9-1.9-1.9z" fill="rgba(255,255,255,.4)"/>' +
      '<path d="M12 11.2v9.6" stroke="currentColor" stroke-width="1.3" fill="none" stroke-linecap="round"/>' +
      '<path d="M12 15.4c0-1.5 1.7-2.1 2.8-1.3" stroke="currentColor" stroke-width="1.1" fill="none" stroke-linecap="round"/>'
    ),

    envelope: svg(
      '<rect x="3" y="6" width="18" height="13" rx="2.2" fill="none" stroke="currentColor" stroke-width="1.4"/>' +
      '<path d="M4 7.2l8 6.3 8-6.3" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M12 12.8c-1 .9-1 2.5 0 3.3 1-.8 1-2.4 0-3.3z" fill="currentColor"/>'
    ),

    balloon: svg(
      '<path d="M12 3c-3.6 0-6.1 2.9-6.1 6.5 0 3.9 3.6 6.7 5 7.6l-.6 1.5h3.4l-.6-1.5c1.4-.9 5-3.7 5-7.6C18.7 5.9 15.6 3 12 3z" fill="currentColor"/>' +
      '<path d="M12 18.6c1.7.5 1.3 2.4-.3 2.3" stroke="currentColor" stroke-width="1" fill="none" stroke-linecap="round"/>'
    ),

    confetti: svg(
      '<rect x="9" y="2.5" width="5.5" height="9.5" rx="1.8" transform="rotate(20 12 7)" fill="currentColor"/>' +
      '<circle cx="6.5" cy="17.5" r="1.9" fill="currentColor" opacity=".85"/>' +
      '<rect x="14.5" y="14.5" width="5" height="2.6" rx="1.2" transform="rotate(-18 17 16)" fill="currentColor" opacity=".85"/>'
    ),

    sparkleStar: svg(
      '<path d="M12 2c.7 4.6 2.2 7.1 6.3 8.4-4.1 1.3-5.6 3.8-6.3 8.4-.7-4.6-2.2-7.1-6.3-8.4C9.8 9.1 11.3 6.6 12 2z" fill="currentColor"/>'
    ),

    diamond: svg('<path d="M12 2 20.5 12 12 22 3.5 12Z" fill="currentColor"/>'),

    dot: svg('<circle cx="12" cy="12" r="6.4" fill="currentColor"/>'),

    pumpkin: svg(
      '<path d="M11.2 4.6c.1-1.3 1.6-2.1 1.9-.7" stroke="currentColor" stroke-width="1.2" fill="none" stroke-linecap="round"/>' +
      '<ellipse cx="12" cy="14.5" rx="8.2" ry="6.6" fill="currentColor"/>' +
      '<path d="M8 8.6c-1.2 2.2-1.2 11.4 0 13.6M12 8.1c-.6 2.2-.6 12 0 14M16 8.6c1.2 2.2 1.2 11.4 0 13.6" ' +
      'stroke="rgba(0,0,0,.2)" stroke-width="1" fill="none"/>'
    ),

    bat: svg(
      '<path d="M12 9.5c-1.7-2.8-5.3-4.3-8.9-2.5 1.7.2 3 1.2 3.6 2.1-2.1-.4-4.2.4-5.3 2.3 1.9-.6 3.4-.3 4.2.5' +
      '-1.5.4-2.5 1.7-2.7 3.2 1.7-1.3 3.2-1.5 4.2-1 .5 1.1 2 1.7 3.9 1.2' +
      'M12 9.5c1.7-2.8 5.3-4.3 8.9-2.5-1.7.2-3 1.2-3.6 2.1 2.1-.4 4.2.4 5.3 2.3-1.9-.6-3.4-.3-4.2.5' +
      '1.5.4 2.5 1.7 2.7 3.2-1.7-1.3-3.2-1.5-4.2-1-.5 1.1-2 1.7-3.9 1.2" fill="currentColor"/>' +
      '<circle cx="12" cy="10" r="1.3" fill="currentColor"/>'
    ),

    ghost: svg(
      '<path d="M12 3c-4.6 0-7.4 3.3-7.4 7.5V21l2.3-1.9 2.1 1.9 2.1-1.9 1.9 1.9 2.1-1.9 2.1 1.9 2.2-1.9V10.5C19.4 6.3 16.6 3 12 3z" fill="currentColor"/>' +
      '<circle cx="9.3" cy="10.6" r="1.15" fill="rgba(0,0,0,.4)"/>' +
      '<circle cx="14.7" cy="10.6" r="1.15" fill="rgba(0,0,0,.4)"/>'
    ),

    firework: svg(
      '<g stroke="currentColor" stroke-width="1.4" stroke-linecap="round">' +
      '<path d="M12 12V3M12 12l7.8-4.5M12 12l7.8 4.5M12 12V21M12 12l-7.8 4.5M12 12L4.2 7.5"/>' +
      '</g>' +
      '<g fill="currentColor">' +
      '<circle cx="12" cy="3" r="1.1"/><circle cx="19.8" cy="7.5" r="1.1"/><circle cx="19.8" cy="16.5" r="1.1"/>' +
      '<circle cx="12" cy="21" r="1.1"/><circle cx="4.2" cy="16.5" r="1.1"/><circle cx="4.2" cy="7.5" r="1.1"/>' +
      '</g>'
    ),

    musicNote: svg(
      '<ellipse cx="8.6" cy="18" rx="2.7" ry="2.1" transform="rotate(-15 8.6 18)" fill="currentColor"/>' +
      '<path d="M11.2 18V5l6-2v3.4l-4.2 1.5" stroke="currentColor" stroke-width="1.4" fill="none" ' +
      'stroke-linecap="round" stroke-linejoin="round"/>'
    ),

    dna: svg(
      '<path d="M7 3c0 5 10 4 10 9s-10 4-10 9" stroke="currentColor" stroke-width="1.3" fill="none" stroke-linecap="round"/>' +
      '<path d="M17 3c0 5-10 4-10 9s10 4 10 9" stroke="currentColor" stroke-width="1.3" fill="none" stroke-linecap="round"/>' +
      '<path d="M8.2 6.6h7.6M7.5 12h9M8.2 17.4h7.6" stroke="currentColor" stroke-width="1" opacity=".55"/>'
    ),

    leaf: svg(
      '<path d="M19.2 4.8C10 4.8 4.8 10 4.8 19.2c9.2 0 14.4-5.2 14.4-14.4z" fill="currentColor"/>' +
      '<path d="M6.3 17.7c5-5 8-8 12-12" stroke="rgba(0,0,0,.18)" stroke-width="1" fill="none" stroke-linecap="round"/>'
    ),

    candleFlame: svg(
      '<path d="M12 2c1.8 2.9 3.6 5.4 3.6 8.4a3.6 3.6 0 1 1-7.2 0c0-1.7.8-3.1 1.6-4.3C10.6 7 11.6 5.4 12 2z" fill="currentColor"/>'
    ),

    snowflake: svg(
      '<g stroke="currentColor" stroke-width="1.3" stroke-linecap="round">' +
      '<path d="M12 2v20M2.7 7.5l18.6 9M21.3 7.5l-18.6 9"/>' +
      '<path d="M12 5l-1.8 1.6M12 5l1.8 1.6M12 19l-1.8-1.6M12 19l1.8-1.6"/>' +
      '<path d="M4.4 8.6l1 2.3M4.4 8.6l2.4-.5M19.6 15.4l-1-2.3M19.6 15.4l-2.4.5"/>' +
      '<path d="M19.6 8.6l-1 2.3M19.6 8.6l-2.4-.5M4.4 15.4l1-2.3M4.4 15.4l2.4.5"/>' +
      '</g>'
    ),

    sun: svg(
      '<circle cx="12" cy="12" r="4.6" fill="currentColor"/>' +
      '<g stroke="currentColor" stroke-width="1.4" stroke-linecap="round">' +
      '<path d="M12 2.5v2.6M12 18.9v2.6M21.5 12h-2.6M5.1 12H2.5"/>' +
      '<path d="M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8M18.4 18.4l-1.8-1.8M7.4 7.4L5.6 5.6"/>' +
      '</g>'
    )
  };

  window.Icons = Icons;
})();
