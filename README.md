# Machining Desk


### V1.11.2 — Dimensioned insert identification

- **Charts → Insert Identification** now updates three annotated technical drawings for the entered insert designation. The selected insert shape, nose angle, inscribed circle, nose radius, relief angle, thickness and hole/chipbreaker configuration appear with dimension callouts. The seven code positions are shown above the drawings.
- Verified ISO size/shape mappings and ANSI nominal dimensions are used where supported. Manufacturer-specific clamping-hole diameters, coatings, chipbreaker details, edge preparation and tolerance magnitudes are not inferred. Drawings are schematic rather than scaled machining prints.

### V1.11.1 — Units, countersinks and tooling reference

- Choose display **Units** below the Machining Desk logo: inches/millimeters, pounds-force/newtons, psi/MPa, lbf·ft/N·m and hp/kW. Preferences are stored in the browser; machine/controller limits remain internally consistent. Not every fixed shop-standard reference table is converted.
- Use **Calculators → Countersink Geometry** or **Drilling → Countersink** to change the target top diameter and axial cut depth interchangeably using the included angle and existing hole diameter. The geometric model assumes a straight-sided conical profile; actual tool tip geometry and setup Z zero must be checked.
- Use **Charts → ER collet & CAT40 tightening / drawbar** for brand-specific ER nut tightening references, a 40-taper retention-knob torque reference, and Haas 40-taper drawbar clamping **force**. These are different quantities and must not be interchanged. Holder design, nut, bore and exact retention knob affect torque specifications.
- Insert Identification now shows schematic dimension sketches, and the factory manual engine lathe spindle limit is 1,500 RPM.


**Release: v1.11.2** · Browser-based machining calculators and a local technology database.

Machining Desk contains milling, turning and drilling calculators; machine, cutter, material and coating records; 18 searchable chart categories (drill sizes, hardware references, engineering charts); ten standalone engineering calculators; Haas machine-linked G/M-code lists; and internal/external thread tools. It is a **static website** using HTML, CSS and vanilla JavaScript. There is no server, account system, package manager, build process or external dependency.

## New in v1.11.0 — Substrates, machining strategies, pecks and machine multipliers

**Tool substrate selection:** Select carbide, HSS, HSS-Co, cermet, ceramic, CBN, or PCD on machining pages. The default finish is **Uncoated** for every substrate; optional factory coatings are filtered to broadly compatible combinations and highlighted by workpiece material family. User-made coatings remain available. Cermet, ceramic, CBN and PCD are often supplied as inserts or edges and are not interchangeable with solid-body cutters. Material/cutter/substrate combinations without reasonable general-purpose starting data have no recommended SFM rather than receiving an invented speed. The Database → Materials editor has a substrate selector to add toolmaker data for such combinations. New substrate starting ranges are engineering placeholders, not graded manufacturer values; existing material customizations are preserved. For a carbide-supported PCD/CBN-tipped milling cutter, deflection is estimated with a carbide-like supporting body; actual shank construction can differ.

**Cutting strategies:** The machining cutter panel has a **General purpose / Roughing / Finishing** control for milling and turning. Changing it refreshes suggested SFM, chip feed, and radial engagement. Finishing chooses a smaller radial engagement and chip feed and a higher location in the allowable SFM range; material, tool and machine limits may require a different approach. Any manually entered values can be adjusted afterward and are remembered for that operation. Turning finishing in materials prone to long chips shows a *chip-wrap warning* because a very light pass can increase the risk of an unbroken chip string around the rotating chuck. Proper chip breakers, coolant, guarding and safe chip evacuation matter more than the label **Finishing**. Never reach into a running chuck or spindle.

**Peck suggestions:** Only **twist drills** and **parting tools** show an editable peck recommendation. Twist drilling uses tool diameter, HSS/HSS-Co versus carbide, and the general work material family to suggest a provisional Q-depth. Parting shows radial retraction spacing, not radial DOC. In either case, the recommendation is an **estimate** and may be inappropriate when toolmaker guidance favors uninterrupted drilling/cutting or through-tool coolant. It does not enter the power calculation for parting. Use `↻` to restore the calculated starting value.

**Machine-specific defaults:** Database → Machines provides independent numerical multipliers for nominal surface speed and suggested feed per tooth/revolution. Manual machine presets use **0.80 / 0.80**, CNC machine presets **1.00 / 1.00**. Thus the resulting IPM may reflect both the speed and chip-feed multipliers, not merely a single 80% feedrate override. For taps, the exact synchronized lead is used and these chip-feed multipliers do **not** alter tap pitch. Both settings are saved and included in database exports; copied machines inherit them. Previously customized multipliers are kept unless they equal the application's old factory manual defaults.

