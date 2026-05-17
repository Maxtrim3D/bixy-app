# Obtenir le fichier .apk — Guide étape par étape

## Prérequis (à installer une seule fois)

- [Git pour Windows](https://git-scm.com/download/win) — à installer si pas déjà là
- Un compte [GitHub](https://github.com) (gratuit)

---

## Étape 1 — Créer le repo GitHub

1. Va sur **https://github.com/new**
2. Nom du repo : `bixy-app`
3. Visibilité : **Privé** (Private) ← important
4. Ne coche rien d'autre
5. Clique **Create repository**

---

## Étape 2 — Pusher le code

Ouvre un terminal (PowerShell ou CMD) dans le dossier `BixyApp` :

```powershell
cd "D:\Windows\Bureau\Admin\Claude\App Maxtrim3D\BixyApp"

git init
git add .
git commit -m "Initial commit - Bixy Android app"
git branch -M main
git remote add origin https://github.com/TON_USERNAME/bixy-app.git
git push -u origin main
```

> Remplace `TON_USERNAME` par ton nom d'utilisateur GitHub.
> GitHub va te demander de te connecter (navigateur ou token).

---

## Étape 3 — Attendre le build (~15 min)

1. Va sur **https://github.com/TON_USERNAME/bixy-app/actions**
2. Tu vois un job **"Build Android APK"** qui tourne (icône jaune = en cours)
3. Attends qu'il devienne **vert** ✅

---

## Étape 4 — Télécharger l'APK

1. Clique sur le job vert
2. En bas de la page → section **Artifacts**
3. Clique sur **Bixy-debug-1** → télécharge le `.zip`
4. Extrais le zip → tu as `app-debug.apk`

---

## Étape 5 — Installer sur Android

1. Transfère `app-debug.apk` sur le téléphone (câble USB, email, Drive…)
2. Sur le téléphone : **Paramètres → Sécurité → Installer des apps inconnues** → Autoriser pour le gestionnaire de fichiers
3. Ouvre le fichier `.apk` depuis le téléphone
4. Installe → **Bixy** apparaît dans les apps

---

## Mettre à jour l'app

À chaque modification du code :

```powershell
git add .
git commit -m "Description du changement"
git push
```

→ GitHub Actions relance automatiquement le build → nouvel APK disponible dans Artifacts.

---

## Premier lancement hors WiFi

Android va afficher une boîte de dialogue :
> *"Bixy veut créer une connexion VPN"*

→ **OK** — c'est normal, c'est le tunnel WireGuard qui s'active pour rejoindre le serveur depuis l'extérieur.
Cette autorisation est mémorisée, elle ne sera demandée qu'une seule fois.
