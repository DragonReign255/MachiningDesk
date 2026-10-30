# Changelog

## V1.12.5 — Consolidated workshop tools (October 30, 2026)

- Ctrl+K / Search: local global search of pages, materials, machines, tool types, charts, calculator titles, common G/M codes, and insert-marking navigation. It doesn't transmit search queries.
- Added manufacturer-specific fields to custom tool records (manufacturer, part number, grade, insert, holder, preferred substrate/coating, source URL and evidence type); stored in existing private DB and cloud backups.
- Added Advanced panel linked-model audit with shortcuts that carry current machining parameters to Cutting Torque, Deflection, Surface Finish, Tool Life and Cycle Time calculators.
- Added Taylor tool-life comparison (requires observed baseline and fitted empirical exponent), straight-cut cycle-time approximation, chamfer, sine bar, drill point and preliminary elastic press-fit screening calculators.
- Added charts on ISO carbide application groups, drill-point geometry, and engineering plastics.
- Extended spindle-load records with optional displayed loaded and unloaded kW, saved cutting MRR, robust diagnostic median factors and scatter warnings. NO automatic change to manufacturer power curve, cutter safety limits or speeds/feeds.
- Bumped PWA cache; preserved cloud configuration, shared approval data and user database settings.

## V1.12.4

- Report an error from machining pages, calculators and charts; optionally attach reviewed current inputs.
- Material Properties family/grade filter, synced with Technology Database.

For full earlier version history see the previous update changelogs or GitHub commit history.
