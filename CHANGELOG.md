# Changelog

## V1.12.6 — Insert Catalog Number Handling

- Corrected false "invalid insert" errors for genuine manufacturer catalog and ordering numbers that are not ISO/ANSI geometry designations. Unknown codes now explicitly say **not verified in offline catalog** rather than incorrectly asserting the insert is invalid.
- Accepts selected manufacturer labels ahead of compatible ISO/ANSI designations and recognizes geometry codes embedded in pasted product descriptions, including three-letter ANSI shorthand.
- Detects six-to-nine-digit order codes and presents exact-part manufacturer-catalog search links, without inventing missing geometry, coating, or grades.
- Added decoding for Kennametal A2 cut-off inserts, including nominal width, cutting direction, approach angle, chipbreaker and nose radius where encoded. Exact product and holder compatibility still require catalog confirmation.
- Improved category handling for Kennametal milling and exchangeable drill-tip families. Updated the clarification in the universal insert search.
- No changes to local databases, cloud authentication, or Supabase tables.

**Limitations:** Automatic exact part-number resolution for every manufacturer requires licensed/official part-number catalog data or authorized APIs. Unknown manufacturer SKU formats remain unverified until a manufacturer source is consulted. A matching ISO prefix does not confirm chipbreaker, coating, substrate grade, or actual SKU validity.

Reference: Kennametal Combined Turning Master Catalog (A2 catalog numbering) and Kennametal ISO/ANSI Turning Inserts catalogs.
