# Korgix — Agent Guide

This document contains project-specific context for AI coding agents working on the Korgix codebase. Korgix is a Progressive Web App (PWA) for daily task planning and focus tracking. It is a React + TypeScript frontend backed by Firebase (Auth, Firestore, Cloud Messaging) with server-side push notifications delivered via Firebase Cloud Functions.

---

## Project Overview

- **Name:** Korgix
- **Type:** Single-page PWA (mobile-first, iOS-optimized)
- **Purpose:** Users create time-boxed tasks, track their status (pending → in-progress → completed/missed), and receive push notifications when tasks start or end.
- **Monorepo layout:** Root contains the Vite frontend. `functions/` contains the Firebase Cloud Functions backend.

---

## Technology Stack

### Frontend
- **React 18** with TypeScript (strict mode enabled)
- **Vite 5** (build tool + dev server)
- **Tailwind CSS 3** for styling
- **Zustand 4** for global state management (with `persist` middleware)
- **Firebase JS SDK 12** (Auth, Firestore with offline persistence, Cloud Messaging)
- **date-fns** for date manipulation
- **lucide-react** for icons
- **idb** for IndexedDB wrapper (legacy local fallback; primary offline storage is Firestore persistence)

### Backend
- **Firebase Cloud Functions v2** (Node.js 24 runtime)
- **TypeScript** compiled to `lib/` in the `functions/` directory
- **firebase-admin** + **firebase-functions**

### PWA / Notifications
- **vite-plugin-pwa** generates the web app manifest and a single combined service worker (`src/sw.ts` → `/sw.js`)
- The **combined service worker** handles both Workbox precaching/runtime caching and FCM push/notification-click events
- **Firebase Cloud Messaging** for cross-device push notifications
- **`usePWAUpdate`** uses `workbox-window` to detect waiting updates and trigger reloads from the Settings screen

---

## Directory Structure

```
├── index.html                # Entry HTML with iOS PWA meta tags and splash screens
├── vite.config.ts            # Vite + PWA plugin configuration
├── tailwind.config.js        # Tailwind content paths (standard)
├── postcss.config.js         # Tailwind + autoprefixer
├── tsconfig.json             # Frontend TS config (ES2020, react-jsx, bundler resolution)
├── tsconfig.node.json        # Vite config TS project reference
├── vercel.json               # Vercel deployment settings (builds to dist/)
├── firebase.json             # Firebase functions predeploy hooks
├── .firebaserc               # Firebase project alias (default: korgix2005)
├── .env                      # Local dev env (staging collections, full Firebase config)
├── .env.production           # Production env (live collections)
├── public/
│   ├── manifest.json         # PWA manifest
│   ├── sw.js                 # Custom service worker for FCM push + notifications
│   ├── firebase-messaging-sw.js
│   └── icons/                # App icons and iOS splash screens
├── src/
│   ├── main.tsx              # React root render + custom SW registration
│   ├── App.tsx               # Root component: auth state, page router, modals
│   ├── firebase.ts           # Firebase app init (Auth, Firestore, Messaging)
│   ├── index.css             # Tailwind directives + CSS variables + custom animations
│   ├── types/
│   │   └── index.ts          # Task, RecurrencePattern, DayPlan types
│   ├── stores/
│   │   ├── taskStore.ts      # Zustand store: Firestore CRUD, subscriptions, recurrence
│   │   └── themeStore.ts     # Theme state (dark / light / system) with localStorage persistence
│   ├── hooks/
│   │   ├── useTaskScheduler.ts # Time-based status transitions + local notification scheduling
│   │   └── usePWAUpdate.ts     # Service-worker update detection and controls
│   ├── components/           # React components (see below)
│   ├── utils/
│   │   ├── time.ts           # Date formatting and task time helpers
│   │   ├── notifications.ts  # Web Notification API helpers + timeout-based scheduling
│   │   ├── fcm.ts            # Firebase Cloud Messaging token registration
│   │   └── recurrence.ts     # Recurring task instance generation
│   └── db/
│       └── indexedDB.ts      # IndexedDB wrapper (currently secondary to Firestore)
└── functions/
    ├── package.json           # Separate dependencies for Firebase Functions
    ├── tsconfig.json          # Functions TS config (NodeNext, ES2017, outDir: lib)
    ├── .eslintrc.js           # ESLint with Google config + double quotes rule
    └── src/
        └── index.ts           # Scheduled Cloud Function: checkDueTasksAndNotify
```

