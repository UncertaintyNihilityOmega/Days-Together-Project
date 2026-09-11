/*
  script.js — the day counter, the draggable heart, the click effects,
  the special-day system, and the love letters. See CODE_WALKTHROUGH.md
  for a full beginner-friendly explanation of everything in this file.
*/

// ↓↓↓ EDIT THIS — the day you got together (YYYY-MM-DD) ↓↓↓
var startDate = new Date('2026-03-07T00:00:00');
// ↑↑↑ EDIT THIS ↑↑↑

// Always renders as English — "since <Month name> <day>, <year>" —
// month names are hard-coded so the visitor's browser language/locale
// can never swap them for another language.
var MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
function formatSinceDate(date){
  return MONTH_NAMES[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear();
}

function updateCounter(){
  var now = new Date();
  var msPerDay = 86400000;
  var totalDays = Math.max(0, Math.floor((now - startDate) / msPerDay));

  var y = now.getFullYear() - startDate.getFullYear();
  var m = now.getMonth() - startDate.getMonth();
  var d = now.getDate() - startDate.getDate();
  if (d < 0){
    m--;
    var prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    d += prevMonth.getDate();
  }
  if (m < 0){ y--; m += 12; }
  if (y < 0){ y = 0; m = 0; d = 0; }

  document.getElementById('dayCount').textContent = totalDays.toLocaleString('en-US');

  var parts = [];
  if (y > 0) parts.push(y + (y === 1 ? ' year' : ' years'));
  if (m > 0) parts.push(m + (m === 1 ? ' month' : ' months'));
  parts.push(d + (d === 1 ? ' day' : ' days'));
  document.getElementById('breakdown').textContent = "That's " + parts.join(', ');

  document.getElementById('sinceLine').textContent = 'since ' + formatSinceDate(startDate);
}

var prefersReducedMotion = window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- The background scene (see js/scenery.js) ----------
var bgCanvas = document.getElementById('bgScenery');
if (bgCanvas && window.Scenery){
  Scenery.init(bgCanvas);
  Scenery.setReducedMotion(prefersReducedMotion);
}

// ---------- The huggable/throwable scene objects (see js/interactive-objects.js) ----------
// Drawn on their own canvas, stacked above the card and love panels, so
// a dragged/thrown object is always visible on top of them.
var fgCanvas = document.getElementById('fgInteractive');
if (fgCanvas && window.SceneInteractive){
  SceneInteractive.init(fgCanvas);
}

// ---------- Drag the heart+wings anywhere, leaving a little tail, then glide back ----------
var heartDrag = document.getElementById('heartDrag');
var dragState = null;
var DRAG_THRESHOLD = 6;

heartDrag.addEventListener('pointerdown', function(e){
  if (e.button !== undefined && e.button !== 0) return;
  try { heartDrag.setPointerCapture(e.pointerId); } catch (err){}
  var rect = heartDrag.getBoundingClientRect();
  dragState = {
    startX: e.clientX, startY: e.clientY,
    centerX: rect.left + rect.width / 2,
    centerY: rect.top + rect.height / 2,
    moved: false, pointerId: e.pointerId,
    lastTrailTime: 0
  };
  heartDrag.classList.remove('returning');
  heartDrag.classList.add('dragging');
});

heartDrag.addEventListener('pointermove', function(e){
  if (!dragState || e.pointerId !== dragState.pointerId) return;
  var dx = e.clientX - dragState.startX;
  var dy = e.clientY - dragState.startY;
  if (!dragState.moved && Math.hypot(dx, dy) > DRAG_THRESHOLD){
    dragState.moved = true;
  }
  var tilt = Math.max(-16, Math.min(16, dx * 0.12));
  heartDrag.style.transform = 'translate(' + dx + 'px,' + dy + 'px) rotate(' + tilt + 'deg) scale(1.08)';

  if (dragState.moved && !prefersReducedMotion){
    var t = performance.now();
    if (t - dragState.lastTrailTime > 45){
      dragState.lastTrailTime = t;
      spawnDragTrail(dragState.centerX + dx, dragState.centerY + dy);
    }
  }
});

function spawnDragTrail(x, y){
  var el = document.createElement('span');
  el.className = 'drag-trail';
  el.innerHTML = Math.random() < 0.7 ? Icons.heartSolid : Icons.sparkleStar;
  el.style.color = Math.random() < 0.6 ? 'var(--rose)' : 'var(--gold)';
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  el.style.fontSize = Math.round(9 + Math.random() * 9) + 'px';
  el.style.setProperty('--driftX', Math.round(Math.random() * 16 - 8) + 'px');
  el.style.setProperty('--driftY', Math.round(Math.random() * 10 - 2) + 'px');
  document.body.appendChild(el);
  setTimeout(function(){ if (el.parentNode) el.parentNode.removeChild(el); }, 600);
}

function endDrag(e){
  if (!dragState || (e.pointerId !== undefined && e.pointerId !== dragState.pointerId)) return;
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
heartDrag.addEventListener('pointerup', endDrag);
heartDrag.addEventListener('pointercancel', endDrag);

// little pop on the heart itself for direct taps
var heartGlyph = document.getElementById('heartGlyph');
document.getElementById('heartBtn').addEventListener('click', function(){
  heartGlyph.classList.remove('pop');
  void heartGlyph.offsetWidth;
  heartGlyph.classList.add('pop');
  setTimeout(function(){ heartGlyph.classList.remove('pop'); }, 420);
});

// ---------- Click anywhere: heart-shaped impact + small hearts flying out ----------
var floatLayer = document.getElementById('floatLayer');
var SVG_NS = 'http://www.w3.org/2000/svg';
var HEART_PATH_D = 'M50,88 C22,66 8,47 8,29 C8,15 19,5 32,5 C40,5 47,10 50,19 C53,10 60,5 68,5 C81,5 92,15 92,29 C92,47 78,66 50,88 Z';

function spawnBurstParticles(x, y, count, icons){
  icons = (icons && icons.length) ? icons : ['heartSolid', 'heartOutline'];
  for (var i = 0; i < count; i++){
    var el = document.createElement('span');
    el.className = 'float-heart';
    var iconKey = icons[Math.floor(Math.random() * icons.length)];
    el.innerHTML = Icons[iconKey] || Icons.heartSolid;

    var hue = Math.random();
    el.style.color = hue < 0.45 ? 'var(--rose)' : (hue < 0.8 ? 'var(--wine)' : 'var(--gold)');

    var angle = (Math.PI * 2 * i / count) + (Math.random() * 0.6 - 0.3);
    var dist = 55 + Math.random() * 70;
    var midDist = dist * 0.55;
    var midX = Math.cos(angle) * midDist;
    var midY = Math.sin(angle) * midDist - 10;
    var endX = Math.cos(angle) * dist;
    var endY = Math.sin(angle) * dist + 22;

    var rot0 = Math.round(Math.random() * 40 - 20);
    var rot1 = rot0 + Math.round(Math.random() * 40 - 20);
    var rot2 = rot1 + Math.round(Math.random() * 30 - 15);

    var size = Math.round(12 + Math.random() * 12);
    var dur = 0.9 + Math.random() * 0.7;
    var delay = Math.random() * 0.15;

    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.fontSize = size + 'px';
    el.style.setProperty('--midX', midX.toFixed(1) + 'px');
    el.style.setProperty('--midY', midY.toFixed(1) + 'px');
    el.style.setProperty('--endX', endX.toFixed(1) + 'px');
    el.style.setProperty('--endY', endY.toFixed(1) + 'px');
    el.style.setProperty('--rot0', rot0 + 'deg');
    el.style.setProperty('--rot1', rot1 + 'deg');
    el.style.setProperty('--rot2', rot2 + 'deg');
    el.style.animationDuration = dur + 's';
    el.style.animationDelay = delay + 's';

    floatLayer.appendChild(el);

    (function(node, totalMs){
      setTimeout(function(){
        if (node.parentNode) node.parentNode.removeChild(node);
      }, totalMs);
    })(el, (dur + delay) * 1000 + 60);
  }
}

function spawnImpactFlash(x, y){
  var svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.classList.add('impact-flash');
  var size = 88;
  svg.style.left = x + 'px'; svg.style.top = y + 'px';
  svg.style.width = size + 'px'; svg.style.height = size + 'px';
  var p = document.createElementNS(SVG_NS, 'path');
  p.setAttribute('d', HEART_PATH_D);
  p.setAttribute('fill', 'url(#impactFlashGrad)');
  svg.appendChild(p);
  floatLayer.appendChild(svg);
  setTimeout(function(){ if (svg.parentNode) svg.parentNode.removeChild(svg); }, 450);
}

function spawnImpactRing(x, y){
  var svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.classList.add('impact-ring');
  var size = 66 + Math.random() * 18;
  svg.style.left = x + 'px'; svg.style.top = y + 'px';
  svg.style.width = size + 'px'; svg.style.height = size + 'px';
  svg.style.setProperty('--rot', Math.round(Math.random() * 24 - 12) + 'deg');
  var p = document.createElementNS(SVG_NS, 'path');
  p.setAttribute('d', HEART_PATH_D);
  svg.appendChild(p);
  floatLayer.appendChild(svg);
  setTimeout(function(){ if (svg.parentNode) svg.parentNode.removeChild(svg); }, 830);
}

function spawnImpactFractures(x, y, count){
  var svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '-45 -45 90 90');
  svg.classList.add('impact-fracture');
  var size = 90;
  svg.style.left = x + 'px'; svg.style.top = y + 'px';
  svg.style.width = size + 'px'; svg.style.height = size + 'px';

  for (var i = 0; i < count; i++){
    var angle = (Math.PI * 2 * i / count) + (Math.random() * 0.5 - 0.25);
    var len = 20 + Math.random() * 28;
    var bend = angle + (Math.random() * 0.6 - 0.3);
    var midLen = len * 0.45;
    var x1 = Math.cos(bend) * midLen, y1 = Math.sin(bend) * midLen;
    var x2 = Math.cos(angle) * len, y2 = Math.sin(angle) * len;
    var p = document.createElementNS(SVG_NS, 'path');
    p.setAttribute('d', 'M0,0 L' + x1.toFixed(1) + ',' + y1.toFixed(1) + ' L' + x2.toFixed(1) + ',' + y2.toFixed(1));
    svg.appendChild(p);
  }

  floatLayer.appendChild(svg);
  requestAnimationFrame(function(){ svg.classList.add('show'); });
  setTimeout(function(){ if (svg.parentNode) svg.parentNode.removeChild(svg); }, 700);
}

function spawnImpactDebris(x, y, count){
  var shapeIcons = ['diamond', 'sparkleStar', 'dot'];
  for (var i = 0; i < count; i++){
    var el = document.createElement('span');
    el.className = 'impact-debris';
    el.innerHTML = Icons[shapeIcons[Math.floor(Math.random() * shapeIcons.length)]];
    el.style.color = Math.random() < 0.5 ? 'var(--crater)' : 'var(--gold)';

    var angle = Math.random() * Math.PI * 2;
    var dist = 28 + Math.random() * 52;
    var endX = Math.cos(angle) * dist;
    var endY = Math.sin(angle) * dist - 6;
    var endY2 = endY + 24 + Math.random() * 16;

    var rot0 = Math.round(Math.random() * 60 - 30);
    var rot1 = rot0 + Math.round(Math.random() * 180 - 90);
    var rot2 = rot1 + Math.round(Math.random() * 120 - 60);

    var size = Math.round(7 + Math.random() * 7);
    var dur = 0.5 + Math.random() * 0.35;

    el.style.left = x + 'px'; el.style.top = y + 'px';
    el.style.fontSize = size + 'px';
    el.style.setProperty('--endX', endX.toFixed(1) + 'px');
    el.style.setProperty('--endY', endY.toFixed(1) + 'px');
    el.style.setProperty('--endY2', endY2.toFixed(1) + 'px');
    el.style.setProperty('--rot0', rot0 + 'deg');
    el.style.setProperty('--rot1', rot1 + 'deg');
    el.style.setProperty('--rot2', rot2 + 'deg');
    el.style.animationDuration = dur + 's';

    floatLayer.appendChild(el);
    (function(node, ms){
      setTimeout(function(){ if (node.parentNode) node.parentNode.removeChild(node); }, ms);
    })(el, dur * 1000 + 80);
  }
}

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

document.addEventListener('click', function(e){
  if (heartDrag.contains(e.target)) return; // heartDrag's own pointerup handles taps on the heart
  if (window.SceneInteractive && SceneInteractive.wasInteracted()) return; // a scene object was just grabbed/thrown/toggled instead
  triggerHeartClickEffect(e.clientX, e.clientY);
});

// tapping (not dragging) the big heart on the default page sends a much
// bigger burst of hearts flying — see interactive-objects.js's endDrag()
window.triggerBigHeartBurst = function(x, y){
  if (prefersReducedMotion) return;
  spawnHeartImpact(x, y);
  spawnBurstParticles(x, y, 26 + Math.floor(Math.random() * 10), ['heartSolid', 'heartOutline']);
};

// ---------- Occasional sparkle twinkles near the heart ----------
var heartStage = document.getElementById('heartStage');

function spawnSparkle(){
  var rect = heartStage.getBoundingClientRect();
  var el = document.createElement('span');
  el.className = 'sparkle';
  el.innerHTML = Icons.sparkleStar;
  el.style.left = (rect.width / 2 + (Math.random() * 70 - 35)) + 'px';
  el.style.top = (rect.height / 2 + (Math.random() * 50 - 25)) + 'px';
  el.style.fontSize = (8 + Math.random() * 8) + 'px';
  heartStage.appendChild(el);
  setTimeout(function(){ if (el.parentNode) el.parentNode.removeChild(el); }, 900);
}

function scheduleSparkle(){
  var delay = 2600 + Math.random() * 2600;
  setTimeout(function(){
    spawnSparkle();
    if (Math.random() < 0.4) setTimeout(spawnSparkle, 180 + Math.random() * 220);
    scheduleSparkle();
  }, delay);
}
if (!prefersReducedMotion) scheduleSparkle();

// ---------- Special-day dress-up: Valentine's, anniversaries, birthdays, Halloween, New Year ----------
var occasionBanner = document.getElementById('occasionBanner');
var currentOccasion = null;
var ambientTimer = null;

var occasionConfig = {
  valentine: { icons: ['rose', 'heartSolid', 'heartOutline', 'envelope'], label: "Happy Valentine's Day", icon: 'heartSolid' },
  halfAnniversary: { icons: ['heartSolid', 'sparkleStar'], label: 'Happy Half-Anniversary', icon: 'sparkleStar' },
  anniversary: { icons: ['heartSolid', 'sparkleStar', 'confetti'], label: 'Happy Anniversary', icon: 'heartSolid' },
  tessaBirthday: { icons: ['balloon', 'confetti', 'musicNote'], label: 'Happy Birthday, Tessa', icon: 'musicNote' },
  uncertaintyBirthday: { icons: ['balloon', 'confetti', 'leaf', 'dna'], label: 'Happy Birthday, Uncertainty', icon: 'dna' },
  halloween: { icons: ['pumpkin', 'bat', 'ghost'], label: 'Happy Halloween', icon: 'ghost' },
  newYear: { icons: ['firework', 'sparkleStar', 'snowflake'], label: 'Happy New Year', icon: 'firework' }
};

function halfAnniversaryDate(start){
  return new Date(start.getFullYear(), start.getMonth() + 6, start.getDate());
}

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

function spawnAmbientParticle(icons){
  var el = document.createElement('span');
  el.className = 'ambient-particle';
  var iconKey = icons[Math.floor(Math.random() * icons.length)];
  el.innerHTML = Icons[iconKey] || Icons.sparkleStar;
  var hue = Math.random();
  el.style.color = hue < 0.4 ? 'var(--rose)' : (hue < 0.75 ? 'var(--gold)' : 'var(--wine)');
  var dur = 5 + Math.random() * 4;
  el.style.left = (Math.random() * window.innerWidth) + 'px';
  el.style.fontSize = (14 + Math.random() * 14) + 'px';
  el.style.setProperty('--driftX', Math.round(Math.random() * 90 - 45) + 'px');
  el.style.setProperty('--spin', Math.round(Math.random() * 360) + 'deg');
  el.style.animationDuration = dur + 's';
  document.body.appendChild(el);
  setTimeout(function(){ if (el.parentNode) el.parentNode.removeChild(el); }, dur * 1000 + 150);
}

function startAmbient(icons){
  stopAmbient();
  (function tick(){
    spawnAmbientParticle(icons);
    ambientTimer = setTimeout(tick, 900 + Math.random() * 1000);
  })();
}

function stopAmbient(){
  clearTimeout(ambientTimer);
  ambientTimer = null;
}

function celebrateBurst(icons){
  spawnBurstParticles(window.innerWidth / 2, Math.min(140, window.innerHeight * 0.22), 18, icons);
}

// previewOverride: undefined = follow the real date; null = force "no occasion";
// a key string = force that occasion. Set by the preview toggle (below).
var previewOverride;

function applyOccasion(now, start){
  var key = (previewOverride !== undefined) ? previewOverride : detectOccasion(now, start);
  if (key === currentOccasion) return;
  currentOccasion = key;

  if (key){
    var cfg = occasionConfig[key];
    document.body.setAttribute('data-occasion', key);
    var label = cfg.label;
    if (key === 'newYear' && now.getMonth() === 11) label = "Happy New Year's Eve";
    occasionBanner.innerHTML =
      '<span class="banner-icon">' + Icons[cfg.icon] + '</span>' +
      '<span>' + label + '</span>' +
      '<span class="banner-icon">' + Icons[cfg.icon] + '</span>';
    occasionBanner.classList.add('show');
    if (!prefersReducedMotion){
      startAmbient(cfg.icons);
      celebrateBurst(cfg.icons);
    }
  } else {
    document.body.removeAttribute('data-occasion');
    occasionBanner.classList.remove('show');
    stopAmbient();
  }

  if (window.Scenery) Scenery.setScene(key);
}

function refreshAll(){
  updateCounter();
  applyOccasion(new Date(), startDate);
}
refreshAll();
setInterval(refreshAll, 60000); // stays correct if left open past midnight

// ---------- Preview toggle: peek at other occasions without waiting for the date ----------
var scenePanel = document.getElementById('scenePanel');
var sceneHandle = document.getElementById('sceneToggleHandle');

if (sceneHandle) sceneHandle.innerHTML = Icons.sparkleStar;

if (scenePanel){
  var PREVIEW_LABELS = [
    ['__live__', 'Today (live)'],
    ['', 'Default'],
    ['valentine', "Valentine's Day"],
    ['halfAnniversary', 'Half-Anniversary'],
    ['anniversary', 'Anniversary'],
    ['tessaBirthday', "Tessa's Birthday"],
    ['uncertaintyBirthday', "Uncertainty's Birthday"],
    ['halloween', 'Halloween'],
    ['newYear', "New Year"]
  ];
  PREVIEW_LABELS.forEach(function(entry){
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('data-preview', entry[0]);
    btn.textContent = entry[1];
    if (entry[0] === '__live__') btn.classList.add('active');
    scenePanel.appendChild(btn);
  });

  scenePanel.addEventListener('click', function(e){
    var btn = e.target.closest ? e.target.closest('button[data-preview]') : null;
    if (!btn) return;
    var val = btn.getAttribute('data-preview');
    previewOverride = (val === '__live__') ? undefined : (val === '' ? null : val);
    Array.prototype.forEach.call(scenePanel.querySelectorAll('button'), function(b){
      b.classList.toggle('active', b === btn);
    });
    currentOccasion = undefined; // force applyOccasion to re-evaluate even if the key repeats
    applyOccasion(new Date(), startDate);
  });
}

// ---------- Love letters: reasons lists + envelope button "peek" ----------
// The words themselves live in js/letters-content.js (window.LettersContent),
// keyed by person ('tessa' / 'uncertainty'). This section only builds DOM
// from that data — edit the words over there, not here.
var letterModal = document.getElementById('letterModal');
var letterModalTitle = document.getElementById('letterModalTitle');
var letterModalBody = document.getElementById('letterModalBody');
var letterCloseBtn = document.getElementById('letterClose');
var letterBackdrop = document.getElementById('letterBackdrop');
var letterOpenerEl = null;

// same little heart used in the love-panel-title icons, reused per bullet
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

function onLetterKeydown(e){
  if (e.key === 'Escape') closeLetter();
}

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
  if (letterCloseBtn) letterCloseBtn.focus();
}

function closeLetter(){
  if (!letterModal) return;
  letterModal.classList.remove('show');
  letterModal.setAttribute('aria-hidden', 'true');
  document.removeEventListener('keydown', onLetterKeydown);
  if (letterOpenerEl) letterOpenerEl.focus();
}

if (letterModal){
  Array.prototype.forEach.call(document.querySelectorAll('.envelope-btn[data-person]'), function(btn){
    var iconHolder = btn.querySelector('svg');
    if (!iconHolder && window.Icons) btn.innerHTML = Icons.envelope;
    btn.addEventListener('click', function(e){
      e.stopPropagation(); // don't also trigger the click-anywhere heart effect
      letterOpenerEl = btn;
      openLetter(btn.getAttribute('data-person'));
    });
  });
  if (letterBackdrop) letterBackdrop.addEventListener('click', closeLetter);
  if (letterCloseBtn) letterCloseBtn.addEventListener('click', closeLetter);
}
