# Machining Desk — Development Roadmap

Current release: **V1.12.5**, October 30, 2026. Priorities are proposed, not guaranteed release dates.

| Feature | Status | Important boundaries |
|---|---|---|
| Community ideas, votes, reporting and owner review | Implemented V1.12.3–1.12.4 | Separate personal and reviewed data. |
| Material Properties family and grade filtering | Implemented V1.12.4 | Includes custom material records. |
| Offline global search for charts, calculators, codes, tool records and materials | **Implemented V1.12.5** | Searches local installed data; no web fetch. |
| Linked cutting-power/torque/deflection/finish and cycle-time inputs | **Implemented V1.12.5** | Transferred values are estimates; formulas remain application-dependent. |
| Manufacturer-specific cutter records | **Implemented V1.12.5 (basic)** | Stores exact maker/part/grade/insert/source and preferred coating/substrate; does NOT automatically certify speed ranges. |
| Load-model diagnostics from machine records | **Implemented V1.12.5 (diagnostic)** | At least five matched cuts and optional measured spindle kW; never adjusts horsepower curve, feed/speed, warnings or safety limits automatically. |
| Additional engineering calculators | **Implemented V1.12.5** | Tool-life, cycle time, chamfer, sine-bar, drill point, and press-fit screening; tool-life coefficients require actual measurements. |
| Additional charts | **Implemented V1.12.5** | ISO carbide material application groups, drill point geometry, engineering plastics. |
| GitHub Actions calculation and browser regression tests | In progress | Existing offline smoke suite; improve coverage and connect CI once permissions allow. |
| Shop validation of spindle load and measured kW | **Requires physical machine testing** | Collect 5–8+ comparable cuts per spindle, unloaded values, verified tool and material, controller kW where possible. Confirm whether the displayed load is rated continuous motor capacity or another metric. |
| Manufacturer tooling imports | Future | Manufacturer-specific schemas, provenance review, no guessed geometry or proprietary speed bands. |
| Material model refinement from actual measurements | Future | Validate power-meter point, specific cutting-force dependence on chip thickness, tool wear, repeatability and model errors before enabling any correction factors. |
| Advanced hydraulic fitting standards, cutting-fluid and surface-treatment references | Future | Require grade-specific standards/licensing and validated specs. |
| Verified CNC program analysis | Future | Only when machine/control/options and work offsets can be modeled; not a collision-proof certification. |

Source/background: ISCAR's tool-life guide covers Taylor's empirical law. Haas operator manuals describe load percentage as a motor-capacity reading; its meaning and the available power may depend on model and control. Do not treat a controller load % as measured cutter horsepower.
