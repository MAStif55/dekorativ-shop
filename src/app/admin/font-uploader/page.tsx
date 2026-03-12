'use client';

import { useState } from 'react';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function FontUploaderPage() {
    const [status, setStatus] = useState('Idle');
    const [progress, setProgress] = useState(0);

    const handleUpload = async () => {
        try {
            setStatus('Fetching local fonts list...');
            const res = await fetch('/api/fonts');
            const data = await res.json();
            const fonts = data.fonts;

            setStatus(`Found ${fonts.length} fonts. Starting upload...`);

            const uploadedFonts = [];

            for (let i = 0; i < fonts.length; i++) {
                const font = fonts[i];
                setStatus(`Uploading ${i + 1}/${fonts.length}: ${font.name}`);

                // Check format
                const isOtf = font.file.toLowerCase().endsWith('.otf');
                const contentType = isOtf ? 'font/otf' : 'font/ttf';

                // Fetch local file
                const fileRes = await fetch(font.path);
                const blob = await fileRes.blob();

                // Upload to Firebase
                const storageRef = ref(storage, `fonts/${font.category}/${font.file}`);
                await uploadBytes(storageRef, blob, { contentType });
                const url = await getDownloadURL(storageRef);

                uploadedFonts.push({
                    id: font.id,
                    name: font.name,
                    category: font.category,
                    file: font.file,
                    url: url
                });

                setProgress(Math.round(((i + 1) / fonts.length) * 100));
            }

            setStatus('Uploading fonts-metadata.json...');

            // Upload metadata JSON
            const metadataStr = JSON.stringify({ fonts: uploadedFonts, categories: data.categories }, null, 2);
            const metadataBlob = new Blob([metadataStr], { type: 'application/json' });
            const metaRef = ref(storage, 'fonts/fonts-metadata.json');

            await uploadBytes(metaRef, metadataBlob, { contentType: 'application/json' });

            setStatus('Complete! All fonts and metadata have been successfully uploaded to Firebase Storage.');
        } catch (e: any) {
            console.error(e);
            setStatus(`Error: ${e.message}`);
        }
    };

    return (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 max-w-2xl mt-10">
            <h1 className="text-2xl font-bold mb-4 font-ornamental">Firebase Font Migrator</h1>
            <p className="mb-6 text-slate-600">
                This internal tool bypasses Windows execution blocks by reading fonts from your local <code>public/fonts</code>
                directory via the browser and uploading them directly to your authenticated Firebase Storage bucket.
            </p>

            <button
                onClick={handleUpload}
                disabled={status.includes('Uploading')}
                className="px-6 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
                Start Font Upload
            </button>

            <div className="mt-8">
                <p className="font-semibold text-sm text-slate-800 mb-2">{status}</p>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
                    <div
                        className="bg-turquoise h-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            </div>
        </div>
    );
}
