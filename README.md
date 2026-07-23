# Chat Web Application for Every Small Company

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38B2AC.svg)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E.svg)](https://supabase.com/)

A modern, real-time, enterprise-grade chat application built with React, TypeScript, Tailwind CSS, and Supabase. Designed as a robust foundation for building secure, scalable, and customizable communication platforms.

![Dashboard Preview](./public/screenshots/dashboard.png)
*(Placeholder: Replace with actual screenshot of the chat interface)*

## 🌟 Features

- **Private Chat** — Direct messages between users
- **Group Chat** — Team conversations with customizable channels
- **File Sharing** — Documents, images, videos, audio, and CAD files
- **Real-time Messaging** — Instant delivery via Supabase Realtime
- **Typing Indicators** — See when others are typing (Broadcast)
- **Online Presence** — Visual indicators when users are online (Presence)
- **Message Replies** — Reply to specific messages in threads
- **Message Editing** — Edit your own messages with history
- **Message Deletion** — Soft delete with undo capability
- **Unread Counts** — Badge on conversations with new messages
- **Message Search** — Search across all conversations
- **Read Status** — Automatic mark-as-read on view with receipts
- **Admin Panel** — Manage users and roles
- **Drag & Drop Upload** — Paste images, drag files into composer
- **Responsive Design** — Works seamlessly on desktop, tablet, and mobile

---

## 🏗 Architecture Overview

FileKiwi follows a component-driven architecture with a clear separation of concerns:

### Realtime Modes Used

| Feature | Mode | Why |
|---------|------|-----|
| Messages | Postgres Changes | Persistent, RLS-protected |
| Typing | Broadcast | Ephemeral, <50ms, no DB write |
| Online Status | Presence | CRDT-based, auto-cleanup on disconnect |
| Read Status | Postgres Changes | Persisted, real-time updates |

### Key Optimizations

- **Single channel per conversation** — one WebSocket connection handles all realtime modes
- **Optimistic UI** — messages appear instantly before server confirmation
- **Cursor pagination** — `(created_at, id)` composite cursor for O(log n) message loading
- **Debounced typing** — 3s auto-clear prevents broadcast flooding
- **Worker WebSocket** — `worker: true` option prevents background tab throttling
- **RLS on every table** — security enforced at database level

```mermaid
graph TD
    A[Client (React/Vite)] -->|HTTPS/WSS| B(Supabase API)
    B --> C[Auth Service]
    B --> D[Realtime Service]
    B --> E[PostgreSQL DB]
    B --> F[Storage Bucket]
    C --> G[RLS Policies]
    D --> G
    E --> G
    F --> G
```

---

## 🛠 Technology Stack

| Category | Technology |
| :--- | :--- |
| **Framework** | React 18, Vite, Astro |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS |
| **Backend** | Supabase (PostgreSQL, Auth, Realtime, Storage) |
| **Icons** | Lucide React |
| **Formatting** | Prettier, ESLint |
| **Package Manager** | npm / yarn / pnpm |
| **Hosting** | Static hosting (Apache/Nginx/Vercel/Netlify) |

---

## 📂 Project Structure

```text
filekiwi-chat/
├── public/                 # Static assets
├── supabase/
│   └── migrations/         # SQL migration files for database setup
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── auth/           # Authentication forms
│   │   ├── sidebar/        # Sidebar, Search, Conversation list
│   │   ├── chat/           # Chat window, messages, composer
│   │   ├── messages/       # File cards, media players
│   │   ├── modals/         # New chat, group settings, confirm
│   │   ├── admin/          # Admin panel, user manager
│   │   └── ui/             # Base primitives (Avatar, Badge, Button, Modal)
│   ├── hooks/              # Custom React hooks (useMessages, usePresence, etc.)
│   ├── lib/                # Supabase client, auth, DB queries, storage
│   ├── pages/              # Page views (Login, Dashboard, Settings)
│   ├── types/              # TypeScript type definitions
│   ├── layouts/            # Base HTML layouts
│   └── styles/             # Global CSS
├── .env.example            # Environment variable template
├── .htaccess               # Apache SPA routing config
├── astro.config.mjs        # Astro configuration
├── tailwind.config.js      # Tailwind configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Dependencies and scripts
```

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/), [yarn](https://yarnpkg.com/), or [pnpm](https://pnpm.io/)
- A [Supabase](https://supabase.com/) account (free tier is sufficient)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/filekiwi-chat.git
cd filekiwi-chat
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and fill in your Supabase credentials:
   ```env
   # Supabase Configuration
   # Get these from your Supabase Project Settings > API
   PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

   > **⚠️ Security Note**: Never commit your `.env` file to version control. The `.gitignore` is pre-configured to exclude it. Only use the `anon` key in frontend code. **Never expose the `service_role` key.**

### 4. Database Setup

This project relies on specific database tables and Row Level Security (RLS) policies.

1. Go to your Supabase project dashboard.
2. Navigate to the **SQL Editor**.
3. Run the migration files located in `supabase/migrations/` **in order**:

| Order | File | Purpose |
|-------|------|---------|
| 1 | `001_create_profiles.sql` | Profiles table + auto-create trigger |
| 2 | `002_create_conversations.sql` | Conversations + members tables |
| 3 | `003_create_messages.sql` | Messages table + supabase_realtime |
| 4 | `004_create_attachments.sql` | File attachments table |
| 5 | `005_create_message_reads.sql` | Read receipts table |
| 6 | `006_create_rls_policies.sql` | Row Level Security (15 policies) |
| 7 | `007_create_indexes.sql` | Performance indexes |
| 8 | `008_create_storage_bucket.sql` | Storage bucket + RLS |
| 9 | `009_create_default_admin.sql` | Default admin account |
| 10 | `010_fix_rls_and_profiles.sql` | RLS + profiles fixes |
| 11 | `011_batch_unread_counts.sql` | Batched unread-count RPC |
| 12 | `012_p0_features.sql` | P0 features (pins, reactions, forwarding) |
| 13 | `013_last_messages_rpc.sql` | Sidebar last-message RPC (DISTINCT ON) |

4. After migrations, go to **Database → Replication → supabase_realtime** and ensure the `messages` table is enabled for replication.

   ```sql
   -- Run this in SQL Editor if not already done by migration 3
   ALTER PUBLICATION supabase_realtime ADD TABLE messages;
   ```

### 5. Default Admin Account

Migration `009_create_default_admin.sql` creates a default admin user:

| Field | Value |
|-------|-------|
| Email | `admin@example.com` |
| Password | `admin123` |

> **⚠️ Important**: The account is created only if it doesn't already exist. **Change the password immediately after first login.**

### 6. Create Additional Users

1. Go to **Authentication → Users → Add User** in Supabase Dashboard.
2. Create the first employee/user account.
3. Run this SQL to make them an admin (optional):
   ```sql
   UPDATE profiles SET role = 'admin' WHERE id = '<user-uuid>';
   ```

### 7. Run Development Server

```bash
npm run dev
```

The application will start at `http://localhost:4321` (Astro default) or `http://localhost:5173` (Vite).

---

## 🏭 Production Build

To create an optimized production build:

```bash
npm run build
```

The static files are generated in the `dist/` directory.

You can preview the production build locally:

```bash
npm run preview
```

---

## 🌐 Deployment

FileKiwi generates static files that can be hosted on any static hosting provider.

### Generic Static Hosting (Apache/Nginx)

1. Run `npm run build`.
2. Upload all files from `dist/` to your web server's document root.
3. Ensure the included `.htaccess` file is uploaded (for Apache) to handle client-side routing.

#### `.htaccess` (SPA fallback for Apache)

```apache
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

#### Nginx Configuration Example

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### Vercel / Netlify

1. Connect your GitHub repository.
2. Set the Build Command to `npm run build`.
3. Set the Output Directory to `dist`.
4. Add your environment variables in the platform dashboard.

### Docker

Build and run the application using Docker:

```bash
# Build the image
docker build -t filekiwi-chat .

# Run the container
docker run -p 80:80 filekiwi-chat
```

Ensure your environment variables are passed to the container securely.

---

## 🎨 Customization

### Theming

FileKiwi uses Tailwind CSS for styling. To customize the theme:

1. Edit `tailwind.config.js` to change colors, fonts, and spacing.
2. Modify `src/styles/global.css` for global styles and CSS variables.

### Branding

Replace the logo and default text in the relevant components (`src/components/layout/`, `src/pages/Login.tsx`).

### Adding Authentication Providers

To add new authentication providers (Google, GitHub, etc.):
1. Enable the provider in your Supabase Dashboard > Authentication > Providers.
2. Update the login UI in `src/components/auth/LoginForm.tsx` to include the new provider button.

---

## 🔒 Security Recommendations

- **RLS Policies**: Always verify that your Supabase RLS policies correctly restrict data access. Test with different user roles.
- **Environment Variables**: Never expose service role keys in the frontend. Only use the `anon` key.
- **Input Sanitization**: While React handles most XSS risks, always validate and sanitize file uploads and rich text inputs on the backend (via Supabase Edge Functions if needed).
- **Dependencies**: Regularly run `npm audit` and update dependencies.
- **Default Credentials**: Change the default admin password immediately after setup.

---

## 🧩 Troubleshooting

**Issue: Messages not appearing in real-time.**
- *Solution*: Check your Supabase Realtime settings. Ensure the `messages` table is broadcastable (enabled in Database > Replication) and your RLS policies allow `SELECT` for authenticated users.

**Issue: "Invalid API Key" error.**
- *Solution*: Verify `PUBLIC_SUPABASE_ANON_KEY` in your `.env` file matches the `anon` `public` key in Supabase. Do not use the `service_role` key.

**Issue: Build fails with TypeScript errors.**
- *Solution*: Run `npm run lint` to identify specific type issues. Ensure all strict mode settings in `tsconfig.json` are satisfied.

**Issue: Images/Files not uploading.**
- *Solution*: Ensure the storage bucket exists and RLS policies allow `INSERT` for authenticated users. Check the bucket name in `src/lib/storage.ts`.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'Add amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

### Development Guidelines

- Follow existing code style (Prettier/ESLint).
- Write meaningful commit messages.
- Test your changes thoroughly.
- Update documentation if necessary.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgements

- [Supabase](https://supabase.com/) for the incredible backend infrastructure.
- [Tailwind CSS](https://tailwindcss.com/) for the styling framework.
- [Lucide Icons](https://lucide.dev/) for beautiful icons.
- [Astro](https://astro.build/) for the hybrid web framework.

---

Built with ❤️ by the ApexSofteck Team
www.apexsofteck.com
