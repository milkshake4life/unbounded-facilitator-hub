# UnboundEd Facilitator Hub

A centralized product to support facilitators, replacing information currently
scattered across Google Sheets and Docs. This repository contains the first of
three planned parts of the project.

## Part 1 — Facilitator Directory

A searchable, filterable directory of every facilitator the team has worked
with, replacing the shared contacts spreadsheet. Each facilitator has a
headshot plus rich profile information (pathways, grade bands, location,
contact info, availability, gear, and more).

### Features

- **Card grid** of facilitators with headshots, organization, pathways, and
  location.
- **Search** across name, organization, job title, content area, and location.
- **Filter** by pathway (English Language Arts, Mathematics, Leadership,
  UnboundEd Planning Process).
- **Sort** by name (A–Z / Z–A) or recently added.
- **View** a full facilitator profile in a detail modal.
- **Add / Edit / Delete** facilitators (kebab menu on each card + "Add
  Facilitator" button).
- **Archived** view for facilitators no longer active.
- **Pagination** for large directories.
- **Google sign-in** gates access when Firebase is configured.
- **Email allowlist** — only invited emails can use the app; any allowlisted
  user can invite or revoke others from the sidebar profile menu.
- **Import from Google Sheets** — pick a sheet from the Google Picker, map
  columns to fields, and import with a **merge (by email)** or **replace**
  strategy into a shared Firestore database.
- **Import Headshots** — pick a Google Drive folder, match photos to
  facilitators by filename, and store compressed images in Firestore.

> One-time Firebase + Google Cloud setup is documented in
> [`SETUP-GOOGLE-SHEETS.md`](./SETUP-GOOGLE-SHEETS.md).

> When Firebase is configured, facilitator data is stored in and streamed live
> from Firestore. Without configuration the app runs in **demo mode** against
> the in-memory sample data in `src/data/facilitators.ts` (headshots use the
> free [randomuser.me](https://randomuser.me) portrait set as stand-ins), so
> the UI still works before setup is finished.

## Tech stack

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/) for dev/build tooling
- [Tailwind CSS v4](https://tailwindcss.com/) for styling
- [lucide-react](https://lucide.dev/) for icons
- [Firebase](https://firebase.google.com/) (Auth + Firestore) for sign-in and
  shared data
- [Google Sheets / Drive / Picker APIs](https://developers.google.com/) for the
  import features

## Getting started

```bash
npm install
npm run dev      # start the dev server (http://localhost:5173)
```

To enable sign-in and the import features, copy `.env.example` to `.env.local`
and fill in your Firebase + Google keys — see
[`SETUP-GOOGLE-SHEETS.md`](./SETUP-GOOGLE-SHEETS.md). Without these the app runs
in **demo mode** on the in-memory sample data in `src/data/facilitators.ts`.

### Other scripts

```bash
npm run build    # type-check + production build
npm run preview  # preview the production build
npm run lint     # run oxlint
```

## Project structure

```
src/
  App.tsx                        # directory page: auth gate, search, filters, sort, grid
  types.ts                       # Facilitator data model + option lists
  data/facilitators.ts           # sample facilitator records (demo mode)
  lib/
    firebase.ts                  # Firebase app init (Auth + Firestore)
    useAuth.ts                   # Google sign-in hook
    useAccess.ts                 # allowlist gate after sign-in
    accessService.ts             # allowedUsers Firestore CRUD
    facilitatorsService.ts       # Firestore CRUD + import + headshot storage
    googleSheets.ts              # Google token, Picker, Sheets + Drive reads
    importMapping.ts             # sheet header -> field mapping + row parsing
    headshotMatch.ts             # match photo filenames to facilitators
    image.ts                     # client-side image compression
    useHeadshot.ts               # lazy-load + cache stored headshots
    ui.ts                        # shared UI helpers (chip colors, classNames)
  components/
    Sidebar.tsx                  # left navigation + signed-in profile menu
    FacilitatorCard.tsx          # directory card w/ view/edit/delete menu
    FacilitatorModal.tsx         # facilitator detail view
    FacilitatorFormModal.tsx     # add / edit facilitator form
    ImportWizardModal.tsx        # Google Sheets import wizard
    HeadshotImportModal.tsx      # Drive headshot import wizard
    ManageAccessModal.tsx        # invite / revoke allowlisted emails
    SignInScreen.tsx             # Google sign-in screen
    AccessDeniedScreen.tsx       # signed in but not allowlisted
    Avatar.tsx                   # headshot with graceful fallback
```

`firestore.rules` at the repo root is the recommended security rules (allowlist-
gated). Publish them in the Firebase console as described in the setup guide.

## Roadmap

- [x] Part 1 — Facilitator Directory
- [ ] Part 2 — _TBD_
- [ ] Part 3 — _TBD_
