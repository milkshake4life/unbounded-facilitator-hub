# Firebase, Firestore & Google Sheets — Setup Guide

This app stores facilitator data in **Cloud Firestore** (inside a Firebase
project). Google Sheets / Drive import is optional but recommended for bulk
loading.

You only need to do this setup once. It takes ~15 minutes. Everything below is
free-tier friendly.

---

## What you'll end up with

| Piece | What it does |
|---|---|
| **Firebase project** | Hosts Auth + **Firestore** (your database) |
| **Google sign-in** | Users sign in with their Google account |
| **Firestore** | Stores facilitators, headshots, and allowlisted users |
| **Google Sheets / Drive APIs** | Import from a sheet + match headshots/resumes from Drive folders |
| **`.env.local`** | Local keys (git-ignored) so the app can talk to Firebase/Google |

> A Firebase project *is* a Google Cloud project — it's all one project.

**Where data lives (all in Firestore — no Firebase Storage needed):**

| Collection / field | Contents |
|---|---|
| `facilitators/{id}` | Each facilitator's profile, including resume Drive file id |
| `headshots/{id}` | Compressed headshot photo (data URL) |
| `allowedUsers/{email}` | Who can sign in and use the app |

---

## Step 1 — Create the Firebase project + Firestore

### 1a. Create the project
1. Go to <https://console.firebase.google.com> → **Add project**.
2. Name it (e.g. `unbounded-facilitator-hub`). You can skip Google Analytics.

### 1b. Turn on Google sign-in
1. Left nav: **Build → Authentication → Get started**.
2. Open the **Sign-in method** tab → **Google** → **Enable**.
3. Set a support email → **Save**.

### 1c. Create the Firestore database
1. Left nav: **Build → Firestore Database → Create database**.
2. Choose **Start in production mode**.
3. Pick a location (closest to your users is fine) → **Enable**.

> This is the only database the app uses. You do **not** need Firebase Storage.

### 1d. Publish Firestore security rules
1. Still under **Firestore**, open the **Rules** tab.
2. Replace everything with the contents of `firestore.rules` from this repo.
3. Click **Publish**.

Those rules:
- Allow only emails in the `allowedUsers` collection to read/write
  `facilitators` and `headshots`.
- Let any allowlisted user invite or revoke others.
- Let bootstrap emails (listed in `isBootstrapEmail()`) seed the allowlist
  on first sign-in.

**Edit the bootstrap email** in `firestore.rules` → `isBootstrapEmail()` to
include your admin address(es). You'll mirror the same list in
`VITE_BOOTSTRAP_ALLOWLIST` in Step 4.

### 1e. Register a web app (get your Firebase config)
1. Project Overview (gear / home) → click the **`</>`** (Web) icon → register
   the app (nickname anything, e.g. `facilitator-hub`).
2. Copy the config values Firebase shows you — you'll need all of these for
   `.env.local`:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket` *(Firebase always includes this; paste it even though we
     don't use Storage)*
   - `messagingSenderId`
   - `appId`

### 1f. First allowlisted user (optional if using bootstrap)
If you prefer not to use bootstrap, manually create a document in Firestore:

| Field | Value |
|---|---|
| Collection | `allowedUsers` |
| Document ID | your email **lowercase** (e.g. `you@unbounded.org`) |
| `email` | same lowercase string |
| `displayName` | `null` |
| `grantedBy` | `null` |
| `grantedAt` | a number, e.g. `Date.now()` → `1730000000000` |

> Without an allowlist entry (or bootstrap), signed-in users see
> “Access not granted” and cannot open the directory.

---

## Step 2 — Enable Google Sheets, Picker & Drive APIs

Open the Google Cloud console for the **same** project
(<https://console.cloud.google.com> → pick your Firebase project at the top):

1. **APIs & Services → Library**.
2. Search and **Enable** each of these:
   - **Google Sheets API** — reading the facilitator spreadsheet
   - **Google Picker API** — the file/folder chooser in the browser
   - **Google Drive API** — listing + downloading headshots and resumes

---

## Step 3 — OAuth consent screen + credentials

### Consent screen
1. **APIs & Services → OAuth consent screen**.
2. Choose **Internal** if this is a Google Workspace org (recommended — only
   your org's accounts can sign in, no verification needed). Otherwise
   **External** and add yourself as a test user.
3. Fill in app name + support email and save. No extra scopes needed here.

### OAuth Client ID (Sheets / Drive token)
1. **APIs & Services → Credentials → Create credentials → OAuth client ID**.
2. Application type: **Web application**.
3. Under **Authorized JavaScript origins**, add:
   - `http://localhost:5173`
   - (later, add your deployed URL too)
4. Create → copy the **Client ID**. → `VITE_GOOGLE_CLIENT_ID`

### API key (for the Picker)
1. **Create credentials → API key** → copy it. → `VITE_GOOGLE_API_KEY`
2. (Recommended) **Restrict** the key to the **Google Picker API** and
   **Google Sheets API**, and to your `localhost`/deployed origins.

---

## Step 4 — Add the keys locally

1. Copy the template:
   ```bash
   cp .env.example .env.local
   ```
