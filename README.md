# UnboundEd Facilitator Hub

A centralized web app for the UnboundEd facilitator team, replacing information
scattered across Google Sheets and Docs. The hub brings together a searchable
facilitator directory, event staffing workflows, personal facilitator groups,
and a shared email template library — all in one place.

## Architecture

This is a **client-only single-page application**. There is no custom backend
server. The React app runs in the browser and talks directly to:

- **Firebase Auth + Firestore** for sign-in and shared data
- **Google APIs** for Sheets/Drive import, Gmail, and Calendar

Production builds are static files (`npm run build` → `dist/`) suitable for any
static host. Firebase and Google Cloud configuration lives outside the repo.

## Platform overview

The sidebar has three main sections. Navigation is in-memory (no URL routing).

| Section | Sub-views | Purpose |
|---------|-----------|---------|
| **Directory** | All Facilitators, Groups, Archived | Search, filter, and manage facilitator profiles |
| **Events** | Event list → event detail | Booking pipeline and staffing board |
| **Templates** | Template library | Shared team email templates |

---

### Directory

A searchable, filterable directory of every facilitator the team has worked
with. Each facilitator has a headshot plus rich profile information (pathways,
grade bands, location, contact info, availability, gear, and more).

**All Facilitators**

- Card grid with headshots, organization, pathways, and location
- Search across name, organization, job title, city, state, and region
- Filters by pathway, event history (Standards Institute / Summit / In-Service),
  programs, and US region
- Sort by name (A–Z / Z–A) or recently added
- Pagination (12 per page)
- Full profile modal with tabs: UnboundEd Experience, Professional, Biography,
  Contact & Availability
- Add / Edit / Archive / Delete facilitators
- **Add to group** from any facilitator card
- **Birthday alerts widget** — upcoming birthdays with a Gmail compose shortcut
- **AI biography generation** via Gemini (falls back to a template when no API
  key is configured)

**Import & media**

- **Import from Google Sheets** — pick a sheet via Google Picker, map columns
  to fields, and import with **merge (by email)** or **replace all** into
  Firestore
- **Import headshots** — pick a Google Drive folder, match photos to
  facilitators by filename, and store compressed images in Firestore
- **Import resumes** — match resume files from a Drive folder; only the Drive
  file ID is stored (resumes stay in Drive)

**Groups**

- Personal curated sets of facilitators (owner-only in Firestore)
- Create, edit, archive, and delete groups; manage members
- **Email group** via Gmail (BCC recipients, with template picker)

**Archived**

- Archived facilitators, groups, and events in one view

---

### Events

A shared booking and staffing board for client events. Any allowlisted user can
read and write events.

**Event management**

- Create, edit, archive, and delete events keyed by Account | School
- Event types: Executive Coaching, GLEAM Learning Walk, In Service Workshop,
  Standards Institute, Summit, Custom
- Modes: In-Person or Virtual
- Pipeline stages: Prospective → Likely → Contracted → Delivered
- Pathways → Sections → Placements hierarchy for staffing

**Staffing workflow**

- Assign facilitators to sections with placement stages:
  Proposed → Availability → HOLD → CONFIRM → Contracted
- Drop a facilitator with a required reason
- **Google Calendar HOLD/CONFIRM invites** (stored `calendarEventId` on each
  placement)
- **Email event** staffed facilitators via Gmail

---

### Templates

A shared team email template library (Communication / Purpose / Subject / Body).
Any allowlisted user can create, edit, and delete templates. Templates are
available when composing group, event, and birthday emails.

In demo mode the app loads 12 seed templates from `src/data/templates.ts`.

---

## Access control

When Firebase is configured:

- **Google sign-in** gates access
- **Email allowlist** in Firestore (`allowedUsers` collection) — only invited
  emails can use the app
- **Bootstrap allowlist** via `VITE_BOOTSTRAP_ALLOWLIST` seeds the first admins
  (must mirror `isBootstrapEmail()` in `firestore.rules`)
- Any allowlisted user can **invite or revoke** others from the sidebar profile
  menu

When Firebase env vars are missing, the app runs in **demo mode**:

- Skips sign-in and allowlist checks
- Uses in-memory sample data: **24 facilitators** in `src/data/facilitators.ts`
  and **12 email templates** in `src/data/templates.ts`
