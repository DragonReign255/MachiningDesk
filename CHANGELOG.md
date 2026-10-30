# V1.12.3 — Community feedback and measured spindle-load records (October 30, 2026)

- Community ideas: new ideas and feature proposals, one vote per signed-in account, search and owner-managed statuses/release versions.
- Private incorrect-data and software bug reporting with administrator review and author-only visibility.
- In-app development roadmap plus `ROADMAP.md` for upcoming priorities.
- Advanced now accepts observed **peak spindle-load percentage** (optional unloaded percentage and notes) and saves a complete parameter snapshot **inside the selected machine record**. Records sync with the personal Technology Database and can be explicitly submitted for review.
- Machine-specific history and a tentative historical controller-load indicator once at least three comparable samples exist. Controller load percentage is **not** measured spindle horsepower; no automatic change to calculated cutting power or published spindle curves.
- Community submission and approval support for reviewed spindle-load observations (read-only, not importable cutting settings).
- Supabase migration `community-v1.12.3.sql` adds new RLS-protected idea/voting/report tables. No change to existing cloud snapshot schema.

## V1.12.0 — Cloud foundation

- Optional Supabase sign-up and sign-in from a new Cloud dialog.
- Manual revision-protected upload of the current device database and preferences.
- Explicit cloud restore with a local JSON backup and reload.
- SQL schema with private per-user Row Level Security and optimistic revision checking.
- Without configured credentials, Machining Desk runs unchanged as a local/offline app.
- No automatic two-way sync in this release; a later version will add per-record conflicts.

# Machining Desk — Changelog

## V1.12.1 — Automatic cloud sync (minor update)

- Adds opt-in, local-first automatic cloud synchronization after edits and on periodic online checks (45 seconds while open).
- Uses the existing V1.12.0 Supabase snapshot/RPC schema; no new server migration.
- Three-way merge compares the last synchronized baseline, this device, and the cloud, down to individual Technology Database record properties and saved setups.
- When two devices change the same value, a review panel lets users select the correct version. Revision-aware database writes reject stale uploads.
- First-time activation never automatically overwrites an existing different cloud copy or existing device database. Manual Upload or Download establishes the initial baseline after confirmation.
- Changes received from another device are applied to local storage with a safety backup; a reload prompt updates the app’s in-memory data.
- Uses IndexedDB to retain synchronization history and up to six local safety backups per account. Last safety backup is exportable.
- Retains manual cloud upload/restore, optional sign-in, and full offline operation.
- The Cloud popup reports synchronization state, conflicts and required reloads.
- Fixed incorrect handling of missing legacy revision markers from V1.12.0; prior cloud keys are preserved.

## V1.12.0 — Optional cloud backup

- Added email login, manual upload/download with cloud revision protection, user-private Supabase SQL table and Row Level Security.


## V1.11.5 — Minor update · Multi-brand inserts, galvanic reference, engineering materials

- Insert chart: added selectable manufacturer (Kennametal, ISCAR, Haas Tooling, Sandvik Coromant, Seco, Walter, Mitsubishi, Tungaloy, Kyocera, Sumitomo, Korloy, and other), catalog/search links, drilling inserts and exchangeable drill heads, and supported proprietary insert-family guidance.
- Standard ISO/ANSI turning decoder remains available for every manufacturer. Proprietary numbering systems cannot be reliably decoded from text alone; unknown manufacturer codes explicitly require maker specifications rather than an invented dimension or drawing.
- Supports saving a user-confirmed physical insert profile by maker and code (shape, width, thickness, corner radius); local to current browser. The custom profile is not automatically included in the Technology Database export.
- Seven ISO/ANSI designation positions are now clickable in the turning insert chart and scroll to expanded reference tables for shapes, relief angles, tolerance, clamping configurations, size, thickness, and nose radius.
- New Galvanic Corrosion chart: select two metal grades from the Materials database, active/passive stainless state, wet/dry conditions, and cathode/anode exposed area ratio. Ordinal seawater-series screening, not a claim of universal safety or fixed electrode potentials.
- Added 50+ engineering material grades/conditions spanning aluminum, carbon/alloy/tool/stainless steel, cast irons, titanium, copper/brass/bronze, nickel superalloys, magnesium, and cobalt alloys. Representative property figures and estimated analog-based uncoated SFM ranges are labeled as *engineering estimates*; they are not verified manufacturer speeds for each specific cutter, substrate and coating.
- Added Material family dropdown to Milling, Turning and Drilling. The grade dropdown is filtered by family; material sharing across machining pages remains in place.
- New materials merge into existing local databases without overwriting existing materials or edits. Offline app cache updated to V1.11.5.

**Sources and limits:** ASTM G82, U.S. EPA galvanic series for seawater, Kennametal cutting references, ISCAR drilling catalogs, Haas Tooling indexable-drill/milling catalog, TIMET titanium grade datasheets, Harvey Tool coating application guide. Use verified toolmaker/catalog and material certs for production machining, joint compatibility, or critical material design.

## V1.12.2 — Moderated Community Library
- New Community button: browse approved machines, materials, cutting tool types, and coatings without changing the factory database.
- Sign-in-aware submissions from the user's personal Technology Database, with record preview, optional HTTPS reference, and notes. Macro programs and authentication fields are excluded.
- Users can track their submission status (pending, approved, rejected) and read reviewer feedback.
- Owner-only review queue with one-step approve/reject actions. Admin rights are enforced by server-side RLS and a revision-safe review function, not by hidden buttons.
- Approved entries may be **explicitly imported** as independent personal copies, then synchronized through the existing private cloud sync. No automatic changes to factory recommendations.
- New one-time Supabase migration: `supabase/community-v1.12.2.sql`. Project owner must grant their Supabase Auth user ID administrator status via SQL Editor; **do not** share service credentials.
- Offline app and private V1.12.1 cloud sync remain unchanged. The community catalog requires network access and sign-in.
- Service-worker cache advanced to `machining-desk-v1.12.2`.
