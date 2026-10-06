# UI formatting review

The terminal's shared display helpers now keep blank/boolean/container values unknown instead of displaying fabricated zero prices or gains; normalize invalid decimal precision to the helper's documented default; reject impossible or malformed calendar dates without JavaScript's silent rollover; and distinguish future timestamps from fresh past observations while retaining epoch zero as a valid timestamp.

The date comparison uses UTC representations of local calendar dates so elapsed-hour daylight-saving changes cannot alter the day count. Existing valid numeric strings and normal prices/percentages/volumes keep their format. This changes display only: no financial calculations, records, signals, prediction contracts, trades, authentication or provider configuration are changed.

Eleven web tests pass in both America/New_York and America/Guyana timezones (eight formatting tests plus three existing routing tests). Vite build and git diff whitespace checks pass. The build retains a warning for a main chunk over 500 kB. Five new cases failed or threw on the original implementation. Tests use synthetic values and no API, model, broker or network request. Native browser rendering and the separate Go/Python services remain unverified; no service was started and no release was deployed.

Run the web checks from `web/`: `npm ci --ignore-scripts`, `npm test`, `npm run build`. There is no package.json at repository root.
