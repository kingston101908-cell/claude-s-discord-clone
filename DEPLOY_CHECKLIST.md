# Discord Clone - Deploy Checklist

Complete guide to deploy from zero to a live URL on free tier.

## Prerequisites

- Node.js 18+ installed
- Git installed  
- GitHub account
- Supabase account (free tier)
- Vercel account (free tier)

---

## Step 1: Supabase Setup

### 1.1 Create Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New Project**
3. Choose organization, enter project name (e.g., `discord-clone`)
4. Set a strong database password (save it!)
5. Select closest region
6. Click **Create new project** (wait 2-3 mins)

### 1.2 Run Database Migration

1. Go to **SQL Editor** in sidebar
2. Click **New query**
3. Copy and paste the contents of `supabase_migration.sql`
4. Click **Run** (green button)
5. Verify all tables were created in **Table Editor**

### 1.3 Configure Authentication

1. Go to **Authentication** → **Providers**
2. Under **Email**, ensure it's enabled
3. **IMPORTANT**: Turn OFF "Confirm email" for easy testing
4. Save changes

### 1.4 Create Storage Bucket

1. Go to **Storage** in sidebar
2. Click **New bucket**
3. Name: `attachments`
4. Toggle **Public bucket** ON
5. Click **Create bucket**

### 1.5 Get API Keys

1. Go to **Project Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIs...`

---

## Step 2: Environment Variables

Create `.env.local` in project root:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## Step 3: Local Testing

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Open http://localhost:5173
```

Test locally:
- [ ] Create account
- [ ] Create server
- [ ] Send message
- [ ] Invite link works
- [ ] DMs work

---

## Step 4: Deploy to Vercel

### Option A: CLI Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### Option B: GitHub Deploy

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click **Import Project**
4. Select your GitHub repo
5. Vercel auto-detects Vite settings
6. Add Environment Variables in settings:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
7. Click **Deploy**

---

## Step 5: Post-Deploy Configuration

### 5.1 Update Auth Redirect URLs

1. Go to Supabase Dashboard
2. **Authentication** → **URL Configuration**
3. Add your Vercel URL to **Redirect URLs**:
   - `https://your-app.vercel.app`
   - `https://your-app.vercel.app/`

### 5.2 Test Production

1. Open your Vercel URL
2. Create a new account
3. Create a server
4. Test all features

---

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL | `https://abc123.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key | `eyJhbGciOiJIUzI1NiIs...` |

---

## Security Checklist

- [x] Row Level Security (RLS) enabled on all tables
- [x] Users can only read their own DMs
- [x] Users can only edit/delete their own messages
- [x] Roles checked server-side via RLS policies
- [x] File uploads restricted to authenticated users
- [x] Storage bucket configured for public read access
- [ ] **Recommended**: Enable email confirmation in production
- [ ] **Recommended**: Add rate limiting via Supabase Edge Functions

---

## Troubleshooting

### "No servers found" after login
- Check Supabase RLS policies are set up correctly
- Verify environment variables are correct

### File uploads failing
- Ensure `attachments` bucket exists and is public
- Check bucket policies in Supabase Storage

### Real-time not working
- Verify tables are added to `supabase_realtime` publication
- Check browser console for WebSocket errors

### CORS errors
- Add your Vercel URL to Supabase Auth redirect URLs
- Ensure no trailing slashes cause issues

---

## Free Tier Limits

### Supabase Free Tier
- 500MB database
- 1GB storage
- 2GB bandwidth/month
- Unlimited API requests

### Vercel Free Tier  
- 100GB bandwidth/month
- Unlimited deployments
- Automatic HTTPS

Both free tiers are sufficient for small to medium projects!
