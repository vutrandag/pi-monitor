const express = require('express');
const os = require('os');
const { execSync } = require('child_process');
const path = require('path');

const app = express();
const PORT = 9000;

function exec(cmd) {
  try { return execSync(cmd, { encoding: 'utf8' }).trim(); } catch { return ''; }
}

app.get('/api/stats', (req, res) => {
  // CPU usage (1s sample)
  let cpuPercent = 0;
  try {
    const result = exec("top -bn1 | grep 'Cpu(s)' | awk '{print $2}'");
    cpuPercent = parseFloat(result) || 0;
  } catch { }

  // CPU temp
  let cpuTemp = null;
  try {
    const t = exec('cat /sys/class/thermal/thermal_zone0/temp');
    if (t) cpuTemp = (parseInt(t) / 1000).toFixed(1);
  } catch { }

  // Memory
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;

  // Disk
  let diskTotal = 0, diskUsed = 0, diskFree = 0;
  try {
    const disk = exec("df -BG / | tail -1 | awk '{print $2, $3, $4}'").split(' ');
    diskTotal = parseInt(disk[0]) || 0;
    diskUsed = parseInt(disk[1]) || 0;
    diskFree = parseInt(disk[2]) || 0;
  } catch { }

  // Network (tailscale + eth0)
  const nets = os.networkInterfaces();
  const tailscaleIP = Object.values(nets).flat().find(n => n.address?.startsWith('100.'))?.address || null;
  const ethIP = (nets['eth0'] || nets['enp1s0'] || nets['ens3'] || []).find(n => n.family === 'IPv4')?.address || null;

  // Network traffic
  let rxBytes = 0, txBytes = 0;
  try {
    const netstat = exec("cat /proc/net/dev | grep -E 'eth0|end0' | head -1");
    const parts = netstat.trim().split(/\s+/);
    rxBytes = parseInt(parts[1]) || 0;
    txBytes = parseInt(parts[9]) || 0;
  } catch { }

  // Uptime
  const uptimeSec = os.uptime();
  const days = Math.floor(uptimeSec / 86400);
  const hours = Math.floor((uptimeSec % 86400) / 3600);
  const mins = Math.floor((uptimeSec % 3600) / 60);
  const uptime = days > 0 ? `${days}d ${hours}h ${mins}m` : hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  // Load average
  const load = os.loadavg();

  // Hostname & platform
  const hostname = os.hostname();
  const platform = exec('uname -m') || os.arch();

  // PostgreSQL status
  let pgStatus = 'unknown';
  try {
    const pg = exec('systemctl is-active postgresql 2>/dev/null || pg_isready -q 2>/dev/null && echo active');
    pgStatus = pg.includes('active') ? 'running' : 'stopped';
  } catch { }

  // Node processes
  let nodeProcs = 0;
  try {
    nodeProcs = parseInt(exec("pgrep -c node || echo 0")) || 0;
  } catch { }

  res.json({
    hostname,
    platform,
    uptime,
    cpuPercent: parseFloat(cpuPercent.toFixed(1)),
    cpuTemp,
    cpuCores: os.cpus().length,
    cpuModel: os.cpus()[0]?.model || 'ARM Cortex',
    memory: {
      total: totalMem,
      used: usedMem,
      free: freeMem,
      percent: parseFloat(((usedMem / totalMem) * 100).toFixed(1))
    },
    disk: {
      total: diskTotal, used: diskUsed, free: diskFree,
      percent: diskTotal ? parseFloat(((diskUsed / diskTotal) * 100).toFixed(1)) : 0
    },
    network: { tailscaleIP, ethIP, rxBytes, txBytes },
    load: load.map(l => parseFloat(l.toFixed(2))),
    services: { postgresql: pgStatus, nodeProcesses: nodeProcs },
    timestamp: new Date().toISOString()
  });
});

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Pi Monitor running at http://0.0.0.0:${PORT}`);
});
