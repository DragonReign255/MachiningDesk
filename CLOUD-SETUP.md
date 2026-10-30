# Machining Desk Cloud — Setup and Automatic Sync (V1.12.1)

The existing GitHub Pages website remains the app host. Supabase stores private revision-checked cloud snapshots. Local data continues to work offline, even if you never create an account.

## One-time administrator setup

If V1.12.0 cloud backup is already configured and working, **no new SQL or Supabase project is needed**. Keep the configured `assets/js/cloud-config.js` file in your GitHub repository; do not replace it with the example placeholder.

1. Create a project at https://supabase.com/dashboard if you do not already have one.
2. In Supabase SQL Editor, run `supabase/schema.sql` from V1.12.0 once. It creates `md_cloud_snapshots`, user-scoped Row Level Security, and the `md_save_snapshot` revision-check function. Rerunning the original SQL is not necessary for this release.
3. In `assets/js/cloud-config.js`, use your project URL (`https://<project-id>.supabase.co`, *without* `/rest/v1/`) and your **publishable** key. Never put a `sb_secret_...` or service-role key in a public website.
4. In Authentication, enable Email sign-in and configure confirmation-link redirects for your GitHub Pages website if required.
5. Deploy the V1.12.1 update files to the same GitHub Pages repository, preserving folders. **Do not overwrite your existing configured cloud-config.js**.
6. Refresh the website or installed app so the service-worker update activates.

## First device

1. Open Machining Desk and click **Cloud**. Sign in using your Supabase account.
2. If you have already used V1.12.0 manual cloud backup, verify which copy has your latest changes. **Upload this device** if its current database should replace the cloud version, or **Download cloud** if the cloud version is authoritative. Both actions require confirmation; restoring cloud exports the old local database first.
3. Enable **Automatically sync across devices**. For a brand-new empty cloud, your current device becomes the initial cloud copy after your confirmation.
4. After making a change, use **Sync now** to verify it uploads. Automatic sync also runs after edits when online and checks for changes every 45 seconds while the app is open.

## Second device

1. Install/open the same GitHub Pages application on your other device, and sign in using the **same account**.
2. If its local database differs from the cloud and this device has never synchronized, the app will **not** silently combine or replace those two full histories. Decide which device has the authoritative starting data. On the new device, select **Download cloud to this device** to preserve the cloud copy. The current device is exported first.
3. Reload the page if prompted, then enable automatic sync. Updates made on one device appear on the other after its next successful sync and reload.

## Conflicts and offline edits

- All edits save immediately into the same local application database as before, including when offline.
- The last successfully synchronized revision and full baseline are retained in IndexedDB so that future uploads can use **three-way merge** rather than last-write-wins.
- Independent changes to different material/machine/tool records or individual properties are merged automatically. For simultaneous changes to the same property, a **Review conflicting edits** panel asks you to keep the current-device value or the cloud value. The app does not resolve these silently.
- A revision-checked SQL write prevents a stale upload from overwriting a later cloud revision. If the cloud changes during a merge, the client rechecks both versions.
- When cloud changes are applied locally, the app asks you to **Reload** to refresh the in-memory Technology Database safely. It does not interrupt editing with a forced reload.
- If two tabs have different in-memory copies of the local Technology Database, the stale tab asks for a reload before further synchronization.
- The client checks for updates while the app is open; this is not a background push service while the app is completely closed.
- An IndexedDB **safety backup** is saved before automatic cloud merges and manual restores. The six most recent backups for the signed-in user are retained on that device; you can export the newest from the Cloud menu. Independently export Database backups periodically.

## Limits and troubleshooting

- V1.12.1 uses the **single-snapshot Supabase table** from V1.12.0 and client-side conflict resolution; it is not a multiuser shared-library service.
- To begin automatic synchronization, the app needs a trustworthy starting revision. If local and cloud data already differ and there is no baseline on this device, choose manual Upload/Download first. Neither action silently overwrites data.
- Cloud sync requires HTTPS and a supported browser with localStorage and IndexedDB. The local machining calculators still work if the Supabase service is unavailable.
- Any browser storage clearing, incognito-session termination or application uninstall may remove local data and safety backups. Keep separate exports. If an old device holds important unsynced changes, export it before restoring cloud data.
- If another device is running an older Machining Desk version, update it before enabling automatic sync to avoid unexpected schema conflicts.
- A damaged or incompatible cloud payload is rejected without overwriting local data.

Supabase documentation: https://supabase.com/docs/guides/database/postgres/row-level-security and https://supabase.com/docs/reference/javascript/auth-signinwithpassword.
