# Discord Clone

A real-time Discord clone with user authentication, servers, channels, and invite links. Built with React + Supabase.

## Features

- 🔐 **Authentication** - Email/password signup and login
- 🏠 **Servers** - Create servers with custom emoji icons
- 💬 **Channels** - Create text channels in servers
- ⚡ **Real-time Messaging** - Messages sync instantly
- 👥 **Member List** - Click members to view profiles
- 🔗 **Invite Links** - Share links to invite others
- 👤 **User Profiles** - Banner, bio, and about me sections

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/kingston101908-cell/claude-s-discord-clone.git
cd claude-s-discord-clone
npm install
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) → Create project
2. Go to **SQL Editor** and run:

```sql
-- Servers table
create table servers (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  icon text,
  owner_id uuid not null,
  members uuid[] default '{}',
  member_details jsonb default '{}',
  invite_code text unique,
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

-- User profiles table
create table profiles (
  id uuid primary key,
  username text,
  bio text,
  banner_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table servers enable row level security;
alter table channels enable row level security;
alter table messages enable row level security;
alter table profiles enable row level security;

-- Policies
create policy "Users can view servers" on servers for select using (true);
create policy "Users can create servers" on servers for insert with check (auth.uid() = owner_id);
create policy "Users can update servers" on servers for update using (auth.uid() = any(members));

create policy "Users can view channels" on channels for select using (true);
create policy "Users can create channels" on channels for insert with check (true);

create policy "Users can view messages" on messages for select using (true);
create policy "Users can send messages" on messages for insert with check (auth.uid() is not null);

create policy "Users can view profiles" on profiles for select using (true);
create policy "Users can update own profile" on profiles for all using (auth.uid() = id);

-- Enable realtime
alter publication supabase_realtime add table servers;
alter publication supabase_realtime add table channels;
alter publication supabase_realtime add table messages;
```

3. Go to **Authentication** → **Providers** → **Email** → Turn OFF "Confirm email"
4. Go to **Settings** → **API** → Copy URL and anon key

### 3. Configure Environment

Create `.env.local`:
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-key
```

### 4. Run

```bash
npm run dev
```

## Deploy to Vercel

```bash
npm i -g vercel
vercel --prod
```

Add environment variables in Vercel Dashboard → Settings → Environment Variables.

Add your Vercel URL to Supabase → Authentication → URL Configuration → Redirect URLs.

## Invite Links

Share invite links like: `https://your-app.vercel.app/invite/ABC123`

## Tech Stack

- React 18 + Vite
- Supabase (Auth + PostgreSQL + Realtime)
- Vercel (Hosting)
- Lucide React (Icons)
