# Machining Desk

A progressive web application for shop machining calculators, tooling references, machine data and charts.

## V1.11.5 update

Upload only the files in the V1.11.5 update ZIP to your existing GitHub repository, preserving directory structure. Your existing local Technology Database, saved setups, and settings are preserved. Export your Technology Database before updating.

### Insert reference

Choose an insert category (Turning, Parting, Grooving, Milling, Drilling) and manufacturer. ISO/ANSI turning specifications decode from the standard designation. Some known vendor families are classified, and vendor catalogs are linked for exact parts. For unknown proprietary codes, consult the supplier and enter confirmed geometry into the local insert profile; **no tool can accurately identify all vendor-specific SKUs using the marking alone**. Manufacturer-specific chipbreakers, pocket/seat dimensions, grades, coatings and operating data are not derivable from a generic ISO code.

Code fields 1–7 on the turning drawing link to the corresponding reference tables. Drawings are schematic and not valid for machining or holder compatibility decisions.

### New material library

Fifty-plus additional material grades have been added. Most cutting-speed ranges for these additional materials are labeled as analogy-based **engineering estimates**, scaled from an existing baseline; they are **not directly verified cutting-data recommendations** for each tool, grade or coating. Hardness, strength and other material figures are representative and vary with heat treatment, product form, and temper. Verify with the material certification and specific tooling manufacturer. Material families filter the machining grade dropdown.

### Galvanic corrosion reference

Ordinal galvanic compatibility screening based on the seawater series. Select two metal grades and surface state; plastics are excluded. Galvanic corrosion depends on electrolyte, temperature, electrical continuity, oxide film, and exposed area ratio. This tool cannot guarantee any pair is safe or calculate actual corrosion current.

### Offline mode

The PWA precaches the added modules. Installed PWAs receive updates when online and when the service worker refreshes. Browser-local insert profiles are not included in the standard Technology Database JSON export; V1.12.1 cloud snapshots can synchronize them when Cloud automatic sync is enabled.



## V1.12.1 — Automatic cloud synchronization

- Local-first, opt-in automatic sync of private material, machine, tool, coating, setup, macro, and preference data.
- Uses the existing Supabase V1.12.0 schema; no new SQL migration.
- Revision-checked uploads, durable IndexedDB synchronization baselines, and three-way record/field-level merging.
- Conflicting changes require explicit per-field user decisions rather than silent overwrites.
- Offline changes remain local and are uploaded on reconnect; cloud is checked while the app is open.
- Local safety backups are saved before incoming merges, with a download option.
- User-initiated reload safely activates incoming database changes without interrupting work.
- Existing configured `assets/js/cloud-config.js` must be retained when deploying this version.

See [CLOUD-SETUP.md](CLOUD-SETUP.md) for setup, first-device enrollment, additional devices, safety and recovery.

## V1.12.2 — Community library and owner approval

The **Community** button lets signed-in users submit personal machine, tool, material and coating data for review and browse approved contributions. The **Owner review** tab is visible only after the account is granted administrator access in Supabase. Approvals are validated server-side; hiding or exposing browser controls never changes permissions.

Approved records **do not overwrite factory data**. Each user decides whether to add a personal copy, which then syncs as part of their existing private account. Review manufacturing specifications and consult current source documents before using data in a cut. Community approval does not mean tooling-manufacturer certification.

**One-time setup:** Run `supabase/community-v1.12.2.sql` in the existing Supabase SQL Editor and explicitly grant your Auth user UUID admin membership as described in `CLOUD-SETUP.md`. No new Supabase project or keys are needed. Retain the existing configured `assets/js/cloud-config.js` when uploading this update.

## V1.12.4: contextual technical corrections and material groups

Charts, engineering calculators, and machining/threading calculators now include **Report an error** controls. Clicking one opens Community → Bug reports with the location prefilled. The optional current-input snapshot is **off by default** and can be inspected before submitting. Reports stay private to their author and community administrators; submitting requires Cloud sign-in.

Charts → Material Properties now has a family dropdown and a search box. It shows custom and factory materials with live Database overrides. The filter is local to your browser session; it does not alter machining material selection.

**Supabase:** Uses the existing `md_community_reports` table from V1.12.3. No new SQL setup is required. Preserve your current `assets/js/cloud-config.js` when uploading the update files. Next planned feature: global search.

## V1.12.3: community ideas and observed spindle loads

The Community dialog supports idea submission and voting, owner-managed idea status, private bug/data-error reports, and the in-app roadmap. See `ROADMAP.md`.

Advanced → **Measured spindle load** stores controller-observed peak spindle-load % and captures the current operation, machine/spindle, selected material, tool, coating, substrate, geometry, depth of cut, feed, RPM, machine power model, overrides, and optional chip/coolant notes. Records are kept **within that machine's `loadTests` array**, which is part of the existing Technology Database, export and private cloud sync. Records do not automatically update cutting recommendations. At least three comparable tests are required to display a historical ratio-based indicator. Controller load % is not directly convertible to horsepower.

An individual record may be submitted to Community → Submit Entry → Spindle-load observations, where the user reviews the exact parameters and confirms consent. Owner-approved records are published as **reference-only shop observations**, not as certified feed/speed recommendations.

Before using Community Ideas, Voting, Reports, or Spindle Submission, run `supabase/community-v1.12.3.sql` once in the existing Supabase project. Do not overwrite the existing `assets/js/cloud-config.js` or rerun earlier migrations unless necessary. See `CLOUD-SETUP.md` for security and installation notes.
