# zReview — Instructions pour Claude

## Présentation du projet

SaaS de gamification des avis Google. Les entreprises (restaurants, salons, cafés…) configurent une **roue de la fortune** : le client laisse un avis Google, reçoit un code unique, tourne la roue et gagne une récompense.

Chaque entreprise a sa propre URL publique via sous-domaine dynamique :
`restaurant.visium-boost.fr` → page personnalisée récupérée depuis MongoDB par slug.

**Domaine de production** : `visium-boost.fr` (Vercel)

---

## Stack technique

- **Framework** : Next.js 14 App Router (JavaScript, pas TypeScript)
- **Base de données** : MongoDB via Mongoose (cluster Atlas : `zreview.raljo3q.mongodb.net`)
- **Auth** : JWT maison avec cookies httpOnly (`zreview_token`, 30 jours), bcryptjs pour les mots de passe
- **UI** : Tailwind CSS + styles inline, Recharts pour les graphiques
- **Fonts** : Calistoga (titres/logo) + Inter (corps) + JetBrains Mono (codes)
- **Runtime** : Node.js pour les API routes, Edge pour le middleware

---

## Structure des fichiers

```
src/
  app/
    page.js                        # Landing page (server component)
    layout.js                      # Root layout — fonts, metadata
    login/page.js                  # Page de connexion
    register/page.js               # Page d'inscription
    dashboard/
      layout.js                    # Wrappe AppProvider
      page.js                      # Dashboard client (vérifie auth via /api/auth/me)
    admin/
      layout.js
      page.js                      # Panel admin (KPI, graphiques, table clients)
    s/[slug]/
      page.js                      # Server component — fetch entreprise par slug
      PlayClient.js                # Roue de la fortune publique (client)
      not-found.js                 # 404 propre si slug inexistant
    play/page.js                   # Page roue legacy (gardée)
    api/
      auth/login|register|logout|me/route.js
      admin/clients/route.js       # GET/PATCH/DELETE — admin seulement
      admin/stats/route.js         # KPIs + graphiques — admin seulement
      entreprises/route.js         # GET/POST/PATCH/DELETE — utilisateur connecté
      entreprises/[slug]/route.js  # GET public — fetch par slug
      user/codes/route.js          # GET/POST codes anti-fraude
      codes/validate/route.js      # POST public — valider un code
      codes/generate/route.js      # POST — générer des codes (auth requise)
  components/
    AppShell.js                    # Shell principal du dashboard
    Sidebar.js                     # Sidebar avec user badge + nav
    MobileNav.js
    Icon.js                        # Icônes SVG inline
    StatCard.js
    pages/
      PageDashboard.js             # Tableau de bord avec graphiques
      PageClients.js               # Gestion des entreprises + slugs
      PageCodes.js                 # Codes anti-fraude
      PageWheel.js                 # Config de la roue
      PageAffiliation.js
      PageSubscription.js
      PageAccount.js
  lib/
    mongodb.js                     # Connexion Mongoose avec cache global
    auth.js                        # signToken, verifyToken, cookies (Node.js uniquement)
    context.js                     # AppProvider — state dashboard (localStorage: "zreview-state")
    utils.js                       # generateCode, uid, formatNum, données mock
    models/
      User.js                      # email, password, name, role, plan, businessName
      Entreprise.js                # slug (UNIQUE), nom, couleurs, rewards[]
      Code.js                      # userId, code (UNIQUE), used, usedAt
      WheelConfig.js               # Config roue par userId
  middleware.js                    # Subdomain routing + auth guards (Edge-safe)
  styles/globals.css
```

---

## Variables d'environnement (.env.local)

```env
MONGODB_URI=mongodb+srv://...@zreview.raljo3q.mongodb.net/?appName=zReview
JWT_SECRET=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_DOMAIN=visium-boost.fr
ADMIN_EMAIL=admin@zreview.fr
ADMIN_PASSWORD=Admin123!
```

**En production Vercel** :
- `NEXT_PUBLIC_APP_URL` = `https://visium-boost.fr`
- `NEXT_PUBLIC_APP_DOMAIN` = `visium-boost.fr`

---

## Modèles MongoDB

### User
```js
{ email, password (bcrypt), name, role: "admin"|"client", plan: "free"|"starter"|"pro",
  businessName, googleLink, phone, active, lastLogin, totalScans, totalReviews }
```

### Entreprise
```js
{ userId, slug (UNIQUE index), nom, logo, couleur_principale, couleur_secondaire,
  lien_avis, cta_text, rewards: [{ id, name, probability }],
  totalScans, totalReviews, active }
```

### Code
```js
{ userId, code (UNIQUE), used: false, usedAt, createdAt }
```

---

## Auth

- Cookie `zreview_token` — httpOnly, secure en prod, 30 jours
- JWT payload : `{ id, email, role, name }`
- **Middleware** (Edge) : décode le JWT sans vérifier la signature (atob base64) — pour routing uniquement
- **API routes** (Node.js) : vérifient la signature complète via `jsonwebtoken`
- Le compte admin est créé automatiquement à la première connexion (`POST /api/auth/login`)

---

## Système multi-tenant sous-domaines

Le middleware intercepte toutes les requêtes :

```
restaurant.visium-boost.fr/   → rewrite → /s/restaurant
restaurant.localhost:3000/    → rewrite → /s/restaurant
visium-boost.fr/              → comportement normal (landing, login, dashboard…)
```

La page `/s/[slug]` est un **Server Component** qui :
1. Appelle `connectDB()` + `Entreprise.findOne({ slug })`
2. Renvoie 404 si slug inexistant
3. Passe les données sérialisées à `PlayClient.js`

**Sans domaine custom** : l'URL publique tombe en fallback sur `APP_URL/s/[slug]`

---

## Commandes

```bash
npm run dev      # Démarrage en développement (port 3000)
npm run build    # Build production
npm run start    # Lancement en production
```

---

## Déploiement Vercel

1. Push le repo sur GitHub, importer dans Vercel
2. Ajouter les variables d'environnement (voir section ci-dessus)
3. Dans **Settings → Domains** : ajouter `visium-boost.fr` ET `*.visium-boost.fr` (wildcard)
4. Vercel génère automatiquement les certificats SSL wildcard
5. Redéployer après ajout des env vars

---

## Conventions de code

- **Pas de TypeScript** — JavaScript pur
- **Server Components** pour les pages publiques (landing, `/s/[slug]`)
- **Client Components** (`"use client"`) pour les formulaires, dashboard, admin
- **Styles** : Tailwind pour le dashboard, styles inline pour les pages publiques/auth
- **Couleurs brand** : Primary `#6C5CE7` (violet), Secondary `#00B894` (vert), Background dark `#0F0F1A`
- **Fonts** : Calistoga pour les titres et logo, Inter pour le reste
- Pas d'emojis comme icônes dans le dashboard — SVG inline via `Icon.js`
- Les API routes admin vérifient toujours `getCurrentUser()` + `role === "admin"`

---

## Plans tarifaires

| Plan | Prix | Établissements | Scans/mois |
|------|------|----------------|------------|
| free | 0€ | 1 | 50 |
| starter | 29€ | 3 | 500 |
| pro | 79€ | illimité | illimité |

Revenu mensuel calculé dans `/api/admin/stats` : `(nbFree × 0) + (nbStarter × 29) + (nbPro × 79)`
