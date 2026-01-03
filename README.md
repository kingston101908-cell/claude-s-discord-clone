# Discord Clone

A real-time Discord clone with user authentication and persistent data. Built with React + Supabase.

![Discord Clone](https://img.shields.io/badge/React-18-blue) ![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20Database-green) ![Vercel](https://img.shields.io/badge/Deploy-Vercel-black)

## Features

- 🔐 **Google Authentication** - Sign in with your Google account
- 🏠 **Servers** - Create and join servers with custom emoji icons
- 💬 **Channels** - Organize conversations in text channels
- ⚡ **Real-time Messaging** - Messages sync instantly across all users
- 👥 **Member List** - See who's in each server
- 🌐 **Fully Deployed** - Runs on Vercel with Supabase backend

## Quick Start

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd claude-discord-clone
npm install
```

### 2. Set Up Supabase (Free)

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click **New Project** → Choose a name and password → **Create**
3. Wait for the project to be ready (~2 minutes)

#### Create Database Tables

Go to **SQL Editor** and run this:

```sql
-- Servers table
create table servers (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  icon text,
  owner_id uuid not null,
  members uuid[] default '{}',
  member_details jsonb default '{}',
  created_at timestamp with time zone default now()
);

-- Channels table
create table channels (
  id uuid default gen_random_uuid() primary key,
  server_id uuid references servers(id) on delete cascade,
  name text not null,
  type text default 'text',
  category text default 'Text Channels',
  created_at timestamp with time zone default now()
);

-- Messages table
create table messages (
  id uuid default gen_random_uuid() primary key,
  channel_id uuid references channels(id) on delete cascade,
  content text not null,
  author jsonb not null,
  created_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table servers enable row level security;
alter table channels enable row level security;
alter table messages enable row level security;

-- Policies (allow authenticated users)
create policy "Users can view servers they're members of" on servers
  for select using (auth.uid() = any(members));

create policy "Users can create servers" on servers
  for insert with check (auth.uid() = owner_id);

create policy "Users can update servers they're members of" on servers
  for update using (auth.uid() = any(members));

create policy "Users can view channels" on channels
  for select using (true);

create policy "Users can create channels" on channels
  for insert with check (true);

create policy "Users can view messages" on messages
  for select using (true);

create policy "Users can send messages" on messages
  for insert with check (auth.uid() is not null);

-- Enable realtime
alter publication supabase_realtime add table servers;
alter publication supabase_realtime add table channels;
alter publication supabase_realtime add table messages;
```

#### Enable Google Auth

1. Go to **Authentication** → **Providers** → **Google**
2. Toggle **Enable**
3. Add your Google OAuth credentials (or use Supabase's for testing)
4. **Save**

#### Get API Keys

1. Go to **Settings** → **API**
2. Copy the **Project URL** and **anon public** key

### 3. Configure Environment

Create `.env.local` in the project root:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Deploy to Vercel (Free)

### Option A: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Import your GitHub repository
2. Add environment variables (same as `.env.local`)
3. Deploy!

### Option B: CLI Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy (follow prompts)
vercel

# Deploy to production
vercel --prod
```

**Important:** After deploying, add your Vercel URL to Supabase:
1. Supabase Dashboard → Authentication → URL Configuration
2. Add your `https://your-app.vercel.app` to **Site URL** and **Redirect URLs**

## Project Structure

```
src/
├── components/
│   ├── Auth/           # Login page
│   ├── ServerSidebar/  # Server list
│   ├── ChannelSidebar/ # Channels + user panel
│   ├── ChatArea/       # Messages + input
│   ├── MemberList/     # Online members
│   ├── Message/        # Chat message
│   └── Modal/          # Create server/channel
├── context/
│   └── AppContext.jsx  # Global state + Supabase subscriptions
├── supabase/
│   ├── client.js       # Supabase initialization
│   ├── auth.js         # Authentication helpers
│   └── database.js     # Database operations
└── App.jsx             # Main app with auth routing
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite |
| Styling | Vanilla CSS |
| Auth | Supabase Auth |
| Database | Supabase (PostgreSQL) |
| Realtime | Supabase Realtime |
| Hosting | Vercel |
| Icons | Lucide React |

## License

MIT
