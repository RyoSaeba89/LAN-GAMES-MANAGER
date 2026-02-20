/* ================================================================
   scanner.js — SCAN DE DOSSIER + DÉTECTION AUTO DE GENRE
   ================================================================
   Ce fichier gère :
   - Le scan d'un dossier local via l'API File/Directory
   - La détection du genre à partir du nom du sous-dossier
   - L'écran de validation (cocher/décocher les jeux à importer)

   POUR UN DÉBUTANT :
   L'attribut "webkitdirectory" sur un <input type="file"> permet
   de sélectionner un DOSSIER entier au lieu d'un seul fichier.
   Le navigateur retourne la liste de TOUS les fichiers récursivement.
   On analyse les chemins pour détecter les jeux et leurs genres.
   ================================================================ */
/* [FIX-1] IIFE — tout le contenu est isolé du scope global */
(function () {
  'use strict';

  var LGM   = window.LGM;
  var state  = LGM._state;


  /* ================================================================
     SECTION 1 : SCAN DE DOSSIER
     ================================================================ */

  function handleFolderScan(event) {
    var files = Array.from(event.target.files);
    if (!files.length) return;

    var status = document.getElementById('scanStatus');
    status.style.display = 'block';
    status.textContent = '⏳ Analyse de ' + files.length + ' fichiers...';

    setTimeout(function () {
      var folderMap = {};
      var rootDir = (files[0] && files[0].webkitRelativePath) ? files[0].webkitRelativePath.split('/')[0] : 'Unknown';

      for (var i = 0; i < files.length; i++) {
        var p = files[i].webkitRelativePath.split('/');
        if (p.length >= 4) {
          var cat = p[1], gn = p[2];
          if (cat[0] === '.' || gn[0] === '.') continue;
          var key2 = 'd2:' + cat + '/' + gn;
          if (!folderMap[key2]) folderMap[key2] = { name: gn, path: rootDir + '/' + cat + '/' + gn, category: cat, size: 0, depth: 2 };
          folderMap[key2].size += files[i].size;
        }
        if (p.length >= 3) {
          var sub = p[1];
          if (sub[0] === '.') continue;
          var key1 = 'd1:' + sub;
          if (!folderMap[key1]) folderMap[key1] = { name: sub, path: rootDir + '/' + sub, category: '', size: 0, depth: 1 };
          folderMap[key1].size += files[i].size;
        }
      }

      var d2 = Object.entries(folderMap).filter(function (e) { return e[0].startsWith('d2:'); });
      var d1 = Object.entries(folderMap).filter(function (e) { return e[0].startsWith('d1:'); });

      var results;
      if (d2.length > 0) {
        results = d2.map(function (e) { return e[1]; });
      } else if (d1.length > 0) {
        results = d1.map(function (e) { return e[1]; });
      } else {
        results = [{ name: rootDir, path: rootDir, category: '', size: files.reduce(function (s, f) { return s + f.size; }, 0), depth: 0 }];
      }

      results.sort(function (a, b) { return a.name.localeCompare(b.name); });

      var gamesCache = LGM.getGames();
      var existingNames = new Set(gamesCache.map(function (g) { return g.name.toLowerCase(); }));
      var newR = results.filter(function (r) { return !existingNames.has(r.name.toLowerCase()); });

      var withCat = newR.filter(function (r) { return r.category; }).length;
      status.innerHTML = '✓ ' + results.length + ' dossier(s), ' + newR.length + ' nouveau(x)<br>' +
        '<span style="color:#50ffff">' + withCat + ' avec catégorie détectée depuis le sous-dossier</span>';

      if (!newR.length) { LGM.toast('Tous les jeux sont déjà dans la base'); return; }

      state.pendingValidation = newR.map(function (f) {
        return {
          id: LGM.genId(), name: f.name,
          type: f.category ? guessTypeFromCategory(f.category) : 'Autre',
          size: f.size, path: f.path, category: f.category || '',
          players: 0, version: '', selected: true, addedAt: Date.now()
        };
      });

      LGM.closeModal('scanModal');
      openValidateModal();
      event.target.value = '';
    }, 30);
  }


  /* ================================================================
     SECTION 2 : DÉTECTION AUTOMATIQUE DU GENRE
     ================================================================ */

  function guessTypeFromCategory(cat) {
    if (!cat) return 'Autre';
    var c = cat.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    var exact = {
      'fps':'FPS','tps':'TPS','action':'Action','course':'Course','racing':'Course',
      'rts':'RTS','strategie':'RTS','strategy':'RTS','rpg':'RPG','role':'RPG',
      'aventure':'Aventure','adventure':'Aventure','sport':'Sport','sports':'Sport',
      'moba':'MOBA','simulation':'Simulation','sim':'Simulation','simulateur':'Simulation',
      'tower defense':'Tower Defense','tower_defense':'Tower Defense','towerdefense':'Tower Defense','td':'Tower Defense',
      'sandbox':'Sandbox','bac a sable':'Sandbox',
      'plateau':'Jeu de plateau','jeu de plateau':'Jeu de plateau','board':'Jeu de plateau',
      'boardgame':'Jeu de plateau','board game':'Jeu de plateau',
      'autre':'Autre','other':'Autre','misc':'Autre','divers':'Autre'
    };
    if (exact[c]) return exact[c];
    for (var key in exact) {
      if (c.includes(key) || key.includes(c)) return exact[key];
    }
    return 'Autre';
  }


  /* ================================================================
     SECTION 3 : ÉCRAN DE VALIDATION
     ================================================================ */

  function openValidateModal() {
    renderValidateList();
    document.getElementById('validateModal').style.display = 'flex';
  }

  function openScanModal() {
    document.getElementById('scanStatus').style.display = 'none';
    document.getElementById('scanModal').style.display = 'flex';
  }

  /**
   * [FIX-2] Rendu via DocumentFragment — plus de innerHTML par concat.
   * [FIX-4] Pose data-index sur chaque .validate-check et .validate-item
   * pour permettre le toggle partiel.
   */
  function renderValidateList() {
    var fragment = document.createDocumentFragment();

    for (var i = 0; i < state.pendingValidation.length; i++) {
      var g = state.pendingValidation[i];

      var item = document.createElement('div');
      item.className = 'validate-item';
      item.dataset.index = i;  /* [FIX-4] data-index pour ciblage direct */

      // Checkbox
      var check = document.createElement('div');
      check.className = 'validate-check' + (g.selected ? ' checked' : '');
      check.dataset.index = i; /* [FIX-4] data-index */
      check.textContent = g.selected ? '✓' : '';
      (function (idx) {
        check.onclick = function () { toggleValidate(idx); };
      })(i);

      // Info
      var info = document.createElement('div');
      info.className = 'validate-info';

      var nameEl = document.createElement('div');
      nameEl.className = 'validate-name';
      nameEl.title = g.name;
      nameEl.textContent = g.name;  /* [FIX-2] textContent — pas de XSS */

      // Badge catégorie
      if (g.category) {
        var catTag = document.createElement('span');
        catTag.style.cssText = 'color:#3ddc84;font-size:0.6rem;font-weight:700;margin-left:0.4rem;border:1px solid #3ddc84;padding:0 4px;border-radius:2px';
        catTag.textContent = '📂 ' + g.category + ' → ' + g.type;
        nameEl.appendChild(catTag);
      } else {
        var warnTag = document.createElement('span');
        warnTag.style.cssText = 'color:#ff5faf;font-size:0.6rem;margin-left:0.4rem';
        warnTag.textContent = '⚠ pas de sous-dossier genre';
        nameEl.appendChild(warnTag);
      }

      var pathEl = document.createElement('div');
      pathEl.className = 'validate-path';
      pathEl.title = g.path || '';
      pathEl.textContent = '📁 ' + (g.path || '—');

      info.appendChild(nameEl);
      info.appendChild(pathEl);

      // Taille
      var sizeEl = document.createElement('div');
      sizeEl.className = 'validate-size';
      sizeEl.textContent = LGM.formatSize(g.size);

      // Sélecteur de type
      var typeWrap = document.createElement('div');
      typeWrap.className = 'validate-type';
      var select = document.createElement('select');
      LGM.GAME_TYPES.forEach(function (t) {
        var opt = document.createElement('option');
        opt.value = t;
        opt.textContent = t;
        if (g.type === t) opt.selected = true;
        select.appendChild(opt);
      });
      (function (idx) {
        select.onchange = function () { state.pendingValidation[idx].type = this.value; };
      })(i);
      typeWrap.appendChild(select);

      item.appendChild(check);
      item.appendChild(info);
      item.appendChild(sizeEl);
      item.appendChild(typeWrap);
      fragment.appendChild(item);
    }

    var list = document.getElementById('validateList');
    list.innerHTML = '';          /* [FIX-2] vider une seule fois */
    list.appendChild(fragment);   /* [FIX-2] un seul reflow */
    updateValidateSummary();
  }

  /**
   * [FIX-4] Toggle partiel sans re-render complet.
   * Mute le modèle + met à jour uniquement le nœud concerné.
   */
  function toggleValidate(i) {
    state.pendingValidation[i].selected = !state.pendingValidation[i].selected;
    var selected = state.pendingValidation[i].selected;

    /* [FIX-4] Cibler le nœud exact via data-index — pas de re-render complet */
    var checkEl = document.querySelector('.validate-check[data-index="' + i + '"]');
    if (checkEl) {
      checkEl.classList.toggle('checked', selected);
      checkEl.textContent = selected ? '✓' : '';
    }

    /* [FIX-4] Mettre à jour uniquement le compteur — pas renderValidateList() */
    updateValidateSummary();
  }

  function toggleAllValidation(s) {
    state.pendingValidation.forEach(function (g) { g.selected = s; });
    /* toggleAll nécessite quand même un re-render complet des checkboxes */
    renderValidateList();
  }

  function updateValidateSummary() {
    var sel = state.pendingValidation.filter(function (g) { return g.selected; });
    document.getElementById('validateCount').textContent = sel.length;
    document.getElementById('validateTotalSize').textContent = LGM.formatSize(
      sel.reduce(function (s, g) { return s + (g.size || 0); }, 0)
    );
  }

  /**
   * [FIX-3] confirmValidation avec try/catch sur les opérations SQL
   */
  async function confirmValidation() {
    var sel = state.pendingValidation.filter(function (g) { return g.selected; });
    if (!sel.length) { LGM.toast('Aucun jeu sélectionné'); return; }

    var gamesCache = LGM.getGames();
    var existingNames = new Set(gamesCache.map(function (g) { return g.name.toLowerCase(); }));
    var toAdd = sel.filter(function (g) { return !existingNames.has(g.name.toLowerCase()); }).map(function (g) {
      return {
        id: g.id || LGM.genId(), name: g.name, type: g.type, size: g.size || 0,
        players: g.players || 0, version: g.version || '', path: g.path || '', addedAt: g.addedAt || Date.now()
      };
    });

    if (toAdd.length) {
      /* [FIX-3] Gestion d'erreurs SQL */
      try {
        LGM.sqlInsertBatch(toAdd);
        LGM.persistDB();
        LGM.setGames(LGM.sqlSelectAll() || []);  /* [FIX-3] jamais undefined */
      } catch (err) {
        console.error('[LGM SQL] confirmValidation:', err);
        LGM.toast('⚠ Erreur SQL : ' + err.message);
        return;
      }
    }

    state.pendingValidation = [];
    LGM.renderGames();
    LGM.closeModal('validateModal');
    LGM.toast(toAdd.length + ' jeu(x) importé(s) dans SQLite');
  }


  /* [FIX-1] Exposition publique */
  LGM.handleFolderScan     = handleFolderScan;
  LGM.openScanModal        = openScanModal;
  LGM.openValidateModal    = openValidateModal;
  LGM.toggleValidate       = toggleValidate;
  LGM.toggleAllValidation  = toggleAllValidation;
  LGM.confirmValidation    = confirmValidation;

})();
