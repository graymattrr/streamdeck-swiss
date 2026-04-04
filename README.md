# Swiss Deck

Swiss life on your Stream Deck — weather, pollen, and waste collection tiles powered by open Swiss data.

## Features

| Tile | Description |
|------|-------------|
| **Weather — Today** | Current temperature, weather icon, daily high/low |
| **Weather — Tomorrow** | Tomorrow's forecast with icon, high/low, day name |
| **Weather — Forecast** | 2-day weather overview with icons |
| **Pollen** | Real-time pollen intensity, color-coded by allergen |
| **Waste Collection** | Next waste pickup type and countdown |

## Install

1. Download `ch.swissdeck.plugin.streamDeckPlugin` from the [latest release](https://github.com/graymattrr/streamdeck-swiss/releases/latest)
2. Double-click the file to install
3. Open Stream Deck, find **Swiss Deck** in the action list, and drag a tile onto your deck
4. Enter your Swiss postal code (PLZ) in the tile settings

## Setup

Each tile is configured through the Stream Deck Property Inspector:

- **Weather tiles** — Enter your PLZ to find the nearest MeteoSwiss weather station
- **Pollen tile** — Enter your PLZ to find the nearest pollen monitoring station. Optionally select specific allergens to track
- **Waste tile** — Enter your PLZ (supports Zurich, Basel, St. Gallen, and more via OpenERZ)

**Tip:** Long-press any tile to force a data refresh.

## Build from source

```bash
npm install
npm run build
```

To package the plugin:

```bash
npm install -g @elgato/cli
streamdeck pack ch.swissdeck.plugin.sdPlugin
```

## Data Sources

- [Open-Meteo](https://open-meteo.com/) — weather forecasts
- [MeteoSwiss OGD](https://www.meteoswiss.admin.ch/) — weather station data and pollen measurements
- [OpenERZ](https://openerz.metaodi.ch/) — waste collection schedules
- [swisstopo](https://www.swisstopo.admin.ch/) — geocoding

## License

MIT