Relevant official process guidance: [Haas G83 drilling with pecks](https://www.haascnc.com/service/codes-settings.type%3Dgcode.machine%3Dmill.value%3DG83.html); [Haas high-speed-peck drilling considerations](https://www.haascnc.com/content/dam/haascnc/ecommerce-assets/linedrawings/holemaking/modular_drill_heads/Tech_Doc_Drilling_With_High-Speed_Peck_sr_02-0060_to_02-0077.pdf); [Sandvik Coromant parting/grooving setup](https://www.sandvik.coromant.com/en-gb/knowledge/parting-and-grooving/tool-set-up-parting-and-grooving). These references do not validate this app's provisional peck heuristics.

## File structure

```text
index.html                   Home page and application markup
assets/
  css/
    styles.css               Layout, components and responsive rules
    theme.css                Dark/light themes, accent styling, color dialog
    features.css             Chart sidebar, favorite strip, calculator and override styles
  js/
    manufacturer-data.js     Published Haas tool-series cutting references
    defaults.js              Factory machines, cutters, materials, coatings
    reference-data.js        Drill dimensions and thread pitch tables
    theme.js                 Saved appearance preferences and color dialog
    app.js                   Calculators, navigation and database interface
    three-wire.js            External-thread measurement over three wires
    haas-codes.js            Mill, UMC and lathe G/M-code references
    hardware-data.js         Socket-head fastener reference chart
    charts.js                17 chart views, global search, chart favorites
    fastener-engineering.js  60° bolted-joint preliminary torque and thread stripping screening
    material-properties.js   23 grade-condition reference estimates and Database property overrides
    calculators.js           Nine unit-aware engineering calculator views
    spindle-curves.js        Digitized Haas family curves, editable custom curves, SVG plots
    machining-advanced.js    Tool deflection, boring-bar and finish estimates
    hardness.js              3-way Rockwell/Brinell/Vickers converter with range checks
assets/
  icons/                     Windows/Android/iOS installed-app icons
manifest.webmanifest         Progressive Web App identity and icon set
sw.js                        Offline cache and automatic update handling
favicon.ico                  Browser-tab and shortcut favicon
README.md                    Setup and development notes
CHANGELOG.md                 Release history
.nojekyll                    Keep GitHub Pages from using Jekyll processing
```

**Edit the appropriate file** when making changes; don't combine everything back into one HTML file. Asset paths are relative to `index.html`, so the app can be hosted in a GitHub Pages project subdirectory.

## Publish using GitHub Pages

1. Create a repository (for example `machining-desk`).
2. Extract the project ZIP and upload its **contents**, including the `assets` directory, to the repository root. Do not upload the ZIP by itself.
3. Commit the files to your default branch, normally `main`.
4. In **Settings → Pages**, select **Deploy from a branch**, choose `main` and `/(root)`, and save.
5. Open the GitHub Pages URL shown in Settings. For a standard project repository it typically looks like `https://YOUR_USERNAME.github.io/machining-desk/`.

This structure also works with static hosting services other than GitHub Pages.

## Run locally

Open `index.html` in a modern browser with the full `assets` folder beside it. If your browser restricts data storage on `file://` URLs, serve the folder locally instead:

```sh
cd machining-desk
python -m http.server 8000
```

Then open `http://localhost:8000/`.

No installation or network connection is required for calculations after the files have loaded.

## Data and user preferences

- Machine, cutter, material and coating changes are stored in browser `localStorage` using the existing `machiningDeskTechnology` key.
- Saved setups are stored under `machiningDeskSetups`, units under `machiningDeskUnits`, and color preferences under `machiningDeskAppearance`.
- There is **no synchronization** between browsers, devices, or users. Export your database to JSON from the Database page before clearing site data or changing computers.
- The database export includes saved cutting setups. Importing a JSON backup replaces the current database, so save a current backup first.
- **Moving from the old local HTML file to GitHub Pages changes the browser origin. Your old local data will not appear automatically on the published site.** Export JSON in the previous app and import it on the new site if you've customized the database or saved setups.
- Updates to the default records in `defaults.js` generally do **not** replace an existing user's customized local records. Existing records are retained on purpose. Users can restore defaults in the Database page after exporting a backup.
- Color choices are stored separately from the machining database and are not included in the database JSON export.


## v1.8.0: saved inputs, tapping and thread milling

- Machining cards remember their values on navigation and browser reload. Milling, turning, and drilling share the latest workpiece material. Individual cutter selections, overrides, machine choices and input parameters remain independent per operation. Changing a cutter or material can recalculate dependent recommended values. Circular-arrow buttons reset the current parameter group to appropriate defaults; they are not a full database reset.
- The renamed **Threading** page preserves selected system, thread nominal size, TPI/pitch, tapping type, percentage and three-wire parameters. System and series use vertically arranged, mutually exclusive checkbox-style options. In addition to Unified and ISO metric, it offers British Standard Whitworth (BSW), British Standard Fine (BSF), British Standard Pipe Parallel/Taper (BSPP/BSPT), National Pipe Taper/National Pipe Taper Fuel (NPT/NPTF), and general-purpose ACME. **Non-Unified/non-metric thread geometries are indicative, not class/limit tooling or inspection values; tapered threads require gauge-plane and taper rules.**
- Drilling includes a **rigid tapping** cutter choice, sharing thread diameter and pitch with the Threading page. Feed per revolution is the thread pitch, and the displayed tapping torque/power are empirical estimates only. A tap's actual safe torque cannot be inferred from nominal diameter alone; obtain toolmaker failure/torque data before specifying limits. Milling adds **single-point** and **multi-point thread mills**, with cutter-centerline feed correction for a helical interpolated path. Confirm tool diameter, correct pitch/form, depth/engagement and CAM/control interpolation requirements.
- The engineering calculators remember their individual input values. **Hardness Conversion** is now the ninth calculator rather than a Charts page: three scale selectors and input boxes accept changes in any row. It interpolates between rough steel reference points for **Rockwell B (HRB), Rockwell C (HRC), Rockwell A (HRA), Brinell (HBW), and Vickers (HV)**. Unsupported/out-of-range inputs and outputs are flagged or blank. These are **not certified ASTM E140 conversions and must not be used for material acceptance**.

## v1.8.0: spindle graphs and factory locks

- **Factory Haas machine curves are locked**. The included VF 8,100-RPM, VF Super-Speed / UMC 12,000-RPM, and ST-20Y main-spindle 4,000-RPM sample tables are **approximately digitized from identifiable Haas published 200%-spindle-load family charts**, not measured values. The profile must match your exact spindle option, year, drive type and controller software. Factory machine entries with nonmatching RPM cannot be assumed to use the same plotted graph. Copy a machine to edit its sampled graph. Generic CNC machines and manual machines allow user-defined RPM/HP points.
- The **ST-20Y finishing A2-5 subspindle** is set to **8 hp (user-provided, not independently verified)** and **6,000 RPM**; the **BMT65 / 12-station 4,000-RPM live-tool drive** uses the **published nominal 12 hp**. Their power and torque curves are **illustrative models based on the ratings**, *not* official Haas digitized curves. Reference: <https://www.haascnc.com/productivity/turret/lt-bmt65-12.html> and <https://www.haascnc.com/productivity/spindles/sub-spindle-a2-5.html>. Verify subspindle power on the actual machine plaque or manufacturer documentation.
- Main VF/UMC published family reference: <https://www.haascnc.com/content/dam/haascnc/productivity/spindles/torque-chart-jpg/torque-chart-machine-pdp-binder-/EC-400-40T%20Series%20Binder.pdf>. ST spindle reference: <https://sales.haascnc.com/sites/default/files/ES0088%20REV%20BP.pdf> (ST Series 4,000-RPM 20-HP chart, approximately digitized). The graphs show separately scaled left **power** and right **torque** axes; the cutting demand point comes from the current calculator and is an estimate.

## Installable Windows and phone app (v1.8.0)

Machining Desk is now a Progressive Web App (PWA). The approved **MD carbide endmill slotting steel** icon is configured for Chrome (Windows and Android), Safari Add to Home Screen (iPhone), and favicon tabs. On the HTTPS GitHub Pages deployment, open the Chrome menu and choose **Install page as app**; on supported Android browsers choose **Install** or **Add to Home screen**; on iPhone use Safari → Share → Add to Home Screen. On devices already using an older generic M icon, uninstall/remove the previous shortcut and reinstall after deployment if it does not update automatically.

The service worker caches the app's own JavaScript, CSS, icons and main HTML for offline use after a successful initial online load. It checks the network first and falls back to cached files when offline. Cache installation may fail if required assets are missing from the deployed repository. **User database data are still device/browser-local (not synced)**; installing a separate app context or clearing site storage can affect access. Export a database backup before replacing files or removing installations.

## Cutting force and motor power estimates (v1.6.0)

- The **Details** section shows a rough combined effective tangential force derived from net cutting horsepower and peripheral surface speed: `F_t [lbf] ≈ 33,000 × P_cut [hp] / V_cut [ft/min]`. It is an equivalent cutting force, **not** a verified 3-axis force vector, not peak tooth force, and **not drilling thrust**. Single-point threading is excluded because the existing model does not determine pass-by-pass removal rate.
- The cutting horsepower still uses editable approximate material **unit power**: `P_cut ≈ MRR [in³/min] × unitHp [hp/(in³/min)]`. At small chip thicknesses, material-dependent specific cutting force rises, and tool edge geometry/condition matter; simple unit power often underpredicts. Compare measured cuts and update the specific cutting power for your exact application in Database → Materials.
- **Motor-equivalent power** `≈ P_cut / spindle drive efficiency + idle/auxiliary power`. Defaults of **85% efficiency** and **0 hp idle** are **editable example assumptions** per machine, not manufacturer measurements. This is an input/motor model; a CNC's spindle load percentage is not identical to total machine power from the mains. Auxiliary pumps and servo drives may not be included in the spindle load display.
- **Power/torque curves:** Database → Machines contains 0–24 ordered `RPM,HP` points for the main spindle, and additionally for the secondary/live spindles where configured. A blank curve uses an **illustrative** linear power increase to 30% of rated RPM followed by constant horsepower. This is NOT an actual Haas spindle torque curve. Use actual machine/spindle option/production-year documentation or machine tests when available. The Details tab marks the estimated cutting demand at its operating RPM and compares it to the entered curve.
- **Haas peak/continuous power:** Haas describes short-term peak numbers as approximately 200% of 100%-load continuous power on several published spindle configurations. If the machine's horsepower basis is marked short-term peak, the graph includes a **dashed illustrative 50%-of-peak continuous curve**; machine rating and duration must be checked for your exact option and vintage. See <https://www.haascnc.com/productivity/spindles/15k-40t-in.html> and Haas's older machine-specific torque/power charts at <https://sales.haascnc.com/sites/default/files/ES0088M_1.pdf>.
- Cutting-force and machining-power formula references: <https://www.sandvik.coromant.com/en-gb/knowledge/machining-formulas-definitions/milling-formulas-definitions> and <https://www.sandvik.coromant.com/es-es/knowledge/materials/specific-cutting-force>.

## Engineering calculator unit changes (v1.6.0)

The IN/MM top toggle converts editable physical quantities and results across all ten standalone engineering calculators. Inputs are converted rather than resetting when switching units. Thread tapping major diameter and pitch are displayed as inches in IN mode, and mm in MM mode. Module, diametral pitch, and dimensionless inputs are kept consistent with their selected unit systems. Conversion is presentation-only; underlying equations work in consistent base units. Some internationally defined standard size labels or material selection references (e.g., MPa or DP) remain in their native published system.

## Reference chart material coverage (v1.6.0)

The Material Properties chart now lists **every material currently present in the database**, including copied and imported materials. For 22 shipped factory records, it uses illustrative approximate grade-specific typical physical properties. Added custom materials fall back to family-level examples when no explicit user properties exist. To improve them, edit **density (g/cm³), elastic modulus (GPa), and thermal expansion (µm/m·K)** for each material in Database → Materials. These optional properties are stored and transferred in database JSON; they are **not** verified grade certificates. The O-ring, keyway, bearing, retaining-ring, fit and hardness charts remain samples/engineering references, not replacements for the governing standards.

## Development and future updates

For routine changes, replace only the relevant source files; don't needlessly recreate the project or rename assets. Keep persistent storage keys and import/export formats compatible with earlier releases. Verify calculations, mobile layout, database import/export, and unit conversions before publishing.

Release identifiers use semantic versioning `MAJOR.MINOR.PATCH`. The current release is **v1.11.0**. Release filenames can contain versions, but repository source filenames should remain stable (`index.html`, `app.js`, etc.).


### 1.4.0 — streamlined cutter entry and thread inspection

- **Cutter parameters:** Double-click any editable cutter number, even an unfocused field, to select the complete value. Calculator numeric fields are text inputs with a decimal keyboard hint so text selection works consistently; equations still validate numbers. Flute length and ADOC percentage have been removed from the calculator and cutter editor. ADOC is entered as an absolute length; RDOC retains both absolute and percentage inputs.
- **Cutting readout:** The sticky RPM, feed and power display is tailored by operation: milling shows feed per tooth, turning/drilling show feed per revolution, and drilling-only feed time is hidden for milling/turning. Estimated power/removal are suppressed on single-point threading where a multi-pass MRR estimate would be misleading.
- **RPM and feed overrides:** Two independent sliders from **0–200%**, initially 100%, apply to the base recommended RPM and feed. 200% may exceed machine capability; with “Respect machine RPM limit” on, the spindle is capped at the entered maximum. Otherwise the app warns. These sliders do **not** necessarily preserve chip load; the displayed IPT/IPR is recomputed from adjusted feed divided by adjusted RPM, and higher/lower chip-load warnings appear. Zero spindle RPM with nonzero feed gives a warning and no cutting-power estimate. Overrides are included in saved machining setups and remain separate for each calculation mode.
- **Threads:** The previous Threads and Three-Wire tabs are replaced by **Internal · Tapping** and **External · Single Point**. External threads have an optional checkbox to expand the complete three-wire inspection form directly below the thread dimensions. It takes nominal diameter, pitch and thread system from the thread selected above, avoiding duplicate entries. Both the 60° example and metric calculations are supported. Other wire-form angles still require checking against the selected thread family.
- **Charts:** Formerly “Drill Chart”. Tab-like **Drill Sizes** and **Cap Head Screws** buttons separate the tables and make space for future chart categories.
- **Persistence:** No change to the database or appearance storage keys. Legacy flute settings remain harmless if present in old saved records; the cutter editor no longer uses them. Import/export remains JSON-compatible.

### 1.3.0 — streamlined database and shop reference

**Tool library**
- One **twist drill** and one **chucking reamer** per geometry type. Choose **HSS** or **Carbide** in the machining calculator. Legacy substrate-specific drill/reamer IDs and saved setups are mapped to their consolidated equivalents. Existing custom tool records remain intact.
- Carbide milling defaults for **6061-T6, 7075-T6 and 2024-T3 aluminum** use the user's requested 800–1500 SFM shop band for standard flat end mills. Other milling geometries and turning tools receive a reduced band using their existing tool factors; aluminum drilling remains at its separate, lower drilling speeds. Do not apply the flat-end-mill speed band to HSS, drills, saws or specialty form cutters without verifying the selected cutter. These shop settings **supersede higher Haas HSAM2 starting speeds** for the generic calculator; they are not manufacturer speeds.

**Technology Database**
- Materials are separated into expandable material families. Existing groups include Aluminum, Carbon steel, Alloy steel, Stainless steel, Tool steel, Cast iron, Titanium, Copper alloy, Plastic and Other. Users can create additional groups.
- The Materials **Copy** action opens a modal for new name, existing/new family, and a one-time positive scalar. All source carbide and HSS SFM minimum/maximum numbers are scaled and rounded to a whole SFM; the scalar is not saved on the material. Check copied entries before using them on a machine. Other cutting data like horsepower coefficient and notes is duplicated unchanged.
- Each coating editor displays material-family suitability checkboxes. Factory starting recommendations follow published Harvey Tool guidance: AlTiN/TiAlN for many ferrous/exotic materials, ZrN/DLC for nonferrous materials and TiB₂ for nonabrasive aluminum. Individual coating recipes, cutting conditions and tool geometry can change suitability; these checkboxes are **guidance, not coating-qualified speeds**. Reference: [Harvey Tool coatings](https://www.harveytool.com/resources/tool-coatings).

**Shop reference**
- Threads and Three-Wire now appear as tabs on the same **Threads** page; no separate Three-Wire home tile.
- The **Drill Chart** page includes socket head cap screw dimensions, recommended close/free clearance holes and counterbores for selected ASME B18.3 inch #2–1 in and ISO 4762 metric M3–M24 standard heads. The *flush* counterbore depth is theoretical and may require tolerance allowance; see [NORAMARK reference](https://www.noramark.com/resources/charts/counterbore-dimensions/).
- The **Haas Codes** page has a machine selector and separately searchable side-by-side G-code and M-code tables. Choosing a code opens its function, an abbreviated (where available) operand summary, and a link to the official Haas code-specific reference. Default mill and lathe codes are separated; optional UMC/5-axis mill G codes are included for UMC machines. Generic and manual machines show no Haas code reference. The source index pages are [Haas mill G-codes](https://www.haascnc.com/service/codes-settings.html?type=gcode&machine=mill) and [Haas lathe G-codes](https://www.haascnc.com/service/codes-settings.html?type=gcode&machine=lathe). **This is a Haas family-level reference, not an exhaustive or machine-option-verified ST-20Y, VF or UMC code list.** Parameter summaries are abbreviated and not present for every code. Check the Haas documentation and your actual machine/control generation before programming.

**Upgrade and persistence**
- Upload only the changed file paths in `machining-desk-update-v1.3.0.zip` to update from v1.2.0. Add new `assets/js/haas-codes.js` and `assets/js/hardware-data.js` at their respective paths.
- The app attempts to migrate the existing locally stored technology library and saved setups **without erasing material custom ranges**. The first-use aluminum factory speed update intentionally changes previous unmodified factory defaults. Before uploading, use the Database export feature to make a backup. Separate browser origins still have separate data, including local file vs GitHub Pages.

## Technical limitations and safety

For selected generic carbide end-mill and solid carbide drill records, the application now supplies **manufacturer-derived starting recommendations** from specific Haas tool series. The material-group mappings are approximations, not validated for arbitrary tools. For other combinations, the initial material cutting speeds, tool multipliers, geometry assumptions and specific-power constants remain **illustrative estimates**, not manufacturer-qualified process parameters. Some machine specifications are examples and may not match installed options. Specific spindle power ratings can be unknown and are marked as zero rather than guessed. Confirm tooling recommendations, tool engagement, workholding, spindle limits, coolant, machine rigidity, thread tolerance class and machine documentation before cutting a part. The app does not guarantee process safety.

### 1.1.0 — machining references and cautions
The application uses the conventional milling relationships RPM = 12 × SFM / (π × cutting diameter in inches), feed = RPM × programmed feed per tooth × number of cutting edges (for milling), and removal rate = width × axial depth × actual feed. See [Sandvik Coromant milling formulas](https://www.sandvik.coromant.com/en-gb/knowledge/machining-formulas-definitions/milling-formulas-definitions).

FSWizard's [calculator overview](https://zero-divide.net/fswizard) was reviewed for coverage of tool geometry, workpiece materials, milling/drilling/turning, radial chip thinning, HSM and horsepower. Its proprietary material tables and algorithms were not copied. Harvey Tool's [dovetail cutter information](https://www.harveytool.com/products/dovetail-cutters) establishes that included angle, diameter, length of cut, neck diameter, tooth count and coating affect the selection, and tooling-specific recommendations should be consulted. Haas [slotting and side-cutting recommendations](https://www.haascnc.com/content/dam/haascnc/ecommerce-assets/linedrawings/milling/end_mills/speeds-and-feeds/%2803-511%20to%2003-0520%29%20End%20Mills%2C%20HTPM%2C%20Speeds%20and%20Feeds%2C%20Slotting%20and%20Side%20Cutting%2C%20Metric.pdf) distinguish full-width slotting from side cutting and advise large reductions with long tool engagement.

The 0.65× full-width slotting and 0.55× default dovetail feed modifiers are **our conservative heuristic defaults**, not sourced universal manufacturer recommendations. Chip loads, cutting speeds, specific power, coating multipliers and spindle ratings require verification for the actual tooling, material, setup and machine. Editor geometry fields for nose radius, overhang, angle and neck diameter are recorded but **are not yet included in the advanced physical force/deflection model**. There is no claim of parity with FSWizard.

### 1.2.0 — tool-series cutting data, chip loads and three-wire measurement

**Published cutting data and scope**

- `assets/js/manufacturer-data.js` contains transcribed **Haas Tooling-specific** speed and feed targets from its [HSAM2 aluminum end mill chart](https://www.haascnc.com/content/dam/haascnc/ecommerce-assets/linedrawings/milling/end_mills/speeds-and-feeds/End%20Mills%2003-3052%20to%203062%2C%20HSAM2%2C%20Speeds%20and%20Feeds.pdf), [HTPM performance end mill chart](https://www.haascnc.com/content/dam/haascnc/ecommerce-assets/linedrawings/milling/end_mills/speeds-and-feeds/End%20Mills%2C%2003-3076%20to%2003-3095%2C%20HTPM%2C%20Speeds%20and%20Feeds%2C%20Inch.pdf), and [general-purpose carbide drill chart](https://www.haascnc.com/content/dam/haascnc/ecommerce-assets/linedrawings/holemaking/carbide_drills/speed-n-feeds/Carbide%20Drills%2C%20General%20Purpose%2C%20Speeds%20and%20Feeds%2C%20Inch.pdf). Consult the linked PDF for the exact cutter series, workpiece group, diameter and machining conditions.
- **Applicability:** by default these values are applied only to the factory *flat carbide end mill* (`flat`) for specified metal materials and the factory *twist drill* (`drill_twist`) with carbide substrate selected for selected workpiece groups. Other cutters/substrates retain estimates. Workpiece material grades are mapped approximately to the manufacturer's groups; this is not a complete manufacturer database or a substitute for an exact tool part number.
- A published tool-series target is represented in the database as a **computed 85–100% starting band**. Haas did not publish this calculated interval; the 85% bound is an app-defined conservative margin. Coating multipliers are suppressed for these series-specific entries. Other library ranges and associated horsepower models still need independent verification.
- Feed per tooth (*IPT*) in milling, or feed per revolution (*IPR*) for drills, now interpolates between tool-diameter table points where published. Outside the charted diameter range, the closest end value is used with a warning rather than extrapolated. The app maintains the conservative **0.65× slotting feed factor**, which is an app heuristic independent of Haas's separate slotting cutting speed guidance.
- When updating an existing browser database, **only carbide speed ranges identical to the previous factory defaults** are migrated. User-edited ranges are preserved. Back up the database from the Database page first; import/export continues to use the existing JSON workflow.

**Three-wire external thread measuring calculator**

The *Three-Wire* tab inside the *Threads* page opens an external thread pitch-diameter calculator. Select Unified or metric preset, enter custom thread and included angle as needed, choose calibrated wire diameter (or calculate the ideal best wire), and enter micrometer measurement over wires. The calculator returns actual pitch diameter, theoretical basic pitch diameter where known, target over-wire dimension, and measured-minus-target deviation. It can also handle 55° Whitworth, 29° general-purpose Acme, and 30° ISO trapezoidal profiles with simplified geometry.

Geometric formulas (in consistent length units; `P` is **axial pitch**, `W` wire diameter, `E` pitch diameter, `M` measurement over wires, `θ` included flank angle):

- `M = E + W*(1 + csc(θ/2)) − (P/2)*cot(θ/2)`
- For 60° threads: `E = M − 3W + 0.8660254*P`
- Best-size wire: `W_best = P / (2*cos(θ/2))`. For 60° threads the theoretical contact limits are 0.505182P to 1.010363P.

Pratt & Whitney Measurement Systems documents the [three-wire method, included angles, and corrections](https://www.prattandwhitney.com/Thread_Gage_Measurement_Calibration/) and the [60° best/min/max wire sizes](https://www.prattandwhitney.com/Calibrating_Thread_Measuring_Wires_60_degree_threads_/). **This is a simplified shop estimator**: it does not account for helical lead-angle correction, wire deformation, contact geometry, measurement force or thread fit-class tolerances. It does not automatically determine thread accept/reject. Use the actual calibrated wire size and drawing-specified pitch-diameter limits for inspection.

**Updating an existing GitHub repo from v1.1.0:** overwrite the seven file paths present in `machining-desk-update-v1.2.0.zip`, keeping their directories. The two new JS files must be added, not omitted. No build step is required.


## Added in v1.5.0

- **Copy** in Machines, Tools, and Coatings opens a popup. Name and numerical settings can be changed before creating the copy; machine category and tool operation are inherited. Relevant tool flags and coating suitability groups can be changed. Copy does not affect the original.
- Machine records have a **G/M code library** field: None, VF, UMC or ST. Only machines assigned a library appear on the Haas Codes page. This assignment is informational; code availability must be verified on the actual control/software/options.
- The RPM and feed percentage overrides retain 0–200% sliders and provide ±5% and reset buttons. The sliders apply independently.
- External threading places the three-wire checkbox directly below the thread-pitch input, with the existing wire-measurement panel below the thread geometry calculations.
- The **Charts** page includes 17 topics, searchable titles/keywords, a collapsible sidebar and a strip of favorite charts. **Database → Favorite charts** controls the list. Favorites are saved in the existing technology-database JSON export/import. Some reference tabs deliberately contain short sample tables or guidance rather than complete copyrighted standards.
- **Calculators** includes tool deflection, boring-bar deflection, spindle cutting torque, theoretical turning surface finish, thermal expansion, tapping torque, spur-gear geometry, and knurl tracking geometry. All calculations are local and do not require internet.

### Engineering-calculation limitations

- **Tool and boring-bar deflection:** Euler–Bernoulli end-loaded solid/hollow circular cantilever; holder flexibility, flutes, complex cutting force, tool breakage, vibration and tool-specific stiffness are not modeled. Calculated deflection is not a safe-cut guarantee.
- **Cutting torque:** from net horsepower and spindle RPM; it is not motor output, shaft capacity or a torque curve.
- **Surface finish:** ideal feed-mark geometry (not measured or guaranteed Ra/Rz).
- **Thermal expansion:** uses typical constant linear expansion coefficients, not grade-specific thermophysical data.
- **Tap torque and capacity:** cutting torque is an *uncalibrated heuristic* based on tap major diameter, thread pitch, work material, tap style and engagement. Capacity screen uses an *assumed* shaft-core ratio and allowable shear stress. It **does not determine a safe maximum torque**, fracture limit, or suitable torque-limiter setting for any actual HSS/carbide tap. Obtain the exact tap manufacturer's failure/torque data and verify with the toolmaker. The app explicitly flags these limitations.
- **Gears:** standard, full-depth, external spur gears with no shift, backlash, helix, or undercut compensation.
- **Knurls:** wheel pitch and circumferential integer tooth-count tracking. Plastic flow, helix angle, penetration, force, and wheel timing are not predicted.
- **Reference charts:** curated excerpts/examples, not complete tolerance standards; verify controlling drawings, standards, revision levels and manufacturer part numbers before applying tolerances or making parts.

### Technical sources

- [Sandvik Coromant — Milling formulas and definitions](https://www.sandvik.coromant.com/en-gb/knowledge/machining-formulas-definitions/milling-formulas-definitions)
- [Parker O-Ring Handbook ORD-5700](https://www.parker.com/content/dam/Parker-com/Literature/O-Ring-Division-Literature/ORD-5700.pdf)
- [SKF Rolling Bearings — Interface and fit selection](https://www.skf.com/binaries/pub12/Images/0901d196802809de-Rolling-bearings---17000_1-EN_tcm_12-121486.pdf)
- [KHK gear terminology / reference](https://khkgears.net/new/gear_knowledge/gear_technical_reference/)
- [ASTM E140 — Hardness conversion tables](https://www.astm.org/e0140-12b2024.html)

The references help explain the geometry or terminology but **do not validate** the uncalibrated tapping-torque/capacity model or all abbreviated chart values.

### New in v1.8.0

The machining Advanced drawer includes approximate tool and boring bar deflection, L/D-based vibration risk guidance, turning theoretical Ra/peak-to-valley roughness, and ball-nose scallop heights. Set unsupported stickout, boring-bar shank diameter/material, and nose radius in Cutter Parameters. Force is an estimate from net cutting horsepower and tangential speed; dynamic stability and exact finished dimensions cannot be verified from the calculator alone.

Fractional numeric inputs such as `3/8` and `1 3/16` are accepted in the app and convert to decimal to 0.0001 units. Drill diameters accept numbered `#29` and letter `F` drill sizes, preserving the designation with an adjacent decimal conversion. Three-wire actual wire diameter accepts `#36` (AWG 36). The Chart insert identification section decodes common ISO and ANSI turning insert symbols; manufacturer grade and chipbreaker suffixes require the toolmaker catalog.

The ST-20Y Database mill-turn editor now shows the A2-5 secondary spindle and BMT65 live tooling specifications simultaneously instead of hiding them behind a main/sub/live dropdown.

## V1.9.1 material-library addition

- Added **AlSi10Mg aluminum · LPBF as-built** to the Aluminum group with per-tool carbide and high-speed-steel starting SFM bands, a conservative estimated unit-power coefficient, and the relevant material properties (hardness, density, elastic modulus, thermal expansion, yield strength, tensile strength, thermal conductivity).
- Existing locally saved databases are migrated non-destructively to include AlSi10Mg, except when the user already created a material named AlSi10Mg. All existing records and custom values remain unchanged.
- Laser powder bed fusion (LPBF) AlSi10Mg differs from cast and heat-treated conditions; update the properties and cutting values in the Database if your material condition is different.

## V1.9.0 machining/fastener additions

- For turning, stickout/boring-bar deflection appears **only for the Boring bar cutter type**. The boring bar has a selectable shank material (steel, solid carbide or damped) and independent cutting-insert material. Shank modulus affects the static stiffness estimate; the insert-type multiplier is a **non-validated force sensitivity scenario**, not a true insert force model.
- In Milling, enabling Slotting temporarily replaces RDOC with 100% of the tool diameter; disabling it restores the last absolute RDOC. Diameter changes preserve the entered absolute RDOC (and update the percentage). The non-slot RDOC is retained in saved machining drafts.
- The Advanced results panel now has its own vertical scroll container and capped height, avoiding forced scrolling through the entire cutting-parameter page.
- Material Properties lists all Technology Database materials with approximate hardness designation, yield/tensile strength, density, Young's modulus, thermal expansion and conductivity; these are **not guaranteed design values**. Optional custom values can be entered and exported via Database → Materials. An uncharacterized material receives labeled family estimates where available.
- The Threaded fasteners chart is automatically added to Favorites once per browser. It supports Unified and ISO metric 60° standard and custom diameters/pitches, grade classes, an independent bolt material choice, an independent tapped material choice, full thread engagement, nut factor, requested preload and stripping safety factor.
- **Critical:** The torque result is a rough **preliminary upper-bound screening estimate**, **NOT a maximum safe or certified assembly torque**. The thread-stripping area assumption is a simplified 50% effective engaged shear area and shear yield approximation. It does not calculate real ISO/ASME geometry/tolerances, lubrication uncertainty, galling, seating, fatigue, temperature, plastic creep, inserts, tensile/shear load interaction, torque scatter, or dynamic joint behavior. Set verified strengths and use application-specific fastener/insert manufacturer guidance.
- Bolt strength and proof values are summary references for SAE J429 and ISO 898-1 and have applicable diameter limitations; check original standard. References: NASA Fastener Design Manual https://ntrs.nasa.gov/api/citations/19900009424/downloads/19900009424.pdf and NASA Torque Guidelines https://www.nasa.gov/wp-content/uploads/2025/06/mechanicalfastenertorqueguidelines.pdf, Bossard summary https://www.bossard.com/global-en/-/media/bossard-group/website/documents/technical-resources/en/f-009-en.pdf.

## V1.10.0 — Haas macro variables and user program notebook

**Haas Codes → choose machine → Macros** opens a machine-family-specific reference based on Haas's published **Next Generation Control (NGC)** macro tables. Use **Variable reference** to search by number (such as `#5222`, `#4132`, `#3000`, `#62510`), name or function; filter by local variables, persistent user globals, system variables, tool/work offsets, inputs/outputs, probing options, or reserved ranges. Click a table entry to show its legacy equivalent and a usage note. Traditional three-digit legacy globals such as `#100` resolve to their NGC equivalents (`#10100`). The VF and UMC share the Haas mill reference; ST uses the Haas lathe reference.

The optional **My macro programs** subtab maintains a simple inventory of the O-programs you have actually created or installed on each machine (number, purpose, arguments, operating notes). This is a *reference notebook*, **not a macro editor, simulator, machine reader, or uploader**. Changes are stored in each machine's `macroPrograms` array inside the normal Technology Database JSON, so Database export/import backs up those notes. The original G/M tables remain in their previous tab.

Safety and accuracy boundaries: The macro reference is based on the published *family-level* Haas NGC variable tables, not a readout from any particular ST-20Y, VF-4SS or UMC-750SS. The complete set of truly usable variables depends on control release and options, and system/offset variables may be writable but are **not available for user storage**. Many nominally general-purpose variables are claimed by probing, bar feeders, pallet changers or other macros. Never overwrite a variable until its ownership is checked on the machine. Program aliases O9000–O9019 can be reserved for custom G/M mappings. The quick syntax guide omits many control subtleties; actual CNC tests and the original manual are authoritative.

Official manufacturer references:
- Haas mill macro variables and syntax: https://www.haascnc.com/service/online-operator-s-manuals/mill-operator-s-manual/mill---macros.html
- Haas lathe macro variables and syntax: https://www.haascnc.com/service/online-operator-s-manuals/lathe-operator-s-manual/lathe---macros.html
