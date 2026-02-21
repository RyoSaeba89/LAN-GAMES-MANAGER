/* ================================================================
   utils.js — FONCTIONS UTILITAIRES
   ================================================================
   Petites fonctions "couteau suisse" réutilisées partout :
   - Générer un identifiant unique
   - Formater une taille en octets → Ko/Mo/Go
   - Échapper le HTML (sécurité contre le XSS)
   - Afficher une notification "toast"
   - Fermer une modale
   - Anti-rebond (debounce) pour la recherche
   
   POUR UN DÉBUTANT :
   Ces fonctions sont "pures" — elles ne touchent pas à la base
   de données et n'ont pas d'effets de bord complexes.
   Elles sont utilisées par les autres fichiers JS.
   ================================================================ */
/* [FIX-1] IIFE — tout le contenu est isolé du scope global */
(function () {
  'use strict';

  /* [FIX-1] Namespace unique — toutes les vars restent locales */
  window.LGM = window.LGM || {};

  // --- Variables d'état partagées ---
  // Accessibles par les autres IIFE via LGM._state
  var state = {
    activeFilter: null,      // Genre sélectionné dans les filtres (null = tous)
    sortMode:     'name',    // Mode de tri actuel : 'name' ou 'size'
    sortDir:      'asc',     // Direction du tri : 'asc' (croissant) ou 'desc'
    pendingValidation: [],   // Jeux en attente de validation après un scan
    renderTimer:  null       // Timer pour le debounce de la recherche
  };

  /* [FIX-1] Exposer l'état partagé pour les autres fichiers */
  window.LGM._state = state;


  /**
   * Génère un identifiant unique pour un jeu.
   * Combine le timestamp en base 36 + des caractères aléatoires.
   * Exemple : "g_lxk5f2abc"
   * 
   * @returns {string} Un ID unique
   */
  function genId() {
    return 'g_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }


  /**
   * Convertit une taille en octets vers un format lisible.
   * 
   * @param {number} b - Taille en octets
   * @returns {string} Taille formatée (ex: "1.5 Go", "256 Mo")
   */
  function formatSize(b) {
    if (!b || b === 0) return '0 Mo';
    if (b < 1024 ** 2) return (b / 1024).toFixed(0) + ' Ko';
    if (b < 1024 ** 3) return (b / (1024 ** 2)).toFixed(1) + ' Mo';
    return (b / (1024 ** 3)).toFixed(2) + ' Go';
  }


  /**
   * Échappe les caractères HTML dangereux dans une chaîne.
   * Empêche les attaques XSS (injection de script malveillant).
   */
  function esc(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }


  /**
   * Affiche une notification éphémère en bas à droite de l'écran.
   * Elle disparaît automatiquement après 3 secondes.
   */
  function toast(msg) {
    var old = document.querySelector('.toast');
    if (old) old.remove();
    var el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function () { el.remove(); }, 3000);
  }


  /**
   * Ferme une modale en la masquant.
   * @param {string} id - L'id HTML de la modale (ex: 'gameModal')
   */
  function closeModal(id) {
    document.getElementById(id).style.display = 'none';
  }


  /**
   * Lance le rendu des jeux avec un léger délai (debounce).
   * Évite de re-rendre 60 fois par seconde quand on tape vite
   * dans la barre de recherche.
   */
  function debouncedRender() {
    clearTimeout(state.renderTimer);
    state.renderTimer = setTimeout(function () { LGM.renderGames(); }, 60);
  }


  /**
   * Met à jour la barre de progression de l'écran de chargement.
   * Déclaré ici (utils.js) car db.js en a besoin au démarrage,
   * et utils.js est chargé avant db.js.
   */
  function setLoad(pct, msg) {
    document.getElementById('loadBar').style.width = pct + '%';
    document.getElementById('loadStatus').textContent = msg;
  }


  /* [FIX-1] Exposition publique — uniquement ce qui est appelé depuis
     index.html ou par d'autres fichiers via LGM.xxx */
  LGM.setLoad      = setLoad;
  LGM.genId        = genId;
  LGM.formatSize   = formatSize;
  LGM.esc         = esc;
  LGM.toast       = toast;
  LGM.closeModal  = closeModal;
  LGM.debouncedRender = debouncedRender;

})();
