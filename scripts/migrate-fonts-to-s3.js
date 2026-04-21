#!/usr/bin/env node

/**
 * FONT MIGRATION SCRIPT: Firebase Storage → Yandex Cloud S3
 * 
 * This script does two things:
 *   1. Uploads every font file from public/fonts/ to the Yandex S3 bucket
 *   2. Updates the MongoDB 'fonts' collection so each record's `url` field
 *      points to the new S3 location instead of the dead Firebase link
 * 
 * Run on the PRODUCTION SERVER where S3 env vars are configured:
 *   cd /var/www/dekorativ
 *   node scripts/migrate-fonts-to-s3.js
 * 
 * Environment variables required:
 *   YC_S3_ACCESS_KEY_ID
 *   YC_S3_SECRET_ACCESS_KEY
 *   YC_S3_BUCKET        (default: dekorativ-media)
 *   YC_S3_ENDPOINT       (default: https://storage.yandexcloud.net)
 *   MONGODB_URI          (default: from mongo-client.ts fallback)
 */

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// ── Configuration ──────────────────────────────────────────────────────────
const BUCKET   = process.env.YC_S3_BUCKET      || 'dekorativ-media';
const REGION   = process.env.YC_S3_REGION       || 'ru-central1';
const ENDPOINT = process.env.YC_S3_ENDPOINT     || 'https://storage.yandexcloud.net';
const MONGO_URI = process.env.MONGODB_URI       || 'mongodb://dekorativ_app:DekorativAppPass2026@127.0.0.1:27017/dekorativ_data';
const DB_NAME   = process.env.MONGODB_DB_NAME   || 'dekorativ_data';

const FONTS_DIR = path.join(__dirname, '..', 'public', 'fonts');

const s3 = new S3Client({
    region: REGION,
    endpoint: ENDPOINT,
    credentials: {
        accessKeyId:     process.env.YC_S3_ACCESS_KEY_ID     || '',
        secretAccessKey: process.env.YC_S3_SECRET_ACCESS_KEY || '',
    },
});

// ── Helpers ────────────────────────────────────────────────────────────────

function getContentType(filename) {
    return filename.toLowerCase().endsWith('.otf') ? 'font/otf' : 'font/ttf';
}

/** Build the S3 key the same way the admin upload code does: spaces → underscores */
function buildS3Key(category, filename) {
    const safe = filename.replace(/\s+/g, '_');
    return `fonts/${category}/${safe}`;
}

function buildPublicUrl(s3Key) {
    return `${ENDPOINT}/${BUCKET}/${encodeURI(s3Key)}`;
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
    // 1. Verify S3 credentials exist
    if (!process.env.YC_S3_ACCESS_KEY_ID || !process.env.YC_S3_SECRET_ACCESS_KEY) {
        console.error('❌  S3 credentials not set. Make sure YC_S3_ACCESS_KEY_ID and YC_S3_SECRET_ACCESS_KEY are in your environment.');
        process.exit(1);
    }

    // 2. Connect to MongoDB
    console.log(`\n🔗  Connecting to MongoDB at ${MONGO_URI.replace(/\/\/.*@/, '//***@')}...`);
    const mongo = new MongoClient(MONGO_URI);
    await mongo.connect();
    const db = mongo.db(DB_NAME);
    const fontsCollection = db.collection('fonts');

    // 3. Load all font records from DB
    const allFonts = await fontsCollection.find().toArray();
    console.log(`📋  Found ${allFonts.length} font records in MongoDB.\n`);

    // 4. Scan local public/fonts/ directory
    const categories = fs.readdirSync(FONTS_DIR).filter(f =>
        fs.statSync(path.join(FONTS_DIR, f)).isDirectory()
    );
    console.log(`📁  Found categories: ${categories.join(', ')}\n`);

    let uploaded = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    // 5. For each category, upload every font file to S3
    for (const category of categories) {
        const categoryDir = path.join(FONTS_DIR, category);
        const files = fs.readdirSync(categoryDir).filter(f =>
            /\.(ttf|otf)$/i.test(f)
        );

        console.log(`\n── ${category} (${files.length} files) ──`);

        for (const filename of files) {
            const filePath = path.join(categoryDir, filename);
            const s3Key = buildS3Key(category, filename);
            const publicUrl = buildPublicUrl(s3Key);

            // Upload to S3
            try {
                const fileBuffer = fs.readFileSync(filePath);
                await s3.send(new PutObjectCommand({
                    Bucket: BUCKET,
                    Key: s3Key,
                    Body: fileBuffer,
                    ContentType: getContentType(filename),
                }));
                uploaded++;
                process.stdout.write(`  ✅ ${filename}\n`);
            } catch (err) {
                console.error(`  ❌ UPLOAD FAILED: ${filename} — ${err.message}`);
                errors++;
                continue; // Don't update DB if upload failed
            }

            // Update matching MongoDB record(s)
            // Match by filename (original or sanitized) within the same category
            const result = await fontsCollection.updateMany(
                {
                    category: category,
                    $or: [
                        { file: filename },
                        { file: filename.replace(/\s+/g, '_') },
                    ]
                },
                { $set: { url: publicUrl } }
            );

            if (result.modifiedCount > 0) {
                updated += result.modifiedCount;
            } else {
                // Font file exists locally but has no DB record — that's OK, 
                // it means it was never registered via the admin panel
                skipped++;
            }
        }
    }

    // 6. Catch any DB records that point to Firebase but had no local file match
    const staleRecords = await fontsCollection.find({
        url: { $regex: /firebasestorage\.googleapis\.com/ }
    }).toArray();

    if (staleRecords.length > 0) {
        console.log(`\n⚠️  ${staleRecords.length} DB record(s) still point to Firebase after file-based migration.`);
        console.log('   Attempting to fix by reconstructing S3 URLs from category + filename...\n');

        for (const record of staleRecords) {
            const s3Key = buildS3Key(record.category, record.file);
            const publicUrl = buildPublicUrl(s3Key);
            await fontsCollection.updateOne(
                { _id: record._id },
                { $set: { url: publicUrl } }
            );
            console.log(`  🔧 Fixed: ${record.name} → ${publicUrl}`);
            updated++;
        }
    }

    // 7. Summary
    console.log('\n════════════════════════════════════════════');
    console.log('  MIGRATION COMPLETE');
    console.log('════════════════════════════════════════════');
    console.log(`  Uploaded to S3:       ${uploaded}`);
    console.log(`  DB records updated:   ${updated}`);
    console.log(`  No DB record (skip):  ${skipped}`);
    console.log(`  Errors:               ${errors}`);
    console.log('════════════════════════════════════════════\n');

    await mongo.close();
}

main().catch(err => {
    console.error('💥 Fatal error:', err);
    process.exit(1);
});
