# Machining Desk

**Release: v1.0.0** · Browser-based machining calculators and a local technology database.

Machining Desk contains milling, turning and drilling calculators; machine, cutter, material and coating records; a drill-size chart; and internal/external thread tools. It is a **static website** using HTML, CSS and vanilla JavaScript. There is no server, account system, package manager, build process or external dependency.

## File structure

```text
index.html                   Home page and application markup
assets/
  css/
    styles.css               Layout, components and responsive rules
    theme.css                Dark/light themes, accent styling, color dialog
  js/
    defaults.js              Factory machines, cutters, materials, coatings
    reference-data.js        Drill dimensions and thread pitch tables
    theme.js                 Saved appearance preferences and color dialog
    app.js                   Calculators, navigation and database interface
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

## Development and future updates

For routine changes, replace only the relevant source files; don't needlessly recreate the project or rename assets. Keep persistent storage keys and import/export formats compatible with earlier releases. Verify calculations, mobile layout, database import/export, and unit conversions before publishing.

Release identifiers use semantic versioning `MAJOR.MINOR.PATCH`. The current release is **v1.0.0**. Release filenames can contain versions, but repository source filenames should remain stable (`index.html`, `app.js`, etc.).

## Technical limitations and safety

The initial material cutting speeds, tool multipliers, tool geometry assumptions and specific-power constants are **illustrative estimates**, not manufacturer-qualified process parameters. Some machine specifications are examples and may not match installed options. Specific spindle power ratings can be unknown and are marked as zero rather than guessed. Confirm tooling recommendations, tool engagement, workholding, spindle limits, coolant, machine rigidity, thread tolerance class and machine documentation before cutting a part. The app does not guarantee process safety.
