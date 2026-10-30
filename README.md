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

The PWA precaches the added modules. Installed PWAs receive updates when online and when the service worker refreshes. Browser-local profiles for arbitrary inserts remain local to that browser and are not included in the existing database JSON export.
