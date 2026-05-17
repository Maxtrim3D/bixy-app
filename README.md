# BixyApp — Android

Application mobile Bixy pour Maxtrim3D.

## Prérequis

- Node.js 18+
- Android Studio (SDK 34, NDK 26.1)
- JDK 17
- Un appareil Android ≥ 7.0 (API 24) ou émulateur

## Installation

```bash
cd BixyApp
npm install

# Lier les modules natifs (React Native 0.73+ = auto-linking)
npx react-native run-android
```

## Connexion automatique

1. **LAN** : L'app ping `http://192.168.1.38/health` (timeout 500ms)
   - Succès → API directe, pas de VPN
2. **WireGuard** : Si le LAN ne répond pas, le tunnel démarre automatiquement
   - AllowedIPs = `10.8.0.1/32` (split-tunnel : seul le trafic vers le serveur passe par le VPN)
   - API → `http://10.8.0.1/api/v1`
3. **Fermeture / arrière-plan** → tunnel coupé automatiquement

## Structure

```
src/
├── constants/      config.ts (URLs, clé WG), colors.ts
├── services/       ConnectionManager.ts, WireGuardBridge.ts
├── api/            client.ts (axios + token)
├── store/          authStore.ts, connectionStore.ts
├── navigation/     RootNavigator, AuthStack, AppDrawer
├── screens/        Un dossier par module
└── components/ui/  Screen, ConnectionBanner

android/app/src/main/java/com/bixyapp/wireguard/
├── WireGuardModule.kt   ← pont JS → natif
├── WireGuardPackage.kt  ← enregistrement React Native
└── MainApplication.kt  ← ajout du package
```

## Modules disponibles (filtrés par rôle)

| Module | Permission |
|--------|-----------|
| Dashboard | — (tous) |
| Commandes | orders:read |
| Préparation | orders:prepare |
| Machines 3D | machines:read |
| Pointeuse | attendance:read |
| Commissions | commissions:read |
| Tâches | tasks:read |
| Réassort | restock:read |
| Utilisateurs | users:write |
| Paramètres | settings:read |

## Première permission VPN Android

Au premier lancement hors LAN, Android affiche une boîte de dialogue système pour autoriser le VPN.
L'utilisateur doit accepter une seule fois — la permission est mémorisée.
