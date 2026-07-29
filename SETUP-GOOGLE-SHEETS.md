# Google Sheets Import — Setup Guide

This feature lets a signed-in user pick a Google Sheet, map its columns to
facilitator fields, and import the rows into a shared Firestore database
(either **merging** by email or **replacing** the whole directory).

You only need to do this setup once. It takes ~15 minutes. Everything below is
free-tier friendly.

---

## What you'll end up with

- A **Firebase project** (Google sign-in + Firestore database).
- **Google Cloud** APIs enabled in that same project (Sheets + Picker) plus an
  OAuth Client ID and an API key.
- A local **`.env.local`** file holding those keys (git-ignored).

> A Firebase project *is* a Google Cloud project, so it's all one project.

---

## Step 1 — Create the Firebase project

1. Go to <https://console.firebase.google.com> → **Add project**.
2. Name it (e.g. `unbounded-facilitator-hub`). You can skip Google Analytics.
3. In the left nav: **Build → Authentication → Get started**.
   - Enable **Google** as a sign-in provider. Set a support email. Save.
4. In the left nav: **Build → Firestore Database → Create database**.
   - Start in **production mode**, pick a location, and create it.
5. Add a **Web app**: Project Overview → the `</>` (web) icon → register app.
   - Copy the config values it shows you (`apiKey`, `authDomain`, `projectId`,
     `storageBucket`, `messagingSenderId`, `appId`). You'll paste these into
     `.env.local` in Step 4.

### Firestore security rules

Copy the contents of `firestore.rules` from this repo into
**Firestore → Rules**, then **Publish**. Those rules:

- Allow only emails in the `allowedUsers` collection to read/write
  facilitators and headshots.
- Let any allowlisted user invite or revoke others.
- Let bootstrap emails (listed in `isBootstrapEmail()`) seed the allowlist
  on first sign-in.

Edit `isBootstrapEmail()` in the rules to include your admin email(s), and put
the same addresses in `VITE_BOOTSTRAP_ALLOWLIST` in `.env.local` (comma-
separated). After the first successful sign-in, use **Manage access** in the
sidebar profile menu to invite colleagues.

Alternatively, skip bootstrap and manually create a document in Firestore:

- Collection: `allowedUsers`
- Document ID: your email in lowercase (e.g. `you@unbounded.org`)
- Fields: `email` (string), `displayName` (null), `grantedBy` (null),
  `grantedAt` (number, e.g. `Date.now()`)

> Without an allowlist entry (or bootstrap), signed-in users see an
> “Access not granted” screen and cannot open the directory.

---

## Step 2 — Enable the Sheets & Picker APIs

Open the Google Cloud console for the **same project**
(<https://console.cloud.google.com> → pick your Firebase project at the top):

1. **APIs & Services → Library**.
2. Search and **Enable** each of these:
   - **Google Sheets API** (reading the spreadsheet)
   - **Google Picker API** (the file/folder chooser)
   - **Google Drive API** (listing + downloading headshot photos)

---

## Step 3 — OAuth consent screen + credentials

### Consent screen
1. **APIs & Services → OAuth consent screen**.
2. Choose **Internal** if this is a Google Workspace org (recommended — only
   your org's accounts can sign in, no verification needed). Otherwise
   **External** and add yourself as a test user.
3. Fill in app name + support email and save. No extra scopes needed here.

### OAuth Client ID (for the Sheets/Picker token)
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
   | `VITE_FIREBASE_API_KEY` … `VITE_FIREBASE_APP_ID` | Step 1.5 (web app config) |
   | `VITE_GOOGLE_CLIENT_ID` | Step 3 (OAuth client) |
   | `VITE_GOOGLE_API_KEY` | Step 3 (API key) |

3. Restart the dev server so Vite picks up the new env:
   ```bash
   npm run dev
   ```

Until these are filled in, the app runs in **demo mode** on the in-memory
sample data, and the import wizard shows a "finish setup" notice.

---

## Step 5 — Headshots (no extra setup needed)

The "Import Headshots" feature copies photos from a Drive folder, compresses
them in the browser, and stores them in a **`headshots` Firestore collection**
(no Firebase Storage / Blaze upgrade required — it stays on the free plan).

Just make sure your Firestore rules cover the `headshots` collection. Update the
rules from Step 1 to include it, then **Publish**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /facilitators/{doc} {
      allow read, write: if request.auth != null;
    }
    match /headshots/{doc} {
      allow read, write: if request.auth != null;
    }
  }
}
```

> Note: the headshot import also requests a **Drive read scope**
> (`drive.readonly`) so it can list and download the folder's images. The first
> time you use it, Google will ask for that additional permission — approve it
> once. (If you were already signed in, sign out and back in so your session
> picks up the new scope.)

---

## Step 5b — AI biographies (optional, one-time)

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

## Step 6 — Use it

**Import facilitator data:**
1. Open the app → sign in with Google.
2. Toolbar → **Import from Google Sheets**.
3. **Choose Google Sheet** → the Google Picker opens → pick your file.
4. Confirm the auto-detected **column mapping** (adjust any that are off).
5. Review the **preview**, choose **Merge / update** or **Replace everything**,
   and run the import.

**Import headshots (after the facilitators exist):**
1. Toolbar → **Import Headshots**.
2. **Choose Drive folder** → pick the folder of photos.
3. The app matches each photo to a facilitator by filename. **Review** the
   grid — thumbnails load as you scroll; fix any wrong/blank matches with the
   dropdown (set to "Skip" to leave a photo out).
4. **Upload** — matched photos are copied into Storage and attached to each
   facilitator's profile.

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
- **Headshot matching is by filename** and tolerant of inconsistent names
  (e.g. `Jane Smith.jpg`, `smith_jane_final.png`, `JSmith-headshot.jpg`). It's
  a best guess — always review before uploading.
- **Headshots overwrite by facilitator**: re-importing a photo for the same
  person replaces their previous one. If two files map to one person, the last
  uploaded wins (the review step warns you).
- Scopes used: `drive.file` + `spreadsheets.readonly` (sheet import) and
  `drive.readonly` (listing/downloading the headshot folder).
