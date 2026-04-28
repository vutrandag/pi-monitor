# pi-monitor

A lightweight real-time system resource dashboard for Raspberry Pi 5, built with Node.js and Express. Displays CPU, memory, disk, temperature, network, and service status — auto-refreshing every 3 seconds.

![Dashboard](https://img.shields.io/badge/status-live-brightgreen) ![Node](https://img.shields.io/badge/node-v20.19.2_LTS-green) ![PostgreSQL](https://img.shields.io/badge/postgresql-17-blue) ![pgvector](https://img.shields.io/badge/pgvector-0.8.2-blueviolet)

## Features

- **CPU** — usage percentage, core count, model
- **Temperature** — live °C with color-coded health status
- **Load Average** — 1m / 5m / 15m bar chart
- **Memory** — used/total GB with gauge
- **Disk** — used/free GB on `/` partition
- **Network** — Tailscale IP, Ethernet IP, RX/TX bytes
- **Services** — PostgreSQL, Node processes, Tailscale status
- **Stack Summary** — fixed version badges for the full dev stack
- Auto-refreshes every 3 seconds with no page reload

## Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js v20.19.2 LTS |
| Framework | Express 4 |
| Database | PostgreSQL 17 + pgvector 0.8.2 |
| Hardware | Raspberry Pi 5 8GB · 64GB storage |
| Remote access | Tailscale VPN |
| Process manager | systemd |

## Requirements

- Raspberry Pi 5 running Raspberry Pi OS or Debian/Ubuntu (64-bit)
- Node.js v18+ (v20 LTS recommended)
- npm

## Installation

```bash
# Clone the repo
git clone git@github.com:vutrandag/pi-monitor.git
cd pi-monitor

# Install dependencies
npm install

# Run
node server.js
```

Open `http://<your-pi-ip>:3000` in your browser.

## Project Structure

```
pi-monitor/
├── server.js           # Express server + /api/stats endpoint
├── public/
│   └── index.html      # Single-page dashboard UI
├── pi-monitor.service  # systemd service file
├── package.json
└── .gitignore
```

## API

### `GET /api/stats`

Returns a JSON object with current system metrics:

```json
{
  "hostname": "pi-worker01",
  "platform": "aarch64",
  "uptime": "1d 2h 30m",
  "cpuPercent": 4.2,
  "cpuTemp": "52.4",
  "cpuCores": 4,
  "cpuModel": "Cortex-A76",
  "memory": {
    "total": 8589934592,
    "used": 1572864000,
    "free": 7017070592,
    "percent": 18.3
  },
  "disk": {
    "total": 58,
    "used": 10,
    "free": 47,
    "percent": 17.2
  },
  "network": {
    "tailscaleIP": "100.116.70.5",
    "ethIP": "192.168.1.x",
    "rxBytes": 123456789,
    "txBytes": 987654321
  },
  "load": [0.10, 0.08, 0.02],
  "services": {
    "postgresql": "running",
    "nodeProcesses": 6
  },
  "timestamp": "2026-04-28T13:26:30.000Z"
}
```

## Run as a systemd Service (auto-start on boot)

```bash
# Copy the service file
sudo cp pi-monitor.service /etc/systemd/system/

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable pi-monitor
sudo systemctl start pi-monitor

# Check status
sudo systemctl status pi-monitor
```

## Deploy Updates

```bash
cd ~/pi-monitor && git pull && sudo systemctl restart pi-monitor
```

## Useful Commands

```bash
# View live logs
sudo journalctl -u pi-monitor -f

# Stop the service
sudo systemctl stop pi-monitor

# Restart after changes
sudo systemctl restart pi-monitor
```

## Access via Tailscale

Once Tailscale is installed and connected on both your Pi and your dev machine, the dashboard is accessible from anywhere on your Tailscale network:

```
http://100.116.70.5:3000
```

No port forwarding or firewall rules required.

## License

MIT