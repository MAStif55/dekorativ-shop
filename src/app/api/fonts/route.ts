import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const fontsDir = path.join(process.cwd(), 'public', 'fonts');

        if (!fs.existsSync(fontsDir)) {
            return NextResponse.json({ error: 'Fonts directory not found' }, { status: 404 });
        }

        const categories = fs.readdirSync(fontsDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

        const fonts = [];

        for (const category of categories) {
            const categoryDir = path.join(fontsDir, category);
            const files = fs.readdirSync(categoryDir)
                .filter(file => file.endsWith('.ttf') || file.endsWith('.otf'));

            for (const file of files) {
                // Remove extension and generate a clean name for display
                const rawName = file.replace(/\.(ttf|otf)$/i, '');

                fonts.push({
                    id: `${category}/${file}`,
                    name: rawName,
                    category: category,
                    file: file,
                    path: `/fonts/${category}/${file}`
                });
            }
        }

        return NextResponse.json({ fonts, categories });
    } catch (error) {
        console.error('Error scanning fonts directory:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
