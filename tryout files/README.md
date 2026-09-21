# San Jac Ravens Esports — Standalone Tryout Site

This ZIP is a complete standalone React/Vite website. It does not depend on the management portal.

## Public captain form
`#/`

## Admin sign-in
`#/admin`

## Admin submissions / Excel export
`#/admin/tryouts`

## Supabase
You already ran the standalone SQL successfully. The matching SQL is included in:
`supabase/01_tryout_submissions.sql`

## Create the admin account
In Supabase:
Authentication > Users > Add user

Create only trusted admin/staff accounts. Captains do not need accounts.

## Local environment
Copy `.env.example` to `.env.local` and enter:
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY

## GitHub Pages
In the GitHub repository:
Settings > Secrets and variables > Actions

Create repository secrets:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Then:
Settings > Pages > Source > GitHub Actions

The included `.github/workflows/deploy.yml` will build and deploy whenever `main` is updated.

## Important
Do not put a Supabase service_role or secret key in this frontend.
The public/publishable key is the correct browser key.
