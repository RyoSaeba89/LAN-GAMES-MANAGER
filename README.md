# 📖 LAN GAMES MANAGER — Documentation Développeur

> **Auteur :** Ryo  
> **Stack :** HTML5 / CSS3 / JavaScript Vanilla / SQLite (WASM)  
> **Aucun framework.** Aucune dépendance npm. Tout est fait à la main.

---

## 📁 Structure du projet

```
lan-games-manager/
│
├── index.html          ← Page HTML principale (squelette de l'UI)
├── style.css           ← Tout le style visuel (thème cyberpunk néon)
│
├── db.js               ← Moteur SQLite : chargement WASM, cache, CRUD
├── utils.js            ← Fonctions utilitaires (formatage, IDs, toasts)
├── ui.js               ← Rendu de l'interface (cartes, tri, filtres, modales)
├── scanner.js          ← Scan de dossier + détection auto de genre
├── stats.js            ← Graphiques statistiques (camembert, histogramme)
├── demoscene.js        ← Scrolltext animé style Amiga (canvas)
├── xm-player.js        ← Lecteur de musique chiptune .XM (Web Audio)
├── app.js              ← Point d'entrée : init() lance tout
│
├── assets/
│   ├── chiptune.xm         ← Musique chiptune (format FastTracker II)
│   └── database_ryo.sqlite ← Base de données exemple de Ryo
│
└── README.md           ← Ce fichier
```

---

## 🚀 Lancement

### Option 1 : Avec un serveur local (recommandé)
```bash
# Python 3
python3 -m http.server 8000

# Node.js (npx)
npx serve .
```
Puis ouvrir `http://localhost:8000` dans le navigateur.

### Option 2 : Ouvrir directement le fichier
Ouvrir `index.html` dans un navigateur. **Attention :** le bouton
"Charger database de Ryo" nécessite `fetch()` qui peut être bloqué
sur le protocole `file://`. Un serveur local est préférable.

---

## 🏗️ Architecture — Comment ça marche ?

### Ordre de chargement des scripts (important !)

Les scripts sont chargés dans `index.html` dans cet ordre :

```
1. db.js         → Déclare les variables globales (SQL, sqlDB, gamesCache)
2. utils.js      → Déclare les utilitaires et variables de tri
3. ui.js         → Utilise db.js + utils.js pour afficher l'UI
4. scanner.js    → Utilise db.js + utils.js + ui.js pour le scan
5. stats.js      → Utilise gamesCache + utils pour les graphiques
6. demoscene.js  → Indépendant (auto-exécuté dans une IIFE)
7. xm-player.js  → Indépendant (fonctions globales pour le bouton)
8. app.js        → Appelle init() qui orchestre le démarrage
```

**Pourquoi cet ordre ?** En JavaScript vanilla (sans bundler/module),
les scripts partagent le scope global. Un script ne peut utiliser
une fonction que si elle a été déclarée dans un script chargé AVANT lui.

### Flux de données

```
[Fichier .sqlite] → [sql.js WASM] → [sqlDB en mémoire]
                                          ↓
                                    [gamesCache] ← tableau JS en mémoire
                                          ↓
                                    [renderGames()] → HTML des cartes
```

1. L'utilisateur importe un `.sqlite` (ou utilise la base de Ryo)
2. `sql.js` le charge en mémoire comme une vraie base SQLite
3. `sqlSelectAll()` extrait les jeux dans `gamesCache` (un tableau JS)
4. `renderGames()` génère le HTML et l'injecte dans le DOM

---

## 📂 Description de chaque fichier

### `index.html` — Le squelette
Contient uniquement la structure HTML (aucun style inline, aucun JS inline).
Les éléments importants :
- `#loading` : écran de chargement avec barre de progression
- `#app` : conteneur principal (masqué au départ)
- `#gameGrid` : grille où les cartes de jeux sont injectées
- Modales : `#gameModal`, `#scanModal`, `#validateModal`, `#commentModal`, `#statsModal`

### `style.css` — Le style
Thème cyberpunk/néon avec variables CSS (`--neon-pink`, `--neon-cyan`, etc.).
Points techniques :
- `clip-path: polygon(...)` crée les coins coupés
- `body::after` crée la grille en perspective (style Tron)
- Responsive : une seule colonne sur mobile (< 768px)

### `db.js` — La base de données
Le fichier le plus "technique". Il gère :
- **Cache WASM** : Le binaire SQLite (~500 Ko) est sauvegardé dans IndexedDB
  pour fonctionner hors-ligne après la première visite
- **Schéma SQL** : Table `games` avec id, name, type, size, players, version, path, comment, added_at
- **CRUD** : `sqlInsert()`, `sqlSelectAll()`, `sqlUpdate()`, `sqlDelete()`
- **Batch insert** : `sqlInsertBatch()` utilise une transaction SQL pour importer
  des centaines de jeux en une fraction de seconde

