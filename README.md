This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Supabase Setup

1. Create a Supabase project and copy your project URL and public anon key.
2. Add these values to a `.env.local` file in the project root using the structure in `.env.local.example`.
3. Create the following tables in Supabase: `profiles` and `grades`.

Example `profiles` fields:
- `user_id` (uuid)
- `email` (text)
- `full_name` (text)
- `role` (text)
- `status` (text)
- `assigned_subject` (text)
- `phone` (text)
- `address` (text)
- `created_at` (timestamp)

Example `grades` fields:
- `student_id` (uuid)
- `teacher_id` (uuid)
- `subject` (text)
- `score` (numeric)
- `comment` (text)
- `created_at` (timestamp)

When you first set up Supabase, run the SQL script in `supabase/create_profiles_trigger.sql` from the Supabase SQL editor. That script creates the necessary tables, trigger, and RLS policies.

### Create the first admin user
1. In Supabase, go to Authentication → Users → New User.
2. Create a user with email `admin@test.com` and password `admin123`.
3. In Supabase SQL Editor, open `supabase/create_initial_admin.sql`.
4. Confirm the SQL uses `admin@test.com`.
5. Run the SQL in the editor.
6. The SQL file does not set the Auth password — it only creates the profile row for the existing Auth user.
7. Log in as the admin with `admin@test.com` / `admin123`, then approve teacher/student registrations from the app.

Once your environment is configured, run:

```bash
npm install
npm run dev
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

This app is ready for Vercel deployment as a normal Next.js project.

### Steps to deploy
1. Push your repository to GitHub, GitLab, or Bitbucket.
2. Go to [Vercel](https://vercel.com/new) and import your repository.
3. In the Vercel project settings, add these environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Optionally add the same values to a local `.env.local` file during development.

### Environment variables
Use `.env.local.example` as a template. In Vercel, copy the values from your Supabase project settings:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key
```

Make sure both variables are configured for your Vercel project before build and deployment.

### Notes
- You do not need to store the service role key in Vercel for this app, because the current code uses the public anon key in the browser.
- Make sure you have run your Supabase SQL setup first, including `supabase/create_profiles_trigger.sql` and `supabase/create_initial_admin.sql`.
- If Vercel build still fails with `supabaseUrl is required`, the problem is that `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` are not set in Vercel.

Once the variables are configured, Vercel will build with:

```bash
npm install
npm run build
```

After deployment, the app should be available from your Vercel URL.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
