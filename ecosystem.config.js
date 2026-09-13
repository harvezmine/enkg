/**
 * Konfigurasi PM2 untuk situs Every Nation Kelapa Gading.
 *
 * Yang dijalankan adalah `server.js` hasil build `output: "standalone"` —
 * server Node mandiri, bukan `next start`.
 *
 * Pakai (biasanya lewat deploy/deploy.sh):
 *   pm2 startOrReload ecosystem.config.js --update-env
 *   pm2 logs enkg
 */

const fs = require("node:fs");
const path = require("node:path");

const APP_DIR = process.env.ENKG_APP_DIR || "/var/www/enkg";
const ENV_FILE = path.join(APP_DIR, ".env.production");

/**
 * Nilai .env.production dimasukkan ke `env`, bukan lewat node_args, supaya
 * perilakunya sama di mode fork maupun cluster.
 */
function readEnvFile(file) {
  if (!fs.existsSync(file)) {
    console.warn(`[pm2] ${file} tidak ditemukan — memakai environment yang ada.`);
    return {};
  }

  const out = {};
  for (const raw of fs.readFileSync(file, "utf8").split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;

    const eq = line.indexOf("=");
    if (eq === -1) continue;

    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

const fileEnv = readEnvFile(ENV_FILE);

module.exports = {
  apps: [
    {
      name: "enkg",
      script: "server.js",
      cwd: path.join(APP_DIR, "current"),

      // 2 worker cluster: `pm2 reload` mengganti worker satu per satu (tanpa downtime).
      instances: 2,
      exec_mode: "cluster",

      env: {
        NODE_ENV: "production",
        // 3001 supaya tidak bentrok dengan situs lain (mis. jp di 3000) di server yang sama.
        PORT: Number(fileEnv.PORT || process.env.PORT || 3001),
        // Hanya dengarkan localhost — nginx yang menghadap ke internet.
        HOSTNAME: "127.0.0.1",
        ...fileEnv,
      },

      autorestart: true,
      max_restarts: 10,
      min_uptime: "20s",
      restart_delay: 3000,
      kill_timeout: 10000,
      listen_timeout: 10000,
      max_memory_restart: "384M",

      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      out_file: `${APP_DIR}/logs/out.log`,
      error_file: `${APP_DIR}/logs/error.log`,
    },
  ],
};
