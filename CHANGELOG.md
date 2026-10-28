# Machining Desk Changelog

## v1.11.1 — 2026-10-28

- Replace the top navigation IN/MM toggle with a compact **Units** menu under the Machining Desk wordmark. Select length (in/mm), force (lbf/N), stress (psi/MPa), torque (lbf·ft/N·m) and power (hp/kW) independently; choices persist locally. Applicable machining outputs, advanced readouts, engineering calculators, machine power curves, material properties and database numeric editors use the corresponding selections.
- Add **Countersink Geometry** to Calculators, sharing cutter diameter, included angle, pilot-hole diameter, top cut diameter and axial depth with Drilling → Countersink. Adjusting either top diameter or axial depth recalculates the other; SFM uses cutting contact diameter. The conical cutting model is approximate and must not replace actual tool geometry or Z-offset verification.
- Add **ER collet & CAT40 tightening / drawbar** reference under Charts → Machines. Include Techniks ER nut tightening data (nut style and collet bore-dependent), Techniks 40-taper retention-knob tightening torque, and Haas 40-taper drawbar clamping **force**, with explicit warnings that drawbar force is not tightening torque. Verify values against the holder/pull stud manufacturer for the exact hardware.
- Add responsive black-and-white dimension and geometry drawings to Insert Identification, covering plan-view shape, inscribed circle, side-view thickness and nose radius. Sketches are schematics, not tolerance-certified shop prints.
- Set the factory **Manual engine lathe** maximum spindle RPM to **1,500**, migrating only an unchanged prior 2,000-RPM factory default and preserving custom values.
- Refresh offline app cache and include the new countersink-geometry module.


## v1.11.0 — 2026-10-26

- Add tool substrate options for **cobalt high-speed steel (HSS-Co), cermet, ceramic, cubic boron nitride (CBN), and polycrystalline diamond (PCD)** alongside existing carbide and HSS. Each defaults to **Uncoated**, with eligible optional factory coatings ranked by workpiece suitability; user-created coatings remain available. Support for these cutting-tip materials does not imply they are suitable for every operation or work material.
- Add a substrate selector in **Database → Materials** for separately editing low/high cutting-speed ranges per cutter. Preserve legacy carbide/HSS data and customized ranges. Infer additional cautious planning bands only for plausible combinations (for example, PCD on nonferrous materials, cermet for turning selected steels, CBN for cast iron); unsupported pairings remain blank. The extra substrate bands are **not manufacturer-validated feeds and speeds**.
- Add **General purpose / Roughing / Finishing** strategy dropdown to Milling and Turning. Changing strategy updates the recommended cutting speed position within the material range, chip load, and radial engagement. A selected strategy and its manually tuned values remain in per-operation saved settings. General-purpose remains the default. These are starting heuristics, not a guarantee of consistent surface finish.
- Show a visible **chip-wrap hazard warning** for finish turning stringy materials, including aluminum, stainless, copper alloys, plastics and common mild steels; long chips can wrap around rotating chuck/workholding. Never remove chips while the machine is running.
- For **parting** tools replace the visible radial DOC entry with an editable recommended **peck/retract spacing**, explicitly separate from cutting-power estimation. For conventional **twist drills** also show a provisional G83-style peck distance scaled to tool diameter, HSS/HSS-Co versus carbide, and workpiece material family. Show a circular-arrow reset for peck length. These are chip-evacuation estimates, **not a recommendation to peck all drills or interrupt every parting cut**. Insert drills and other drilling tools do not show a peck distance.
- Add configurable starting **speed multiplier** and **feed-per-tooth/revolution multiplier** to every machine's Database editor and Copy dialog. Default CNC to 100% / 100%, manual machines to 80% / 80%; migrate only original untouched 25% / 22% manual defaults. Edited machine factors remain user-controlled. Rigid-tap feed/rev always remains equal to thread lead for synchronization.
- Update PWA cache and add guidance to tool-deflection notes for PCD/CBN cutters with assumed carbide support bodies; tool geometry still requires verification.

## v1.10.0 — 2026-10-26

