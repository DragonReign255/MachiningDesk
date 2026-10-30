# Machining Desk

Machining Desk is an offline-capable, GitHub Pages-hosted progressive web application with a personal technology database, cutting and engineering calculators, reviewed references and optional Supabase sync.

## V1.12.5 — Consolidated update

### Install
Upload **only the paths contained in the V1.12.5 update ZIP** to the repository, preserving the directory structure. Keep the existing `assets/js/cloud-config.js` and Supabase schema. Export a copy of your Technology Database first. Refresh installed PWAs after deployment if the older app is cached.

### Main changes

- Search all main app pages, reference charts, calculator names, materials, machine and tool records, and G/M codes with the top-bar **Search** button or Ctrl+K. Results navigate to their matching section; enter an insert marking to open the insert explorer.
- Define exact manufacturer tool records in **Database → Tools**. New optional fields describe manufacturer, part number, grade, insert code, holder, preferred substrate/coating, evidence type and link to the maker's HTTPS specification. These describe the tool but **do not invent manufacturer feeds and speeds**.
- New calculators: **Tool Life Comparison**, **Straight-Cut Cycle Time**, **Chamfer Geometry**, **Sine Bar**, **Drill Point Length** and **Press Fit Screening**. Some rely on measured or verified empirical constants and identify their assumptions. The standard machining calculators remain unchanged.
- New chart topics: **ISO carbide application groups**, **Drill Point Geometry** and **Engineering Plastics Machining**.
- **Advanced** now includes a single shared-model audit and links transferring existing cutting parameters into applicable standalone calculators.
- Spindle-load records can include observed **loaded and unloaded kW**, where displayed by the control. After five sufficiently comparable observations, the app shows a **diagnostic controller-load calibration estimate** with scatter. This **does not automatically modify** nominal horsepower, spindle torque curves, speeds, feeds or safety warnings. Perform controlled validation per machine before trusting predictions.

### Limitations and verification

**Actual machining tests are necessary before using spindle calibration to influence decisions.** Controller motor-load percent is not direct cutter horsepower. Before drawing conclusions, compare like-for-like machine, spindle, operation, material, RPM, tool geometry, feed, DOC, baseline idle load and optional displayed kW. Record at least five runs; eight or more are more helpful. Verify the controller's load-meter meaning for that exact machine.

Taylor's tool-life model requires a reference tool-life test and calibrated exponent for the same tool and work material. Press fits are nontrivial elastic/plastic contact systems; the calculator is preliminary screening, not a proof of joint capacity. Shared community tool data is owner-reviewed, not manufacturer-certified.

## Data and security

Personal machines, materials, tool entries, load observations, setups and preferences remain local-first and are eligible for the existing private cloud sync. No new Supabase tables or secrets are needed for V1.12.5. Never commit a Supabase `service_role` or `sb_secret` key to GitHub.

For earlier cloud setup see `CLOUD-SETUP.md`. For upcoming work see `ROADMAP.md`.
