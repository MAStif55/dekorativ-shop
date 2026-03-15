/**
 * Firestore Integrity Check — Orphaned Image References
 * 
 * This read-only script scans the `gallery` and `products` collections
 * to verify that all referenced image URLs are still accessible in
 * Firebase Storage. Reports orphaned/broken references without mutating data.
 * 
 * Usage:
 *   node scripts/check-orphans.js
 * 
 * Requires: FIREBASE_* env vars in .env.local (loaded via dotenv-style parsing below)
 */

const fs = require('fs');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

// ---------------------------------------------------------------------------
// 1. Load .env.local
// ---------------------------------------------------------------------------
function loadEnv() {
    const envPath = path.resolve(__dirname, '..', '.env.local');
    if (!fs.existsSync(envPath)) {
        console.error('❌  .env.local not found at', envPath);
        process.exit(1);
    }
    const content = fs.readFileSync(envPath, 'utf-8');
    const vars = {};
    for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx === -1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim();
        vars[key] = val;
    }
    return vars;
}

const env = loadEnv();

// ---------------------------------------------------------------------------
// 2. Initialize Firebase
// ---------------------------------------------------------------------------
const firebaseConfig = {
    apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ---------------------------------------------------------------------------
// 3. URL Checker — HEAD request
// ---------------------------------------------------------------------------
async function checkUrl(url) {
    try {
        const res = await fetch(url, { method: 'HEAD' });
        return { url, status: res.status, ok: res.ok };
    } catch (err) {
        return { url, status: 0, ok: false, error: err.message };
    }
}

// ---------------------------------------------------------------------------
// 4. Extract image URLs from a document
// ---------------------------------------------------------------------------
function extractImageUrls(doc) {
    const data = doc;
    const urls = [];

    // Products: images[] array (each item is { url: string } or a plain string)
    if (Array.isArray(data.images)) {
        for (const img of data.images) {
            if (typeof img === 'string' && img) urls.push(img);
            else if (img && img.url) urls.push(img.url);
        }
    }

    // Gallery / Portfolio: single imageUrl field
    if (data.imageUrl) urls.push(data.imageUrl);

    // Video preview
    if (data.videoPreviewUrl) urls.push(data.videoPreviewUrl);

    return urls;
}

// ---------------------------------------------------------------------------
// 5. Main scan
// ---------------------------------------------------------------------------
async function main() {
    console.log('🔍  Firestore Image Integrity Check');
    console.log('━'.repeat(60));

    const collectionsToScan = ['gallery', 'products', 'portfolioPhotos'];
    const results = { total: 0, ok: 0, broken: 0, empty: 0, details: [] };

    for (const colName of collectionsToScan) {
        console.log(`\n📂  Scanning collection: ${colName}`);

        let snapshot;
        try {
            snapshot = await getDocs(collection(db, colName));
        } catch (err) {
            console.log(`   ⚠️  Skipped — ${err.code || err.message}`);
            results.details.push({
                collection: colName,
                docId: '-',
                issue: 'ACCESS_DENIED',
                url: '-',
            });
            continue;
        }

        if (snapshot.empty) {
            console.log(`   (empty collection)`);
            continue;
        }

        for (const docSnap of snapshot.docs) {
            const docData = { id: docSnap.id, ...docSnap.data() };
            const urls = extractImageUrls(docData);

            if (urls.length === 0) {
                results.empty++;
                results.details.push({
                    collection: colName,
                    docId: docSnap.id,
                    issue: 'NO_IMAGES',
                    url: '-',
                });
                continue;
            }

            for (const url of urls) {
                results.total++;
                const check = await checkUrl(url);
                if (check.ok) {
                    results.ok++;
                } else {
                    results.broken++;
                    results.details.push({
                        collection: colName,
                        docId: docSnap.id,
                        issue: `HTTP_${check.status}`,
                        url: url.slice(0, 80) + (url.length > 80 ? '...' : ''),
                        error: check.error || '',
                    });
                }
            }
        }
    }

    // ---------------------------------------------------------------------------
    // 6. Report
    // ---------------------------------------------------------------------------
    console.log('\n' + '━'.repeat(60));
    console.log('📊  RESULTS');
    console.log('━'.repeat(60));
    console.log(`   Total image URLs checked:  ${results.total}`);
    console.log(`   ✅  Accessible:            ${results.ok}`);
    console.log(`   ❌  Broken / Orphaned:     ${results.broken}`);
    console.log(`   ⚠️   Docs with no images:   ${results.empty}`);

    if (results.details.length > 0) {
        console.log('\n📋  ISSUE DETAILS:');
        console.log('─'.repeat(60));
        for (const d of results.details) {
            console.log(`   [${d.collection}] doc=${d.docId}  issue=${d.issue}`);
            if (d.url !== '-') console.log(`      URL: ${d.url}`);
            if (d.error) console.log(`      Error: ${d.error}`);
        }
    } else {
        console.log('\n✅  No issues found — all image references are valid!');
    }

    console.log('\n' + '━'.repeat(60));
    console.log('Done. This script is read-only — no data was modified.');
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
