# Changelog

All notable changes to this integration are documented in this file. The format
follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project
uses [semantic versioning](https://semver.org/).

Describe each change under `## [Unreleased]` as you make it. The Release
workflow moves that section under the version it ships, and the section becomes
the notes of the version's GitHub Release.

## [Unreleased]

## [1.0.1] - 2026-10-22

### Security

- Rebuilt on Node.js 24.22.1, the October 2026 security release (remote code
  execution in the Brotli decoder, CVE-2026-111497; TLS hostname and DNS
  fixes).

## [1.0.0] - 2026-10-15

### Added

- A "GDACS alerts" device for your area: number of active alerts, highest GDACS level (green,
  orange, red, as the Gladys risk badge), latest event in words and distance of the nearest
  event.
- The followed area: a radius of 100 to 5,000 km around the house (or around coordinates),
  countries by ISO code, and optionally every red alert of the world; event types and a minimum
  level to choose.
- Scene triggers "GDACS: new event in my area" and "GDACS: alert level raised", filtered by
  event type and level, with the event details as variables. Events already listed at the first
  start, after a restart or a change of settings fire nothing.
- Scene action "GDACS: read the current alerts": the alerts as one sentence, their number and
  the highest level.
- Dashboard widget "GDACS alerts": current alerts, highest level first, then nearest, with their
  GDACS report.
- "Show the current alerts" in the Configuration screen.
- Refresh every 10, 15, 30 or 60 minutes by the integration itself, without relying on Gladys
  polling. Texts in English, French, German and Spanish.

[Unreleased]: https://github.com/guim31/gladys-gdacs/compare/v1.0.1...HEAD
[1.0.1]: https://github.com/guim31/gladys-gdacs/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/guim31/gladys-gdacs/releases/tag/v1.0.0
