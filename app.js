/* ================================================================
   app.js — POINT D'ENTRÉE DE L'APPLICATION
   ================================================================
   Ce fichier orchestre le démarrage de l'application :
   1. Charge le moteur SQLite (WASM)
   2. Initialise une base vide
   3. Affiche l'interface
   4. Tente de charger les polices Google Fonts

   C'est le DERNIER script chargé dans index.html.
   Toutes les fonctions des autres fichiers sont déjà disponibles.

   POUR UN DÉBUTANT :
   La fonction init() est "async" (asynchrone) car certaines
   étapes prennent du temps (télécharger le WASM, etc.).
   Le mot-clé "await" met la fonction en pause jusqu'à ce que
   l'opération soit terminée, SANS bloquer le navigateur.
   ================================================================ */
/* [FIX-1] IIFE — tout le contenu est isolé du scope global */
(function () {
  'use strict';

  var LGM = window.LGM;

  /* ================================================================
     SECTION 1 : BARRE DE PROGRESSION
     ================================================================ */

  /* setLoad() est défini dans utils.js (chargé avant db.js) */


  /* ================================================================
     SECTION 2 : INITIALISATION PRINCIPALE
     ================================================================ */

  /**
   * [FIX-3] Gestion d'erreurs avec bouton Réessayer et fallback gamesCache = []
   */
  async function init() {
    try {
      await LGM.loadSQLJS();

      LGM.setLoad(55, 'Initialisation base vide...');
      LGM.loadDBFromCache();

      LGM.setLoad(70, 'Lecture...');

      /* [FIX-3] try/catch séparé sur sqlSelectAll — ne pas planter toute l'app */
      try {
        LGM.setGames(LGM.sqlSelectAll() || []);  /* [FIX-3] jamais undefined */
      } catch (dbErr) {
        console.error('[LGM SQL] sqlSelectAll:', dbErr);
        LGM.setGames([]);  /* [FIX-3] état dégradé mais stable */
        LGM.toast('⚠ Base de données vide (erreur lecture)');
      }

      LGM.setLoad(90, 'Rendu...');
      document.getElementById('app').style.display = '';
      LGM.renderGames();

      tryLoadFonts();

      LGM.setLoad(100, 'Prêt — Chargez un fichier .sqlite');
      setTimeout(function () {
        document.getElementById('loading').classList.add('hide');
        setTimeout(function () { document.getElementById('loading').remove(); }, 500);
      }, 400);

    } catch (err) {
      console.error('[LGM INIT]', err);
      LGM.setLoad(100, '⚠ ' + err.message);

      /* [FIX-3] Bouton "Réessayer" au lieu d'un texte mort */
      var retryBtn = document.createElement('button');
      retryBtn.className = 'btn btn-primary';
      retryBtn.style.marginTop = '1rem';
      retryBtn.textContent = '↺ Réessayer';
      retryBtn.onclick = function () { location.reload(); };
      document.getElementById('loading').appendChild(retryBtn);
    }
  }


  /* ================================================================
     SECTION 3 : CHARGEMENT OPTIONNEL DES POLICES
     ================================================================ */

  function tryLoadFonts() {
    try {
      var l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Rajdhani:wght@300;400;500;600;700&family=Share+Tech+Mono&display=swap';
      l.onerror = function () {};
      document.head.appendChild(l);
    } catch (e) { /* polices système suffisent */ }
  }


  /* ================================================================
     SECTION 4 : LANCEMENT !
     ================================================================ */

  init();

})();
