# Korgix

[![Live Demo](https://img.shields.io/badge/Live%20Demo-korgix.vercel.app-blue)](https://korgix.vercel.app/app)

A progressive web app for daily task planning and focus tracking. Create time-boxed tasks, receive push notifications when they start and end, and review completion analytics.

**Live app:** [https://korgix.vercel.app/app](https://korgix.vercel.app/app) — the site root hosts the marketing landing page; the PWA lives under `/app/`.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Microsoft Work IQ Integration](#microsoft-work-iq-integration)
- [Security](#security)
- [License](#license)

---

## Features

- **Time-boxed tasks** — Schedule tasks with explicit start and end times.
- **Status lifecycle** — Tasks move automatically from `pending` → `in-progress` → `completed` or `missed`.
- **Recurring tasks** — Configure daily, weekly, monthly, yearly, or custom recurrence patterns.
- **Push notifications** — Firebase Cloud Messaging delivers start and end reminders, even when the app is closed.
- **Local notifications** — Web Notification API provides immediate feedback while the app is open.
- **Progress analytics** — Review completion rates and done/missed history by day, week, month, or year.
- **PWA support** — Installable on mobile and desktop; offline persistence via Firestore.
- **Cross-device sync** — Real-time Firestore subscriptions keep tasks in sync across signed-in devices.

---

## Tech Stack

### Frontend
- **React 18** + **TypeScript** (strict mode)
- **Vite 5** — build tool and dev server
- **Tailwind CSS 3** — utility-first styling
- **Zustand 4** — global state management with persistence
- **Firebase JS SDK 12** — Auth, Firestore, Cloud Messaging
- **date-fns** — date manipulation
- **lucide-react** — icons
- **vite-plugin-pwa** — manifest and service worker generation

### Backend
- **Firebase Cloud Functions v2** — Node.js 24 runtime
- **firebase-admin** + **firebase-functions**
- **TypeScript** compiled to `functions/lib/`

### Infrastructure
- **Vercel** — frontend hosting
- **Firebase** — authentication, database, and scheduled push notifications

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- A Firebase project
- A Vercel account (for deployment)

### Installation

1. Clone the repository and install dependencies:

```bash
git clone <repo-url>
cd Korgix
npm install
cd functions
npm install
cd ..
```

2. Configure environment variables (see [Environment Variables](#environment-variables)).

3. Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173` by default.

### Build locally

```bash
npm run build
```

Output is written to `dist/`.

---

## Project Structure

```
Korgix/
├── index.html                  # Entry HTML with PWA meta tags
├── vite.config.ts              # Vite + PWA configuration
├── tailwind.config.js          # Tailwind content paths
├── postcss.config.js           # Tailwind + autoprefixer
├── tsconfig.json               # Frontend TypeScript config
├── vercel.json                 # Vercel deployment settings
├── firebase.json               # Firebase functions predeploy hooks
├── .firebaserc                 # Firebase project alias
├── public/                     # Static assets and service workers
│   ├── manifest.json
│   ├── sw.js                   # Custom FCM push service worker
│   └── icons/
├── src/
│   ├── main.tsx                # React root + custom SW registration
│   ├── App.tsx                 # Auth gate and page router
│   ├── firebase.ts             # Firebase initialization
│   ├── index.css               # Tailwind + theme variables
│   ├── types/
│   │   └── index.ts            # Task, RecurrencePattern, DayPlan types
│   ├── stores/
│   │   └── taskStore.ts        # Zustand store + Firestore CRUD
│   ├── hooks/
│   │   └── useTaskScheduler.ts # Time-based status transitions
│   ├── components/             # React UI components
│   └── utils/                  # Notifications, FCM, recurrence, time helpers
├── functions/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       └── index.ts            # Scheduled Cloud Function for push notifications
├── scripts/
│   └── list-workiq-tools.cjs   # Verifies the Work IQ MCP server
├── WORKIQ.md                   # Microsoft Work IQ integration guide
└── AGENTS.md                   # Project context for AI coding agents
```

---

## Architecture

### Authentication
- Firebase Auth with email/password.
- `onAuthStateChanged` gates the UI: unauthenticated users see onboarding; authenticated users see their task list.

### Data Model

Firestore path: `users/{userId}/tasks`

```typescript
interface Task {
  id: string;
  title: string;
  description?: string | null;
  startTime: string;       // ISO 8601
  endTime: string;         // ISO 8601
  date: string;            // YYYY-MM-DD
  status: 'pending' | 'in-progress' | 'completed' | 'missed';
  createdAt: string;
  completedAt?: string;
  notifiedStart: boolean;
  notifiedEnd: boolean;
  recurrence?: RecurrencePattern | null;
  isRecurringParent?: boolean;
  parentTaskId?: string;
  instanceIndex?: number;
}
```

### Client-Side Scheduling
- `useTaskScheduler` runs every 30 seconds and on tab visibility changes.
- Transitions task status based on current time.
- Triggers local Web Notifications for immediate feedback.

### Server-Side Scheduling
- `checkDueTasksAndNotify` runs every minute as a Firebase scheduled function.
- Queries pending tasks whose start time has passed.
- Looks up the user's FCM token and sends a push notification.
- Updates the task document to prevent duplicate notifications.

### Recurring Tasks
- A recurring task is stored as a parent template (`isRecurringParent: true`).
- Only the first instance is generated immediately.
- The next instance is created on-demand when the current one is completed or missed.

### Notifications (Dual Layer)
1. **Foreground/Local:** Web Notifications API via `utils/notifications.ts` and `useTaskScheduler`.
2. **Background/Push:** Firebase Cloud Messaging delivered through the custom `public/sw.js` service worker.

---

## Environment Variables

Create `.env` for local development and `.env.production` for production builds.

| Variable | Purpose |
|----------|---------|
| `VITE_FIREBASE_API_KEY` | Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | FCM sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | Firebase Analytics ID |
| `VITE_FIREBASE_VAPID_KEY` | FCM VAPID key for web push |
| `VITE_STAGING_MODE` | `"true"` for staging collections, `"false"` for production |

Firebase client configuration is public by design. Do not place server secrets in these files.

---

## Deployment

### Frontend (Vercel)

```bash
npm run build
```

Vercel is configured via `vercel.json` to run `npm ci`, `npm run build`, and serve `dist/`.

### Backend (Firebase Functions)

```bash
cd functions
npm run build
npm run deploy
```

Or from the project root:

```bash
npm run deploy:firebase
```

### PWA Assets

`vite-plugin-pwa` generates the web app manifest and Workbox service worker at build time. The custom FCM service worker (`public/sw.js`) is copied as-is.

---

## Microsoft Work IQ Integration

This project integrates **Microsoft Work IQ** as its Microsoft intelligence layer through the Model Context Protocol (MCP).

- Work IQ was chosen because Korgix is a productivity application, and Work IQ understands work context — meetings, emails, people, documents, and relationships.
- The `@microsoft/workiq` MCP server is configured in `.vscode/mcp.json`.
- AI assistants connecting to the workspace can invoke Work IQ tools to read Microsoft 365 Copilot data and use that context to help plan Korgix tasks (for example, suggesting focus-time slots or warning about meeting conflicts).
- No Microsoft Graph or Entra ID code lives inside the React app; the integration is maintained at the MCP / assistant layer.

Verify the MCP server is reachable:

```bash
node scripts/list-workiq-tools.cjs
```

See [`WORKIQ.md`](WORKIQ.md) for setup instructions, tool reference, example queries, and security notes.

---

## Security

- Firebase client configuration is public and safe to commit; it is required for client-side SDK initialization.
- Firestore security rules must restrict `users/{userId}` access to the authenticated owner. Rules are managed in the Firebase Console.
- FCM tokens are stored in plaintext on user documents in Firestore. This is expected for push delivery, so strict Firestore rules are essential.
- Cloud Functions use `firebase-admin` with default application credentials. No manual API keys are stored in `functions/src/`.
- Work IQ uses the user's own Microsoft 365 identity and requires explicit consent. Korgix does not store Microsoft tokens.

---

## License

[MIT](LICENSE)
