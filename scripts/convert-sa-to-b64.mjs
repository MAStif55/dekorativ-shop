#!/usr/bin/env node
/**
 * Convert Firebase Service Account JSON to Base64
 * 
 * Auto-discovers the service account key in the project root,
 * minifies it, and writes the Base64 string to .temp_b64.txt.
 * 
 * Usage: node scripts/convert-sa-to-b64.mjs
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, resolve } from 'path';

const ROOT = resolve(import.meta.dirname, '..');

// Auto-discover service account JSON
const files = readdirSync(ROOT);
const saFile = files.find(f => f.includes('firebase-adminsdk') && f.endsWith('.json'));

if (!saFile) {
    console.error('❌ No Firebase service account key found in project root.');
    console.error('   Expected pattern: *firebase-adminsdk*.json');
    process.exit(1);
}

const saPath = join(ROOT, saFile);
console.log(`✅ Found service account: ${saFile}`);

// Read, minify, base64 encode
const raw = readFileSync(saPath, 'utf-8');
const minified = JSON.stringify(JSON.parse(raw)); // Minify
const b64 = Buffer.from(minified).toString('base64');

// Write to temp file (for piping into gh secret set)
const outPath = join(ROOT, '.temp_b64.txt');
writeFileSync(outPath, b64, 'utf-8');

console.log(`✅ Base64 written to .temp_b64.txt (${b64.length} chars)`);
console.log('   Use: gh secret set FIREBASE_SERVICE_ACCOUNT_BASE64 < .temp_b64.txt');
