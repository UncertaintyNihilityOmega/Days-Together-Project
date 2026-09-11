/*
  scenery.js — the hand-drawn, full-screen background scene.

  Everything here is plain Canvas 2D drawing (arcs, bezier curves,
  gradients) — no images, no emoji. There are two canvases:
    - a hidden, in-memory "static" canvas that holds the parts of the
      scene that don't move (the tree/harp/helix, the ground, the sky,
      the moon...). It's only redrawn when the scene or window size
      changes.
    - the visible canvas, which every frame just stamps a copy of the
      static canvas and then draws the moving bits on top (falling
      petals/snow, fireflies, bats, flickering candle flames).
  Splitting it this way means the expensive "grow a whole tree" work
  only happens once per scene change, not 60 times a second.

  Public API (used by script.js):
    Scenery.init(canvasElement)
    Scenery.setScene(occasionKeyOrNull)
    Scenery.setReducedMotion(true|false)
*/
(function(){
  'use strict';

  var canvas, ctx, staticCanvas, staticCtx;
  var W = 0, H = 0, DPR = 1;
  var particles = [];
  var currentSceneKey = 'default';
  var currentColors = null;
  var reducedMotion = false;
  var rafId = null;
  var lastTime = 0;

  // Note: the snowman, jack-o'-lantern, cake, chocolate, and paper lanterns
  // used to be listed here as static "extras" — they've since moved to
  // js/interactive-objects.js, since they're now things you can pick up
  // and throw. SceneInteractive.setup() below decides which of those to
  // create, keyed off the same scene name.
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

  /* ---------------- small helpers ---------------- */

  function hexToRgba(hex, a){
    hex = (hex || '#000000').replace('#', '').trim();
    if (hex.charAt(0) === 'r') return hex; // already rgb()/rgba()
    if (hex.length === 3) hex = hex.split('').map(function(c){ return c + c; }).join('');
    var r = parseInt(hex.substr(0, 2), 16) || 0;
    var g = parseInt(hex.substr(2, 2), 16) || 0;
    var b = parseInt(hex.substr(4, 2), 16) || 0;
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  }

  function readThemeColors(){
    var cs = getComputedStyle(document.body);
    function v(name, fallback){
      var val = cs.getPropertyValue(name);
      return (val && val.trim()) || fallback;
    }
    return {
      wine: v('--wine', '#6E1E2E'),
      rose: v('--rose', '#C2626F'),
      gold: v('--gold', '#BD9257'),
      blush: v('--blush', '#F3DCD9'),
      paper: v('--paper', '#FDF6F0'),
      crater: v('--crater', '#9C6B3E'),
      ink: v('--ink', '#3B1A22')
    };
  }

  function roundedRect(c, x, y, w, h, r){
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  function cubicPoint(x0, y0, x1, y1, x2, y2, x3, y3, t){
    var mt = 1 - t;
    return {
      x: mt * mt * mt * x0 + 3 * mt * mt * t * x1 + 3 * mt * t * t * x2 + t * t * t * x3,
      y: mt * mt * mt * y0 + 3 * mt * mt * t * y1 + 3 * mt * t * t * y2 + t * t * t * y3
    };
  }

  function debounce(fn, ms){
    var t;
    return function(){
      var args = arguments;
      clearTimeout(t);
      t = setTimeout(function(){ fn.apply(null, args); }, ms);
    };
  }

  /* ---------------- sky, glow, ground ---------------- */

  function drawSky(c, colors){
    var g = c.createLinearGradient(0, 0, W * 0.25, H);
    g.addColorStop(0, colors.blush);
    g.addColorStop(1, colors.paper);
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
    addGlow(c, W * 0.18, H * -0.05, W * 0.55, hexToRgba(colors.rose, .16));
    addGlow(c, W * 0.92, H * 1.05, W * 0.42, hexToRgba(colors.gold, .14));
  }

  function addGlow(c, cx, cy, r, rgba){
    var g = c.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, rgba);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g;
    c.beginPath();
    c.arc(cx, cy, r, 0, Math.PI * 2);
    c.fill();
  }

  function drawGround(c, colors){
    var groundY = H * 0.87;
    c.beginPath();
    c.moveTo(0, H);
    c.lineTo(0, groundY + 16);
    c.quadraticCurveTo(W * 0.25, groundY - 12, W * 0.55, groundY + 8);
    c.quadraticCurveTo(W * 0.8, groundY + 20, W, groundY - 6);
    c.lineTo(W, H);
    c.closePath();
    var g = c.createLinearGradient(0, groundY - 10, 0, H);
    g.addColorStop(0, hexToRgba(colors.crater, .22));
    g.addColorStop(1, hexToRgba(colors.crater, .36));
    c.fillStyle = g;
    c.fill();
  }

  /* ---------------- the big tree (recursive branches) ---------------- */

  function branch(c, x, y, len, angle, width, depth, maxDepth, trunkColor, canopyPoints){
    var bend = Math.random() * 0.5 - 0.25;
    var midAngle = angle + bend;
    var cx = x + Math.cos(midAngle) * len * 0.5;
    var cy = y + Math.sin(midAngle) * len * 0.5;
    var x2 = x + Math.cos(angle) * len;
    var y2 = y + Math.sin(angle) * len;

    c.strokeStyle = trunkColor;
    c.lineWidth = Math.max(width, 0.6);
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(x, y);
    c.quadraticCurveTo(cx, cy, x2, y2);
    c.stroke();

    if (depth <= 0 || len < 7){
      canopyPoints.push({ x: x2, y: y2, gen: maxDepth - depth });
      return;
    }
    if (depth > 1 && Math.random() < 0.3){
      canopyPoints.push({ x: x2, y: y2, gen: maxDepth - depth });
    }

    var count = depth > 4 ? 2 : (Math.random() < 0.55 ? 2 : 1);
    for (var i = 0; i < count; i++){
      var spread = 0.4 + Math.random() * 0.26;
      var dir = count === 1 ? (Math.random() < 0.5 ? -1 : 1) : (i === 0 ? -1 : 1);
      var newAngle = angle + dir * spread + (Math.random() * 0.16 - 0.08);
      branch(c, x2, y2, len * (0.68 + Math.random() * 0.1), newAngle, width * 0.68, depth - 1, maxDepth, trunkColor, canopyPoints);
    }
  }

  function drawTree(c, colors, opts){
    opts = opts || {};
    var originX = W * 0.07;
    var originY = H * 0.92;
    var maxDepth = 7;
    var trunkLen = H * 0.32;
    var trunkWidth = Math.max(9, W * 0.012);
    var trunkColor = hexToRgba(colors.crater, .92);

    var canopyPoints = [];
    branch(c, originX, originY, trunkLen, -1.4, trunkWidth, maxDepth, maxDepth, trunkColor, canopyPoints);

    if (!opts.bare){
      var palette = [colors.blush, colors.rose, '#FFFFFF', colors.gold];
      canopyPoints.forEach(function(p){
        var clusters = 2 + Math.floor(Math.random() * 3);
        for (var i = 0; i < clusters; i++){
          var r = 9 + Math.random() * 20 + p.gen * 1.4;
          var ox = (Math.random() - 0.5) * 24;
          var oy = (Math.random() - 0.5) * 20;
          var col = palette[Math.floor(Math.random() * palette.length)];
          var g = c.createRadialGradient(p.x + ox, p.y + oy, 0, p.x + ox, p.y + oy, r);
          g.addColorStop(0, hexToRgba(col, .8));
          g.addColorStop(1, hexToRgba(col, 0));
          c.fillStyle = g;
          c.beginPath();
          c.arc(p.x + ox, p.y + oy, r, 0, Math.PI * 2);
          c.fill();
        }
      });
    }

    if (opts.snow){
      canopyPoints.forEach(function(p){
        c.fillStyle = 'rgba(255,255,255,.88)';
        c.beginPath();
        c.ellipse(p.x, p.y - 4, 7 + Math.random() * 6, 3.4 + Math.random() * 3, 0, Math.PI, 0);
        c.fill();
      });
    }

    return canopyPoints;
  }

  /* ---------------- harp (Tessa's birthday) ---------------- */

  function drawHarp(c, colors){
    var x0 = W * 0.09, yBase = H * 0.93;
    var xTop = W * 0.33, yTop = H * 0.13;
    var backC1 = { x: x0 - W * 0.09, y: H * 0.64 };
    var backC2 = { x: x0 - W * 0.015, y: H * 0.27 };

    c.beginPath();
    c.moveTo(x0, yBase);
    c.bezierCurveTo(backC1.x, backC1.y, backC2.x, backC2.y, xTop, yTop);
    c.bezierCurveTo(xTop + W * 0.05, H * 0.155, xTop + W * 0.065, H * 0.21, xTop + W * 0.042, H * 0.29);
    c.bezierCurveTo(x0 + W * 0.1, H * 0.55, x0 + W * 0.086, H * 0.8, x0 + W * 0.09, yBase);
    c.closePath();
    var g = c.createLinearGradient(x0, yBase, xTop, yTop);
    g.addColorStop(0, hexToRgba(colors.crater, .92));
    g.addColorStop(1, hexToRgba(colors.gold, .85));
    c.fillStyle = g;
    c.fill();

    c.strokeStyle = hexToRgba(colors.paper, .65);
    c.lineWidth = 1.1;
    var n = 24;
    for (var i = 1; i < n; i++){
      var t = i / n;
      var top = cubicPoint(x0, yBase, backC1.x, backC1.y, backC2.x, backC2.y, xTop, yTop, 0.1 + t * 0.82);
      var botX = x0 + W * 0.018 + t * (W * 0.058);
      var botY = yBase - t * (yBase - H * 0.22);
      c.beginPath();
      c.moveTo(botX, botY);
      c.lineTo(top.x, top.y);
      c.stroke();
    }
  }

  /* ---------------- DNA helix (Uncertainty's birthday) ---------------- */

  function drawHelix(c, colors){
    var top = H * 0.05, bottom = H * 0.98;
    var cx = W * 0.15, amp = W * 0.085, turns = 4.5, steps = 160;

    function strandPoint(phase, t){
      var y = top + t * (bottom - top);
      var x = cx + Math.sin(t * Math.PI * 2 * turns + phase) * amp;
      return { x: x, y: y };
    }

    c.strokeStyle = hexToRgba(colors.gold, .5);
    c.lineWidth = 2;
    for (var i = 0; i <= 26; i++){
      var t = i / 26;
      var a = strandPoint(0, t), b = strandPoint(Math.PI, t);
      if (Math.abs(a.x - b.x) > amp * 0.4){
        c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
      }
    }

    [0, Math.PI].forEach(function(phase, si){
      c.beginPath();
      for (var i = 0; i <= steps; i++){
        var t = i / steps;
        var p = strandPoint(phase, t);
        if (i === 0) c.moveTo(p.x, p.y); else c.lineTo(p.x, p.y);
      }
      c.strokeStyle = hexToRgba(si === 0 ? colors.rose : colors.wine, .82);
      c.lineWidth = 5;
      c.lineCap = 'round';
      c.stroke();
    });
  }

  /* ---------------- moon, fog, stars, pumpkins, candles ---------------- */

  function drawMoon(c, colors){
    var mx = W * 0.83, my = H * 0.15, r = Math.min(W, H) * 0.052;
    addGlow(c, mx, my, r * 2.4, hexToRgba(colors.gold, .3));
    c.fillStyle = hexToRgba(colors.paper, .95);
    c.beginPath(); c.arc(mx, my, r, 0, Math.PI * 2); c.fill();
    c.fillStyle = hexToRgba(colors.crater, .16);
    [[.3, -.2, .22], [-.25, .15, .16], [.1, .4, .12]].forEach(function(cr){
      c.beginPath(); c.arc(mx + cr[0] * r, my + cr[1] * r, cr[2] * r, 0, Math.PI * 2); c.fill();
    });
  }

  function drawFog(c, colors){
    for (var i = 0; i < 4; i++){
      var y = H * (0.55 + i * 0.1);
      var g = c.createLinearGradient(0, y - 30, 0, y + 30);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(.5, hexToRgba(colors.blush, .3));
      g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g;
      c.fillRect(0, y - 30, W, 60);
    }
  }

  function drawStars(c, colors){
    for (var i = 0; i < 46; i++){
      var x = Math.random() * W, y = Math.random() * H * 0.5;
      c.globalAlpha = 0.25 + Math.random() * 0.6;
      c.fillStyle = hexToRgba(colors.gold, 1);
      c.beginPath(); c.arc(x, y, Math.random() * 1.3 + 0.4, 0, Math.PI * 2); c.fill();
    }
    c.globalAlpha = 1;
  }

  function drawPumpkins(c, colors){
    for (var i = 0; i < 3; i++){
      var x = W * (0.09 + i * 0.055) + Math.random() * 26;
      var y = H * 0.92 - Math.random() * 5;
      var s = 15 + Math.random() * 9;
      c.save();
      c.translate(x, y);
      c.scale(1, .8);
      c.fillStyle = hexToRgba(colors.rose, .9);
      c.beginPath(); c.arc(0, 0, s, 0, Math.PI * 2); c.fill();
      c.strokeStyle = 'rgba(0,0,0,.16)';
      c.lineWidth = s * 0.12;
      [-.6, 0, .6].forEach(function(o){
        c.beginPath(); c.moveTo(o * s, -s * .9); c.quadraticCurveTo(o * s * 1.3, 0, o * s, s * .9); c.stroke();
      });
      c.restore();
      c.fillStyle = hexToRgba(colors.crater, .9);
      c.fillRect(x - 2, y - s * 0.8 - 9, 4, 10);
    }
  }

  function drawBalloons(c, colors){
    var cx = W * 0.83, cy = H * 0.24;
    var offsets = [[-22, 6, 0], [4, -14, 1], [24, 4, 2]];
    var palette = [colors.rose, colors.gold, colors.wine];
    offsets.forEach(function(o){
      var x = cx + o[0], y = cy + o[1], rx = 15, ry = 19;
      c.strokeStyle = hexToRgba(colors.crater, .4);
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(x, y + ry);
      c.quadraticCurveTo(x + 12, y + ry + 46, x - 8, y + ry + 92);
      c.stroke();

      var g = c.createRadialGradient(x - rx * 0.3, y - ry * 0.3, 1, x, y, rx * 1.3);
      var col = palette[o[2] % palette.length];
      g.addColorStop(0, hexToRgba(col, .55));
      g.addColorStop(1, hexToRgba(col, .92));
      c.fillStyle = g;
      c.beginPath();
      c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = hexToRgba(col, .92);
      c.beginPath();
      c.moveTo(x - 3, y + ry);
      c.lineTo(x + 3, y + ry);
      c.lineTo(x, y + ry + 7);
      c.closePath();
      c.fill();
    });
  }

  function drawGarland(c, colors){
    var x0 = W * 0.03, x1 = W * 0.99;
    var y0 = H * 0.1, y1 = H * 0.2, sag = H * 0.09;

    c.strokeStyle = hexToRgba(colors.crater, .3);
    c.lineWidth = 1;
    c.beginPath();
    for (var i = 0; i <= 40; i++){
      var t = i / 40;
      var x = x0 + (x1 - x0) * t;
      var y = y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * sag;
      if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
    }
    c.stroke();

    var n = 15;
    for (var i = 0; i < n; i++){
      var t = (i + 0.5) / n;
      var x = x0 + (x1 - x0) * t;
      var y = y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * sag + 5;
      addGlow(c, x, y, 13, hexToRgba(i % 2 === 0 ? colors.gold : colors.rose, .45));
      c.fillStyle = hexToRgba(i % 2 === 0 ? colors.gold : colors.rose, .95);
      c.beginPath(); c.arc(x, y, 2.4, 0, Math.PI * 2); c.fill();
    }
  }

  // Candle *bodies* are static (baked into the picture below); their
  // flames are lit/unlit, flickering, clickable objects owned by
  // js/interactive-objects.js — this just draws the wax and reports back
  // where each wick is so that file can take over from there.
  function drawCandlesStatic(c, colors){
    var n = 5, baseY = H * 0.96;
    var positions = [];
    for (var i = 0; i < n; i++){
      var cx = W * (0.55 + i * 0.08) + (Math.random() - 0.5) * 10;
      var h = 44 + Math.random() * 38;
      var w = 11 + Math.random() * 5;
      var g = c.createLinearGradient(cx - w / 2, baseY - h, cx + w / 2, baseY);
      g.addColorStop(0, hexToRgba(colors.paper, .95));
      g.addColorStop(1, hexToRgba(colors.blush, .9));
      c.fillStyle = g;
      roundedRect(c, cx - w / 2, baseY - h, w, h, w * 0.3);
      c.fill();
      c.strokeStyle = hexToRgba(colors.gold, .5);
      c.lineWidth = 1;
      c.stroke();
      // a couple of subtle wax-drip runs down the side, for realism
      c.strokeStyle = hexToRgba(colors.blush, .8);
      c.lineWidth = 1.4;
      c.beginPath();
      c.moveTo(cx - w * 0.22, baseY - h * 0.7);
      c.quadraticCurveTo(cx - w * 0.3, baseY - h * 0.4, cx - w * 0.18, baseY - h * 0.12);
      c.stroke();
      positions.push({ x: cx, y: baseY - h - 4, size: 8 + Math.random() * 3 });
    }
    return positions;
  }

  /* ---------------- particle shapes ---------------- */

  function drawPetalShape(c, s){
    c.beginPath();
    c.moveTo(0, -s);
    c.quadraticCurveTo(s * .9, -s * .2, 0, s * .9);
    c.quadraticCurveTo(-s * .9, -s * .2, 0, -s);
    c.fill();
  }

  function drawLeafShape(c, s){
    c.beginPath();
    c.moveTo(0, -s);
    c.quadraticCurveTo(s * .82, -s * .25, 0, s);
    c.quadraticCurveTo(-s * .82, -s * .25, 0, -s);
    c.fill();
    c.strokeStyle = 'rgba(0,0,0,.16)';
    c.lineWidth = 1;
    c.beginPath(); c.moveTo(0, -s * .78); c.lineTo(0, s * .78); c.stroke();
  }

  function drawNoteShape(c, s){
    c.beginPath();
    c.ellipse(-s * .12, s * .7, s * .42, s * .32, -0.3, 0, Math.PI * 2);
    c.fill();
    c.lineWidth = s * 0.14;
    c.beginPath();
    c.moveTo(s * .2, s * .75);
    c.lineTo(s * .2, -s * .9);
    c.stroke();
    c.beginPath();
    c.moveTo(s * .2, -s * .9);
    c.quadraticCurveTo(s * .9, -s * .6, s * .5, -s * .1);
    c.stroke();
  }

  function drawBatShape(c, s, flap){
    c.beginPath();
    c.moveTo(0, 0);
    c.quadraticCurveTo(-s * 1.6, -s * (0.55 + flap), -s * 2.6, -s * 0.2);
    c.quadraticCurveTo(-s * 1.4, s * 0.1, 0, s * 0.3);
    c.quadraticCurveTo(s * 1.4, s * 0.1, s * 2.6, -s * 0.2);
    c.quadraticCurveTo(s * 1.6, -s * (0.55 + flap), 0, 0);
    c.fill();
  }

  /* ---------------- particle engine ---------------- */

  function resetParticle(p, initial){
    p.t = 0;
    switch (p.type){
      case 'petal':
        p.baseX = Math.random() * W;
        p.y = initial ? Math.random() * H : -20 - Math.random() * 40;
        p.vy = 16 + Math.random() * 14;
        p.swayAmp = 18 + Math.random() * 26;
        p.swaySpeed = 0.5 + Math.random() * 0.5;
        p.swayPhase = Math.random() * Math.PI * 2;
        p.size = 6 + Math.random() * 6;
        p.rot = Math.random() * Math.PI * 2;
        p.vrot = (Math.random() - 0.5) * 1.1;
        p.colorKey = Math.random() < 0.5 ? 'rose' : 'blush';
        break;
      case 'snow':
        p.baseX = Math.random() * W;
        p.y = initial ? Math.random() * H : -10 - Math.random() * 30;
        p.vy = 20 + Math.random() * 24;
        p.swayAmp = 8 + Math.random() * 16;
        p.swaySpeed = 0.35 + Math.random() * 0.45;
        p.swayPhase = Math.random() * Math.PI * 2;
        p.size = 2 + Math.random() * 3.2;
        p.opacity = 0.45 + Math.random() * 0.5;
        break;
      case 'note':
        p.baseX = W * 0.12 + Math.random() * W * 0.5;
        p.y = initial ? H * 0.2 + Math.random() * H * 0.65 : H + 24 + Math.random() * 40;
        p.vy = -(12 + Math.random() * 14);
        p.swayAmp = 10 + Math.random() * 16;
        p.swaySpeed = 0.45 + Math.random() * 0.4;
        p.swayPhase = Math.random() * Math.PI * 2;
        p.size = 12 + Math.random() * 7;
        p.rot = Math.random() * 0.5 - 0.25;
        p.opacity = 0.5 + Math.random() * 0.4;
        break;
      case 'leaf':
        p.baseX = Math.random() * W;
        p.y = initial ? Math.random() * H : -20 - Math.random() * 40;
        p.vy = 11 + Math.random() * 12;
        p.swayAmp = 24 + Math.random() * 24;
        p.swaySpeed = 0.45 + Math.random() * 0.45;
        p.swayPhase = Math.random() * Math.PI * 2;
        p.size = 9 + Math.random() * 7;
        p.rot = Math.random() * Math.PI * 2;
        p.vrot = (Math.random() - 0.5) * 1.4;
        break;
      case 'firefly':
        p.baseX = W * 0.05 + Math.random() * W * 0.9;
        p.baseY = H * 0.35 + Math.random() * H * 0.55;
        p.angle = Math.random() * Math.PI * 2;
        p.orbitR = 16 + Math.random() * 34;
        p.speed = 0.3 + Math.random() * 0.4;
        p.size = 1.6 + Math.random() * 1.8;
        p.twinklePhase = Math.random() * Math.PI * 2;
        break;
      case 'bat':
        p.baseX = initial ? Math.random() * W : -60;
        p.y = H * 0.06 + Math.random() * H * 0.32;
        p.vx = 26 + Math.random() * 24;
        p.swayAmp = 12 + Math.random() * 10;
        p.swaySpeed = 1.6 + Math.random() * 1.6;
        p.swayPhase = Math.random() * Math.PI * 2;
        p.size = 9 + Math.random() * 7;
        break;
    }
  }

  function stepParticle(p, dt){
    p.t += dt;
    switch (p.type){
      case 'petal': case 'leaf': case 'snow':
        p.y += p.vy * dt;
        p.rot = (p.rot || 0) + (p.vrot || 0) * dt;
        if (p.y > H + 20) resetParticle(p, false);
        break;
      case 'note':
        p.y += p.vy * dt;
        if (p.y < -30) resetParticle(p, false);
        break;
      case 'bat':
        p.baseX += p.vx * dt;
        if (p.baseX > W + 60) resetParticle(p, false);
        break;
      case 'firefly':
        p.angle += p.speed * dt;
        break;
    }
  }

  function drawParticle(c, p, colors){
    var x, y;
    switch (p.type){
      case 'petal':
      case 'leaf':
        x = p.baseX + Math.sin(p.swayPhase + p.t * p.swaySpeed) * p.swayAmp;
        c.save();
        c.translate(x, p.y);
        c.rotate(p.rot);
        c.fillStyle = hexToRgba(p.type === 'leaf' ? colors.crater : (colors[p.colorKey] || colors.rose), .85);
        if (p.type === 'petal') drawPetalShape(c, p.size); else drawLeafShape(c, p.size);
        c.restore();
        break;
      case 'snow':
        x = p.baseX + Math.sin(p.swayPhase + p.t * p.swaySpeed) * p.swayAmp;
        c.globalAlpha = p.opacity;
        c.fillStyle = '#FFFFFF';
        c.beginPath(); c.arc(x, p.y, p.size, 0, Math.PI * 2); c.fill();
        c.globalAlpha = 1;
        break;
      case 'note':
        x = p.baseX + Math.sin(p.swayPhase + p.t * p.swaySpeed) * p.swayAmp;
        c.save();
        c.globalAlpha = p.opacity;
        c.translate(x, p.y);
        c.rotate(p.rot);
        c.fillStyle = hexToRgba(colors.wine, .9);
        c.strokeStyle = hexToRgba(colors.wine, .9);
        drawNoteShape(c, p.size);
        c.restore();
        c.globalAlpha = 1;
        break;
      case 'firefly':
        x = p.baseX + Math.cos(p.angle) * p.orbitR;
        y = p.baseY + Math.sin(p.angle * 1.3) * p.orbitR * 0.6;
        var tw = 0.35 + 0.65 * Math.abs(Math.sin(p.angle * 2 + p.twinklePhase));
        // fireflies glow brighter and wider in a soft halo when the
        // pointer (mouse or touch) comes near them
        var haloBoost = 0;
        var ptr = window.SceneInteractive && SceneInteractive.getPointer();
        if (ptr && ptr.active){
          var pd = Math.hypot(x - ptr.x, y - ptr.y);
          if (pd < 90) haloBoost = (1 - pd / 90);
        }
        c.globalAlpha = Math.min(1, tw + haloBoost * 0.6);
        var glowR = p.size * (4 + haloBoost * 5);
        var g = c.createRadialGradient(x, y, 0, x, y, glowR);
        g.addColorStop(0, hexToRgba(colors.gold, 1));
        g.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = g;
        c.beginPath(); c.arc(x, y, glowR, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#FFF6DE';
        c.beginPath(); c.arc(x, y, p.size * (1 + haloBoost * 0.5), 0, Math.PI * 2); c.fill();
        c.globalAlpha = 1;
        break;
      case 'bat':
        y = p.y + Math.sin(p.swayPhase + p.t * p.swaySpeed) * p.swayAmp;
        c.save();
        c.translate(p.baseX, y);
        c.fillStyle = hexToRgba(colors.wine, .85);
        drawBatShape(c, p.size, Math.sin(p.t * 10) * 0.5);
        c.restore();
        break;
    }
  }

  function populateParticles(type){
    particles = [];
    var count = (type === 'firefly') ? 16 : (type === 'bat' ? 6 : 42);
    for (var i = 0; i < count; i++){
      var p = { type: type };
      resetParticle(p, true);
      particles.push(p);
    }
  }

  /* ---------------- scene build + main loop ---------------- */

  function buildStaticScene(){
    if (!staticCtx) return;
    currentColors = readThemeColors();
    var cfg = SCENES[currentSceneKey] || SCENES['default'];
    var candlePositions = [];

    staticCtx.clearRect(0, 0, W, H);
    drawSky(staticCtx, currentColors);
    drawGround(staticCtx, currentColors);

    switch (cfg.feature){
      case 'cherryTree': drawTree(staticCtx, currentColors, {}); break;
      case 'bareTree': drawTree(staticCtx, currentColors, { bare: true }); break;
      case 'snowTree': drawTree(staticCtx, currentColors, { bare: true, snow: true }); break;
      case 'harp': drawHarp(staticCtx, currentColors); break;
      case 'helix': drawHelix(staticCtx, currentColors); break;
    }

    (cfg.extras || []).forEach(function(extra){
      if (extra === 'moon') drawMoon(staticCtx, currentColors);
      if (extra === 'fog') drawFog(staticCtx, currentColors);
      if (extra === 'stars') drawStars(staticCtx, currentColors);
      if (extra === 'pumpkins') drawPumpkins(staticCtx, currentColors);
      if (extra === 'candles') candlePositions = drawCandlesStatic(staticCtx, currentColors);
      if (extra === 'balloons') drawBalloons(staticCtx, currentColors);
      if (extra === 'garland') drawGarland(staticCtx, currentColors);
    });

    populateParticles(reducedMotion ? null : cfg.particle);

    if (window.SceneInteractive) SceneInteractive.setup(currentSceneKey, { W: W, H: H }, candlePositions);
  }

  function loop(now){
    rafId = requestAnimationFrame(loop);
    var dt = Math.min((now - lastTime) / 1000, 0.05) || 0;
    lastTime = now;
    if (!ctx || !staticCanvas || !W || !H) return;

    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(staticCanvas, 0, 0, W, H);

    if (!reducedMotion){
      for (var i = 0; i < particles.length; i++){
        stepParticle(particles[i], dt);
        drawParticle(ctx, particles[i], currentColors);
      }
    }

    if (window.SceneInteractive){
      if (!reducedMotion) SceneInteractive.update(dt);
      SceneInteractive.draw(currentColors);
    }
  }

  function resize(){
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth || document.documentElement.clientWidth || 0;
    H = window.innerHeight || document.documentElement.clientHeight || 0;
    if (!W || !H) return; // nothing to size yet — a later resize/retry will catch up
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    staticCanvas.width = W * DPR;
    staticCanvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    staticCtx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  var handleResize = debounce(function(){ resize(); buildStaticScene(); }, 180);

  // Some environments report a 0×0 viewport for the first frame or two
  // (e.g. before the tab has finished laying out). Keep retrying on the
  // next animation frame until we get a real size — the loop itself
  // never starts until then, so nothing tries to draw a blank canvas.
  function waitForSize(attemptsLeft){
    if (attemptsLeft <= 0) return;
    requestAnimationFrame(function(){
      resize();
      if (W && H){ buildStaticScene(); startLoop(); return; }
      waitForSize(attemptsLeft - 1);
    });
  }

  function startLoop(){
    if (rafId || !W || !H) return;
    lastTime = performance.now();
    rafId = requestAnimationFrame(loop);
  }

  // A smooth approximation of the wavy ground line drawn in drawGround(),
  // so interactive-objects.js can land thrown things at the right height
  // without needing to know how that curve is actually drawn.
  function groundYAt(x){
    var groundY = H * 0.87;
    var pts = [[0, groundY + 16], [0.25 * W, groundY - 12], [0.55 * W, groundY + 8], [0.8 * W, groundY + 20], [W, groundY - 6]];
    if (x <= pts[0][0]) return pts[0][1];
    if (x >= pts[pts.length - 1][0]) return pts[pts.length - 1][1];
    for (var i = 0; i < pts.length - 1; i++){
      if (x >= pts[i][0] && x <= pts[i + 1][0]){
        var t = (x - pts[i][0]) / (pts[i + 1][0] - pts[i][0]);
        var smooth = t * t * (3 - 2 * t);
        return pts[i][1] + (pts[i + 1][1] - pts[i][1]) * smooth;
      }
    }
    return groundY;
  }

  window.Scenery = {
    init: function(canvasEl){
      canvas = canvasEl;
      ctx = canvas.getContext('2d');
      staticCanvas = document.createElement('canvas');
      staticCtx = staticCanvas.getContext('2d');
      // SceneInteractive owns its own separate, higher-stacked canvas
      // (#fgInteractive) — see js/interactive-objects.js and script.js —
      // it is not initialized with this (background) canvas.
      window.addEventListener('resize', handleResize);
      resize();
      if (W && H){
        buildStaticScene();
        startLoop();
      } else {
        waitForSize(90);
      }
    },
    setReducedMotion: function(v){
      reducedMotion = !!v;
      buildStaticScene();
    },
    setScene: function(occasionKey){
      currentSceneKey = occasionKey || 'default';
      if (!canvas) return;
      buildStaticScene();
    },
    groundYAt: groundYAt
  };
})();
