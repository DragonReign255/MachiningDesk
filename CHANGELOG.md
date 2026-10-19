# Release history

## v1.5.0 — 2026-10-19

- Change all Database Duplicate controls to Copy. For machines, tools, and coatings, open a pre-save dialog with editable names and applicable parameters. Keep source machine category and tool operation fixed. Allow editing inherited tool flags or recommended coating families. Preserve material Copy and one-time SFM scaling.
- Add per-machine Haas G/M-code-library selection (None, VF, UMC, ST). Show only associated machines in the Haas Codes page; migrate existing named Haas records while leaving manual/generic machines unassigned.
- Add ±5% increments and reset beside the existing independent spindle-RPM and feed override sliders.
- Align RDOC and ADOC control heights. Move the three-wire checkbox directly below thread pitch while retaining the existing expanded measurement panel.
- Reorganize Charts into a collapsible grouped sidebar with indexed search, favorite strip, and Database-managed favorites included in JSON import/export.
- Add six main chart sections: hole/shaft fit examples, thread reference, ISO turning insert identification, key/broach reference, general fastener reference, and theoretical surface-finish chart.
- Add nine secondary references: bearing fits, O-ring gland excerpts, retaining rings, dowel pins, spindle tapers, hardness conversion examples, material properties, GD&T symbols, and 1/128-inch fraction table.
- Add eight new calculators: tool and boring-bar deflection, cutting torque, turning roughness, thermal expansion, tapping torque/capacity screen, spur gears, and knurl tracking. Warn clearly that tap torque and capacity are **not verified safe limits** or toolmaker recommendations.
- Add short source links in chart pages and extensive limitations in the README. Existing local saved setups, tool/material data and colors are not reset.


## v1.4.0 — 2026-10-19

- Select the entire value on the first double-click of any cutter parameter, including fields that did not previously have focus. Calculator numeric fields accept text selection, retain mobile decimal keyboards and continue numeric validation.
- Remove the flute-length input and ADOC percentage from the cutter calculator and tool editor. Keep absolute ADOC and synchronized absolute/% RDOC.
- Limit calculator readout fields to relevant operations; use IPT for milling, IPR for turning/drilling and drilling-only feed time. Suppress threading power/volume estimates in the summary.
- Add independent 0–200% RPM/feed override sliders to the sticky readout, display their effective results and recompute chip load. Preserve override percentages in saved cutting setups and operation drafts; warn about exceeding spindle limits and excessive chip loads.
- Replace thread inspection tabs with Internal/Tapping and External/Single Point selections. Move three-wire inspection to an expandable checkbox beneath external thread geometry; share common nominal diameter, pitch and thread-system inputs.
- Rename Drill Chart to Charts and separate drill and socket head cap screw charts with tab-like buttons.
- Maintain database migration, local storage keys, existing saved setups, theme preferences and drill/Haas-code library.


## v1.3.0 — 2026-10-18

- Consolidate redundant twist-drill and chucking-reamer entries into one geometry each, with HSS/carbide chosen through tool-substrate selection. Migrate old tool IDs and saved setups.
- Set aluminum carbide flat-end-mill reference to a user-specified 800–1500 SFM band, with reduced geometry-specific shop bands for other milling/turning cutters; do not boost aluminum drilling speeds.
- Group material records by family and allow new custom material families.
- Replace Material Duplicate with **Copy** dialog: new name, destination family/new family, one-time whole-SFM scaling multiplier. Do not store the multiplier.
- Add editable per-coating material-family suitability checkboxes; populate initial recommendations from tool-coating application guidance. Include TiB₂ for aluminum and preserve existing coating records.
- Merge Three-Wire measurement into the Threads page as a second tab; preserve thread/wire calculations.
- Add an inch/metric socket head cap screw reference chart, including clearance hole and counterbore dimensions.
- Add Haas machine-family G/M-code tables with separate text searches, click-through concise descriptions and selected parameter summaries, and per-code official Haas links. Show a no-codes message for manual and generic machines. UMC-750SS includes UMC-related 5-axis code family.
- Preserve theme/settings and perform local data migration with a one-time marker to avoid repeatedly overwriting user edits.


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
