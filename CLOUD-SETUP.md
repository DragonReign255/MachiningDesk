# Machining Desk — Cloud backup setup (V1.12.0)

This release adds **optional accounts and manual private cloud backup/restore**, not unattended multi-device automatic sync. The local browser database remains the primary working database. GitHub Pages continues to host the app.

## Setup (administrator, once)

1. Create a Supabase project at https://supabase.com/dashboard.
2. In Supabase **SQL Editor**, paste and run `supabase/schema.sql` (or apply it as a migration). This creates `md_cloud_snapshots`, enables Row Level Security and installs an atomic revision-check upload function. Do not create an unprotected public table.
3. From **Project Settings → API**, copy the project URL and the **publishable** key (`sb_publishable_...`). Put them in `assets/js/cloud-config.js`. Older projects may display a public `anon` key. **Never use a `service_role` key or a secret API key in browser code or GitHub.**
4. Under **Authentication → Providers**, enable Email. Set the Site URL and redirect URLs to the actual GitHub Pages domain if email confirmation is required. For this first release, confirmation links return to the website; sign in normally afterward.
5. Commit/upload only the files in the update ZIP, preserving paths. Allow GitHub Pages to deploy; refresh installed PWAs so the updated service worker loads.
6. Open Machining Desk → **Cloud**, create an account, confirm your email if prompted, and sign in. Use **Upload this device** on the device that contains your authoritative local database. On a second device, sign in and choose **Download cloud to this device**.

## Data protection

- **Upload** overwrites the cloud record only if its revision is unchanged; stale uploads are rejected.
- **Download** explicitly replaces local data **after confirmation** and first exports the old device data to a dated `.json` file. Retain that file. It cannot protect you if browser downloads are blocked.
- No background upload, cross-device merge, or live synchronization is enabled yet. If you change both devices independently, choose which device is authoritative. Avoid uploading stale data.
- The snapshot includes the app’s local Machining Desk settings, user customizations, macros, and saved setups; it does not include Supabase auth tokens or unrelated web data.
- For additional protection, use Database → Export periodically. Supabase is not a replacement for independent backups.
- Logins and cloud backup need internet. All existing machining calculators continue operating offline.

## Next release

V1.12.1 can add an offline outbox, per-record revision tracking and conflict-resolution UI. **Do not enable blind last-write-wins auto-sync on the current single-snapshot implementation.**

Supabase documentation: https://supabase.com/docs/guides/database/postgres/row-level-security and https://supabase.com/docs/reference/javascript/auth-signinwithpassword.