### `utils.js` — Les utilitaires
Petites fonctions réutilisées partout :
- `genId()` : génère un ID unique (base36 + random)
- `formatSize(bytes)` : convertit des octets en Ko/Mo/Go lisibles
- `esc(string)` : échappe le HTML (protection XSS)
- `toast(msg)` : notification éphémère en bas à droite
- `closeModal(id)` : cache une modale
- Variables globales de tri : `sortMode`, `sortDir`, `activeFilter`

### `ui.js` — L'interface
Le fichier le plus long. Responsabilités :
- **Rendu** : `renderGames()` génère le HTML de toutes les cartes
- **Tri** : `toggleSort()` change le mode (nom/taille, asc/desc)
- **Filtres** : `renderFilterTags()` crée les boutons par genre
- **Modales CRUD** : `openAddModal()`, `openEditModal()`, `saveGame()`, `deleteGame()`
- **Import/Export** : `exportSQLite()`, `handleImportSQLite()`, `loadRyoDB()`
- **Commentaires** : `openCommentModal()`, `saveComment()`

### `scanner.js` — Le scanner de dossiers
Utilise l'API `webkitdirectory` pour analyser un dossier local :
- Détecte la structure `Racine/Genre/NomDuJeu/fichiers`
- `guessTypeFromCategory()` mappe les noms de dossiers aux genres
  (gère le français, l'anglais, les accents, les variantes)
- Affiche un écran de validation avec checkboxes

### `stats.js` — Les graphiques
Dessine des graphiques dans un `<canvas>` sans librairie :
- **Camembert** (`drawPie`) : proportions par genre
- **Histogramme** (`drawBar`) : barres verticales avec étiquettes
- Gère le DPI pour les écrans haute résolution (Retina)

### `demoscene.js` — Le scrolltext
Animation décorative dans le header, inspirée de la scène démo Amiga :
- Texte défilant horizontalement
- Ondulation sinusoïdale (double sinus)
- Couleurs arc-en-ciel HSL
- Auto-démarre quand l'app devient visible

### `xm-player.js` — Le lecteur chiptune
Lecteur de musique au format FastTracker II (.XM) :
- La musique est encodée en base64 dans le fichier JS
- `parseXM()` : parseur binaire du format .XM (patterns, instruments, samples)
- `playXM()` : moteur de lecture via `ScriptProcessorNode` (Web Audio)
- `toggleMusic()` / `stopXm()` : contrôle lecture/arrêt

### `app.js` — Le chef d'orchestre
Fonction `init()` :
1. Appelle `loadSQLJS()` (db.js) pour charger le WASM
2. Crée une base vide
3. Affiche l'interface
4. Cache l'écran de chargement

---

## 🎮 Fonctionnalités

| Fonctionnalité | Fichiers impliqués |
|---|---|
| Ajouter un jeu manuellement | ui.js (modale) → db.js (SQL INSERT) |
| Scanner un dossier | scanner.js (analyse) → db.js (batch insert) |
| Rechercher un jeu | ui.js (filtrage dans renderGames) |
| Trier par nom/taille | ui.js (toggleSort) |
| Filtrer par genre | ui.js (setFilter, renderFilterTags) |
| Exporter en .sqlite | ui.js (exportSQLite → db.js export) |
| Importer un .sqlite | ui.js (handleImportSQLite → db.js) |
| Statistiques graphiques | stats.js (canvas 2D) |
| Commentaires | ui.js (modale) → db.js (sqlUpdateComment) |
| Musique chiptune | xm-player.js (Web Audio) |
| Scrolltext démo | demoscene.js (canvas animation) |

---

## 🔧 Pour modifier le projet

### Changer les couleurs
Éditer les variables CSS dans `style.css` (section `:root`).

### Ajouter un genre de jeu
1. Ajouter le nom dans `GAME_TYPES` (db.js)
2. Ajouter un style `.type-mon-genre` dans style.css
3. Ajouter le mapping dans `guessTypeFromCategory()` (scanner.js)
4. Ajouter la couleur dans `TYPE_COLORS` (stats.js)

### Changer la musique
Remplacer `assets/chiptune.xm` par un autre fichier .XM, puis mettre à jour
le contenu de `XM_BASE64` dans `xm-player.js` :
```bash
base64 -i nouvelle_musique.xm | tr -d '\n' > temp.txt
# Copier le contenu dans XM_BASE64
```

---

## ⚠️ Points d'attention

- **Protocole file://** : `fetch()` est bloqué sur `file://` dans la plupart
  des navigateurs. Utilisez un serveur local pour le bouton "Charger database de Ryo".
- **ScriptProcessorNode** : Déprécié en faveur de AudioWorklet, mais toujours
  supporté partout. Si le navigateur le supprime un jour, il faudra migrer.
- **Pas de modules ES** : Le projet utilise le scope global (`var`/`let` au niveau
  du fichier). Pour un gros projet, on préférerait des `import`/`export`.

---

*Made with ❤️ by Ryo — Greetings to all LAN warriors!*
