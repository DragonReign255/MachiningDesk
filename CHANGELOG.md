# Release history

## v1.2.0 — 2026-10-18

- Add the standalone **Three-Wire** page and a shortcut from Threads for pitch-diameter measurement on external threads, including UN and ISO metric presets, custom diameters/pitches, 60°, 55°, 29°, 30° and custom included angles, nominal and actual wire diameter, micrometer reading, and lead-angle/seating warnings.
- Add reference-derived Haas HSAM2, HTPM and general-purpose carbide drill SFM settings and **diameter-interpolated feed per tooth/revolution** for selected approximate material groups. Show exact source documents in the calculator; label unsupported combinations as estimates.
- Use an app-derived 85–100% SFM starting band around published targets; separately indicate Haas side-cutting vs slotting surface speed where charted. Retain the conservative 0.65× slotting feed reduction at machine RPM limits.
- Suppress arbitrary coating multipliers on series-specific manufacturer entries, protect user-modified material ranges during migration, and mark subsequent edits as custom.
- Correct a missing database navigation container discovered during browser testing.
- Update application navigation, release label, and usage/safety documentation.

## v1.0.0 — 2026-10-18

Initial GitHub-ready release of Machining Desk.

- Preserved milling, turning, drilling, Drill Chart, Threads and Database pages.
- Added a compact **Colors** button in the header with dark/light appearance, six accent presets, custom color selection, persistence and reset controls.
- Added automatic contrast adjustment for custom accents.
- Split application into stable HTML, CSS and JavaScript source files, with the factory machining database and drill/thread reference data stored separately.
- Kept existing local database, saved setup and unit storage keys for in-place upgrades.
- Included GitHub Pages setup instructions and documented data migration between browser origins.

## 1.1.0
- Group machine records into Mills, Lathes and Mill-Turns and tool records into Milling, Turning and Drilling.
- Expose machine-category-specific secondary and live spindle settings and tool-operation-specific geometry.
- Add dovetail cutter and separate HSS and carbide reamers; migrate these into existing browser libraries without discarding custom entries.
- Apply conservative 0.65× feed adjustment to full-width slotting and an editable per-tool feed multiplier (0.55× initial dovetail setting).
- Preserve saved setups, drill chart, threads, and existing unit/theme settings.