- Add a **Macros** tab to the existing Haas G/M Codes page, alongside the unchanged side-by-side G/M code tables. The selected machine determines which macro reference is shown: ST lathe or VF/UMC mill.
- Add a searchable, grouped **Haas NGC macro variable reference**, transcribed and paraphrased from the official Haas mill and lathe operator-manual variable tables, including local G65 arguments (#1–#33), persistent user globals (#10000–#10999, with probe/option reservations called out), system/state variables, tool/work offsets, I/O, reserved entries, and lathe-specific spindle monitoring (#625xx). Clicking a range shows purpose, legacy numbering and cautions, with a link to the relevant Haas manual. Entering an individual variable number finds ranges that contain it; legacy #100/#500/#800 aliases are supported in lookup.
- Include compact macro-programming syntax examples for G65, G103, IF/GOTO, WHILE, alarms and aliases. Note that macro functionality and option-specific variables may differ by software and installed machine options.
- Add a **My macro programs** notebook for each machine. Save/edit/delete program numbers (O-numbers), descriptions, arguments and notes. Records live in that machine's Technology Database entry and are preserved by the app's normal Database export/import; they do not read or modify real CNC programs.
- Update PWA offline cache version and include the new Haas Macros JavaScript module. All prior machining calculators, charts, custom materials, saved setups, and device icons remain unchanged.

# Release history

## v1.9.1 — AlSi10Mg material added

- Add AlSi10Mg aluminum (as-built laser powder bed fusion condition) to factory materials with 500–900 carbide / 120–250 high-speed-steel flat-end-mill SFM starting ranges, scaled cautiously for other tools, and a provisional specific-power coefficient of 0.45 hp/(in³/min). These are estimated planning values, not certified manufacturer cutting parameters.
- Add material-property chart references: density 2.67 g/cm³, Young’s modulus ~70 GPa, thermal expansion ~20 × 10⁻⁶/K, XY yield ~270 MPa, XY ultimate tensile ~450 MPa, hardness ~115 HBW, thermal conductivity ~105 W/(m·K). EOS data applies to a particular LPBF process and condition; material builds, orientations, and heat treatments differ.
- Add the new default to existing locally stored technology databases without replacing existing records or duplicating user-created AlSi10Mg entries. Refresh the offline cache identifier and visible release version.


## v1.9.0 — Boring bar controls, milling RDOC, material strength, threaded fasteners

- Hide turning tool stickout and deflection unless Boring bar is selected. Add an independently selected boring-bar shank material and insert material; insert sensitivity is intentionally labeled an unverified force proxy rather than treating inserts as structural bar stiffness.
- Remember the last absolute non-slot radial depth of cut when enabling/disabling milling Slotting; update percentage display when cutter diameter changes without modifying RDOC in inches/millimeters. Retain RDOC in saved drafts.
- Give the Advanced floating result panel its own capped-height scrolling area, including mobile scrolling.
- Expand Material Properties for all 22 factory and custom Database materials with hardness (correct scale), yield stress, ultimate strength and thermal conductivity; let users override values in material editors. Factory references remain grade/condition typical approximations.
- Add searchable **Threaded fasteners · strength & torque** chart and automatically favorite it, with inch/metric 60° thread sizes, coarse/fine/extra/custom pitch, SAE/ISO fastener grades, database material selection for bolt and tapped hole, engagement length, nut factor and safety factor. Show tensile stress area, proof/yield/ultimate loads, elastic yield strain, simplified external/internal thread-stripping limits, and preliminary preload/torque limit.
- Explicitly mark tightening torque as **NOT a guaranteed safe torque**: the nut factor, available material properties and simplified shear-area geometry have substantial uncertainty; actual assembly torque requires engineering validation.
- Update offline asset cache and include both new modules. Regression tests in desktop/mobile Chromium cover advanced panel scroll, boring-only control, RDOC toggle/diameter behavior, grade and material changes, and JS startup.


## v1.8.0 — Advanced machining & shop notation

- Restored side-by-side **secondary and live spindle** specifications in the mill-turn machine editor, without repeating main spindle. The main, secondary, and live horsepower/torque chart panels are still available separately.
- Renamed cutting result **Details → Advanced**, while leaving headline speed/feed/power outputs visible.
- Added unsupported tool length/stickout, boring-bar shank diameter and material, and turning insert nose radius as persistent cutter inputs. All relevant lengths follow the IN/MM units toggle.
- Added simplified static tool and boring-bar deflection estimates to Advanced, with bending stress, length/diameter ratio, a conservative **geometry-only chatter risk** indicator, turning theoretical surface roughness, and ball-nose stepover cusp estimate. Actual chatter and surface finish require manufacturer/dynamic measurements; the models are not pass/fail predictions.
- Expanded insert identification into searchable/interactive ISO/ANSI designation decoding, common shapes, relief, tolerance and chipbreaker codes, dimensions, ISO work material groups and limitations. Manufacturer-specific grades, chipbreakers and exact tolerances require a catalog.
- Renamed factory **Haas VF-4SS · example** preset to **Haas VF-4SS**, including a non-destructive migration for users with that unchanged default name.
- Added fractional input (e.g. `3/8`, `1 1/2`, `1-3/16`) to numeric fields: normalized to four decimal places after confirmation, with an inline preview. Drill diameter fields accept **#1–#80** and **A–Z** drill designations; the external three-wire diameter field accepts **American Wire Gauge** `#0–#40` or `AWG 36` with its calculated decimal diameter shown.
- Made mill radial depth follow entered radial diameter percentage, mill axial depth track conservative diameter-based defaults unless manually customized, and drilling feed/revolution scale with drill diameter where a manufacturer feed reference is unavailable.
- Updated offline service worker cache to include the three newly added scripts.

**Technical caution:** All force, deflection, finish, vibration and feed scaling outputs remain simplified estimates. Tool deflection uses equivalent power-derived cutting force rather than measured transverse cutting load; the boring-bar chatter assessment is strictly an unsupported-length/diameter screening guide. Do not use these estimates to waive machine clearance, tool-life or chatter verification.


## v1.7.0 — 2026-10-20

- Move hardness reference into the ninth engineering calculator: three independent source/output selector rows, HRB/HRC/HRA/HBW/HV conversions and out-of-range warnings for approximate steel conversion data. Do not imply ASTM E140 testing equivalence.
- Replace Threads navigation title with Threading, with persistent metric/Unified/Whitworth/BSP/NPT/ACME standards and coarse/fine/extra/custom series options. Preserve nominal diameter and other settings across thread mode and series changes, with exclusive vertical checkbox-style selectors.
- Persist engineering calculator input values and all machining page drafts. Share selected workpiece material between milling, turning and drilling; restore independent last-selected tool and remaining settings on navigation and reload. Add circular-arrow reset buttons.
- Add cutting/form tap in Drilling, linked to Threading major diameter and lead, along with empirical power/torque estimates. Add single- and multi-point thread mills in Milling and apply helical tool-centerline feed correction. Explicitly label unsupported tap strength estimates and geometry caveats.
- Load approximately digitized **published Haas family** 200%-load spindle curves for compatible VF, Super-Speed/UMC and ST-20Y main spindles. Lock factory CNC curves; permit copied-machine, generic CNC and manual-machine edits. Show separate main/sub/live spindle selector. Set ST-20Y finishing sub to user-reported **8 hp (not verified)** and BMT65 live-tool drive to published **12 hp**; secondary/live curve shapes remain clearly labeled illustrative.
- Include approved industrial MD app icon and PWA manifest, service worker, Windows/favicon, Android and iPhone icon sizes for Chrome and home-screen installation with offline asset caching.
- Regression-test selection, conversions, navigation persistence, spindle curve locking/copying, and browser execution without JavaScript exceptions.


## v1.6.0 — 2026-10-19

- Extend the single-first-double-click select-all behavior to numeric/text/search inputs throughout the app, including dynamically rendered Database and engineering/calculator fields.
- Display effective tangential cutting force, cutting torque and estimated motor-equivalent demand on milling, turning and drilling Details. Keep single-point threading excluded from unreliable pass-by-pass net power estimates.
- Convert all eight standalone engineering calculator input/output quantities with the main IN/MM switch; preserve entered values during a unit change. Use correct stress, elastic modulus, power, torque, length, temperature and tap major/pitch conversions.
- Expand the Material Properties reference from six example entries to the complete live Technology Database. Add optional editable density, elastic modulus and thermal expansion fields, retaining them in JSON. Add additional cautions/examples to bearing, dowel, retaining ring, taper and hardness chart sections.
- Move Threads immediately after Drilling in the top navigation.
- Add per-machine editable RPM/HP sample curves. Provide main, secondary and live-tool curve sections on configured mill-turn machines; plot power and derived torque, with the estimated cut marked at its RPM. Blank fields use **clearly labeled illustrative** curves, not unverifiable OEM graphs.
- Add editable machine drive efficiency, idle power and short-term peak versus continuous power basis. Show optional 50%-peak continuous reference for Haas-style short-term peak ratings; do not present this as an exact model-specific duty rating.
- Validate syntactic and navigation/unit behavior in Chromium, including all eight calculators, all reference charts, copied database editors, and mobile 360-pixel viewport. Preserve earlier storage keys and user data.

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
