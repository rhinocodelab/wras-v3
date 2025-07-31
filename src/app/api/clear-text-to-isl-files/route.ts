import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
    try {
        const audioDir = path.join(process.cwd(), 'public', 'text_to_isl', 'audio');
        const publishedDir = path.join(process.cwd(), 'public', 'text_to_isl', 'published');
        const islVideoDir = path.join(process.cwd(), 'public', 'isl_video');

        // Clear audio files
        if (fs.existsSync(audioDir)) {
            const audioFiles = fs.readdirSync(audioDir);
            for (const file of audioFiles) {
                const filePath = path.join(audioDir, file);
                if (fs.statSync(filePath).isFile()) {
                    fs.unlinkSync(filePath);
                }
            }
        }

        // Clear published files
        if (fs.existsSync(publishedDir)) {
            const publishedFiles = fs.readdirSync(publishedDir);
            for (const file of publishedFiles) {
                const filePath = path.join(publishedDir, file);
                if (fs.statSync(filePath).isFile()) {
                    fs.unlinkSync(filePath);
                }
            }
        }

        // Clear ISL video files
        if (fs.existsSync(islVideoDir)) {
            const islVideoFiles = fs.readdirSync(islVideoDir);
            for (const file of islVideoFiles) {
                const filePath = path.join(islVideoDir, file);
                if (fs.statSync(filePath).isFile()) {
                    fs.unlinkSync(filePath);
                }
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: 'Files cleared successfully' 
        });
    } catch (error) {
        console.error('Error clearing files:', error);
        return NextResponse.json(
            { 
                success: false, 
                message: 'Failed to clear files' 
            },
            { status: 500 }
        );
    }
} 