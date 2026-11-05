# report-miner

Node.js scraper that crawls ski-report web pages, parses them into structured
documents, and writes them to MongoDB. Entry point of the data pipeline.
Designed to run unattended on a scheduled EC2 VM (see root `AGENTS.md`).

## What it does

Two stages, run per **target** (`thetop` or `on-ice`):

1. **crawl** (`script/crawler.js <target>`) — hits the target's "list" page to
   find the latest report id, then walks from the last-seen id (`crawling-status.json`)
   up to it, saving each report's raw HTML into `../reports/<target>/<id>.html`.
   Polite: 1s delay between requests, custom User-Agent, retries on error.
2. **parse** (`script/parser.js <target>`) — for each saved HTML file: extracts
   fields via `dom-parser`, runs `my-cleaner` then `my-standardizer` (using the
   CSV dictionaries), adds `SearchTripName`, `OnsiteId`, `Site`, `CreatedAt`,
   writes to MongoDB (`mongo-db-helper`), then deletes the HTML file.

## Layout

- `assets/target.json` — per-target host, path template (`{s}` = id), encoding
  (`thetop`=utf8, `on-ice`=latin1), and CSS selectors for the list page.
- `assets/<target>-paths.json` — per-target field→selector map used by the parser.
- `assets/dictionary.json` — normalization lookup.
- `dictionaries/*.csv` — human-editable dictionaries (`Grade`, `SnowRate`,
  `MainSnowType`, `Region`, `TripRate`, `UphillSide`, `DownhillSide`). The
  `inject-dictionaries-from-csv.js` / `create-dictionaries-csv.js` libs convert
  between CSV and `dictionary.json`.
- `script/lib/` — `dom-parser`, `my-cleaner`, `my-standardizer`,
  `mongo-db-helper` (active), `dynamo-db-helper` (legacy, commented out in
  parser), `cw-logs-helper` (CloudWatch Logs).
- `reports/<target>/` — scratch dir for crawled HTML (created at runtime,
  gitignored).

## Run

```sh
npm install
# set .env: ACCESS_KEY_ID, SECRET_ACCESS_KEY, REGION, DB_URL, COLLECTION
npm run crawl   # crawler.js thetop; crawler.js on-ice
npm run parse   # parser.js thetop; parser.js on-ice
npm run scrape  # crawl then parse for both targets
```

On the EC2 VM this is triggered from `/etc/rc.local` at boot (see README).

## Caveats

- Scraping is **selector-dependent** — if `thetop.it` / `on-ice.it` change their
  HTML, `target.json` / `<target>-paths.json` need updating.
- `crawling-status.json` is stateful; deleting it re-crawls from scratch.
- Parser deletes the HTML file even on parse failure (logs the error first).
- Old deps (`jsdom@3`, `mongodb@2`, `jquery@3.2`). `jsdom.env` is a very old API.
