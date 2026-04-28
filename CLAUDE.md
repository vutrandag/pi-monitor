# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
npm install

# Run (development — auto-restarts on file change)
npm run dev

# Run (production)
npm start
```

No build step. No test suite.

The server starts on port 3000. On the Raspberry Pi, it is managed as a systemd service (`pi-monitor.service`).

## Architecture

This is a two-file application with no bundler or framework:

- **`server.js`** — Express server with a single route `GET /api/stats`. All metrics are collected synchronously via `execSync` shell commands and Node's built-in `os` module, then returned as one JSON payload. The `public/` directory is served as static files (the compiled/placed frontend).

- **`index.html`** — The entire frontend: HTML structure, CSS (dark theme with CSS custom properties, responsive grid), and JavaScript in one file. It polls `/api/stats` every 3 seconds and updates the DOM in place. No framework, no build step — deploy by placing it in `public/`.

### Data flow

```
Browser → GET /api/stats (every 3s) → server.js collects metrics → JSON response → DOM update
```

### Metric collection approach

`server.js` uses a helper `exec(cmd)` that wraps `execSync` and swallows all errors (returns `''` on failure). Every metric source is independently fallible — the response always succeeds even if individual metrics are unavailable. Shell commands used: `top`, `df`, `cat /sys/class/thermal/...`, `uname`, `systemctl`, `pg_isready`, `pgrep`, `/proc/net/dev`.

### Frontend thresholds (hardcoded in `index.html`)

| Metric | Warning | Critical |
|--------|---------|----------|
| CPU | 60% | 80% |
| Memory | 70% | 85% |
| Disk | 75% | 90% |
| Temperature | 65°C | 80°C |

### Deployment (Raspberry Pi)

```bash
sudo cp pi-monitor.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now pi-monitor
```

Service runs as user `admin` from `/home/admin/pi-monitor` with `NODE_ENV=production` and restarts on failure.
