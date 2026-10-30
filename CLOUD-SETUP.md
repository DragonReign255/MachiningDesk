## V1.12.3 migration — community ideas, voting, bug reports and shop observations

The V1.12.3 update uses your **existing Supabase project and publishable key**. Keep your configured `assets/js/cloud-config.js` file unchanged. Do not post any secret keys or service-role credentials.

1. Install only the changed V1.12.3 GitHub files, preserving the `assets/` and `supabase/` folders.
2. In Supabase **SQL Editor**, run `supabase/community-v1.12.3.sql` **once** if it has not already been applied. It extends the V1.12.2 community category constraint and adds `md_ideas`, `md_idea_votes`, and `md_community_reports` with Row Level Security.
3. Continue using your existing administrator account. The migration never adds administrators automatically.
4. Sign in with Cloud, then open Community → Ideas & voting or Bug reports. Community requires a signed-in user; private machining data stays on the device unless the user explicitly submits one record.
5. On a machining page, expand **Advanced** and save an observed spindle-load test. Saved tests travel with your personal Technology Database and automatic sync. To propose a public reference entry, choose **Submit for owner review** on the saved test, inspect its parameters, and confirm.

**Security:** Only authenticated users can vote and submit ideas or bug reports. Each account can vote at most once per idea (unique database key). Votes are counted by a protected database trigger; other users cannot browse voter identities. Bug reports are accessible only to their author and administrators. Only administrators can change statuses, and only they can publish reviewed spindle records through the existing approved library workflow. New tables have RLS enabled.

**Engineering limitations:** Actual observed Haas controller spindle-load percentage cannot be treated as a direct cutting-horsepower measurement. The historical model uses a median measured/model ratio from at least three records with the same machine/spindle, operation, and material family; it is a diagnostic signal, not an independent measurement or permission to exceed machine limits. Calibrating true spindle horsepower needs verified load-meter semantics, unloaded baseline, machine torque/power curve, and measured conditions.

---

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

---

## V1.12.2: Community submissions and owner review (NEW, REQUIRED SQL)

The **private automatic sync from V1.12.1 already works** and needs no modification. V1.12.2 introduces a separate moderated community database. The community feature requires one new migration; until it is run the normal machining and private sync features still work.

### One-time setup

1. Keep your current Supabase project, Auth settings, project URL and browser-safe publishable key. **Do not overwrite** the live `assets/js/cloud-config.js`.
2. In your existing Supabase project, open **SQL Editor**. Copy and run the entire file `supabase/community-v1.12.2.sql` included in this ZIP. It creates the owner-access table, submission queue, approved library and atomic approval/rejection function. It does not change `md_cloud_snapshots` or `md_save_snapshot`.
3. In Supabase, go to **Authentication → Users**, open **your own Machining Desk account**, and copy its exact **User UID** (UUID). It must be the account you use to sign in to Machining Desk, not a project ID or API key.
4. Run this **separate** SQL command in the SQL Editor, substituting the UUID you copied:

```sql
insert into public.md_community_admins (user_id)
values ('YOUR_AUTH_USER_UUID')
on conflict (user_id) do nothing;
```

5. Upload the V1.12.2 update files to GitHub, **preserving the `assets/js` and `assets/css` folders**. Commit to `main`, refresh your installed app/website, and sign in through **Cloud**.
6. Click **Community**. You should see four tabs: **Approved library**, **Submit entry**, **My submissions**, and **Owner review**. Owner review appears only for accounts in `md_community_admins`.

### How contributions work

- **Submit entry:** Choose a type and an entry already saved in Database. Inspect the exact JSON preview, remove any private machine details, optionally add an official HTTPS source, check the sharing consent checkbox, and submit.
- **My submissions:** Track `pending`, `approved`, or `rejected`, plus review notes. Your original database record remains private and unchanged.
- **Owner review:** Inspect the complete submitted parameters, read the source reference, and approve or reject. Each decision runs inside one SQL transaction. Only server-authorized admins can publish.
- **Approved library:** Signed-in users can search and inspect records. **Add personal copy** makes a separately identified item in their private Technology Database. Their existing V1.12.1 cloud sync handles it across their own devices. No public entry automatically changes factory speeds or feeds.

### Security and limitations

- Public GitHub assets contain only **publishable** configuration; never upload `service_role`, `sb_secret_*`, passwords, or personal auth credentials.
- The admin membership table has no authenticated-user insert/update/delete grant. Adding administrators requires the project owner in SQL Editor. **An admin account is not created just by clicking a button.**
- Supabase Row Level Security isolates the submission queue: submitters can see their own submissions, administrators can review submissions, and signed-in users see only approved entries. User email/password and macro programs are not published in community entries.
- A contribution is an **engineering reference proposal**. The owner must verify supporting manufacturer data before approval. Import is always opt-in, and an imported entry is not automatically a verified factory record.
- The Approved library shows the latest 200 records; the review queue shows up to 100 pending items at a time. For larger communities, future pagination and abuse protection will be needed.
- A deleted signed-in session or offline connection prevents browsing or submitting to the community, **but private local calculations and previously saved Technology Database entries remain usable**.
- If you do not see Owner review after setup, check that you inserted the **correct Auth user UID** and that you are signed in to the same account.

Supabase RLS reference: https://supabase.com/docs/guides/database/postgres/row-level-security
