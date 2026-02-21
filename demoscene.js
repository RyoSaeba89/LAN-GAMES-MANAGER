/* ================================================================
   demoscene.js — SCROLLTEXT ANIMÉ STYLE AMIGA
   ================================================================
   Affiche un texte défilant avec une ondulation sinusoïdale
   et un dégradé de couleurs arc-en-ciel. Inspiré des "intros"
   et "démos" de la scène Amiga/Atari des années 80-90.

   POUR UN DÉBUTANT :
   - requestAnimationFrame() demande au navigateur de rappeler
     notre fonction drawFrame() ~60 fois par seconde
   - Math.sin() crée l'effet d'ondulation (une vague)
   - Le HSL (teinte, saturation, luminosité) crée l'arc-en-ciel
   ================================================================ */
(function() {
  // Récupérer le canvas dans le header
  var canvas = document.getElementById('demosceneCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');

  var W, H;             // Dimensions du canvas
  var animId = null;     // ID de l'animation (pour pouvoir l'annuler)

  // Le texte qui défile (avec des bullets décoratives)
  var text = '        LAN GAMES MANAGER by Ryo  \u2022\u2022\u2022  Welcome to the ultimate LAN party archive!  \u2022\u2022\u2022  Powered by SQLite WASM  \u2022\u2022\u2022  Greetings to all LAN warriors!  \u2022\u2022\u2022  ';
  var charW = 16;     // Largeur de chaque caractère (espacement horizontal)
  var speed = 1.6;    // Vitesse de défilement (pixels/frame)
  var scrollX = 0;    // Position X actuelle du texte

  /**
   * Ajuste la taille du canvas quand la fenêtre est redimensionnée.
   * Gère aussi le DPR (Device Pixel Ratio) pour les écrans Retina.
   */
  function resize() {
    var rect = canvas.parentElement.getBoundingClientRect();
    var dpr = window.devicePixelRatio || 1;
    W = rect.width;
    H = 60;
    // Le canvas a une taille "interne" (résolution) et une taille "affichée" (CSS)
    canvas.width  = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (scrollX === 0) scrollX = W; // Commencer hors-écran à droite
  }

  /**
   * Dessine un frame de l'animation.
   * Appelé ~60 fois par seconde par requestAnimationFrame().
   */
  function drawFrame() {
    if (!W) resize();
    ctx.clearRect(0, 0, W, H); // Effacer le frame précédent

    var time = performance.now() * 0.003; // Horloge pour les oscillations

    // Dessiner chaque caractère du texte
    for (var i = 0; i < text.length; i++) {
      var x = scrollX + i * charW;
      if (x < -charW || x > W + charW) continue; // Hors écran → skip

      // Calcul de la position Y (deux sinusoïdes superposées = ondulation complexe)
      var wave  = Math.sin(time + i * 0.35) * 14;
      var wave2 = Math.sin(time * 0.7 + i * 0.2) * 5;
      var y = H / 2 + wave + wave2;

      // Couleur arc-en-ciel qui change avec le temps et la position
      var hue = (time * 30 + i * 12) % 360;
      var sat = 80 + Math.sin(time + i * 0.5) * 20;

      ctx.save();
      ctx.font = 'bold 18px "Segoe UI", "Helvetica Neue", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Première couche : ombre colorée (glow)
      ctx.shadowColor = 'hsl(' + hue + ',' + sat + '%,55%)';
      ctx.shadowBlur = 8;
      ctx.fillStyle = 'hsl(' + hue + ',' + sat + '%,72%)';
      ctx.fillText(text[i], x, y);

      // Deuxième couche : texte plus clair par-dessus (éclat)
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'hsl(' + hue + ',' + sat + '%,92%)';
      ctx.fillText(text[i], x, y);

      ctx.restore();
    }

    // Faire défiler le texte vers la gauche
    scrollX -= speed;
    // Si le texte est sorti à gauche, le remettre à droite
    if (scrollX < -text.length * charW) scrollX = W;

    animId = requestAnimationFrame(drawFrame);
  }

  // Redimensionner quand la fenêtre change de taille
  window.addEventListener('resize', resize);

  // Démarrer l'animation quand l'app devient visible
  var obs = new MutationObserver(function() {
    var app = document.getElementById('app');
    if (app && app.style.display !== 'none') {
      obs.disconnect();
      resize();
      drawFrame();
    }
  });
  obs.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['style'] });

  // Fallback : si l'observateur ne se déclenche pas, démarrer après 1.5s
  setTimeout(function() { if (!animId) { resize(); drawFrame(); } }, 1500);
})();