### Component Map
- `Onboarding.tsx` — Slide-based intro + email/password auth (Firebase Auth)
- `TaskListView.tsx` — Main dashboard with filter tabs, task list, and FAB
- `TaskCard.tsx` — Task list item display
- `TaskDetail.tsx` — Modal/overlay for viewing a task
- `AddTaskView.tsx` / `EditTaskView.tsx` — Full-screen forms for task CRUD
- `RecurrenceModal.tsx` — Recurrence pattern selector
- `FilterTabs.tsx` — Today / Upcoming / Done / All tabs
- `EmptyState.tsx` — Empty list placeholder
- `InstallPrompt.tsx` — Mobile PWA install prompt
- `NotificationPermission.tsx` — UI for requesting notification permissions
- `ThemeToggle.tsx` — Dark / light / system theme switcher
- `Toggle.tsx` — Reusable on/off switch
- `SettingsView.tsx` — App settings (updates, appearance, about)

---

## Build & Development Commands

### Frontend (root directory)
```bash
npm run dev          # Start Vite dev server
npm run build        # Run tsc + vite build (outputs to dist/)
npm run preview      # Preview production build locally
```

### Backend (functions/ directory)
```bash
cd functions
npm run lint         # ESLint check (.js, .ts)
npm run build        # Compile TS to lib/
npm run build:watch  # Watch mode
npm run serve        # Build + start Firebase emulator (functions only)
npm run deploy       # Deploy functions to Firebase
```

### Deployment
- **Frontend:** Deployed to **Vercel** (`vercel.json` configures `npm ci`, `npm run build`, output `dist/`).
- **Backend:** Deployed to **Firebase Functions** via `firebase deploy --only functions`.
- Root shortcut: `npm run deploy:firebase` triggers the Firebase functions deploy.

---

## Runtime Architecture

### Authentication
- Firebase Auth with email/password (no social providers).
- `onAuthStateChanged` in `App.tsx` gates access: unauthenticated users see `Onboarding`, authenticated users see `TaskListView`.

### Data Model
Firestore path: `users/{userId}/tasks`

**Task fields:**
- `id`, `title`, `description`, `startTime`, `endTime`, `date` (ISO strings)
- `status`: `'pending' | 'in-progress' | 'completed' | 'missed'`
- `notifiedStart`, `notifiedEnd`: booleans tracking whether push/local notifications have fired
- `recurrence`: `RecurrencePattern | null` (type: daily/weekly/monthly/yearly/custom)
- `isRecurringParent`: boolean — parent task acts as a template; instances are generated from it
- `parentTaskId`, `instanceIndex`: link instances back to their parent

### State Management
- `taskStore.ts` uses Zustand with localStorage persistence (only `selectedDate` is persisted).
- `themeStore.ts` persists the chosen theme (`dark` | `light` | `system`) in `localStorage`. The resolved theme is applied to `<html data-theme="...">` before the first paint to avoid flashes.
- `pwaUpdateStore.ts` persists the user's auto-update preference and tracks update state (`needRefresh`, `offlineReady`, `checking`, `lastChecked`).
- Firestore is the source of truth. The app calls `subscribeToTasks()` to open a real-time `onSnapshot` listener for the user's task subcollection.
- `loadToday()` is a one-time fetch used on auth state change.

### Task Lifecycle (Client-Side)
- `useTaskScheduler.ts` runs a 30-second interval + visibility-change check.
- It transitions task status automatically:
  - `pending` → `in-progress` when `startTime` passes
  - `pending`/`in-progress` → `missed` when `endTime` passes
- It also triggers `showNotification()` (Web Notifications API) for immediate user feedback.
- End-time notifications are sent ~2 minutes **before** the task ends as a warning; the task is marked `missed` only after a 5-minute grace period past the actual `endTime`.

### Task Lifecycle (Server-Side)
- `checkDueTasksAndNotify` is a Firebase scheduled function running every minute.
- Queries `collectionGroup("tasks")` for pending tasks where `notifiedStart == false` and `startTime <= now`.
- Looks up the user's `fcmToken` and sends a push notification via `admin.messaging().send()`.
- On success, updates the task document to set `notifiedStart: true`.

### Recurring Tasks
- When a recurring task is created, the parent task is saved with `isRecurringParent: true`.
- Only the **first instance** is generated immediately.
- When an instance is marked complete, `generateNextInstance()` creates the next one on-demand (capped by `maxInstances` per recurrence type).

### Notifications (Dual Layer)
1. **Foreground:** `onMessage` handler in `firebase.ts` creates a `new Notification(...)` directly.
2. **Background:** The combined `/sw.js` service worker handles `push` events and displays the notification via the service worker.
3. **Local Scheduling:** `utils/notifications.ts` schedules `setTimeout`-based notifications for tasks while the app is open, so users see precise start/end alerts even without a server round-trip.
4. **PWA Updates:** `usePWAUpdate.ts` uses `workbox-window` to listen for waiting service workers and triggers reloads from the Settings screen.

