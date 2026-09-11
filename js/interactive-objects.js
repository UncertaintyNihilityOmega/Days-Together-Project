/*
  interactive-objects.js — the huggable, throwable parts of the scene.

  Everything a visitor can actually grab lives here: the three snowballs
  that make up the snowman, the jack-o'-lantern swinging from its hook,
  birthday cakes, Valentine's chocolate, the anniversary paper lanterns,
  and the big heart on the default page — plus toggling candles lit or
  unlit on click.

  These are drawn on their OWN canvas (#fgInteractive), separate from
  js/scenery.js's background canvas, and stacked ABOVE the card and the
  "why I love you" panels (see css/style.css's z-index for #fgInteractive)
  — so a dragged or thrown object is always visible on top of them,
  never hidden behind. Because that canvas sits above real page content,
  it's given `pointer-events:none` in CSS so it never blocks clicking
  anything beneath it; instead, this file listens for pointer events on
  `window` directly. Those still fire (via event bubbling) no matter
  which element visually received them first, so an object stays
  grabbable at any position, even one that overlaps a panel.

  Public API (used by js/scenery.js and js/script.js):
    SceneInteractive.init(canvasElement)
    SceneInteractive.setup(occasionKeyOrNull, {W,H}, candlePositions)
    SceneInteractive.update(dt)
    SceneInteractive.draw(colors)
    SceneInteractive.wasInteracted()   — did the most recent pointer gesture grab something?
    SceneInteractive.getPointer()      — {x,y,active} for scenery.js's firefly halo
*/
(function(){
  'use strict';

  var GRAVITY = 480;
  var GROUND_BOUNCE = 0.36;
  var AIR_DRAG = 0.55;
  var HEART_PATH_D = 'M50,88 C22,66 8,47 8,29 C8,15 19,5 32,5 C40,5 47,10 50,19 C53,10 60,5 68,5 C81,5 92,15 92,29 C92,47 78,66 50,88 Z';
  var heartPath2D = (typeof Path2D !== 'undefined') ? new Path2D(HEART_PATH_D) : null;

  var canvas = null, ctx = null, DPR = 1;
  var W = 0, H = 0;
  var sceneKey = 'default';
  var objects = [];
  var jackLantern = null;
  var candles = [];
  var flickerT = 0;

  var drag = null; // { obj, pointerId, offsetX, offsetY, lastX, lastY, lastT, isJack, lastAngle }
  var pendingCandle = null, pendingCandleX = 0, pendingCandleY = 0;
  var interactedThisGesture = false;
  var pointer = { x: -9999, y: -9999, active: false };

  /* ---------------- small helpers ---------------- */

  function dist(x1, y1, x2, y2){ var dx = x1 - x2, dy = y1 - y2; return Math.sqrt(dx * dx + dy * dy); }
  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

  function debounce(fn, ms){
    var t;
    return function(){
      var args = arguments;
      clearTimeout(t);
      t = setTimeout(function(){ fn.apply(null, args); }, ms);
    };
  }

  function resizeCanvas(){
    if (!canvas) return;
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    var w = window.innerWidth || document.documentElement.clientWidth || 0;
    var h = window.innerHeight || document.documentElement.clientHeight || 0;
    if (!w || !h) return;
    canvas.width = w * DPR;
    canvas.height = h * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  function hexToRgba(hex, a){
    hex = (hex || '#000000').replace('#', '').trim();
    if (hex.charAt(0) === 'r') return hex;
    if (hex.length === 3) hex = hex.split('').map(function(c){ return c + c; }).join('');
    var r = parseInt(hex.substr(0, 2), 16) || 0;
    var g = parseInt(hex.substr(2, 2), 16) || 0;
    var b = parseInt(hex.substr(4, 2), 16) || 0;
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  }

  function roundedRectLocal(c, x, y, w, h, r){
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  function groundYAt(x){
    return (window.Scenery && Scenery.groundYAt) ? Scenery.groundYAt(x) : H * 0.9;
  }

  function addGlowLocal(c, cx, cy, r, rgba){
    var g = c.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, rgba);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g;
    c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.fill();
  }

  function drawGroundShadow(c, x, y, rx){
    c.save();
    c.translate(x, y);
    c.scale(1, .3);
    var g = c.createRadialGradient(0, 0, 0, 0, 0, rx);
    g.addColorStop(0, 'rgba(20,10,10,.3)');
    g.addColorStop(1, 'rgba(20,10,10,0)');
    c.fillStyle = g;
    c.beginPath(); c.arc(0, 0, rx, 0, Math.PI * 2); c.fill();
    c.restore();
  }

  function drawFlameLocal(c, x, y, size, colors){
    c.save();
    c.translate(x, y);
    c.beginPath();
    c.moveTo(0, -size * 1.6);
    c.bezierCurveTo(size * .9, -size * .6, size * .7, size * .5, 0, size * .8);
    c.bezierCurveTo(-size * .7, size * .5, -size * .9, -size * .6, 0, -size * 1.6);
    c.closePath();
    var g = c.createRadialGradient(0, size * .3, 0, 0, 0, size * 1.8);
    g.addColorStop(0, '#FFF6DE');
    g.addColorStop(.5, hexToRgba(colors.gold, 1));
    g.addColorStop(1, hexToRgba(colors.rose, .9));
    c.fillStyle = g;
    c.fill();
    c.restore();
  }

  function flicker(seed){ return Math.sin(flickerT * 9 + seed * 3.1) * 1.4 + Math.sin(flickerT * 23 + seed) * 0.6; }

  /* ---------------- generic throwable physics (snowballs, cake, chocolate) ---------------- */

  function makeThrowable(kind, x, y, radius, groundOffset, extra){
    var o = {
      kind: kind, x: x, y: y, vx: 0, vy: 0, rot: 0, vrot: 0,
      radius: radius, groundOffset: groundOffset == null ? radius : groundOffset,
      grabRadius: radius + 16,
      floatMode: false, floatBaseX: x, floatPhase: Math.random() * Math.PI * 2, floatTime: 0,
      settled: true
    };
    for (var k in extra) if (extra.hasOwnProperty(k)) o[k] = extra[k];
    return o;
  }

  // Gravity applies for as long as an object isn't resting on the ground
  // — not for a fixed timer — so a hard throw can never strand something
  // frozen in mid-air off-screen; it always eventually comes back down
  // to visible ground. Side walls and a soft ceiling keep it from
  // sailing off the page while it's airborne.
  function stepThrowable(o, dt){
    if (drag && drag.obj === o) return;

    if (o.floatMode){
      o.floatTime += dt;
      o.y -= 13 * dt;
      o.x = o.floatBaseX + Math.sin(o.floatPhase + o.floatTime * 0.4) * 15;
      if (o.y < -30){
        o.floatBaseX = W * 0.15 + Math.random() * W * 0.7;
        o.x = o.floatBaseX;
        o.y = H + 20 + Math.random() * 60;
        o.floatPhase = Math.random() * Math.PI * 2;
      }
      return;
    }

    if (o.settled) return;

    o.vy += GRAVITY * dt;
    o.x += o.vx * dt;
    o.y += o.vy * dt;
    o.rot += o.vrot * dt;

    if (o.y < -60){ o.y = -60; o.vy = Math.abs(o.vy) * 0.4; }
    if (o.x < o.radius){ o.x = o.radius; o.vx = Math.abs(o.vx) * 0.5; }
    if (o.x > W - o.radius){ o.x = W - o.radius; o.vx = -Math.abs(o.vx) * 0.5; }

    var gy = groundYAt(o.x) - o.groundOffset;
    if (o.y > gy){
      o.y = gy;
      if (Math.abs(o.vy) > 60){
        o.vy = -o.vy * GROUND_BOUNCE;
        o.vx *= 0.7;
        o.vrot *= 0.55;
      } else {
        o.vy = 0; o.vrot *= 0.8; o.vx *= 0.5;
        if (Math.abs(o.vx) < 4){
          o.settled = true;
          if (o.kind === 'lantern'){
            o.floatMode = true; o.floatBaseX = o.x; o.floatPhase = Math.random() * Math.PI * 2; o.floatTime = 0;
          }
        }
      }
    }
    o.vx *= (1 - AIR_DRAG * dt);
  }

  function beginDrag(o, px, py, pointerId){
    drag = { obj: o, pointerId: pointerId, offsetX: px - o.x, offsetY: py - o.y, lastX: px, lastY: py, lastT: performance.now(),
             startX: px, startY: py, moved: false };
    o.floatMode = false;
    o.settled = true; // paused while held; endDrag() below decides what happens next
    o.vx = 0; o.vy = 0;
  }

  var MAX_THROW_SPEED = 2600; // px/s — a generous "hard flick", not a physics glitch

  function updateDrag(px, py){
    var o = drag.obj;
    var now = performance.now();
    // Clamp dt's floor well above zero: two pointermove events can be
    // reported only fractions of a millisecond apart (synthetic input,
    // or a very fast real one), and dividing a real pixel delta by a
    // near-zero time would otherwise produce an absurd, screen-launching
    // velocity.
    var dt = Math.max((now - drag.lastT) / 1000, 0.012);
    var newX = px - drag.offsetX, newY = py - drag.offsetY;
    var vx = clamp((newX - o.x) / dt, -MAX_THROW_SPEED, MAX_THROW_SPEED);
    var vy = clamp((newY - o.y) / dt, -MAX_THROW_SPEED, MAX_THROW_SPEED);
    o.vx = o.vx * 0.6 + vx * 0.4;
    o.vy = o.vy * 0.6 + vy * 0.4;
    o.x = newX; o.y = newY;
    if (!drag.moved && dist(px, py, drag.startX, drag.startY) > 6) drag.moved = true;
    drag.lastX = px; drag.lastY = py; drag.lastT = now;
  }

  function endDrag(){
    var o = drag.obj;
    var wasTap = !drag.moved;
    drag = null;

    if (wasTap && o.kind === 'bigheart' && window.triggerBigHeartBurst){
      o.vx = 0; o.vy = 0; o.vrot = 0;
      window.triggerBigHeartBurst(o.x, o.y);
      return;
    }
    o.vx = clamp(o.vx, -MAX_THROW_SPEED, MAX_THROW_SPEED);
    o.vy = clamp(o.vy, -MAX_THROW_SPEED, MAX_THROW_SPEED);
    o.settled = false;
    o.vrot = clamp(o.vx * 0.012, -7, 7);
  }

  /* ---------------- jack-o'-lantern pendulum ---------------- */

  function makeJackLantern(anchorX, anchorY, length){
    return { kind: 'jack', anchorX: anchorX, anchorY: anchorY, length: length, baseLength: length,
             angle: 0.05, angVel: 0, spin: 0, spinVel: 0, idlePhase: Math.random() * Math.PI * 2, grabRadius: 34 };
  }

  function jackPosition(j){
    return { x: j.anchorX + Math.sin(j.angle) * j.length, y: j.anchorY + Math.cos(j.angle) * j.length };
  }

  function stepJack(j, dt){
    if (drag && drag.obj === j) return;
    j.idlePhase += dt;
    var idleTorque = Math.sin(j.idlePhase * 0.6) * 0.06;
    var accel = -(GRAVITY / j.length) * Math.sin(j.angle) - 1.4 * j.angVel + idleTorque;
    j.angVel += accel * dt;
    j.angle += j.angVel * dt;
    j.length = j.length + (j.baseLength - j.length) * Math.min(1, dt * 4);
    j.spinVel *= (1 - 1.6 * dt);
    j.spin += j.spinVel * dt;
  }

  function beginDragJack(j, px, py, pointerId){
    drag = { obj: j, pointerId: pointerId, isJack: true, lastAngle: j.angle, lastT: performance.now() };
    j.angVel = 0;
  }

  function updateDragJack(px, py){
    var j = drag.obj;
    var now = performance.now();
    var dt = Math.max((now - drag.lastT) / 1000, 0.012);
    var dx = px - j.anchorX, dy = py - j.anchorY;
    var newAngle = Math.atan2(dx, dy);
    var r = clamp(Math.sqrt(dx * dx + dy * dy), j.baseLength * 0.6, j.baseLength * 1.2);
    j.length = r;
    var dAngle = newAngle - drag.lastAngle;
    if (dAngle > Math.PI) dAngle -= Math.PI * 2;
    if (dAngle < -Math.PI) dAngle += Math.PI * 2;
    j.angVel = clamp(j.angVel * 0.5 + (dAngle / dt) * 0.5, -20, 20);
    j.angle = newAngle;
    drag.lastAngle = newAngle;
    drag.lastT = now;
  }

  function endDragJack(){
    var j = drag.obj;
    j.spinVel = clamp(j.spinVel + j.angVel * 1.6, -16, 16);
    drag = null;
  }

  /* ---------------- scene setup ---------------- */

  // The "why I love you" panels are real, opaque page elements that sit
  // in front of the canvas (see css/style.css's z-index) — anything drawn
  // underneath one is both invisible AND unreachable, since the panel
  // physically intercepts the click before it ever reaches the canvas.
  // This finds the horizontal band that's actually clear of them (they
  // only sit *beside* the card on wide screens — on narrow ones they
  // stack above/below it instead and don't block anything), so every
  // object below picks a spawn point that's guaranteed reachable.
  function getSideClearance(){
    var cardEl = document.querySelector('.card');
    var clearance = { left: 0, right: W };
    if (!cardEl) return clearance;
    var cardRect = cardEl.getBoundingClientRect();
    var panels = document.querySelectorAll('.love-panel');
    for (var i = 0; i < panels.length; i++){
      var r = panels[i].getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      var besideCard = r.top < cardRect.bottom && r.bottom > cardRect.top; // vertically overlaps the card = side-by-side layout
      if (!besideCard) continue;
      if (r.left < cardRect.left) clearance.left = Math.max(clearance.left, r.right + 18);
      else if (r.left > cardRect.left) clearance.right = Math.min(clearance.right, r.left - 18);
    }
    if (clearance.left >= clearance.right){ clearance.left = 0; clearance.right = W; } // degenerate (tiny window) — don't break everything
    return clearance;
  }

  function setup(key, dims, candlePositions){
    sceneKey = key || 'default';
    W = dims.W; H = dims.H;
    objects = [];
    jackLantern = null;
    drag = null;
    pendingCandle = null;
    candles = (candlePositions || []).map(function(c){ return { x: c.x, y: c.y, size: c.size, lit: true, seed: Math.random() * 10 }; });

    var clear = getSideClearance();

    if (sceneKey === 'default'){
      var hR = 34;
      var hx = clamp(W * 0.13, clear.left + hR, clear.right - hR);
      objects.push(makeThrowable('bigheart', hx, groundYAt(hx) - hR, hR, hR, { grabRadius: 52 }));
    } else if (sceneKey === 'newYear'){
      var sx = clamp(W * 0.86, clear.left + 30, clear.right - 30);
      var baseY = H * 0.95;
      var r1 = 25, r2 = 18, r3 = 13;
      var y1 = baseY - r1;
      var topOf1 = baseY - r1 * 2 + 4;
      var y2 = topOf1 - r2;
      var topOf2 = topOf1 - r2 * 2 + 4;
      var y3 = topOf2 - r3;
      objects.push(makeThrowable('snowball', sx, y1, r1, r1, { role: 'bottom' }));
      objects.push(makeThrowable('snowball', sx, y2, r2, r2, { role: 'middle' }));
      objects.push(makeThrowable('snowball', sx, y3, r3, r3, { role: 'head' }));
    } else if (sceneKey === 'halloween'){
      var jx = clamp(W * 0.9, clear.left + 40, clear.right - 40);
      jackLantern = makeJackLantern(jx, H * 0.42, 62);
    } else if (sceneKey === 'tessaBirthday' || sceneKey === 'uncertaintyBirthday'){
      var cx = clamp(W * 0.87, clear.left + 40, clear.right - 40);
      objects.push(makeThrowable('cake', cx, groundYAt(cx) - 36, 36, 36, { grabRadius: 48 }));
    } else if (sceneKey === 'valentine'){
      // sits clear of the candle row (candles span roughly 0.55W–0.87W in
      // scenery.js's drawCandlesStatic), so their hit-zones never overlap
      var chx = clamp(W * 0.4, clear.left + 30, clear.right - 30);
      objects.push(makeThrowable('chocolate', chx, groundYAt(chx) - 13, 13, 13, { grabRadius: 30 }));
    } else if (sceneKey === 'anniversary'){
      for (var i = 0; i < 6; i++){
        var lo = Math.max(clear.left + 20, W * 0.1);
        var hi = Math.min(clear.right - 20, W * 0.9);
        var bx = (hi > lo) ? (lo + Math.random() * (hi - lo)) : W * 0.5;
        objects.push(makeThrowable('lantern', bx, H * (0.25 + Math.random() * 0.6), 11, 11,
          { grabRadius: 30, floatMode: true, floatBaseX: bx, floatPhase: Math.random() * Math.PI * 2 }));
      }
    }
  }

  /* ---------------- update + draw ---------------- */

  function update(dt){
    flickerT += dt;
    for (var i = 0; i < objects.length; i++) stepThrowable(objects[i], dt);
    if (jackLantern) stepJack(jackLantern, dt);
  }

  function drawUnlitWick(c, x, y){
    c.fillStyle = 'rgba(40,30,20,.8)';
    c.fillRect(x - 0.8, y - 3, 1.6, 6);
  }

  function drawBigHeart(c, o, colors){
    drawGroundShadow(c, o.x, o.y + o.radius * 0.95, o.radius * 1.5);
    var s = (o.radius * 2.05) / 100;
    c.save();
    c.translate(o.x, o.y);
    c.rotate(o.rot * 0.4);
    c.scale(s, s);
    c.translate(-50, -46);

    if (heartPath2D){
      var g = c.createLinearGradient(0, 0, 0, 90);
      g.addColorStop(0, '#F0919C');
      g.addColorStop(.55, colors.rose);
      g.addColorStop(1, colors.wine);
      c.fillStyle = g;
      c.shadowColor = hexToRgba(colors.wine, .55);
      c.shadowBlur = 20 / s;
      c.fill(heartPath2D);
      c.shadowBlur = 0;
      c.fillStyle = 'rgba(255,255,255,.35)';
      c.beginPath();
      c.ellipse(28, 26, 9, 14, -0.5, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
  }

  function drawChocolate(c, o, colors){
    drawGroundShadow(c, o.x, o.y + o.radius * 0.95, o.radius * 1.4);
    var s = (o.radius * 2.05) / 100;
    c.save();
    c.translate(o.x, o.y);
    c.rotate(o.rot);
    c.scale(s, s);
    c.translate(-50, -46);
    if (heartPath2D){
      var g = c.createLinearGradient(0, 0, 40, 90);
      g.addColorStop(0, '#8A5A34');
      g.addColorStop(.5, '#5C3A21');
      g.addColorStop(1, '#3E2615');
      c.fillStyle = g;
      c.shadowColor = 'rgba(0,0,0,.4)';
      c.shadowBlur = 10 / s;
      c.fill(heartPath2D);
      c.shadowBlur = 0;
      c.fillStyle = 'rgba(255,255,255,.4)';
      c.beginPath();
      c.ellipse(30, 24, 7, 11, -0.5, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = 'rgba(255,240,220,.5)';
      c.lineWidth = 1.4;
      c.beginPath();
      c.moveTo(18, 20); c.quadraticCurveTo(50, 40, 70, 30);
      c.stroke();
    }
    c.restore();
  }

  function drawSnowball(c, o, colors){
    drawGroundShadow(c, o.x, o.y + o.radius * 0.92, o.radius * 1.15);

    var g = c.createRadialGradient(o.x - o.radius * 0.35, o.y - o.radius * 0.35, o.radius * 0.15, o.x, o.y, o.radius * 1.15);
    g.addColorStop(0, '#FFFFFF');
    g.addColorStop(.68, '#F2F4F8');
    g.addColorStop(1, '#D8E0EC');
    c.fillStyle = g;
    c.beginPath(); c.arc(o.x, o.y, o.radius, 0, Math.PI * 2); c.fill();

    c.save();
    c.beginPath(); c.arc(o.x, o.y, o.radius, 0, Math.PI * 2); c.clip();
    var sh = c.createRadialGradient(o.x + o.radius * 0.55, o.y + o.radius * 0.55, 0, o.x + o.radius * 0.55, o.y + o.radius * 0.55, o.radius * 1.2);
    sh.addColorStop(0, 'rgba(140,165,200,.3)');
    sh.addColorStop(1, 'rgba(140,165,200,0)');
    c.fillStyle = sh;
    c.fillRect(o.x - o.radius, o.y - o.radius, o.radius * 2, o.radius * 2);
    c.restore();

    if (o.role === 'middle'){
      c.save(); c.translate(o.x, o.y); c.rotate(o.rot);
      c.fillStyle = hexToRgba(colors.rose, .94);
      roundedRectLocal(c, -o.radius * 0.85, -o.radius * 0.22, o.radius * 1.7, o.radius * 0.42, 4);
      c.fill();
      c.strokeStyle = hexToRgba(colors.wine, .35);
      c.lineWidth = 1;
      for (var s = -3; s <= 3; s++){
        c.beginPath(); c.moveTo(s * o.radius * 0.24, -o.radius * 0.22); c.lineTo(s * o.radius * 0.24, o.radius * 0.2); c.stroke();
      }
      c.fillStyle = hexToRgba(colors.rose, .94);
      c.beginPath();
      c.moveTo(o.radius * 0.4, o.radius * 0.05);
      c.lineTo(o.radius * 0.8, o.radius * 0.7);
      c.lineTo(o.radius * 0.25, o.radius * 0.65);
      c.closePath();
      c.fill();
      c.restore();

      c.strokeStyle = hexToRgba(colors.crater, .85);
      c.lineWidth = 2.6; c.lineCap = 'round';
      var wig = Math.sin(o.rot) * o.radius * 0.15;
      c.beginPath(); c.moveTo(o.x - o.radius * 0.85, o.y); c.lineTo(o.x - o.radius * 2.1, o.y - o.radius * 0.7 + wig); c.stroke();
      c.beginPath(); c.moveTo(o.x - o.radius * 2.1, o.y - o.radius * 0.7 + wig); c.lineTo(o.x - o.radius * 2.35, o.y - o.radius * 0.95 + wig); c.stroke();
      c.beginPath(); c.moveTo(o.x - o.radius * 2.1, o.y - o.radius * 0.7 + wig); c.lineTo(o.x - o.radius * 2.0, o.y - o.radius * 1.0 + wig); c.stroke();
      c.beginPath(); c.moveTo(o.x + o.radius * 0.85, o.y); c.lineTo(o.x + o.radius * 2.1, o.y - o.radius * 0.7 - wig); c.stroke();
      c.beginPath(); c.moveTo(o.x + o.radius * 2.1, o.y - o.radius * 0.7 - wig); c.lineTo(o.x + o.radius * 2.35, o.y - o.radius * 0.95 - wig); c.stroke();
      c.beginPath(); c.moveTo(o.x + o.radius * 2.1, o.y - o.radius * 0.7 - wig); c.lineTo(o.x + o.radius * 2.0, o.y - o.radius * 1.0 - wig); c.stroke();
    }

    if (o.role === 'head'){
      c.save(); c.translate(o.x, o.y); c.rotate(o.rot);
      c.fillStyle = 'rgba(35,28,26,.88)';
      c.beginPath(); c.arc(-o.radius * 0.32, -o.radius * 0.15, 1.6, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.arc(o.radius * 0.32, -o.radius * 0.15, 1.6, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#fff'; c.globalAlpha = .75;
      c.beginPath(); c.arc(-o.radius * 0.32 - 0.5, -o.radius * 0.15 - 0.5, 0.5, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.arc(o.radius * 0.32 - 0.5, -o.radius * 0.15 - 0.5, 0.5, 0, Math.PI * 2); c.fill();
      c.globalAlpha = 1;
      c.fillStyle = 'rgba(35,28,26,.85)';
      for (var b = 0; b < 3; b++){ c.beginPath(); c.arc(0, o.radius * 0.08 + b * o.radius * 0.28, 1.5, 0, Math.PI * 2); c.fill(); }
      var g2 = c.createLinearGradient(0, -o.radius * 0.05, o.radius * 0.85, o.radius * 0.1);
      g2.addColorStop(0, '#F2A25C'); g2.addColorStop(1, '#D97A2E');
      c.fillStyle = g2;
      c.beginPath(); c.moveTo(0, -o.radius * 0.02); c.lineTo(o.radius * 0.85, o.radius * 0.08); c.lineTo(0, o.radius * 0.18); c.closePath(); c.fill();
      c.restore();
    }
  }

  function drawCakeDynamic(c, o, colors){
    drawGroundShadow(c, o.x, o.y + o.groundOffset * 0.95, o.radius * 1.5);
    c.save();
    c.translate(o.x, o.y);
    c.rotate(o.rot * 0.35);

    var t1w = 72, t1h = 32, t2w = 46, t2h = 24;
    var bottomY = o.groundOffset;

    c.fillStyle = 'rgba(0,0,0,.12)';
    c.beginPath(); c.ellipse(0, bottomY + 3, t1w * 0.62, 7, 0, 0, Math.PI * 2); c.fill();

    var y1top = bottomY - t1h;
    var g1 = c.createLinearGradient(-t1w / 2, y1top, t1w / 2, bottomY);
    g1.addColorStop(0, hexToRgba(colors.blush, .95));
    g1.addColorStop(1, hexToRgba(colors.rose, .88));
    c.fillStyle = g1;
    roundedRectLocal(c, -t1w / 2, y1top, t1w, t1h, 6);
    c.fill();
    c.fillStyle = hexToRgba(colors.gold, .5);
    for (var i = 0; i <= 9; i++){
      c.beginPath(); c.arc(-t1w / 2 + i * (t1w / 9), y1top + t1h * 0.42, 2.2, 0, Math.PI * 2); c.fill();
    }

    var y2 = y1top;
    var y2top = y2 - t2h;
    var g2 = c.createLinearGradient(-t2w / 2, y2top, t2w / 2, y2);
    g2.addColorStop(0, hexToRgba(colors.paper, .97));
    g2.addColorStop(1, hexToRgba(colors.blush, .9));
    c.fillStyle = g2;
    roundedRectLocal(c, -t2w / 2, y2top, t2w, t2h, 5);
    c.fill();

    c.fillStyle = hexToRgba(colors.paper, .98);
    c.beginPath();
    var drips = 6;
    for (var d = 0; d <= drips; d++){
      var dx = -t2w / 2 + d * (t2w / drips);
      c.moveTo(dx, y2top);
      c.arc(dx, y2top, 5.5, Math.PI, 0);
    }
    c.fill();

    c.fillStyle = hexToRgba(colors.rose, .9);
    [-t2w * 0.22, t2w * 0.22].forEach(function(cx){
      c.beginPath(); c.arc(cx, y2top + 2, 3.4, 0, Math.PI * 2); c.fill();
      c.fillStyle = 'rgba(255,255,255,.5)';
      c.beginPath(); c.arc(cx - 1, y2top + 1, 1, 0, Math.PI * 2); c.fill();
      c.fillStyle = hexToRgba(colors.rose, .9);
    });

    var candleCount = 4;
    for (var k = 0; k < candleCount; k++){
      var ccx = -t2w / 2 + 9 + k * ((t2w - 18) / (candleCount - 1));
      var ccy = y2top - 3;
      c.fillStyle = hexToRgba(k % 2 === 0 ? colors.gold : colors.rose, .95);
      c.fillRect(ccx - 1.4, ccy - 15, 2.8, 15);
      var jitter = flicker(k + 20);
      addGlowLocal(c, ccx, ccy - 17, 30, hexToRgba(colors.gold, .3));
      drawFlameLocal(c, ccx + jitter * 0.25, ccy - 17, 4.4 + jitter * 0.12, colors);
    }
    c.restore();
  }

  function drawPaperLantern(c, o, colors){
    c.save();
    c.translate(o.x, o.y);
    var s = o.radius;
    var g = c.createRadialGradient(0, 0, 0, 0, 0, s * 2.4);
    g.addColorStop(0, hexToRgba(colors.gold, .5));
    g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g;
    c.beginPath(); c.arc(0, 0, s * 2.4, 0, Math.PI * 2); c.fill();

    var body = c.createLinearGradient(-s * 0.6, -s * 0.7, s * 0.6, s * 0.7);
    body.addColorStop(0, hexToRgba(colors.gold, .95));
    body.addColorStop(1, hexToRgba(colors.rose, .9));
    c.fillStyle = body;
    roundedRectLocal(c, -s * 0.55, -s * 0.65, s * 1.1, s * 1.3, s * 0.32);
    c.fill();
    c.strokeStyle = hexToRgba(colors.crater, .55);
    c.lineWidth = 1;
    c.beginPath(); c.moveTo(-s * 0.55, -s * 0.62); c.lineTo(s * 0.55, -s * 0.62); c.stroke();
    c.beginPath(); c.moveTo(-s * 0.55, s * 0.62); c.lineTo(s * 0.55, s * 0.62); c.stroke();
    c.beginPath(); c.moveTo(0, -s * 0.65); c.lineTo(0, s * 0.65); c.stroke();
    c.restore();
  }

  function drawJack(c, j, colors){
    var pos = jackPosition(j);
    var s = 28;

    c.strokeStyle = hexToRgba(colors.crater, .6);
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(j.anchorX, j.anchorY);
    c.quadraticCurveTo((j.anchorX + pos.x) / 2 + Math.sin(j.angle) * 6, (j.anchorY + pos.y) / 2, pos.x, pos.y - s * 0.95);
    c.stroke();
    c.beginPath(); c.arc(j.anchorX, j.anchorY - 6, 6, 0.3, Math.PI * 1.9); c.stroke();

    addGlowLocal(c, pos.x, pos.y, s * 2.7, hexToRgba(colors.gold, .35));

    c.save();
    c.translate(pos.x, pos.y);
    c.rotate(j.spin);
    c.scale(1, .85);
    var pg = c.createRadialGradient(-s * 0.3, -s * 0.3, s * 0.2, 0, 0, s);
    pg.addColorStop(0, hexToRgba(colors.gold, .5));
    pg.addColorStop(1, hexToRgba(colors.crater, .96));
    c.fillStyle = pg;
    c.beginPath(); c.arc(0, 0, s, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(0,0,0,.32)';
    c.lineWidth = s * 0.1;
    [-.55, 0, .55].forEach(function(o2){
      c.beginPath(); c.moveTo(o2 * s, -s * .9); c.quadraticCurveTo(o2 * s * 1.3, 0, o2 * s, s * .9); c.stroke();
    });

    c.fillStyle = hexToRgba(colors.gold, .95);
    c.shadowColor = hexToRgba(colors.gold, .85);
    c.shadowBlur = 14;
    c.beginPath(); c.moveTo(-s * .32, -s * .15); c.lineTo(-s * .1, s * .1); c.lineTo(-s * .46, s * .1); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(s * .32, -s * .15); c.lineTo(s * .46, s * .1); c.lineTo(s * .1, s * .1); c.closePath(); c.fill();
    c.beginPath();
    c.moveTo(-s * .38, s * .32);
    c.lineTo(-s * .22, s * .46); c.lineTo(-s * .1, s * .32); c.lineTo(s * .05, s * .5);
    c.lineTo(s * .2, s * .32); c.lineTo(s * .38, s * .46); c.lineTo(s * .4, s * .3);
    c.closePath(); c.fill();
    c.shadowBlur = 0;
    c.restore();

    c.fillStyle = hexToRgba(colors.crater, .9);
    c.fillRect(pos.x - 2.5, pos.y - s * 0.85 - 8, 5, 10);
  }

  function draw(colors){
    if (!ctx || !W || !H) return;
    var c = ctx;
    c.clearRect(0, 0, W, H);

    candles.forEach(function(cd){
      if (!cd.lit){ drawUnlitWick(c, cd.x, cd.y); return; }
      var jitter = flicker(cd.seed);
      addGlowLocal(c, cd.x, cd.y - 6, 44, hexToRgba(colors.gold, .3));
      drawFlameLocal(c, cd.x + jitter * 0.3, cd.y - 6, cd.size + jitter * 0.15, colors);
    });

    for (var i = 0; i < objects.length; i++){
      var o = objects[i];
      if (o.kind === 'bigheart') drawBigHeart(c, o, colors);
      else if (o.kind === 'chocolate') drawChocolate(c, o, colors);
      else if (o.kind === 'snowball') drawSnowball(c, o, colors);
      else if (o.kind === 'cake') drawCakeDynamic(c, o, colors);
      else if (o.kind === 'lantern') drawPaperLantern(c, o, colors);
    }

    if (jackLantern) drawJack(c, jackLantern, colors);
  }

  /* ---------------- pointer interaction ---------------- */

  // Picks whichever grabbable thing is actually *closest* to the click,
  // not just the first category checked — two hit-zones can legitimately
  // sit near each other (a candle and a nearby object), and without this
  // a click meant for the farther-but-checked-first one would silently
  // "win", making the closer thing unreachable.
  function hitTest(px, py){
    var best = null, bestDist = Infinity;

    if (jackLantern){
      var jp = jackPosition(jackLantern);
      var dj = dist(px, py, jp.x, jp.y);
      if (dj < jackLantern.grabRadius && dj < bestDist){ best = { type: 'jack', target: jackLantern }; bestDist = dj; }
    }
    for (var i = 0; i < candles.length; i++){
      var dc = dist(px, py, candles[i].x, candles[i].y);
      if (dc < candles[i].size + 16 && dc < bestDist){ best = { type: 'candle', target: candles[i] }; bestDist = dc; }
    }
    for (var j = 0; j < objects.length; j++){
      var doo = dist(px, py, objects[j].x, objects[j].y);
      if (doo < objects[j].grabRadius && doo < bestDist){ best = { type: 'object', target: objects[j] }; bestDist = doo; }
    }
    return best;
  }

  // Listened for on `window` rather than the (pointer-events:none)
  // foreground canvas — see the file header for why: these events bubble
  // up from wherever the browser actually routed them (a panel, the
  // card, anywhere), so an object stays grabbable even where it visually
  // overlaps real page content.
  function onPointerDown(e){
    pointer.x = e.clientX; pointer.y = e.clientY; pointer.active = true;
    interactedThisGesture = false;
    var hit = hitTest(e.clientX, e.clientY);
    if (!hit) return;

    interactedThisGesture = true;

    if (hit.type === 'jack') beginDragJack(hit.target, e.clientX, e.clientY, e.pointerId);
    else if (hit.type === 'candle'){ pendingCandle = hit.target; pendingCandleX = e.clientX; pendingCandleY = e.clientY; }
    else beginDrag(hit.target, e.clientX, e.clientY, e.pointerId);
  }

  function onPointerMove(e){
    pointer.x = e.clientX; pointer.y = e.clientY; pointer.active = true;
    if (!drag) return;
    e.preventDefault(); // don't let a touch-drag also scroll a panel underneath
    if (drag.isJack) updateDragJack(e.clientX, e.clientY);
    else updateDrag(e.clientX, e.clientY);
  }

  function onPointerUp(e){
    if (drag && drag.isJack) endDragJack();
    else if (drag) endDrag();
    if (pendingCandle){
      if (dist(e.clientX, e.clientY, pendingCandleX, pendingCandleY) < 9) pendingCandle.lit = !pendingCandle.lit;
      pendingCandle = null;
    }
  }

  window.SceneInteractive = {
    init: function(canvasEl){
      canvas = canvasEl;
      ctx = canvas.getContext('2d');
      resizeCanvas();
      window.addEventListener('resize', debounce(resizeCanvas, 180));
      window.addEventListener('pointerdown', onPointerDown);
      window.addEventListener('pointermove', onPointerMove, { passive: false });
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);
    },
    setup: setup,
    update: update,
    draw: draw,
    wasInteracted: function(){ return interactedThisGesture; },
    getPointer: function(){ return pointer; },
    _debug: function(){ return { objects: objects, jackLantern: jackLantern, candles: candles, W: W, H: H }; },
    _stepFrames: function(n, dt){ for (var i = 0; i < n; i++) update(dt || 1 / 60); }
  };
})();
