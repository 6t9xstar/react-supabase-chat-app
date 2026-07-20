# Apex Chat

**Internal team chat application** for Apex Accuracy Estimating Inc.

- **Production URL:** `chat.apexaccuracyestimatinginc.com`
- **Stack:** Astro + React + TypeScript + Tailwind CSS + Supabase
- **Hosting:** Static files on Hostinger (no server required)

---

## Features

- **Private Chat** — Direct messages between employees
- **Group Chat** — Team conversations (Marketing, Estimating, Management, etc.)
- **File Sharing** — Documents, images, videos, audio, and CAD files
- **Real-time Messaging** — Instant delivery via Supabase Realtime
- **Typing Indicators** — See when others are typing (Broadcast)
- **Online Presence** — Green dot when users are online (Presence)
- **Message Replies** — Reply to specific messages
- **Message Editing** — Edit your own messages
- **Message Deletion** — Soft delete with undo
- **Unread Counts** — Badge on conversations with new messages
- **Message Search** — Search across all conversations
- **Read Status** — Automatic mark-as-read on view
- **Admin Panel** — Manage employees and roles
- **Drag & Drop Upload** — Paste images, drag files into composer
- **Responsive** — Works on desktop and mobile

---

## Quick Start

### 1. Clone and install

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```env
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Run migrations

Open the **Supabase Dashboard SQL Editor** (`https://supabase.com/dashboard/project/YOUR_REF/sql/new`) and run these files **in order**:

| Order | File | Purpose |
|-------|------|---------|
| 1 | `supabase/migrations/001_create_profiles.sql` | Profiles table + auto-create trigger |
| 2 | `supabase/migrations/002_create_conversations.sql` | Conversations + members tables |
| 3 | `supabase/migrations/003_create_messages.sql` | Messages table + supabase_realtime |
| 4 | `supabase/migrations/004_create_attachments.sql` | File attachments table |
| 5 | `supabase/migrations/005_create_message_reads.sql` | Read receipts table |
| 6 | `supabase/migrations/006_create_rls_policies.sql` | Row Level Security (15 policies) |
| 7 | `supabase/migrations/007_create_indexes.sql` | Performance indexes |
| 8 | `supabase/migrations/008_create_storage_bucket.sql` | Storage bucket + RLS |
| 9 | `supabase/migrations/009_create_default_admin.sql` | Default admin account |

After migrations, go to **Database → Replication → supabase_realtime** and toggle `messages` on.

### 4. Enable Realtime

```sql
-- Run this in SQL Editor if not already done by migration 3
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
```

### 5. Default admin account

Migration `009_create_default_admin.sql` creates a default admin:

| Field | Value |
|-------|-------|
| Email | `admin@apexchat.com` |
| Password | `admin123` |

The account is created only if it doesn't already exist. **Change the password after first login.**

### 6. Create additional users (optional)

1. Go to **Authentication → Users → Add User** in Supabase Dashboard
2. Create the first employee account
3. Run this SQL to make them admin:
```sql
UPDATE profiles SET role = 'admin' WHERE id = '<user-uuid>';
```

### 6. Start development

```bash
npm run dev
```

### 7. Build for production

```bash
npm run build
```

The static files are generated in `dist/`.

---

## Deployment (Hostinger)

1. Run `npm run build`
2. Upload all files from `dist/` to your Hostinger subdomain's document root (e.g., `public_html/chat/`)
3. Ensure `.htaccess` is uploaded (enable "Show Hidden Files" in Hostinger file manager)
4. Configure DNS: Point `chat.apexaccuracyestimatinginc.com` to Hostinger's nameservers or add an A record

### `.htaccess` (SPA fallback)

The included `.htaccess` ensures client-side routing works on Apache:

```apache
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

---

## Architecture

### Realtime Modes Used

| Feature | Mode | Why |
|---------|------|-----|
| Messages | Postgres Changes | Persistent, RLS-protected |
| Typing | Broadcast | Ephemeral, <50ms, no DB |
| Online | Presence | CRDT-based, auto-cleanup |
| Read status | Postgres Changes | Persisted, real-time |

### Key Optimizations

- **Single channel per conversation** — one WebSocket for all 3 modes
- **Optimistic UI** — messages appear instantly before server confirms
- **Cursor pagination** — `(created_at, id)` composite cursor for O(log n) message loading
- **Debounced typing** — 3s auto-clear, prevents broadcast flooding
- **Worker WebSocket** — `worker: true` prevents background tab throttling
- **RLS on every table** — security enforced at database level

---

## Project Structure

```
apex-chat/
├── .env.example
├── .htaccess
├── astro.config.mjs
├── supabase/migrations/     # 8 SQL migration files
├── src/
│   ├── pages/               # Astro pages (login, chat, index)
│   ├── layouts/             # Base HTML layout
│   ├── components/
│   │   ├── auth/            # LoginForm
│   │   ├── sidebar/         # Sidebar, Search, Conversation list
│   │   ├── chat/            # Chat window, messages, composer
│   │   ├── messages/        # File cards, media players
│   │   ├── modals/          # New chat, group settings, confirm
│   │   ├── admin/           # Admin panel, employee manager
│   │   └── ui/              # Avatar, Badge, Button, Modal, Spinner
│   ├── hooks/               # React hooks (useMessages, usePresence, etc.)
│   ├── lib/                 # Supabase client, auth, DB queries, storage
│   ├── types/               # TypeScript types
│   └── styles/              # Global CSS
└── dist/                    # Production build output
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous/publishable key |

Never expose the `service_role` key in frontend code.

---

## License

Internal use — Apex Accuracy Estimating Inc.