---

## Environment Variables

All Firebase client config is injected via Vite env variables (prefixed with `VITE_`):

| Variable | Purpose |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | FCM sender ID |
| `VITE_FIREBASE_APP_ID` | App ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | Analytics ID |
| `VITE_FIREBASE_VAPID_KEY` | FCM VAPID key for web push |
| `VITE_STAGING_MODE` | `"true"` for dev (staging collections), `"false"` for production |

**Note:** `.env` and `.env.production` are currently checked into the repository (they contain public Firebase client config, not secrets). The `.gitignore` excludes `.env.local` and `.env.production.local` for local overrides.

---

## Code Style Guidelines

- **TypeScript:** Strict mode is on. The frontend tsconfig has `noUnusedLocals: false` and `noUnusedParameters: false` (lenient), while the functions tsconfig has `noUnusedLocals: true`.
- **Quotes:** Functions enforce `"double"` quotes via ESLint. Frontend has no enforced quote style — follow surrounding code.
- **Styling:** Tailwind utility classes are preferred. CSS custom properties in `:root` define the dark color palette (`--bg`, `--surface`, `--accent`, etc.). All components assume a dark theme.
- **Mobile-first:** The app targets mobile PWA installation. UI uses `env(safe-area-inset-*)`, `viewport-fit=cover`, and `user-scalable=no`.
- **Component style:** Functional components with explicit interface props. State updates that depend on previous state are done inside Zustand actions rather than React `setState` where possible.

---

## Testing

- **Frontend:** No test runner is currently configured in the root `package.json`.
- **Backend:** `firebase-functions-test` is installed in `functions/` but no test files are present.
- If you add tests, place them alongside the code or in a `__tests__` directory and wire them into the respective `package.json` scripts.

---

## Security Considerations

- Firebase client configuration is public by design (required for client-side SDK initialization). Do **not** place server secrets in `.env` files at the root.
- The Cloud Functions backend uses `firebase-admin` with default application credentials (auto-initialized). No manual API keys are present in `functions/src/`.
- Firestore security rules are not defined in this repository. Ensure rules are configured in the Firebase Console to restrict `users/{userId}` access to the authenticated owner.
- FCM tokens are stored in plaintext on user documents in Firestore. This is expected for FCM push delivery but confirms the need for strict Firestore rules.

---

## Common Tasks for Agents

### Adding a new component
1. Create the file in `src/components/`.
2. Export a named functional component with a typed props interface.
3. Import and wire it into `App.tsx` or the relevant parent component.

### Adding a new scheduled function
1. Add the function to `functions/src/index.ts` (or a new file imported from there).
2. Export it as a named export.
3. Run `npm run build` inside `functions/` and verify with the emulator (`npm run serve`) before deploying.

### Modifying the task data model
1. Update `src/types/index.ts`.
2. Update `taskStore.ts` CRUD methods and any component forms (`AddTaskView`, `EditTaskView`).
3. If the change affects server-side queries (e.g., `checkDueTasksAndNotify`), update `functions/src/index.ts` accordingly.

### Changing notification behavior
- **Foreground/local:** Edit `src/utils/notifications.ts` and/or `src/hooks/useTaskScheduler.ts`.
- **Background/push payload:** Edit `functions/src/index.ts` for the server payload, and `public/sw.js` for how the service worker renders the notification.

---

## Key External Dependencies

- Firebase project: `korgix2005`
- Vercel deployment reads `vercel.json` in the repo root
- PWA manifest and Workbox caching are generated by `vite-plugin-pwa` at build time, but the FCM push service worker (`public/sw.js`) is static and registered manually in `main.tsx`

---

## Microsoft Work IQ Integration

This project satisfies the Microsoft IQ requirement through **Work IQ**, exposed via the Model Context Protocol (MCP).

- Work IQ is the chosen intelligence layer because Korgix is a productivity app and Work IQ understands work context (meetings, emails, people, documents).
- The `@microsoft/workiq` MCP server is configured in `.vscode/mcp.json`.
- AI assistants connecting to the workspace can invoke Work IQ tools to read Microsoft 365 Copilot data and use that context to help plan Korgix tasks.
- No Microsoft Graph or Entra ID code lives inside the Korgix React app; the integration is maintained at the MCP / assistant layer.

See `WORKIQ.md` for setup instructions, example queries, and security notes.
