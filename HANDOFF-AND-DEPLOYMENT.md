# Handoff, Migration & Deployment Guide

This guide is written for someone **with no coding or server experience** who
needs to:

1. Move the Facilitator Hub off a **personal Google account** onto an
   **organizational account** (e.g. `something@unbounded.org`)
2. Make sure **sign-in, database rules, and team access** all work correctly
3. **Deploy the live website** on Vercel so the team can use it in a browser

You do **not** need to install or run a backend server. The “backend” is
Firebase (Google’s hosted database + sign-in). The website is a static app
hosted on Vercel.

**Time estimate:** 1–2 hours the first time, mostly clicking through Google and
Vercel setup screens.

---

## Before you start — gather these

| Item | Example | Why you need it |
|------|---------|-----------------|
| **Org Google account** | `facilitators@unbounded.org` | Will own Firebase, Google Cloud, and Vercel |
| **GitHub access** | Login that can see this repo | Vercel deploys from GitHub |
| **Current owner’s help** (one time) | Person who set up the personal account | To add you as Owner or export data |
| **Team admin emails** | List of who should sign in on day one | For the access allowlist |

Keep a simple notes doc (Google Doc is fine) to paste keys and URLs as you go.
**Do not** put secrets in the GitHub repo — only in Vercel’s environment
settings and your private notes.

---

## Plain-English glossary

| Term | What it means here |
|------|---------------------|
| **Firebase** | Google’s service that handles “Sign in with Google” and stores app data |
| **Firestore** | The database inside Firebase (facilitators, events, templates, etc.) |
| **Firebase project** | One bundle of Auth + Firestore + settings. This app uses exactly one. |
| **Google Cloud project** | The same thing as the Firebase project under the hood |
| **OAuth** | The “Allow this app to access your Google Sheet / Gmail / Calendar?” prompts |
| **Allowlist** | List of emails allowed to use the Hub after signing in |
| **Bootstrap admin** | The first email(s) allowed in before anyone else is invited |
| **Vercel** | Hosts the public website (the pages users see) |
| **Environment variables** | Secret settings (API keys) injected when the site is built |
| **Demo mode** | What users see if keys are missing — sample data only, nothing saved |

---

## How the pieces connect

```
┌─────────────────┐     sign-in + data     ┌──────────────────┐
│  User's browser │ ◄──────────────────► │ Firebase         │
│  (the Hub app)  │                        │ (Auth + Firestore)│
└────────┬────────┘                        └──────────────────┘
         │
         │  import sheets, send email,
         │  calendar invites
         ▼
┌─────────────────┐
│ Google APIs     │
│ Sheets/Drive/   │
│ Gmail/Calendar  │
└─────────────────┘

The Hub app files are served from Vercel (https://your-app.vercel.app).
Firebase and Google Cloud hold the data and permissions.
```

---

## Choose your migration path

There are two ways to move off a personal account. **Start with Path A** unless
your organization requires a completely separate project.

### Path A — Add the org account as Owner (recommended)

**Best when:** You want to keep all existing facilitator data, events, templates,
and allowlisted users with minimal risk.

**What happens:** The same Firebase project keeps running. You add the org Google
account as an **Owner**, then optionally remove the personal account later.

**Pros:** No data copy, no downtime, fastest.  
**Cons:** The project still has the old name/ID unless you rename it (optional).

<details>
<summary><strong>Path A — Step-by-step</strong></summary>

#### A1. Current owner adds the org account to Firebase

1. Current owner signs in at <https://console.firebase.google.com>.
2. Opens the Facilitator Hub project.
3. Click the **gear icon** (Project settings) → **Users and permissions**.
4. Click **Add member**.
5. Enter the **org email address**.
6. Role: **Owner**.
7. Click **Add member**.

The org account will receive an email invitation. Accept it.

#### A2. Org account also becomes Owner in Google Cloud

Firebase permissions alone are not always enough for billing and API settings.

1. Org account signs in at <https://console.cloud.google.com>.
2. At the top, pick the **same project** as Firebase (same name / project ID).
3. Left menu: **IAM & Admin → IAM**.
4. Click **Grant access** (or **+ ADD**).
5. Principal: the org email. Role: **Owner**.
6. Save.

#### A3. Transfer primary ownership (optional but good practice)

