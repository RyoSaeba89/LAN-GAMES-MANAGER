# 🎮 LAN GAMES MANAGER — Guide Utilisateur

> **Gérez votre collection de jeux LAN dans un navigateur, sans installation.**

---

## Sommaire

1. [Démarrage rapide](#-démarrage-rapide)
2. [Présentation de l'interface](#-présentation-de-linterface)
3. [Charger une base de jeux](#-charger-une-base-de-jeux)
4. [Scanner un dossier de jeux](#-scanner-un-dossier-de-jeux)
5. [Ajouter un jeu manuellement](#-ajouter-un-jeu-manuellement)
6. [Rechercher, trier et filtrer](#-rechercher-trier-et-filtrer)
7. [Modifier ou supprimer un jeu](#-modifier-ou-supprimer-un-jeu)
8. [Commentaires](#-commentaires)
9. [Statistiques](#-statistiques)
10. [Sauvegarder et exporter](#-sauvegarder-et-exporter)
11. [Musique chiptune](#-musique-chiptune)
12. [Utilisation hors-ligne](#-utilisation-hors-ligne)
13. [Questions fréquentes](#-questions-fréquentes)

---

## 🚀 Démarrage rapide

### Étape 1 — Lancer un serveur local

L'application fonctionne dans un navigateur mais nécessite un petit serveur local.
Ouvrez un terminal (ou PowerShell sous Windows) dans le dossier du projet, puis tapez :

```
python -m http.server 8000
```

> **Pas de Python ?** Vous pouvez aussi utiliser Node.js : `npx serve .`

### Étape 2 — Ouvrir l'application

Ouvrez votre navigateur et allez à l'adresse :

```
http://localhost:8000
```

L'application se charge. Un écran de chargement affiche la progression pendant
le téléchargement du moteur SQLite (première visite uniquement — ensuite c'est
mis en cache et fonctionne hors-ligne).

### Étape 3 — Charger des jeux

Cliquez sur **⬡ Charger database de Ryo** pour charger la base de 134 jeux intégrée,
ou importez votre propre fichier `.sqlite`.

---

## 🖥 Présentation de l'interface

L'écran principal est divisé en trois zones :

### En-tête

- **Logo** et texte défilant animé (style démo Amiga)
- **Compteurs** : nombre total de jeux et taille totale de la collection
- **Bouton ♫ PLAY XM** : lance la musique chiptune d'ambiance

### Barre d'outils

De gauche à droite :

| Bouton | Action |
|---|---|
| **⬡ Scanner dossier** | Analyse un dossier local pour détecter automatiquement les jeux |
| **＋ Ajouter un jeu** | Ajouter un jeu à la main |
| **↓ Sauvegarder .sqlite** | Exporter la base en fichier `.sqlite` |
| **↑ Charger .sqlite** | Importer un fichier `.sqlite` ou JSON |
| **⬡ Charger database de Ryo** | Charger la base d'exemple (134 jeux) |
| **📊 Statistiques** | Graphiques et compteurs sur la collection |
| **Barre de recherche** | Filtrer les jeux par nom en temps réel |
| **A-Z / Taille** | Trier par nom alphabétique ou par taille |
| **Filtres genre** | Boutons de filtrage par genre (FPS, RPG, Course…) |

### Grille de jeux

Chaque jeu est affiché sous forme de carte contenant :

- **Nom du jeu** (taille de police ajustée automatiquement si le nom est long)
- **Badge genre** coloré (FPS en rose, RPG en violet, Course en cyan…)
- **Taille** sur disque (en Ko, Mo ou Go)
- **Joueurs max** : capacité maximale de joueurs en LAN
- **Version** du jeu
- **Date d'ajout** dans la base
- **Commentaire** (si renseigné) précédé d'une icône 💬
- **Chemin local** (si renseigné) précédé d'une icône 📁
- **Trois boutons** : Modifier, Commentaire, Supprimer

---

## 📂 Charger une base de jeux

### Base intégrée (Ryo)

Cliquez sur **⬡ Charger database de Ryo**.
La base contient 134 jeux LAN pré-configurés avec leur genre, taille, chemin
et nombre de joueurs max.

> **Attention :** charger cette base remplace la base actuelle en mémoire.
> Pensez à sauvegarder votre base avant si vous avez fait des modifications.

### Importer un fichier .sqlite

Cliquez sur **↑ Charger .sqlite** puis sélectionnez un fichier `.sqlite` exporté
précédemment. L'application détecte automatiquement le format :

- **Fichier SQLite** → chargé directement (remplace la base actuelle)
- **Fichier JSON** (tableau d'objets) → passe par l'écran de validation

---

## 🔍 Scanner un dossier de jeux

Le scanner analyse un dossier local pour détecter automatiquement les jeux
et leur genre.

### Comment ça marche

1. Cliquez sur **⬡ Scanner dossier**
2. Cliquez sur **⬡ Choisir un dossier** et sélectionnez votre dossier de jeux
3. L'application analyse la structure des sous-dossiers

### Structure de dossier recommandée

Pour que la détection de genre fonctionne, organisez vos jeux ainsi :

```
MesJeuxLAN/
├── FPS/
│   ├── Counter-Strike Source/
│   │   └── (fichiers du jeu)
│   └── Left 4 Dead 2/
│       └── (fichiers du jeu)
├── RPG/
│   └── Torchlight 2/
│       └── (fichiers du jeu)
├── Course/
│   └── Trackmania/
│       └── (fichiers du jeu)
└── Sport/
    └── FIFA 11/
        └── (fichiers du jeu)
```

Le **nom du sous-dossier parent** (FPS, RPG, Course…) détermine le genre.
Les noms reconnus incluent : FPS, TPS, Action, Aventure, Adventure, RPG,
RTS, Stratégie, Strategy, Course, Racing, Sport, MOBA, Simulation, Sandbox,
Tower Defense, et d'autres variantes en français et anglais.

### Écran de validation

Après le scan, un écran de validation s'affiche avec :

- **Checkbox** pour chaque jeu : cochez/décochez les jeux à importer
- **Nom du jeu** avec son chemin détecté
- **Badge catégorie** (vert si le genre a été détecté depuis le sous-dossier)
- **Taille** calculée automatiquement à partir des fichiers
- **Sélecteur de genre** : vous pouvez modifier le genre pour chaque jeu
- **Boutons "Tout sélectionner" / "Tout décocher"** en haut
- **Compteur** : nombre de jeux sélectionnés et taille totale en bas

Cliquez sur **✓ Confirmer** pour ajouter les jeux sélectionnés à la base.
Les doublons (jeux déjà présents avec le même nom) sont automatiquement ignorés.

---

## ＋ Ajouter un jeu manuellement

1. Cliquez sur **＋ Ajouter un jeu**
2. Remplissez les champs :
   - **Nom** (obligatoire)
   - **Genre** : choisissez dans la liste déroulante
   - **Taille (Go)** : la taille du jeu en gigaoctets (ex : `4.5`)
   - **Joueurs max** : nombre maximum de joueurs en LAN (ex : `16`)
   - **Version** : numéro de version (ex : `1.0.0`)
   - **Chemin local** : le chemin vers le dossier du jeu sur votre disque
3. Cliquez sur **Sauvegarder**

---

## 🔎 Rechercher, trier et filtrer

### Recherche

Tapez dans la barre de recherche **⌕** pour filtrer les jeux en temps réel.
La recherche porte sur le nom du jeu (insensible à la casse).

### Tri

Deux boutons de tri sont disponibles dans la barre d'outils :

- **A-Z** : tri alphabétique par nom (cliquez à nouveau pour inverser Z→A)
- **Taille** : tri par taille sur disque (cliquez à nouveau pour inverser)

La flèche ▲/▼ indique la direction du tri. Le bouton actif est mis en surbrillance.

### Filtres par genre

Les boutons de genre apparaissent automatiquement sous la barre d'outils
en fonction des jeux présents dans la base. Chaque bouton affiche le nom
du genre et le nombre de jeux entre parenthèses.

- Cliquez sur un genre pour n'afficher que ces jeux
- Cliquez sur **TOUS** pour revenir à l'affichage complet

---

## ✏️ Modifier ou supprimer un jeu

### Modifier

1. Cliquez sur **✎ Modifier** sur la carte du jeu
2. Modifiez les champs souhaités
3. Cliquez sur **Sauvegarder**

### Supprimer

1. Cliquez sur **✕ Supprimer** sur la carte du jeu
2. Confirmez la suppression dans la boîte de dialogue

> La suppression est immédiate et ne peut pas être annulée.
> Pensez à sauvegarder votre base régulièrement.

---

## 💬 Commentaires

Chaque jeu peut avoir un commentaire libre (notes, astuces, configuration serveur…).

1. Cliquez sur **💬 Commentaire** sur la carte du jeu
2. Saisissez votre texte
3. Cliquez sur **Sauvegarder**

Le commentaire apparaît directement sur la carte du jeu, précédé de l'icône 💬.

---

## 📊 Statistiques

Cliquez sur **📊 Statistiques** pour ouvrir la fenêtre d'analyse.

### Compteurs globaux

Six indicateurs sont affichés en haut :

- Nombre total de jeux
- Nombre de genres différents
- Taille totale de la collection
- Taille moyenne par jeu
- Nombre de joueurs cumulés
- Nom du plus gros jeu

### Graphiques

Deux modes de visualisation sont disponibles :

- **◉ Circulaire** (camembert) : proportions visuelles
- **▥ Histogramme** : barres comparatives

Trois types de données sont disponibles via le sélecteur :

- **Par genre** : nombre de jeux dans chaque catégorie
- **Taille par genre** : espace disque total par catégorie (en Go)
- **Par nb joueurs** : répartition des jeux par tranche de joueurs max (1-2, 3-4, 5-8, etc.)

---

## 💾 Sauvegarder et exporter

### Sauvegarder en .sqlite

Cliquez sur **↓ Sauvegarder .sqlite** pour télécharger votre base au format SQLite.
Le fichier est nommé `ryo_lan_AAAA-MM-JJ.sqlite` (avec la date du jour).

Ce fichier peut être :
- Rechargé plus tard dans l'application via **↑ Charger .sqlite**
- Ouvert avec n'importe quel logiciel SQLite (DB Browser, DBeaver…)
- Partagé avec d'autres utilisateurs de LAN Games Manager

### Important

L'application fonctionne **en mémoire**. Vos modifications ne sont PAS sauvegardées
automatiquement sur le disque. **Pensez à exporter régulièrement** votre base
via le bouton **↓ Sauvegarder .sqlite** pour ne pas perdre vos données.

---

## 🎵 Musique chiptune

Le bouton **♫ PLAY XM** dans l'en-tête lance un morceau de musique chiptune
au format FastTracker II (.XM), joué en temps réel par le navigateur.

- Cliquez une première fois pour lancer la musique
- Cliquez à nouveau pour l'arrêter
- Le bouton s'anime quand la musique joue

> Le format .XM est un format "tracker" des années 90, populaire dans la scène
> démo/chiptune. Au lieu de stocker de l'audio brut, il stocke des notes et
> de petits échantillons sonores que le navigateur joue en temps réel.

---

## 📡 Utilisation hors-ligne

L'application fonctionne **hors-ligne** après la première visite :

1. **Première visite** : le moteur SQLite WASM (~500 Ko) est téléchargé et
   mis en cache dans le navigateur (IndexedDB)
2. **Visites suivantes** : tout fonctionne sans connexion internet

Les polices décoratives (Orbitron, Rajdhani) sont chargées depuis Google Fonts
si une connexion est disponible. Sinon, des polices système sont utilisées
automatiquement — l'application reste parfaitement fonctionnelle.

---

## ❓ Questions fréquentes

### Mes données sont-elles sauvegardées automatiquement ?

**Non.** L'application fonctionne entièrement en mémoire dans le navigateur.
Pour conserver vos modifications, cliquez sur **↓ Sauvegarder .sqlite** et
gardez le fichier exporté. Vous pourrez le recharger lors de votre prochaine session.

### Le bouton "Charger database de Ryo" ne fonctionne pas

Ce bouton utilise `fetch()` qui nécessite un serveur HTTP. Si vous avez ouvert
le fichier `index.html` directement (adresse `file://...`), le chargement sera
bloqué par le navigateur. Lancez un serveur local avec `python -m http.server 8000`.

### Comment partager ma base avec d'autres joueurs ?

Exportez votre base via **↓ Sauvegarder .sqlite** et envoyez le fichier à vos
amis. Ils pourront le charger via **↑ Charger .sqlite**. Le fichier `.sqlite`
est un format standard, léger (quelques Ko) et compatible avec tous les
outils SQLite.

### Est-ce que je peux modifier le thème visuel ?

Oui. Les couleurs sont définies par des variables CSS dans le fichier `style.css`.
Modifiez les valeurs dans la section `:root` pour personnaliser le thème :

```css
:root {
  --neon-pink:   #ff2d95;   /* Rose néon */
  --neon-cyan:   #00ffff;   /* Cyan néon */
  --neon-yellow: #ffe14d;   /* Jaune néon */
  --bg-main:     #0a0a1a;   /* Fond principal */
}
```

### Comment ajouter un nouveau genre de jeu ?

Les genres sont définis dans le fichier `db.js` (tableau `GAME_TYPES`).
Ajoutez le nom du genre dans ce tableau, puis créez la classe CSS
correspondante dans `style.css` (par exemple `.type-mon-genre`).

### L'application fonctionne-t-elle sur mobile ?

Oui. L'interface est responsive : sur un écran étroit (< 768px), la grille
de jeux passe en une seule colonne et les éléments s'adaptent.

---

*LAN GAMES MANAGER by Ryo — Greetings to all LAN warriors!*
