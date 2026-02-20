/* ================================================================
   db.js — MOTEUR BASE DE DONNÉES SQLite (via WASM)
   ================================================================
   Ce fichier gère tout ce qui touche à la base de données :
   - Téléchargement et cache du moteur SQLite compilé en WebAssembly
   - Création des tables
   - Fonctions CRUD (Create, Read, Update, Delete)
   
   POUR UN DÉBUTANT :
   SQLite est un moteur de base de données SQL "embarqué".
   Normalement, il tourne en C sur un serveur.
   Grâce à WebAssembly (WASM), on peut le faire tourner
   directement dans le navigateur ! La lib "sql.js" s'en charge.
   
   IndexedDB = une base de données clé/valeur intégrée au navigateur.
   On l'utilise ici UNIQUEMENT pour mettre en cache le fichier WASM
   (évite de le re-télécharger à chaque visite).
   ================================================================ */
/* [FIX-1] IIFE — tout le contenu est isolé du scope global */
(function () {
  'use strict';

  var LGM = window.LGM;

  // URL du CDN pour télécharger sql.js (moteur SQLite en WASM)
  var SQLJSCDN = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3';

  // Liste des genres de jeux reconnus par l'application
  var GAME_TYPES = [
    'Action','Aventure','Course','FPS','Jeu de plateau','MOBA',
    'RPG','RTS','Sandbox','Simulation','Sport','Tower Defense','TPS','Autre'
  ];

  // --- Variables internes du moteur DB ---
  var SQL    = null;   // Le module sql.js (une fois chargé)
  var sqlDB  = null;   // L'instance de la base de données active
  var gamesCache = []; // Copie en mémoire des jeux (pour un rendu rapide)

  /* [FIX-1] Exposer GAME_TYPES et le cache en lecture pour les autres fichiers */
  LGM.GAME_TYPES  = GAME_TYPES;
  /* Accesseurs pour gamesCache — les autres fichiers lisent/écrivent via ces helpers */
  LGM.getGames    = function () { return gamesCache; };
  LGM.setGames    = function (arr) { gamesCache = arr; };
  LGM.getSqlDB    = function () { return sqlDB; };
  LGM.setSqlDB    = function (db) { sqlDB = db; };
  LGM.getSQL      = function () { return SQL; };


  /* ================================================================
     SECTION 1 : CACHE WASM DANS IndexedDB
     ================================================================ */

  function openCacheDB() {
    return new Promise(function (res, rej) {
      var r = indexedDB.open('RyoLAN_Cache', 1);
      r.onupgradeneeded = function (e) { e.target.result.createObjectStore('blobs'); };
      r.onsuccess = function (e) { res(e.target.result); };
      r.onerror   = function (e) { rej(e.target.error); };
    });
  }

  function getCached(key) {
    return openCacheDB().then(function (db) {
      return new Promise(function (res) {
        var r = db.transaction('blobs').objectStore('blobs').get(key);
        r.onsuccess = function () { res(r.result); };
        r.onerror   = function () { res(null); };
      });
    });
  }

  function setCached(key, val) {
    return openCacheDB().then(function (db) {
      return new Promise(function (res, rej) {
        var r = db.transaction('blobs', 'readwrite').objectStore('blobs').put(val, key);
        r.onsuccess = function () { res(); };
        r.onerror   = function () { rej(r.error); };
      });
    });
  }


  /* ================================================================
     SECTION 2 : CHARGEMENT DE sql.js
     ================================================================ */

  async function loadSQLJS() {
    LGM.setLoad(10, 'Chargement du moteur SQLite...');
    var wasmBinary = await getCached('sql-wasm');

    if (!wasmBinary) {
      LGM.setLoad(15, 'Téléchargement de SQLite WASM...');
      try {
        var resp = await fetch(SQLJSCDN + '/sql-wasm.wasm');
        wasmBinary = await resp.arrayBuffer();
        await setCached('sql-wasm', wasmBinary);
        LGM.setLoad(30, 'WASM mis en cache pour offline');
      } catch (e) {
        throw new Error('SQLite WASM non disponible. Connectez-vous une première fois pour le télécharger.');
      }
    } else {
      LGM.setLoad(25, 'WASM chargé depuis le cache offline');
    }

    LGM.setLoad(35, 'Initialisation sql.js...');
    if (typeof initSqlJs === 'undefined') {
      var jsCode = await getCached('sql-wasm-js');
      if (!jsCode) {
        try {
          var resp2 = await fetch(SQLJSCDN + '/sql-wasm.js');
          jsCode = await resp2.text();
          await setCached('sql-wasm-js', jsCode);
        } catch (e) {
          throw new Error('sql.js non disponible. Connectez-vous une première fois.');
        }
      }
      var script = document.createElement('script');
      script.textContent = jsCode;
      document.head.appendChild(script);

      await new Promise(function (r) {
        var check = function () { typeof initSqlJs !== 'undefined' ? r() : setTimeout(check, 20); };
        check();
      });
    }

    LGM.setLoad(45, 'Démarrage du moteur SQLite...');
    SQL = await initSqlJs({ wasmBinary: wasmBinary });
  }


  /* ================================================================
     SECTION 3 : GESTION DE LA BASE DE DONNÉES
     ================================================================ */

  function loadDBFromCache() {
    sqlDB = new SQL.Database();
    ensureSchema();
  }

  function persistDB() {
    /* [FIX-3] try/catch sur l'export DB */
    try {
      var data = sqlDB.export();
      updateDBSize(data.length);
    } catch (err) {
      console.error('[LGM SQL] persistDB:', err);
      LGM.toast('⚠ Erreur persistance DB : ' + err.message);
    }
  }

  function updateDBSize(bytes) {
    var el = document.getElementById('dbSize');
    if (bytes < 1024) el.textContent = bytes + ' B';
    else if (bytes < 1024 * 1024) el.textContent = (bytes / 1024).toFixed(1) + ' Ko';
    else el.textContent = (bytes / (1024 * 1024)).toFixed(2) + ' Mo';
  }

  function ensureSchema() {
    sqlDB.run('CREATE TABLE IF NOT EXISTS games (\
      id TEXT PRIMARY KEY,\
      name TEXT NOT NULL,\
      type TEXT DEFAULT \'Autre\',\
      size INTEGER DEFAULT 0,\
      players INTEGER DEFAULT 0,\
      version TEXT DEFAULT \'\',\
      path TEXT DEFAULT \'\',\
      comment TEXT DEFAULT \'\',\
      added_at INTEGER DEFAULT 0\
    )');
    try { sqlDB.run('ALTER TABLE games ADD COLUMN comment TEXT DEFAULT ""'); } catch(e) {}
    sqlDB.run('CREATE INDEX IF NOT EXISTS idx_games_type ON games(type)');
    sqlDB.run('CREATE INDEX IF NOT EXISTS idx_games_name ON games(name COLLATE NOCASE)');
  }


  /* ================================================================
     SECTION 4 : FONCTIONS CRUD
     ================================================================ */

  function sqlSelectAll() {
    var stmt = sqlDB.prepare(
      'SELECT id, name, type, size, players, version, path, comment, added_at FROM games ORDER BY name COLLATE NOCASE'
    );
    var rows = [];
    while (stmt.step()) {
      var r = stmt.getAsObject();
      rows.push({
        id: r.id, name: r.name, type: r.type,
        size: r.size, players: r.players,
        version: r.version, path: r.path,
        comment: r.comment || '', addedAt: r.added_at
      });
    }
    stmt.free();
    return rows;
  }

  function sqlInsert(g) {
    sqlDB.run(
      'INSERT OR REPLACE INTO games (id, name, type, size, players, version, path, added_at) VALUES (?,?,?,?,?,?,?,?)',
      [g.id, g.name, g.type, g.size || 0, g.players || 0, g.version || '', g.path || '', g.addedAt || Date.now()]
    );
  }

  function sqlInsertBatch(games) {
    sqlDB.run('BEGIN TRANSACTION');
    var stmt = sqlDB.prepare(
      'INSERT OR REPLACE INTO games (id, name, type, size, players, version, path, added_at) VALUES (?,?,?,?,?,?,?,?)'
    );
    for (var i = 0; i < games.length; i++) {
      var g = games[i];
      stmt.run([g.id, g.name, g.type, g.size || 0, g.players || 0, g.version || '', g.path || '', g.addedAt || Date.now()]);
    }
    stmt.free();
    sqlDB.run('COMMIT');
  }

  function sqlUpdate(g) {
    sqlDB.run(
      'UPDATE games SET name=?, type=?, size=?, players=?, version=?, path=? WHERE id=?',
      [g.name, g.type, g.size, g.players, g.version, g.path, g.id]
    );
  }

  function sqlDelete(id) {
    sqlDB.run('DELETE FROM games WHERE id=?', [id]);
  }

  function sqlUpdateComment(id, comment) {
    sqlDB.run('UPDATE games SET comment=? WHERE id=?', [comment, id]);
  }

  function sqlCount() {
    var res = sqlDB.exec('SELECT COUNT(*) as c FROM games');
    return (res[0] && res[0].values[0]) ? res[0].values[0][0] : 0;
  }


  /* [FIX-1] Exposition publique */
  LGM.loadSQLJS      = loadSQLJS;
  LGM.loadDBFromCache = loadDBFromCache;
  LGM.persistDB       = persistDB;
  LGM.updateDBSize    = updateDBSize;
  LGM.ensureSchema    = ensureSchema;
  LGM.sqlSelectAll    = sqlSelectAll;
  LGM.sqlInsert       = sqlInsert;
  LGM.sqlInsertBatch  = sqlInsertBatch;
  LGM.sqlUpdate       = sqlUpdate;
  LGM.sqlDelete       = sqlDelete;
  LGM.sqlUpdateComment= sqlUpdateComment;
  LGM.sqlCount        = sqlCount;

})();
