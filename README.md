# Coffee Shop POS MVP

A modern, offline-capable Point of Sale system for coffee shops built with Next.js 15, Supabase, and Tailwind CSS.

## Features

- 🚀 **Next.js 15 App Router**
- 🎨 **Tailwind CSS + shadcn/ui**
- 🗄️ **Supabase** (Auth, DB, Realtime)
- 🛒 **Zustand** for Cart Management
- 📡 **TanStack Query** for Data Fetching
- 📱 **PWA Support** (Installable, Offline-ready)
- 🖨️ **Printing Support** (ESC/POS via qZ Tray)

## Setup Instructions

### 1. Environment Setup

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

### 2. Database Setup (Supabase)

1. Go to your Supabase Project -> SQL Editor.
2. Run the content of `src/supabase/migrations/0000_initial_schema.sql`.
3. (Optional) Run `src/supabase/seed.sql` to populate with dummy data.

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

## Login Credentials

If you enabled the Auth trigger, any new user signing up will be a 'cashier'.
You can manually set a user to 'admin' in the `profiles` table.

## Offline Support

The app is configured as a PWA. It will cache assets and API responses (via Query) for offline use.
To test offline mode, build the app:

```bash
npm run build
npm start
```

Then toggle "Offline" in Chrome DevTools.