- Headshots use the free [randomuser.me](https://randomuser.me) portrait set
- Changes are local-only and not persisted

> One-time Firebase + Google Cloud setup is documented in
> [`SETUP-GOOGLE-SHEETS.md`](./SETUP-GOOGLE-SHEETS.md).

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| Build | [Vite 8](https://vite.dev/) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) |
| Icons | [lucide-react](https://lucide.dev/) |
| Linting | oxlint |
| Auth & database | [Firebase](https://firebase.google.com/) (Auth + Firestore) |
| Google integrations | Sheets, Drive, Picker, Gmail, Calendar APIs |
| AI | [Gemini Developer API](https://ai.google.dev/) (optional, for biographies) |

---

## Getting started

```bash
npm install
npm run dev      # start the dev server (http://localhost:5173)
```

To enable sign-in, shared data, and Google integrations, copy `.env.example` to
`.env.local` and fill in your keys — see
[`SETUP-GOOGLE-SHEETS.md`](./SETUP-GOOGLE-SHEETS.md). Without these the app
runs in **demo mode** on the in-memory sample data.

### Other scripts

```bash
npm run build    # type-check + production build → dist/
npm run preview  # preview the production build
npm run lint     # run oxlint
```

---

## Environment variables

Copy `.env.example` → `.env.local` (git-ignored). Full setup steps are in
[`SETUP-GOOGLE-SHEETS.md`](./SETUP-GOOGLE-SHEETS.md).

| Variable | Purpose |
|----------|---------|
| `VITE_FIREBASE_*` | Firebase web app config (Auth + Firestore) |
| `VITE_BOOTSTRAP_ALLOWLIST` | Comma-separated emails for first-admin seeding |
| `VITE_GOOGLE_CLIENT_ID` | OAuth client for Sheets, Drive, Gmail, Calendar |
| `VITE_GOOGLE_API_KEY` | API key for Google Picker (and Sheets) |
| `VITE_GEMINI_API_KEY` | Optional — AI biography generation |

Also update `isBootstrapEmail()` in `firestore.rules` to match bootstrap emails,
then publish the rules in the Firebase console.

---

## Firestore data model

| Collection | Contents | Access |
|------------|----------|--------|
| `facilitators/{id}` | Facilitator profiles | All allowlisted users |
| `headshots/{id}` | Compressed headshot data URLs | All allowlisted users |
| `allowedUsers/{email}` | Access allowlist | Allowlisted + bootstrap |
| `groups/{id}` | Personal facilitator groups | Owner-only |
| `emailTemplates/{id}` | Shared email templates | All allowlisted users |
| `events/{id}` | Booking events + staffing data | All allowlisted users |

`firestore.rules` at the repo root contains the recommended security rules.
Publish them in the Firebase console as described in the setup guide.

---

## Project structure

```
src/
  App.tsx                        # Root app: auth gates, navigation, all sections
  main.tsx                       # React entry point
  types.ts                       # Data models (Facilitator, Group, Event, Template, …)
  data/
    facilitators.ts              # Sample facilitator records (demo mode)
    templates.ts                 # Seed email templates (demo mode)
  lib/
    firebase.ts                  # Firebase app init (Auth + Firestore)
    useAuth.ts                   # Google sign-in hook
    useAccess.ts                 # Allowlist gate after sign-in
    accessService.ts             # allowedUsers Firestore CRUD
    facilitatorsService.ts       # Facilitator Firestore CRUD + import + headshot/resume
    groupsService.ts             # Personal group Firestore CRUD
    eventsService.ts             # Event Firestore CRUD
    eventModel.ts                # Event staffing helpers
    templatesService.ts          # Email template Firestore CRUD
    googleSheets.ts              # Google token, Picker, Sheets + Drive reads
    gmail.ts                     # Send email via Gmail API
    googleCalendar.ts            # HOLD/CONFIRM calendar invites
    generateBio.ts               # Gemini biography generation
    importMapping.ts             # Sheet header → field mapping + row parsing
    headshotMatch.ts             # Match photo/resume filenames to facilitators
    facilitatorFilters.ts        # Directory search and filter logic
    birthdays.ts                 # Upcoming birthday alerts
    regions.ts                   # US state → region mapping
    image.ts                     # Client-side image compression
    useHeadshot.ts               # Lazy-load + cache stored headshots
    ui.ts                        # Shared UI helpers (chip colors, classNames)
  components/
    Sidebar.tsx                  # Left navigation + signed-in profile menu
    FacilitatorCard.tsx          # Directory card w/ view/edit/delete menu
    FacilitatorModal.tsx         # Facilitator detail view
    FacilitatorFormModal.tsx     # Add / edit facilitator form
    FacilitatorFilterPanel.tsx   # Advanced directory filters
    ImportWizardModal.tsx        # Sheets import + headshot/resume folders
    ManageAccessModal.tsx        # Invite / revoke allowlisted emails
    BirthdayAlertsWidget.tsx     # Upcoming birthday alerts
    GroupsPage.tsx               # Group list and detail views
    GroupCard.tsx                # Group summary card
    GroupModal.tsx               # Create / edit group
    ManageGroupMembersModal.tsx  # Add / remove group members
    GroupEmailModal.tsx          # Compose group email via Gmail
    AddToGroupModal.tsx          # Add facilitator to a group from directory
    EventsPage.tsx               # Event list
    EventCard.tsx                # Event summary card
    EventDetailPage.tsx          # Staffing board for one event
    EventModal.tsx               # Create / edit event
    EventSectionCard.tsx         # Section staffing within an event
    AssignFacilitatorModal.tsx   # Assign facilitator to a section
    DropFacilitatorModal.tsx     # Drop facilitator with reason
    StageChangeModal.tsx         # Advance placement or event stage
    CalendarInviteModal.tsx      # Send HOLD/CONFIRM calendar invite
    PathwayModal.tsx             # Add / edit event pathway
    SectionModal.tsx             # Add / edit event section
    TemplatesPage.tsx            # Template library
    TemplateModal.tsx            # Create / edit template
    SignInScreen.tsx             # Google sign-in screen
    AccessDeniedScreen.tsx       # Signed in but not allowlisted
    Avatar.tsx                   # Headshot with graceful fallback
    ModalShell.tsx               # Shared modal wrapper
public/
  unbounded-icon.png             # App icon
firestore.rules                  # Recommended Firestore security rules
.env.example                     # Environment variable template
SETUP-GOOGLE-SHEETS.md           # Firebase + Google Cloud setup guide
```

---

## Third-party integrations

| Service | Role |
|---------|------|
| **Firebase Auth** | Google sign-in |
| **Cloud Firestore** | Shared database (facilitators, events, templates, groups, allowlist) |
| **Google Sheets API** | Bulk facilitator import from spreadsheets |
| **Google Drive API** | Headshot/resume folder import, resume download |
| **Google Picker API** | File and folder selection UI |
| **Gmail API** | Send group, event, and birthday emails from the user's account |
| **Google Calendar API** | Send HOLD/CONFIRM calendar invites for event staffing |
| **Gemini Developer API** | AI-generated facilitator biographies (optional) |
| **randomuser.me** | Demo-mode placeholder headshots |

---

## Deployment & migration

The live site is meant to run on **Vercel** (static build from GitHub). Firebase
and Google Cloud hold sign-in and data — there is no separate backend server to
run.

| Guide | Audience | Contents |
|-------|----------|----------|
| [`HANDOFF-AND-DEPLOYMENT.md`](./HANDOFF-AND-DEPLOYMENT.md) | **Non-technical admins** | Move off a personal Google account, publish Firestore rules, configure team access, deploy on Vercel, go-live checklist |
| [`SETUP-GOOGLE-SHEETS.md`](./SETUP-GOOGLE-SHEETS.md) | Anyone setting up APIs | Detailed Firebase + Google API setup, imports, Gmail, Calendar, Gemini |

Quick deploy summary:

1. Connect this repo to Vercel → set all `VITE_*` environment variables → Deploy.
2. Add the Vercel URL to Firebase **Authorized domains** and Google OAuth
   **JavaScript origins**.
3. Publish `firestore.rules` in the Firebase console (update bootstrap emails
   first).

A `vercel.json` in the repo sets the Vite build output (`dist/`).

---

## Documentation

| File | Contents |
|------|----------|
| **`README.md`** (this file) | Platform overview, features, structure, and getting started |
| **`HANDOFF-AND-DEPLOYMENT.md`** | Migration off personal accounts, access rules, Vercel deployment |
| **`SETUP-GOOGLE-SHEETS.md`** | Step-by-step Firebase + Google Cloud setup (~15 min) |
| **`.env.example`** | Annotated environment variable template |
| **`firestore.rules`** | Firestore security rules with inline comments |
