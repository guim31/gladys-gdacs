# Test fixtures

- `gladys-feature-table.json`: the category/type couples, units and poll frequencies the Gladys
  core knows, extracted from its code (see `test/gladys-rules.test.js`).
- `gdacs/events-2026-10-15.json`: 12 real GDACS events, as returned by
  `gdacsapi/api/events/geteventlist/SEARCH` on 15/10/2026 around 18:35 UTC, unmodified: earthquakes
  (Costa Rica, Panama, Alaska, and an orange one already over), tropical cyclones (SIMON-26 and
  CHAMPI-26 orange, TRUDY-26 green, and a red one over), a flood (United States), a forest fire
  (Brazil), the Europe-2026 drought (orange, 29 countries) and a volcanic eruption already over
  (Philippines). Public data © GDACS (European Commission, United Nations); no personal data.
  The fake GDACS of `test/helpers/world.js` serves them, filtered and paged like the real API.