2. Fill in every value in `.env.local`:

   | Variable | Where it comes from |
   |---|---|
   | `VITE_FIREBASE_API_KEY` | Step 1e (web app config → `apiKey`) |
   | `VITE_FIREBASE_AUTH_DOMAIN` | Step 1e (`authDomain`) |
   | `VITE_FIREBASE_PROJECT_ID` | Step 1e (`projectId`) |
   | `VITE_FIREBASE_STORAGE_BUCKET` | Step 1e (`storageBucket`) — paste it even though Storage is unused |
   | `VITE_FIREBASE_MESSAGING_SENDER_ID` | Step 1e (`messagingSenderId`) |
   | `VITE_FIREBASE_APP_ID` | Step 1e (`appId`) |
   | `VITE_BOOTSTRAP_ALLOWLIST` | Your admin email(s), comma-separated — must match `isBootstrapEmail()` in `firestore.rules` |
   | `VITE_GOOGLE_CLIENT_ID` | Step 3 (OAuth client) |
   | `VITE_GOOGLE_API_KEY` | Step 3 (API key) |

3. Restart the dev server so Vite picks up the new env:
   ```bash
   npm run dev
   ```

Until these are filled in, the app runs in **demo mode** on the in-memory
sample data, and the import wizards show a "finish setup" notice.

---

## Step 5 — Headshots & resumes (no extra Firebase setup)

Both features use what you already set up:

- **Headshots** — photos are compressed in the browser and stored in the
  Firestore `headshots` collection.
- **Resumes** — the app saves each file's **Google Drive file id** on the
  facilitator document in Firestore. Clicking a resume downloads it from Drive
  (opens a new tab + saves the file). Files stay in your Drive folder; Firestore
  only stores the link.

Just make sure:
1. Firestore rules from Step 1d are published (they already cover `facilitators`
   and `headshots`).
2. The **Google Drive API** from Step 2 is enabled.
3. The first time you import, Google may ask for Drive permission — approve it.
   If you were already signed in, sign out and back in so the new scope sticks.

---

## Step 6 — AI biographies (optional)

The **Biography** tab can generate a district-facing bio with Gemini when the
intake form left that field blank.

1. Make sure you already completed Firebase AI Logic setup once
   ([Firebase console](https://console.firebase.google.com) → **Build → AI** →
   **Get started** → **Gemini Developer API**). That creates a Gemini key in
   your Google Cloud project.
2. Open **Google Cloud credentials** for the **same** project:
   <https://console.cloud.google.com/apis/credentials>
   (confirm the project picker at the top matches your Firebase project).
3. Under **API keys**, open
   **Gemini Developer API key (auto created by Firebase)**
   (or create a new API key if you don’t see that one).
4. Click **Show key** / copy the key value.
5. Add it to `.env.local`:
   ```bash
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```
6. **Restart** the dev server (`npm run dev`) so Vite picks up the new var.
7. (Recommended) On that same credentials page, under **API restrictions**:
   - Choose **Restrict key**
   - Select **Gemini API** (this is the Developer API behind
     `generativelanguage.googleapis.com`; older consoles called it
     “Generative Language API”)
   - Do **not** select “Gemini for Google Cloud API” — that is Vertex/Agent
     Platform and will block biography generation
   - Under **Application restrictions**, you can leave **None** for now, or
     set **HTTP referrers** to `http://localhost:5173/*` (and your deployed
     origin later)
   - Click **Save** (changes can take up to ~5 minutes)

Without `VITE_GEMINI_API_KEY`, Generate still works in demo mode via a simple
template bio (not true AI).

> Note: Firebase AI Logic also enforces App Check on its client SDKs. This app
> calls the Gemini Developer API directly with your key instead, which is
> simpler for localhost and internal use.

---

## Step 7 — Use it

**Import facilitator data (and optionally headshots / resumes):**
1. Open the app → sign in with Google.
2. Toolbar → **Import from Google Sheets**.
3. **Choose Google Sheet** → the Google Picker opens → pick your file.
4. Confirm the auto-detected **column mapping** (adjust any that are off).
5. Choose **Merge / update** or **Replace everything**.
6. Optionally **Attach Drive folders** for headshots and/or resumes.
7. Run the import. If you attached folders, review filename matches and upload /
   link them after the sheet writes to Firestore.

---

## Notes & gotchas

- **First row must be headers.** The importer reads the first tab; row 1 is
  treated as column names, and auto-mapping matches on those names.
- **Multi-value cells** (pathways, grade bands, other programs) can be
  separated by commas, semicolons, or new lines — e.g. `Math, Leadership`.
  (Slashes are kept for program names like `GLEAM® Inventory / Learning Walks`.)
- **Comfort / grade bands:** Google Forms grid columns like
  `… [K-5]`, `… [6-8]` with cells `I nerd out for this!` / `This is fine.` /
  `I do not want to facilitate this.` are auto-detected. You can also map a
  single “Grade bands” list column.
- **Standards Institute:** cells with `National`, `Local`, both, or empty/`No`
  map to national / local / both / no.
- **Merge matches on email** (`unboundedEmail`, falling back to
  `personalEmail`). Rows without an email are always added as new records.
  Only mapped columns overwrite existing values on merge.
- **Replace is destructive** — it deletes all existing records first. The
  wizard makes you pick this explicitly.
- **Headshot / resume matching is by filename** and tolerant of inconsistent
  names (e.g. `Jane Smith.jpg`, `Jane_Smith_Resume.pdf`). It's a best guess —
  always review before uploading.
- **Overwrites by facilitator**: re-importing a photo or resume for the same
  person replaces their previous one. If two files map to one person, the last
  uploaded wins (the review step warns you).
- **Resumes stay in Drive.** Firestore only stores the file id + filename.
  Anyone opening a resume needs Google Drive access to that shared folder.
  Supported types: PDF, `.doc`, `.docx`.
- Scopes used: `drive.file` + `spreadsheets.readonly` (sheet import) and
  `drive.readonly` (listing/downloading headshot and resume folders).
