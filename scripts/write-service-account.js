const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '..', '.firebase');
const OUT_PATH = path.join(OUT_DIR, 'service-account.json');

async function main() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    console.error('❌ FIREBASE_SERVICE_ACCOUNT environment variable is not set.');
    console.error('   Set the secret (contents of service account JSON) and re-run this script.');
    process.exit(1);
  }

  try {
    if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(OUT_PATH, raw, { mode: 0o600 });
    console.log(`✅ Wrote service account to ${OUT_PATH} (file mode 600).`);
    console.log('   Note: this file is gitignored by the project configuration.');
  } catch (err) {
    console.error('❌ Failed to write service account:', err.message || err);
    process.exit(1);
  }
}

main();