1. In Firebase → **Project settings → Users and permissions**.
2. Confirm the org account is **Owner**.
3. When ready, the personal account can be downgraded to **Editor** or removed
   — but **never remove the last Owner**.

#### A4. Update support & contact emails

In both places, change “support email” to the org address if it still shows a
personal email:

- Firebase → **Project settings → General**
- Google Cloud → **APIs & Services → OAuth consent screen**

#### A5. Skip to [Part 2 — Firestore rules](#part-2--publish-firestore-security-rules)
and [Part 4 — Vercel](#part-4--deploy-on-vercel).

</details>

---

### Path B — New Firebase project + copy data

**Best when:** The org must own a fresh project from day one, or the personal
account cannot remain on the project.

**What happens:** Create a new Firebase project under the org account, copy
Firestore data, point Vercel at the new keys, retire the old project.

**Pros:** Clean ownership from the start.  
**Cons:** More steps; you need a one-time data export/import (often with help).

<details>
<summary><strong>Path B — Step-by-step</strong></summary>

#### B1. Export data from the old project

This uses Google Cloud Storage (a temporary “folder” for the export file).

1. Old project owner: open <https://console.cloud.google.com> → select the
   **old** Firebase project.
2. **Firestore → Import/Export** (or search “Firestore export” in the top bar).
3. If prompted, **create a Cloud Storage bucket** in the **same region** as
   Firestore (e.g. `us-central1`). Name it something like
   `unbounded-firestore-backup`.
4. Run **Export** → select **Export entire database** → choose that bucket →
   **Export**.
5. Wait until the export finishes (can take a few minutes to an hour depending
   on size). You’ll see a folder path like
   `gs://unbounded-firestore-backup/2026-08-17/...`.

> **No Cloud Console access?** Ask the current owner to perform this export and
> grant your org account **Storage Object Viewer** on that bucket.

#### B2. Create the new Firebase project

Follow [Part 1 — New project setup](#part-1--firebase--google-cloud-setup) below
using the **org account** only.

#### B3. Import data into the new project

1. Org account: Google Cloud Console → select the **new** project.
2. **Firestore → Import/Export → Import**.
3. Choose the export folder from B1 (same bucket path).
4. **Import** → wait for completion.

> Import does **not** copy Firebase Authentication users — but this app uses
> Google sign-in and an email **allowlist in Firestore**, so team access comes
> from the imported `allowedUsers` collection. Verify that collection imported
> correctly.

#### B4. Update Vercel environment variables

Use the **new** project’s keys (Part 1). Redeploy (Part 4).

#### B5. Retire the old project (later)

After 2–4 weeks of confirmed use, the old project owner can disable or delete
the old Firebase project to avoid duplicate costs or confusion.

</details>

---

## Part 1 — Firebase & Google Cloud setup

Use this section for a **brand-new project** (Path B) or to verify an
existing project (Path A) has everything enabled.

Detailed API steps also live in [`SETUP-GOOGLE-SHEETS.md`](./SETUP-GOOGLE-SHEETS.md).
This section focuses on **ownership, access, and go-live**.

### 1. Create the Firebase project

1. Sign in to <https://console.firebase.google.com> with the **org account**.
2. **Add project** → name it e.g. `unbounded-facilitator-hub`.
3. You can skip Google Analytics.

**You should see:** Project dashboard with “Get started” cards.

### 2. Turn on Google sign-in

1. Left sidebar: **Build → Authentication → Get started**.
2. Tab **Sign-in method** → **Google** → **Enable**.
3. **Support email:** pick the org address → **Save**.

### 3. Create the Firestore database

1. **Build → Firestore Database → Create database**.
2. **Start in production mode** (we add proper rules next).
3. Pick a region close to your team (e.g. `us-central`) → **Enable**.

> The app does **not** use Firebase Storage. You only need Firestore.

### 4. Register the web app (save these values)

1. Project home → click **`</>` Web** → register app (nickname:
   `facilitator-hub`).
2. Copy the config block — you’ll need every value for Vercel later:

| Firebase label | Vercel / env name |
|----------------|-------------------|
| `apiKey` | `VITE_FIREBASE_API_KEY` |
| `authDomain` | `VITE_FIREBASE_AUTH_DOMAIN` |
| `projectId` | `VITE_FIREBASE_PROJECT_ID` |
| `storageBucket` | `VITE_FIREBASE_STORAGE_BUCKET` |
| `messagingSenderId` | `VITE_FIREBASE_MESSAGING_SENDER_ID` |
| `appId` | `VITE_FIREBASE_APP_ID` |

Paste them into your private notes doc now.

### 5. Enable Google APIs

In <https://console.cloud.google.com> (same project selected at the top):

**APIs & Services → Library** → search and **Enable** each:

- Google Sheets API
- Google Picker API
- Google Drive API
- Gmail API
- Google Calendar API
- Generative Language API / Gemini API *(optional — AI biographies)*

### 6. OAuth consent screen

1. **APIs & Services → OAuth consent screen**.
2. User type:
   - **Internal** — if you use Google Workspace `@unbounded.org` (recommended;
     only org accounts can authorize).
   - **External** — if not on Workspace; add test users until verified.
3. App name: `UnboundEd Facilitator Hub`.
4. Support email: org address → Save through the summary.

You do **not** need to pre-add every scope. The app requests Gmail/Calendar
access the first time someone sends email or a calendar invite.

### 7. Create OAuth Client ID

1. **APIs & Services → Credentials → Create credentials → OAuth client ID**.
2. Type: **Web application**.
3. Name: `Facilitator Hub Web`.
4. **Authorized JavaScript origins** — add **all** of these (adjust URLs to
   yours):

   ```
   http://localhost:5173
   https://your-project-name.vercel.app
   https://facilitators.unbounded.org
   ```

   Add localhost for local testing, your Vercel URL (you get this in Part 4),
   and any custom domain.

5. **Authorized redirect URIs** — leave empty for this app (it uses popup sign-in).
6. Create → copy **Client ID** → save as `VITE_GOOGLE_CLIENT_ID`.

### 8. Create API key (Google Picker)

1. **Create credentials → API key** → copy → save as `VITE_GOOGLE_API_KEY`.
2. Click **Restrict key** (recommended):
   - **API restrictions:** Google Picker API, Google Sheets API
   - **Application restrictions:** HTTP referrers → add the same origins as
     step 7 (e.g. `https://your-project-name.vercel.app/*`)

### 9. Gemini API key (optional)

For AI-generated biographies:

1. Firebase console → **Build → AI** → enable Gemini if prompted, **or**
2. Google Cloud → **Credentials** → create or copy a **Gemini Developer API**
   key → save as `VITE_GEMINI_API_KEY`.

Without this key, biography generation uses a simple template instead of AI.

---

## Part 2 — Publish Firestore security rules

Rules control **who can read and write data**. Without correct rules, users
either can’t save anything or (worse) data could be exposed.

### What to do

1. On your computer, open the file `firestore.rules` in this GitHub repo
   (or ask a developer to send you the file).
2. Find the function `isBootstrapEmail()` near the top. It looks like:

   ```
   return emailKey() in ['admin@unbounded.org', 'colleague@unbounded.org'];
   ```

3. Replace the email(s) inside the brackets with your **real org admin
   emails** (lowercase, in single quotes, comma-separated).
4. Firebase console → **Firestore Database → Rules**.
5. Delete everything in the editor → paste the **entire** updated
   `firestore.rules` file.
6. Click **Publish**.

**You should see:** “Rules published successfully” and a timestamp.

> Every bootstrap email must appear in **both** `firestore.rules` **and**
> `VITE_BOOTSTRAP_ALLOWLIST` in Vercel (Part 4). If they don’t match, the
> first admin sign-in will fail with “Access not granted.”

### What the rules protect

| Collection | Who can access |
|------------|----------------|
| `facilitators` | Any allowlisted user |
| `headshots` | Any allowlisted user |
| `allowedUsers` | Allowlisted users; bootstrap emails can create first entries |
| `emailTemplates` | Any allowlisted user |
| `events` | Any allowlisted user |
| `groups` | Only the group’s owner (personal groups) |

---

## Part 3 — Who can sign in (allowlist)

### First admins (bootstrap)

When the app is new (or `allowedUsers` is empty), only emails listed as
**bootstrap** can get in:

1. **`firestore.rules`** → `isBootstrapEmail()` (Part 2)
2. **Vercel** → `VITE_BOOTSTRAP_ALLOWLIST` = same emails, comma-separated, no
   spaces required:

   ```
   admin@unbounded.org,colleague@unbounded.org
   ```

3. Those people sign in with Google once. The app automatically creates their
   `allowedUsers` documents.

### Everyone else

After bootstrap admins are in:

1. Sign in to the live Hub.
2. Click your **profile** (bottom of left sidebar) → **Manage access**.
3. **Invite** teammates by email.

Only invited emails can use the app. Signing in with Google alone is not enough.

### If someone sees “Access not granted”

Checklist:

- [ ] Their email is in **Manage access**, **or** they are a bootstrap admin
- [ ] `VITE_BOOTSTRAP_ALLOWLIST` on Vercel matches `firestore.rules`
- [ ] Vercel was **redeployed** after env var changes
- [ ] They are signing in with the **same Google account** as the invited email

---

## Part 4 — Deploy on Vercel

Vercel builds the app from GitHub and hosts it at a public URL.

### 4a. Connect GitHub to Vercel

1. Sign in to <https://vercel.com> with the **org account** (or a Vercel team
   owned by the org).
2. **Add New → Project**.
3. **Import** the GitHub repository `UnboundEd-Facilitator-Project` (or whatever
   the repo is named).
4. If GitHub doesn’t show the repo, click **Adjust GitHub App Permissions** and
   grant access to that repository.

### 4b. Configure the build

Vercel usually auto-detects Vite. Confirm these settings:

| Setting | Value |
|---------|-------|
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

Click **Environment Variables** and add **every** row below. Use **Production**
(and optionally Preview/Development for testing branches).

| Name | Value |
|------|-------|
| `VITE_FIREBASE_API_KEY` | From Firebase web app config |
| `VITE_FIREBASE_AUTH_DOMAIN` | From Firebase web app config |
| `VITE_FIREBASE_PROJECT_ID` | From Firebase web app config |
| `VITE_FIREBASE_STORAGE_BUCKET` | From Firebase web app config |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | From Firebase web app config |
| `VITE_FIREBASE_APP_ID` | From Firebase web app config |
| `VITE_BOOTSTRAP_ALLOWLIST` | Org admin emails, comma-separated |
| `VITE_GOOGLE_CLIENT_ID` | OAuth Client ID from Google Cloud |
| `VITE_GOOGLE_API_KEY` | API key from Google Cloud |
| `VITE_GEMINI_API_KEY` | *(Optional)* Gemini key |

Then click **Deploy**.

**First deploy takes ~2–5 minutes.** You’ll get a URL like
`https://unbounded-facilitator-project.vercel.app`.

### 4c. Add Vercel URL to Firebase Auth

Google sign-in will fail on the live site until Firebase trusts the domain:

1. Firebase console → **Build → Authentication → Settings**.
2. Tab **Authorized domains**.
3. **Add domain** → paste your Vercel hostname only (no `https://`), e.g.
   `unbounded-facilitator-project.vercel.app`.
4. If you use a custom domain later, add that too (e.g.
   `facilitators.unbounded.org`).

### 4d. Add Vercel URL to Google OAuth

Go back to Google Cloud → **Credentials** → your OAuth client → **Authorized
JavaScript origins**:

Add:

```
https://unbounded-facilitator-project.vercel.app
```

(and your custom domain when you have one). Save.

Also update the **API key** HTTP referrer restrictions to include
`https://unbounded-facilitator-project.vercel.app/*`.

### 4e. Redeploy after env changes

Any time you change environment variables in Vercel:

1. Vercel project → **Deployments**.
2. Click **⋯** on the latest deployment → **Redeploy**.

Or push any commit to GitHub — Vercel redeploys automatically.

### 4f. Custom domain (optional)

1. Vercel project → **Settings → Domains**.
2. Add e.g. `facilitators.unbounded.org`.
3. Follow Vercel’s DNS instructions (usually a CNAME record).
4. Add that domain to **Firebase Authorized domains** and **Google OAuth
   origins** (same as 4c and 4d).

---

## Part 5 — After go-live checklist

Run through this once the site is live. Have two people test if possible.

### Sign-in & access

- [ ] Bootstrap admin can sign in at the Vercel URL
- [ ] Bootstrap admin does **not** see “Access not granted”
- [ ] Bootstrap admin can open **Manage access** and invite a second person
- [ ] Second person can sign in after being invited
- [ ] Sign-out and sign-in again works

### Data

- [ ] Facilitator directory shows real data (not demo/sample names like repeated
  “Denver, CO” placeholders for everyone)
- [ ] Editing a facilitator saves and still appears after refresh
- [ ] Events and Templates sections load

### Google features (each needs a one-time “Allow” click)

- [ ] **Import from Google Sheets** opens the file picker
- [ ] **Email group** sends (check Gmail sent folder)
- [ ] **Calendar HOLD** on an event sends an invite
- [ ] **Generate bio** works if Gemini key is set

### Security

- [ ] Someone **not** on the allowlist sees “Access not granted”
- [ ] `firestore.rules` are published (Firebase → Firestore → Rules → check
  timestamp)
- [ ] Personal account removed or demoted from Owner if migrating off it
- [ ] Secrets only in Vercel env vars — **not** committed to GitHub

---

## Part 6 — Troubleshooting

### “Demo mode” / sample data only

**Cause:** Firebase env vars missing or wrong on Vercel.  
**Fix:** Double-check all `VITE_FIREBASE_*` values → Redeploy.

### “Access not granted” for an admin

**Cause:** Bootstrap list mismatch or user not invited.  
**Fix:** Match `VITE_BOOTSTRAP_ALLOWLIST` and `isBootstrapEmail()` in rules;
redeploy. Or add them via Firestore manually (advanced — ask a developer).

### Google sign-in popup closes with an error

**Cause:** Domain not authorized.  
**Fix:** Add Vercel URL to Firebase **Authorized domains** and Google OAuth
**JavaScript origins**.

### Import / Gmail / Calendar says “not configured”

**Cause:** Missing `VITE_GOOGLE_CLIENT_ID` or APIs not enabled.  
**Fix:** Part 1 steps 5–8; redeploy Vercel.

### “This app is blocked” or OAuth errors for teammates

**Cause:** OAuth consent screen is **External** and users aren’t test users, or
app needs verification.  
**Fix:** If on Google Workspace, switch consent screen to **Internal**. Otherwise
add each user as a **Test user** on the consent screen.

### Changes to rules don’t seem to apply

**Fix:** Firebase → Firestore → Rules → confirm you clicked **Publish**, not
just Save draft.

### Vercel build fails

**Common fixes:** Ensure Node version is 20+ in Vercel project settings; check
build logs for typos in env var names (must start with `VITE_`).

---

## Part 7 — Handoff checklist (what to document)

When migration is complete, record these in a **team-owned** password manager
or secure doc (not a personal account):

| Asset | Where it lives | Owner account |
|-------|----------------|---------------|
| Firebase project | console.firebase.google.com | Org Google account |
| Google Cloud APIs & OAuth | console.cloud.google.com | Same project |
| Firestore data | Firebase → Firestore | Same project |
| GitHub repository | github.com | Org or team |
| Vercel project | vercel.com | Org team |
| Production URL | Vercel → Domains | — |
| Env vars backup | Vercel → Settings → Environment Variables | Export/screenshot securely |
| Bootstrap admin emails | `firestore.rules` + Vercel | — |
| Google Sheet / Drive folders | Drive (for imports) | Shared team drive recommended |

### Recommended ongoing ownership

- **At least two Owners** on Firebase and Google Cloud (avoid a single point of
  failure).
- **Vercel team** under the org, not a personal Vercel account.
- **Billing** on a org payment method if you outgrow free tiers.

---

## Local testing (optional — for a developer helper)

If someone technical needs to test before deploy:

```bash
git clone <repo-url>
cd UnboundEd-Facilitator-Project
npm install
cp .env.example .env.local
# fill .env.local with the same VITE_* values as Vercel
npm run dev
# open http://localhost:5173
```

See [`SETUP-GOOGLE-SHEETS.md`](./SETUP-GOOGLE-SHEETS.md) for import and feature
details.

---

## Related docs

| Document | Purpose |
|----------|---------|
| [`README.md`](./README.md) | What the platform does — features and structure |
| [`SETUP-GOOGLE-SHEETS.md`](./SETUP-GOOGLE-SHEETS.md) | Detailed Google API and import setup |
| [`.env.example`](./.env.example) | List of all environment variables |
| [`firestore.rules`](./firestore.rules) | Database security rules to publish in Firebase |
