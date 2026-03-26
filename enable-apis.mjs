import { readFileSync } from 'fs';
import { createSign } from 'crypto';

const sa = JSON.parse(readFileSync('dekorativ-5c737-firebase-adminsdk-fbsvc-5171b069dd.json', 'utf8'));

function makeJWT() {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now, exp: now + 3600,
  })).toString('base64url');
  const toSign = `${header}.${payload}`;
  const sign = createSign('RSA-SHA256');
  sign.update(toSign);
  return `${toSign}.${sign.sign(sa.private_key, 'base64url')}`;
}

async function getToken() {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${makeJWT()}`,
  });
  const data = await res.json();
  if (!data.access_token) throw new Error(JSON.stringify(data));
  return data.access_token;
}

async function enableAPI(token, api) {
  console.log(`Enabling ${api}...`);
  const res = await fetch(
    `https://serviceusage.googleapis.com/v1/projects/${sa.project_id}/services/${api}:enable`,
    { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: '{}' }
  );
  const data = await res.json();
  if (data.error) {
    console.log(`  ⚠ ${data.error.message}`);
  } else {
    console.log(`  ✓ ${api} enabled (or already active)`);
  }
}

async function main() {
  const token = await getToken();
  console.log('✓ Token obtained');
  await enableAPI(token, 'compute.googleapis.com');
  await enableAPI(token, 'cloudbilling.googleapis.com');
}

main().catch(e => { console.error('FAIL:', e.message); process.exit(1); });
