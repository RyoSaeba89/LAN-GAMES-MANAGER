/* ================================================================
   stats.js — GRAPHIQUES STATISTIQUES (camembert & histogramme)
   ================================================================
   Dessine des graphiques dans un <canvas> HTML5 sans librairie.
   Tout est fait "à la main" avec l'API Canvas 2D.
   ================================================================ */
/* [FIX-1] IIFE — tout le contenu est isolé du scope global */
(function () {
  'use strict';

  var LGM = window.LGM;

  var chartMode = 'pie';

  var TYPE_COLORS = {
    'Action':'#ff4444','Aventure':'#e091ff','Course':'#00ffff','FPS':'#ff2d95',
    'Jeu de plateau':'#ce93d8','MOBA':'#ff6b35','RPG':'#b026ff','RTS':'#ffe14d',
    'Sandbox':'#69f0ae','Simulation':'#64b5f6','Sport':'#3ddc84','Tower Defense':'#ffab40',
    'TPS':'#ff7eb3','Autre':'#888'
  };

  function openStatsModal() {
    if (!LGM.getGames().length) { LGM.toast('Aucun jeu à analyser'); return; }
    renderStatsGlobal();
    document.getElementById('statsModal').style.display = 'flex';
    requestAnimationFrame(function () { renderStatsChart(); });
  }

  function setChartMode(mode) {
    chartMode = mode;
    document.getElementById('chartPieBtn').style.borderColor = mode === 'pie' ? 'var(--neon-yellow)' : 'var(--panel-border)';
    document.getElementById('chartPieBtn').style.color = mode === 'pie' ? 'var(--neon-yellow)' : 'var(--text-secondary)';
    document.getElementById('chartBarBtn').style.borderColor = mode === 'bar' ? 'var(--neon-yellow)' : 'var(--panel-border)';
    document.getElementById('chartBarBtn').style.color = mode === 'bar' ? 'var(--neon-yellow)' : 'var(--text-secondary)';
    renderStatsChart();
  }

  function renderStatsGlobal() {
    var gamesCache = LGM.getGames();
    var total = gamesCache.length;
    var totalSize = gamesCache.reduce(function (s, g) { return s + (g.size || 0); }, 0);
    var totalPlayers = gamesCache.reduce(function (s, g) { return s + (g.players || 0); }, 0);
    var types = new Set(gamesCache.map(function (g) { return g.type; })).size;
    var avgSize = total ? totalSize / total : 0;
    var biggest = total ? gamesCache.reduce(function (a, b) { return (a.size || 0) > (b.size || 0) ? a : b; }) : null;
    var el = document.getElementById('statsGlobal');
    el.innerHTML = [
      ['Jeux', total, 'var(--neon-cyan)'],
      ['Genres', types, 'var(--neon-pink)'],
      ['Taille totale', LGM.formatSize(totalSize), 'var(--neon-cyan)'],
      ['Taille moyenne', LGM.formatSize(avgSize), '#64b5f6'],
      ['Joueurs cumulés', totalPlayers, '#3ddc84'],
      ['Plus gros jeu', biggest ? biggest.name.slice(0, 18) : '—', 'var(--neon-yellow)']
    ].map(function (row) {
      return '<div style="background:rgba(0,0,0,0.3);border:1px solid var(--panel-border);padding:0.6rem 0.8rem;text-align:center">' +
        '<div style="font-family:var(--ff-display);font-size:1rem;font-weight:700;color:' + row[2] + '">' + row[1] + '</div>' +
        '<div style="font-size:0.7rem;color:var(--text-dim);text-transform:uppercase;letter-spacing:1px;margin-top:0.2rem">' + row[0] + '</div>' +
      '</div>';
    }).join('');
  }

  function renderStatsChart() {
    var gamesCache = LGM.getGames();
    var canvas = document.getElementById('statsCanvas');
    var ctx = canvas.getContext('2d');
    var dpr = window.devicePixelRatio || 1;
    var rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var W = rect.width, H = rect.height;
    ctx.clearRect(0, 0, W, H);

    var dataType = document.getElementById('statsDataSelect').value;
    var data = {};
    var title = '';

    if (dataType === 'type') {
      title = 'Nombre de jeux par genre';
      gamesCache.forEach(function (g) { data[g.type] = (data[g.type] || 0) + 1; });
    } else if (dataType === 'size') {
      title = 'Taille totale par genre (Go)';
      gamesCache.forEach(function (g) { data[g.type] = (data[g.type] || 0) + (g.size || 0); });
      Object.keys(data).forEach(function (k) { data[k] = +(data[k] / (1024 * 1024 * 1024)).toFixed(2); });
    } else if (dataType === 'players') {
      title = 'Jeux par tranche de joueurs';
      gamesCache.forEach(function (g) {
        var p = g.players || 0;
        var bucket;
        if (p === 0) bucket = 'Non défini';
        else if (p <= 2) bucket = '1-2';
        else if (p <= 4) bucket = '3-4';
        else if (p <= 8) bucket = '5-8';
        else if (p <= 16) bucket = '9-16';
        else if (p <= 32) bucket = '17-32';
        else bucket = '33+';
        data[bucket] = (data[bucket] || 0) + 1;
      });
    }

    var entries = Object.entries(data).sort(function (a, b) { return b[1] - a[1]; });
    var bucketColors = {'Non défini':'#666','1-2':'#ff2d95','3-4':'#b026ff','5-8':'#0ff','9-16':'#ffe14d','17-32':'#3ddc84','33+':'#ff6b35'};
    var colors = entries.map(function (e) {
      var k = e[0];
      return TYPE_COLORS[k] || bucketColors[k] || 'hsl(' + ([].reduce.call(k, function (a, c) { return a + c.charCodeAt(0); }, 0) % 360) + ',70%,60%)';
    });

    ctx.fillStyle = '#e0e0ff';
    ctx.font = '700 15px "Segoe UI", Roboto, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, Math.round(W / 2), 22);

    if (chartMode === 'pie') { drawPie(ctx, entries, colors, W, H); }
    else { drawBar(ctx, entries, colors, W, H); }

    var legend = document.getElementById('statsLegend');
    legend.innerHTML = entries.map(function (e, i) {
      return '<span style="display:flex;align-items:center;gap:0.3rem"><span style="width:10px;height:10px;background:' + colors[i] + ';display:inline-block;border-radius:2px"></span><span style="color:' + colors[i] + ';font-family:var(--ff-mono)">' + e[0] + '</span> <span style="color:var(--text-dim)">' + e[1] + '</span></span>';
    }).join('');
  }

  function drawPie(ctx, entries, colors, W, H) {
    var total = entries.reduce(function (s, e) { return s + e[1]; }, 0);
    var cx = Math.round(W / 2), cy = Math.round(H / 2 + 15), r = Math.min(W, H) * 0.35;
    var angle = -Math.PI / 2;
    entries.forEach(function (entry, i) {
      var val = entry[1];
      var slice = (val / total) * Math.PI * 2;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, angle, angle + slice); ctx.closePath();
      ctx.fillStyle = colors[i]; ctx.globalAlpha = 0.85; ctx.fill();
      ctx.globalAlpha = 1; ctx.strokeStyle = '#0a0a1a'; ctx.lineWidth = 2; ctx.stroke();
      if (slice > 0.15) {
        var mid = angle + slice / 2;
        ctx.fillStyle = '#fff'; ctx.font = '700 13px "Segoe UI", Roboto, Arial, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(val, Math.round(cx + Math.cos(mid) * r * 0.65), Math.round(cy + Math.sin(mid) * r * 0.65));
      }
      angle += slice;
    });
  }

  function drawBar(ctx, entries, colors, W, H) {
    var margin = { top: 40, right: 20, bottom: 70, left: 55 };
    var cw = W - margin.left - margin.right, ch = H - margin.top - margin.bottom;
    var n = entries.length; if (!n) return;
    var barW = Math.min(50, (cw / n) * 0.7);
    var gap = (cw - barW * n) / (n + 1);
    var maxVal = Math.max.apply(null, entries.map(function (e) { return e[1]; }).concat([1]));

    ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1;
    for (var j = 0; j <= 4; j++) {
      var gy = Math.round(margin.top + ch - (ch / 4) * j) + 0.5;
      ctx.beginPath(); ctx.moveTo(margin.left, gy); ctx.lineTo(W - margin.right, gy); ctx.stroke();
      ctx.fillStyle = '#666'; ctx.font = '700 12px "Segoe UI", Roboto, Arial, sans-serif';
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.fillText(Math.round(maxVal / 4 * j), margin.left - 8, Math.round(gy));
    }

    entries.forEach(function (entry, i) {
      var label = entry[0], val = entry[1];
      var x = Math.round(margin.left + gap + i * (barW + gap));
      var barH = (val / maxVal) * ch, y = Math.round(margin.top + ch - barH);
      ctx.fillStyle = colors[i]; ctx.globalAlpha = 0.85;
      ctx.fillRect(x, y, Math.round(barW), Math.round(barH)); ctx.globalAlpha = 1;
      ctx.fillStyle = colors[i]; ctx.font = '700 13px "Segoe UI", Roboto, Arial, sans-serif';
      ctx.textAlign = 'center'; ctx.fillText(val, Math.round(x + barW / 2), y - 6);
      ctx.save();
      ctx.translate(Math.round(x + barW / 2), Math.round(margin.top + ch + 6));
      ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = '#aaa'; ctx.font = '600 11px "Segoe UI", Roboto, Arial, sans-serif';
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.fillText(label.length > 14 ? label.slice(0, 13) + '…' : label, 0, 0);
      ctx.restore();
    });
  }

  /* [FIX-1] Exposition publique */
  LGM.openStatsModal   = openStatsModal;
  LGM.setChartMode     = setChartMode;
  LGM.renderStatsChart = renderStatsChart;

})();
