# Machining Desk

A progressive web application for machining calculations, tooling references, machine data, charts, offline operation, and cloud synchronization.

## V1.12.6 — Insert identification correction

The Insert Identification chart no longer treats manufacturer catalog numbers as invalid solely because they do not match the ISO 1832 / ANSI insert designation format. The existing brand selector can direct users to search the selected manufacturer's published catalog by exact number. The app still decodes standard geometry and the supported proprietary families locally.

### Kennametal examples

- `CNMG120408MN KCP25B` — standardized geometry is decoded from `CNMG120408`; remaining grade/chipbreaker details require confirmation with Kennametal.
- `TPG321` — ANSI three-letter shorthand is supported.
- `A2040N00CL02` — Kennametal A2 proprietary cutoff family is decoded for nominal width, hand, approach, chipbreaker and radius. Verify the actual insert and compatible toolholder with Kennametal's catalog.
- A seven-digit order number such as `5387662` — a separate catalog ordering identifier, *not* a seven-position ISO geometry designation. Use the catalog search link for complete verified specifications.

For an unfamiliar code, select the brand and paste its full part number. The tool labels the result *not verified* rather than *invalid*. Without a catalog record or official API, it cannot automatically derive exact chipbreaker geometry, edge preparation, seating geometry or cutting data.

Existing cloud synchronization and Community features are unchanged. For installation, replace only the files in the V1.12.6 update ZIP, preserving their paths. Your existing `assets/js/cloud-config.js` is not included and must be preserved.
