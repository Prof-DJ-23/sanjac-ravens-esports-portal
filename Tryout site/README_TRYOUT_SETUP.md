# San Jac Ravens Esports Tryout Form + Supabase

This package adds a public captain tryout form and an admin review/export page.

## Files

Copy these into your existing portal:

- `src/pages/TryoutFormPage.jsx`
- `src/pages/admin/AdminTryoutsPage.jsx`
- `supabase/08_tryout_submissions.sql`

## 1. Run the Supabase SQL

Open Supabase > SQL Editor.

Copy the entire contents of:

`supabase/08_tryout_submissions.sql`

Run it once.

The table is:

`public.tryout_submissions`

### Security behavior

- Public/anonymous users: INSERT only.
- Public/anonymous users: cannot SELECT submissions.
- Verified portal admins: SELECT, UPDATE, DELETE.

The SQL assumes your existing portal profile table is:

`public.profiles`

and that:

- `profiles.id = auth.uid()`
- `profiles.role = 'admin'`
- `profiles.verified = true`

If your user-id column is different, update the admin RLS policies before running the SQL.

## 2. Add the public tryout route

Your portal's router should import:

```jsx
import TryoutFormPage from './pages/TryoutFormPage';
```

Then add:

```jsx
<Route path="/tryouts" element={<TryoutFormPage />} />
```

The public page will be available at:

`/tryouts`

It does not require a portal account.

## 3. Add the admin route

Import:

```jsx
import AdminTryoutsPage from './pages/admin/AdminTryoutsPage';
```

Add this route INSIDE the same authenticated/admin routing structure you already use:

```jsx
<Route path="/admin/tryouts" element={<AdminTryoutsPage />} />
```

The component also checks `role === 'admin'`, and Supabase RLS provides the real database security.

## 4. Add an Admin navigation link

Add a link to:

`/admin/tryouts`

Label it:

`Tryouts`

## 5. Excel download

The admin page includes:

`Download Excel CSV`

It downloads a UTF-8 CSV containing the CURRENT FILTERED results.

Microsoft Excel opens this file directly as a spreadsheet.

The export includes:

- submission time
- tryout date
- game/team
- captain/evaluator
- player name
- Discord name
- in-game name
- role
- rank
- every 1-5 evaluation score
- strengths
- areas for improvement
- captain notes
- recommendation

No extra npm package is required.

## 6. Test

### Public form
1. Open `/tryouts`.
2. Complete all fields and ratings.
3. Submit.
4. Confirm the success message.

### Supabase
Open Table Editor > `tryout_submissions`.

You should see the submitted row.

### Admin
1. Sign into your portal as your verified admin account.
2. Complete MFA.
3. Open `/admin/tryouts`.
4. Confirm the row appears.
5. Click `Download Excel CSV`.
6. Open the downloaded file in Excel.

## Important

Because the form intentionally does not require accounts, anyone who has the public URL can submit a row.

RLS prevents public users from reading the submissions, but a public write form can still receive spam if the URL is widely shared.

The included hidden honeypot reduces simple bot submissions. For heavier public use, the next security upgrade should be a CAPTCHA/Turnstile or a small server-side submission function.
