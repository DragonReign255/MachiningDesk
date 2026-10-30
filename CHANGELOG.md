# Machining Desk — Changelog

## V1.11.5 — Minor update · Multi-brand inserts, galvanic reference, engineering materials

- Insert chart: added selectable manufacturer (Kennametal, ISCAR, Haas Tooling, Sandvik Coromant, Seco, Walter, Mitsubishi, Tungaloy, Kyocera, Sumitomo, Korloy, and other), catalog/search links, drilling inserts and exchangeable drill heads, and supported proprietary insert-family guidance.
- Standard ISO/ANSI turning decoder remains available for every manufacturer. Proprietary numbering systems cannot be reliably decoded from text alone; unknown manufacturer codes explicitly require maker specifications rather than an invented dimension or drawing.
- Supports saving a user-confirmed physical insert profile by maker and code (shape, width, thickness, corner radius); local to current browser. The custom profile is not automatically included in the Technology Database export.
- Seven ISO/ANSI designation positions are now clickable in the turning insert chart and scroll to expanded reference tables for shapes, relief angles, tolerance, clamping configurations, size, thickness, and nose radius.
- New Galvanic Corrosion chart: select two metal grades from the Materials database, active/passive stainless state, wet/dry conditions, and cathode/anode exposed area ratio. Ordinal seawater-series screening, not a claim of universal safety or fixed electrode potentials.
- Added 50+ engineering material grades/conditions spanning aluminum, carbon/alloy/tool/stainless steel, cast irons, titanium, copper/brass/bronze, nickel superalloys, magnesium, and cobalt alloys. Representative property figures and estimated analog-based uncoated SFM ranges are labeled as *engineering estimates*; they are not verified manufacturer speeds for each specific cutter, substrate and coating.
- Added Material family dropdown to Milling, Turning and Drilling. The grade dropdown is filtered by family; material sharing across machining pages remains in place.
- New materials merge into existing local databases without overwriting existing materials or edits. Offline app cache updated to V1.11.5.

**Sources and limits:** ASTM G82, U.S. EPA galvanic series for seawater, Kennametal cutting references, ISCAR drilling catalogs, Haas Tooling indexable-drill/milling catalog, TIMET titanium grade datasheets, Harvey Tool coating application guide. Use verified toolmaker/catalog and material certs for production machining, joint compatibility, or critical material design.
