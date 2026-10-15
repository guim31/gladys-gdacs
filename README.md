# GDACS for Gladys Assistant

Worldwide disaster alerts in [Gladys Assistant](https://gladysassistant.com): earthquakes,
tropical cyclones, floods, volcanic eruptions, droughts and forest fires near your home, as rated
green, orange or red by [GDACS](https://www.gdacs.org), the Global Disaster Awareness and
Coordination System of the United Nations and the European Commission. No account, no API key.

A complement, not a safety alert system: GDACS alerts are model outputs, and the instructions of
your local authorities always prevail. Not affiliated with GDACS, the European Commission or the
United Nations.

## Features

- **A "GDACS alerts" device**: active alerts in your area, highest alert level (Gladys risk
  badge), latest event in words, distance of the nearest event; with history.
- **The followed area**: a radius around your house (or around coordinates), the countries you
  choose (ISO codes, for droughts and floods spreading over large areas), and optionally every red
  alert of the world.
- **Scene triggers**: a new event in your area, an alert level raised; filtered by event type and
  level, with the event details as scene variables.
- **Scene action**: the current alerts as one sentence, to send by message or have read aloud,
  with their number and the highest level.
- **Dashboard widget**: the current alerts, highest level first, then nearest, each with its GDACS
  report.
- Texts in English, French, German and Spanish.

## Requirements

- Gladys Assistant 5.1 or later.
- Internet access from the Gladys host (`www.gdacs.org`).
- A location for your house in Gladys, or coordinates in the configuration.

## Installation

1. In Gladys, open **Integrations → Install from GitHub** and enter
   `https://github.com/guim31/gladys-gdacs` (or install it from the catalog once it is listed).
   The install screen shows the **location** access it asks for (the centre of the area).
2. In **Configuration**, choose the radius, the countries, the event types and the minimum level,
   then save. **Show the current alerts** lists what your settings catch.
3. Open the **Discover** tab and add the **GDACS alerts** device.

The user guide is in [`docs/en.md`](docs/en.md) ([français](docs/fr.md), [Deutsch](docs/de.md),
[español](docs/es.md)); Gladys links it from the Configuration screen.

## How it works

```
Integration container ──HTTPS──▶ www.gdacs.org   gdacsapi/api/events/geteventlist/SEARCH
      │ SDK (WebSocket + host API)
      ▼
Gladys core ── device, states, scene events, scene action, widget
```

- Every 10, 15, 30 or 60 minutes the container asks GDACS for the events of the chosen types and
  levels: one search for droughts (updated every ten days, 14-day window), one for the other
  hazards (5-day window), 100 events per page, 10 pages at most, keeping the current ones. The
  device is published with `should_poll: false`: the core does not poll external devices reliably
  (GladysAssistant/Gladys#3198).
- Distances are great-circle distances to the point GDACS gives (epicentre, cyclone position,
  centre of a flood, drought or fire). Countries match the affected countries GDACS lists.
- The events seen and their level are kept under `/data`, so a restart fires no trigger; the
  events already there at the first start or after a change of settings are not news either.

## Limitations

- The distance is measured to one point, not to the outline of the event: use the Countries
  setting for droughts and floods.
- GDACS covers the major disasters with a potential international impact, not local hazards.
- Country and event names are those of GDACS, in English.
- Developed and tested against the real GDACS service and the SDK's fake Gladys; not yet on a
  real Gladys instance: feedback welcome.

## Development

```bash
npm ci
npm run format:check && npm run lint && npm test
npx -y github:GladysAssistant/integration-store --skip-image-check .
```

The tests run against the SDK's fake Gladys and a fake GDACS serving real events recorded on
15/10/2026 (`test/fixtures/gdacs/`): never the network.

## Credits

- Data: [GDACS](https://www.gdacs.org), European Commission (JRC, ECHO) and United Nations (OCHA,
  UNOSAT). See its [terms of use](https://www.gdacs.org/About/termofuse.aspx).
- The Home Assistant [GDACS integration](https://www.home-assistant.io/integrations/gdacs/) and the
  [aio_georss_gdacs](https://github.com/exxamalte/python-aio-georss-gdacs) library by Malte Franken
  (Apache 2.0) showed what users expect from such an integration; no code is copied from them
  (they read the RSS feed, this integration the JSON event API).
- Built on the [Gladys integration SDK](https://github.com/GladysAssistant/integration-sdk-js) and
  the official JavaScript template.

## License

[Apache 2.0](LICENSE).
