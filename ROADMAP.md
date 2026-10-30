# Machining Desk — Development Roadmap

Current release: **V1.12.3** (October 30, 2026). The release numbers below are tentative. Minor versions remain the default unless explicitly requested otherwise.

| Priority | Feature | Status | Notes |
|---|---|---|---|
| 1 | Community idea submissions, voting and bug reports | Implemented V1.12.3 | Account required; approvals/statuses enforced by Supabase RLS. |
| 1 | Machine-specific spindle-load observations | Implemented V1.12.3 | Stores peak controller % and captured cutting parameters, synced with private machine DB; opt-in approval submissions. |
| 2 | Chart/calculator “Report an error” controls | Planned | Attach page name, selected technical data and supporting source with consent; don't transmit sensitive machine records by default. |
| 2 | Global search | Planned | Materials, machine codes, charts, calculators, tools and insert specifications. |
| 2 | Consistent cutting models and Advanced integration | Planned | Factor in net cutting power, geometry, deflection, machine capability; support per-run data validation. |
| 2 | Load-model validation & calibration | Investigating | Controller load % is not horsepower. Determine per-controller load baseline, duty-cycle and manufacturer curves before allowing correction factors; never silently modify safety limits. |
| 3 | Manufacturer-specific tool and insert records | Proposed | Store part numbers, grades, geometry, coating and verified source links, not guesses. |
| 3 | Further calculators and standards-backed charts | Proposed | Tool life, cycle time, press fits, hydraulic fittings, etc. Add source attribution and automated tests. |
| Ongoing | Automated regression/security tests | Ongoing | Unit conversion, formula bounds, database migrations, offline sync, role-based authorization, XSS and mobile layouts. |

Owner-reviewed ideas can also be marked **Submitted**, **Under Review**, **Planned**, **In Progress**, **Completed**, or **Declined**. Completion can include a release version. The roadmap is a proposal, not a promise to ship features on a fixed date.
