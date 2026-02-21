/* ================================================================
   ui.js — INTERFACE UTILISATEUR (rendu, tri, filtres, modales)
   ================================================================
   Ce fichier gère tout ce qui est VISIBLE à l'écran :
   - Affichage de la grille de cartes de jeux
   - Tri (par nom, par taille)
   - Filtrage par genre
   - Ouverture/gestion des modales (ajouter, modifier, commentaire)
   - Import/export de fichiers .sqlite

   POUR UN DÉBUTANT :
   La logique principale est dans renderGames() :
   1. On filtre les jeux selon la recherche et le genre
   2. On les trie selon le mode choisi
   3. On construit chaque carte via createElement (DocumentFragment)
   4. On injecte le fragment en un seul reflow

   [FIX-2] Le rendu utilise désormais DocumentFragment + createElement
   au lieu de concaténation de strings HTML. Plus sûr (pas de XSS)
   et plus facile à déboguer dans le DevTools.
   ================================================================ */
/* [FIX-1] IIFE — tout le contenu est isolé du scope global */
(function () {
  'use strict';

  var LGM   = window.LGM;
  var state  = LGM._state;   // activeFilter, sortMode, sortDir, etc.

  /* ================================================================
     SECTION 1 : TRI
     ================================================================ */

  function typeSlug(t) {
    return t.toLowerCase().replace(/\s+/g, '-');
  }

  function toggleSort(mode) {
    if (state.sortMode === mode) {
      state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      state.sortMode = mode;
      state.sortDir = mode === 'size' ? 'desc' : 'asc';
    }
    updateSortUI();
    renderGames();
  }

  function updateSortUI() {
    var nb = document.getElementById('sortNameBtn');
    var sb = document.getElementById('sortSizeBtn');
    nb.className = 'sort-btn' + (state.sortMode === 'name' ? ' active' + (state.sortDir === 'desc' ? ' desc' : '') : '');
    sb.className = 'sort-btn' + (state.sortMode === 'size' ? ' active' + (state.sortDir === 'desc' ? ' desc' : '') : '');
    nb.querySelector('.arrow').textContent = state.sortMode === 'name' ? (state.sortDir === 'asc' ? '▲' : '▼') : '▲';
    sb.querySelector('.arrow').textContent = state.sortMode === 'size' ? (state.sortDir === 'asc' ? '▲' : '▼') : '▲';
  }


  /* ================================================================
     SECTION 2 : RENDU DE LA GRILLE DE JEUX
     ================================================================ */

  /* [FIX-2] Helper — crée un élément avec classe et texte */
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  /* [FIX-2] Helper — crée un item meta (label + valeur) */
  function metaItem(label, value) {
    var item = el('div', 'meta-item');
    item.appendChild(el('span', 'meta-label', label));
    item.appendChild(el('span', 'meta-value', value));
    return item;
  }

  /**
   * Fonction PRINCIPALE de l'UI : affiche les cartes de jeux.
   * [FIX-2] Utilise DocumentFragment au lieu de innerHTML string.
   */
  function renderGames() {
    var gamesCache = LGM.getGames();
    var search = document.getElementById('searchInput').value.toLowerCase();

    var filtered = gamesCache.filter(function (g) {
      return g.name.toLowerCase().includes(search) && (!state.activeFilter || g.type === state.activeFilter);
    });

    var dir = state.sortDir === 'asc' ? 1 : -1;
    if (state.sortMode === 'size') {
      filtered.sort(function (a, b) { return ((a.size || 0) - (b.size || 0)) * dir; });
    } else {
      filtered.sort(function (a, b) { return a.name.localeCompare(b.name) * dir; });
    }

    var grid  = document.getElementById('gameGrid');
    var empty = document.getElementById('emptyState');

    if (!filtered.length) {
      grid.innerHTML = '';
      empty.style.display = 'block';
    } else {
      empty.style.display = 'none';

      /* [FIX-2] DocumentFragment — un seul reflow pour toutes les cartes */
      var fragment = document.createDocumentFragment();

      for (var i = 0; i < filtered.length; i++) {
        var g = filtered[i];

        var card = el('div', 'game-card');

        // Top row : nom + badge type
        var top = el('div', 'card-top');
        var name = el('div', 'game-name');
        name.title = g.name;
        name.textContent = g.name;   /* [FIX-2] textContent — XSS impossible */
        var badge = el('span', 'game-type-badge type-' + typeSlug(g.type), g.type);
        top.appendChild(name);
        top.appendChild(badge);
        card.appendChild(top);

        // Métadonnées (grille 2×2)
        var meta = el('div', 'card-meta');
        meta.appendChild(metaItem('Taille', LGM.formatSize(g.size)));
        /* [FIX] Afficher le nombre de joueurs — traiter 0 et undefined séparément */
        meta.appendChild(metaItem('Joueurs', (g.players != null && g.players > 0) ? g.players + '' : '—'));
        meta.appendChild(metaItem('Version', g.version || '—'));
        meta.appendChild(metaItem('Ajouté', g.addedAt ? new Date(g.addedAt).toLocaleDateString('fr-FR') : '—'));
        card.appendChild(meta);

        // Commentaire (si présent)
        if (g.comment) {
          var cmt = el('div', 'card-comment', '💬 ' + g.comment);
          card.appendChild(cmt);
        }

        // Chemin (si présent)
        if (g.path) {
          var pathEl = el('div', 'card-path', '📁 ' + g.path);
          pathEl.title = g.path;
          card.appendChild(pathEl);
        }

        // Actions (boutons)
        var actions = el('div', 'card-actions');
        var btnEdit = el('button', 'btn btn-sm', '✎ Modifier');
        btnEdit.dataset.id = g.id;
        btnEdit.onclick = function () { LGM.openEditModal(this.dataset.id); };
        var btnComment = el('button', 'btn btn-sm', '💬 Commentaire');
        btnComment.style.cssText = 'border-color:#64b5f6;color:#64b5f6';
        btnComment.dataset.id = g.id;
        btnComment.onclick = function () { LGM.openCommentModal(this.dataset.id); };
        var btnDel = el('button', 'btn btn-sm btn-danger', '✕ Supprimer');
        btnDel.dataset.id = g.id;
        btnDel.onclick = function () { LGM.deleteGame(this.dataset.id); };
        actions.appendChild(btnEdit);
        actions.appendChild(btnComment);
        actions.appendChild(btnDel);
        card.appendChild(actions);

        fragment.appendChild(card);
      }

      grid.innerHTML = '';       /* [FIX-2] vider une seule fois */
      grid.appendChild(fragment); /* [FIX-2] un seul reflow */
    }

    updateStats();
    requestAnimationFrame(fitGameNames);
  }

  function fitGameNames() {
    var names = document.querySelectorAll('.game-name');
    for (var i = 0; i < names.length; i++) {
      var elem = names[i];
      var maxW = elem.offsetWidth;
      var fs = 15.4;
      elem.style.fontSize = '';
      if (elem.scrollWidth > maxW) {
        while (elem.scrollWidth > maxW && fs > 9) {
          fs -= 0.5;
          elem.style.fontSize = fs + 'px';
        }
      }
    }
  }


  /* ================================================================
     SECTION 3 : FILTRES PAR GENRE
     ================================================================ */

  function renderFilterTags() {
    var gamesCache = LGM.getGames();
    var counts = {};
    LGM.GAME_TYPES.forEach(function (t) { counts[t] = 0; });
    gamesCache.forEach(function (g) { if (counts[g.type] !== undefined) counts[g.type]++; });

    /* [FIX-2] DocumentFragment pour les filtres */
    var frag = document.createDocumentFragment();
    var allBtn = el('button', 'tag-filter' + (!state.activeFilter ? ' active' : ''), 'TOUS');
    allBtn.onclick = function () { setFilter(null); };
    frag.appendChild(allBtn);

    LGM.GAME_TYPES.filter(function (t) { return counts[t] > 0; }).forEach(function (t) {
      var btn = el('button', 'tag-filter' + (state.activeFilter === t ? ' active' : ''), t + ' (' + counts[t] + ')');
      btn.onclick = function () { setFilter(t); };
      frag.appendChild(btn);
    });

    var container = document.getElementById('filterTags');
    container.innerHTML = '';
    container.appendChild(frag);
  }

  function setFilter(t) {
    state.activeFilter = t;
    renderFilterTags();
    renderGames();
  }

  function updateStats() {
    var gamesCache = LGM.getGames();
    document.getElementById('totalGames').textContent = gamesCache.length;
    document.getElementById('totalSize').textContent = LGM.formatSize(
      gamesCache.reduce(function (s, g) { return s + (g.size || 0); }, 0)
    );
    renderFilterTags();
  }


  /* ================================================================
     SECTION 4 : MODALES CRUD (Ajouter / Modifier / Supprimer)
     ================================================================ */

  function openAddModal() {
    document.getElementById('gameModalTitle').textContent = 'Ajouter un jeu';
    document.getElementById('editId').value = '';
    ['gameName', 'gameSize', 'gamePlayers', 'gameVersion', 'gamePath']
      .forEach(function (id) { document.getElementById(id).value = ''; });
    document.getElementById('gameType').value = 'FPS';
    document.getElementById('gameModal').style.display = 'flex';
  }

  function openEditModal(id) {
    var g = LGM.getGames().find(function (x) { return x.id === id; });
    if (!g) return;
    document.getElementById('gameModalTitle').textContent = 'Modifier';
    document.getElementById('editId').value = g.id;
    document.getElementById('gameName').value = g.name;
    document.getElementById('gameType').value = g.type;
    document.getElementById('gameSize').value = (g.size / (1024 ** 3)).toFixed(2);
    document.getElementById('gamePlayers').value = g.players || '';
    document.getElementById('gameVersion').value = g.version || '';
    document.getElementById('gamePath').value = g.path || '';
    document.getElementById('gameModal').style.display = 'flex';
  }

  async function saveGame() {
    var editId = document.getElementById('editId').value;
    var name = document.getElementById('gameName').value.trim();
    if (!name) { LGM.toast('Nom requis'); return; }

    var sizeGo = parseFloat(document.getElementById('gameSize').value) || 0;
    var data = {
      name: name,
      type: document.getElementById('gameType').value,
      size: Math.round(sizeGo * 1024 ** 3),
      players: parseInt(document.getElementById('gamePlayers').value) || 0,
      version: document.getElementById('gameVersion').value.trim(),
      path: document.getElementById('gamePath').value.trim()
    };

    /* [FIX-3] try/catch sur les opérations SQL */
    try {
      if (editId) {
        LGM.sqlUpdate({ id: editId, name: data.name, type: data.type, size: data.size, players: data.players, version: data.version, path: data.path });
      } else {
        LGM.sqlInsert({ id: LGM.genId(), name: data.name, type: data.type, size: data.size, players: data.players, version: data.version, path: data.path, addedAt: Date.now() });
      }
      LGM.persistDB();
      LGM.setGames(LGM.sqlSelectAll() || []);  /* [FIX-3] jamais undefined */
    } catch (err) {
      console.error('[LGM SQL] saveGame:', err);
      LGM.toast('⚠ Erreur SQL : ' + err.message);
      return;
    }

    renderGames();
    LGM.closeModal('gameModal');
    LGM.toast(editId ? 'Modifié' : 'Ajouté');
  }

  async function deleteGame(id) {
    if (!confirm('Supprimer ce jeu ?')) return;
    /* [FIX-3] try/catch sur SQL delete */
    try {
      LGM.sqlDelete(id);
      LGM.persistDB();
      LGM.setGames(LGM.getGames().filter(function (g) { return g.id !== id; }));
    } catch (err) {
      console.error('[LGM SQL] deleteGame:', err);
      LGM.toast('⚠ Erreur SQL : ' + err.message);
      return;
    }
    renderGames();
    LGM.toast('Supprimé');
  }


  /* ================================================================
     SECTION 5 : COMMENTAIRES
     ================================================================ */

  function openCommentModal(id) {
    var g = LGM.getGames().find(function (x) { return x.id === id; });
    if (!g) return;
    document.getElementById('commentId').value = g.id;
    document.getElementById('commentGameName').textContent = g.name;
    document.getElementById('commentText').value = g.comment || '';
    document.getElementById('commentModal').style.display = 'flex';
    setTimeout(function () { document.getElementById('commentText').focus(); }, 100);
  }

  async function saveComment() {
    var id = document.getElementById('commentId').value;
    var comment = document.getElementById('commentText').value.trim();
    /* [FIX-3] try/catch */
    try {
      LGM.sqlUpdateComment(id, comment);
      LGM.persistDB();
      var g = LGM.getGames().find(function (x) { return x.id === id; });
      if (g) g.comment = comment;
    } catch (err) {
      console.error('[LGM SQL] saveComment:', err);
      LGM.toast('⚠ Erreur SQL : ' + err.message);
      return;
    }
    renderGames();
    LGM.closeModal('commentModal');
    LGM.toast('Commentaire sauvegardé');
  }


  /* ================================================================
     SECTION 6 : EXPORT / IMPORT .sqlite
     ================================================================ */

  function exportSQLite() {
    var gamesCache = LGM.getGames();
    if (!gamesCache.length) { LGM.toast('Aucun jeu à exporter'); return; }
    /* [FIX-3] try/catch */
    try {
      var data = LGM.getSqlDB().export();
      var blob = new Blob([data], { type: 'application/x-sqlite3' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'ryo_lan_' + new Date().toISOString().slice(0, 10) + '.sqlite';
      a.click();
      URL.revokeObjectURL(a.href);
      LGM.toast('Sauvegardé : ' + gamesCache.length + ' jeux (' + LGM.formatSize(data.length) + ')');
    } catch (err) {
      console.error('[LGM SQL] exportSQLite:', err);
      LGM.toast('⚠ Erreur export : ' + err.message);
    }
  }

  function handleImportSQLite(e) {
    var file = e.target.files[0];
    if (!file) return;

    var reader = new FileReader();
    reader.onload = function (ev) {
      try {
        var bytes = new Uint8Array(ev.target.result);
        var header = String.fromCharCode.apply(null, bytes.slice(0, 16));

        if (header.startsWith('SQLite format 3')) {
          var SQL = LGM.getSQL();
          var newDB = new SQL.Database(bytes);
          try {
            var stmt = newDB.prepare('SELECT id, name, type, size, players, version, path, added_at FROM games');
            while (stmt.step()) { /* just testing table exists */ }
            stmt.free();
          } catch (ex) {
            LGM.toast('Table "games" introuvable'); newDB.close(); return;
          }
          var oldDB = LGM.getSqlDB();
          if (oldDB) oldDB.close();
          LGM.setSqlDB(newDB);
          LGM.ensureSchema();
          LGM.setGames(LGM.sqlSelectAll() || []);
          LGM.updateDBSize(bytes.length);
          renderGames();
          LGM.toast('Base chargée : ' + LGM.getGames().length + ' jeu(x) (' + LGM.formatSize(bytes.length) + ')');
        } else {
          try {
            var text = new TextDecoder().decode(bytes);
            var data = JSON.parse(text);
            if (!Array.isArray(data)) throw new Error();
            state.pendingValidation = data.map(function (g) {
              return { id: g.id || LGM.genId(), name: g.name, type: g.type || 'Autre', size: g.size || 0, players: g.players || 0, version: g.version || '', path: g.path || '', addedAt: g.addedAt || Date.now(), selected: true, category: '' };
            });
          } catch (ex) {
            LGM.toast('Format non reconnu (ni SQLite ni JSON)'); return;
          }
          if (!state.pendingValidation.length) { LGM.toast('Aucun jeu dans le fichier'); return; }
          LGM.openValidateModal();
        }
      } catch (err) { LGM.toast('Erreur: ' + err.message); }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  }

  async function loadRyoDB() {
    try {
      var resp = await fetch('assets/database_ryo.sqlite');
      if (!resp.ok) throw new Error('Fichier non trouvé');
      var buf = await resp.arrayBuffer();
      var bytes = new Uint8Array(buf);
      var SQL = LGM.getSQL();
      var newDB = new SQL.Database(bytes);
      try {
        newDB.exec('SELECT COUNT(*) FROM games');
      } catch (ex) {
        LGM.toast('Table "games" introuvable dans la base de Ryo');
        newDB.close();
        return;
      }
      var oldDB = LGM.getSqlDB();
      if (oldDB) oldDB.close();
      LGM.setSqlDB(newDB);
      LGM.ensureSchema();
      LGM.setGames(LGM.sqlSelectAll() || []);
      console.log('[LGM] loadRyoDB — premier jeu:', JSON.stringify(LGM.getGames()[0]));
      LGM.updateDBSize(bytes.length);
      renderGames();
      LGM.toast('Base de Ryo chargée : ' + LGM.getGames().length + ' jeu(x) (' + LGM.formatSize(bytes.length) + ')');
    } catch (err) {
      LGM.toast('Erreur chargement base de Ryo : ' + err.message);
    }
  }


  /* ================================================================
     SECTION 7 : RACCOURCIS CLAVIER + ÉVÉNEMENTS
     ================================================================ */

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay').forEach(function (m) { m.style.display = 'none'; });
    }
  });

  window.addEventListener('resize', function () {
    clearTimeout(state.renderTimer);
    state.renderTimer = setTimeout(function () { requestAnimationFrame(fitGameNames); }, 150);
  });


  /* [FIX-1] Exposition publique */
  LGM.renderGames       = renderGames;
  LGM.toggleSort         = toggleSort;
  LGM.setFilter          = setFilter;
  LGM.openAddModal       = openAddModal;
  LGM.openEditModal      = openEditModal;
  LGM.saveGame           = saveGame;
  LGM.deleteGame         = deleteGame;
  LGM.openCommentModal   = openCommentModal;
  LGM.saveComment        = saveComment;
  LGM.exportSQLite       = exportSQLite;
  LGM.handleImportSQLite = handleImportSQLite;
  LGM.loadRyoDB          = loadRyoDB;

})();
