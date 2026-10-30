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
