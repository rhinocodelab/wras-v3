
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getDb, getCustomNumberAudio } from '@/app/actions';
import { generateSpeech } from '@/ai/flows/tts-flow';
import * as fsPromises from 'fs/promises';
import * as fs from 'fs';
import * as path from 'path';

const AnnouncementInputSchema = z.object({
  routeId: z.number(),
  platform: z.string(),
  category: z.string(),
});

export type AnnouncementInput = z.infer<typeof AnnouncementInputSchema>;

const AnnouncementOutputSchema = z.object({
    announcements: z.array(z.object({
        language_code: z.string(),
        text: z.string(),
        audio_path: z.string().nullable(),
    })),
    isl_video_playlist: z.array(z.string()),
});

export type AnnouncementOutput = z.infer<typeof AnnouncementOutputSchema>;


async function getRouteData(routeId: number) {
    const db = await getDb();
    const route = await db.get('SELECT * FROM train_routes WHERE id = ?', routeId);
    const translations = await db.all('SELECT * FROM train_route_translations WHERE route_id = ?', routeId);
    const audioFiles = await db.all('SELECT * FROM train_route_audio WHERE route_id = ?', routeId);
    await db.close();
    return { route, translations, audioFiles };
}

async function getTemplate(category: string, languageCode: string) {
    const db = await getDb();
    const template = await db.get('SELECT template_text, template_audio_parts FROM announcement_templates WHERE category = ? AND language_code = ?', category, languageCode);
    await db.close();
    if (template) {
        return {
            text: template.template_text,
            audio_parts: template.template_audio_parts ? JSON.parse(template.template_audio_parts) : []
        };
    }
    return null;
}

function replacePlaceholders(template: string, data: any, platform: string, trainNumber: string): string {
    return template
        .replace(/{train_number}/g, data.train_number_translation || trainNumber)
        .replace(/{train_name}/g, data.train_name_translation)
        .replace(/{start_station}/g, data.start_station_translation)
        .replace(/{end_station}/g, data.end_station_translation)
        .replace(/{platform}/g, platform);
}

// A simple digit-to-word map for platform numbers, extend as needed.
const platformNumberWords: { [key: string]: { [lang: string]: string } } = {
    'en': { '1': 'one', '2': 'two', '3': 'three', '4': 'four', '5': 'five', '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine', '0': 'zero' },
    'hi': { '1': 'एक', '2': 'दो', '3': 'तीन', '4': 'चार', '5': 'पांच', '6': 'छह', '7': 'सात', '8': 'आठ', '9': 'नौ', '0': 'शून्य' },
    'mr': { '1': 'एक', '2': 'दोन', '3': 'तीन', '4': 'चार', '5': 'पाच', '6': 'सहा', '7': 'सात', '8': 'आठ', '9': 'नऊ', '0': 'शून्य' },
    'gu': { '1': 'એક', '2': 'બે', '3': 'ત્રણ', '4': 'ચાર', '5': 'પાંચ', '6': 'છ', '7': 'સાત', '8': 'આઠ', '9': 'નવ', '0': 'શૂન્ય' },
};

async function generatePlatformAudio(platform: string, lang: string): Promise<string | null> {
    // Try to get custom audio for each digit in the platform number
    const digits = platform.split('');
    const customAudioFiles: string[] = [];
    
    for (const digit of digits) {
        try {
            // Try to get custom audio for this digit
            const customAudio = await getCustomNumberAudio(digit, lang);
            if (customAudio) {
                // Use the custom audio file
                const customFilePath = path.join(process.cwd(), 'public', customAudio.audio_file_path);
                if (await fsPromises.access(customFilePath).then(() => true).catch(() => false)) {
                    customAudioFiles.push(customFilePath);
                    continue; // Skip TTS generation for this digit
                }
            }
        } catch (error) {
            console.warn(`Failed to get custom audio for digit ${digit} in language ${lang}:`, error);
        }
        
        // Fallback to TTS generation for this digit
        const digitWord = platformNumberWords[lang]?.[digit] || digit;
        const audioContent = await generateSpeech(digitWord, lang);
        if (audioContent) {
            const audioDir = path.join(process.cwd(), 'public', 'audio', '_temp');
            await fsPromises.mkdir(audioDir, { recursive: true });
            const filePath = path.join(audioDir, `platform_digit_${digit}_${lang}.wav`);
            await fsPromises.writeFile(filePath, audioContent);
            customAudioFiles.push(filePath);
        }
    }
    
    // If we have custom audio files, concatenate them
    if (customAudioFiles.length > 0) {
        const audioDir = path.join(process.cwd(), 'public', 'audio', '_temp');
        await fsPromises.mkdir(audioDir, { recursive: true });
        const outputPath = path.join(audioDir, `platform_${platform}_${lang}.wav`);
        
        // Simple concatenation for now
        if (customAudioFiles.length === 1) {
            // If only one file, just copy it
            await fsPromises.copyFile(customAudioFiles[0], outputPath);
        } else {
            // Concatenate multiple files
            const concatenatedPath = await concatenateAudio(customAudioFiles, `platform_${platform}_${lang}.wav`);
            if (concatenatedPath) {
                return concatenatedPath;
            }
        }
        
        return outputPath;
    }
    
    // Fallback to original TTS approach if no custom audio found
    const platformWord = platform.split('').map(digit => platformNumberWords[lang]?.[digit] || digit).join(' ');
    const audioContent = await generateSpeech(platformWord, lang);
    if (!audioContent) return null;

    const audioDir = path.join(process.cwd(), 'public', 'audio', '_temp');
    await fsPromises.mkdir(audioDir, { recursive: true });
    const filePath = path.join(audioDir, `platform_${platform}_${lang}.wav`);
    await fsPromises.writeFile(filePath, audioContent);
    return filePath;
}


async function concatenateAudio(filePaths: (string | null | undefined)[], outputFileName: string): Promise<string | null> {
    const validFiles = filePaths.filter((p): p is string => !!p && fs.existsSync(p));
    if (validFiles.length === 0) return null;

    const audioDir = path.join(process.cwd(), 'public', 'audio', '_announcements');
    await fsPromises.mkdir(audioDir, { recursive: true });
    const outputPath = path.join(audioDir, outputFileName);
    
    // Simple concatenation by appending buffer data. This works for raw PCM/WAV without headers.
    // For a production system, a more robust library like ffmpeg would be better.
    const headerLength = 44; // Standard WAV header size
    let totalLength = 0;
    const audioData: Buffer[] = [];

    for (const filePath of validFiles) {
        try {
            const content = await fsPromises.readFile(filePath);
            const data = content.slice(headerLength);
            audioData.push(data);
            totalLength += data.length;
        } catch (error) {
            console.warn(`Could not read audio file: ${filePath}`, error);
        }
    }

    if (audioData.length === 0) return null;
    
    const firstFileContent = await fsPromises.readFile(validFiles[0]);
    const header = firstFileContent.slice(0, headerLength);
    
    // Update RIFF chunk size (bytes 4-7)
    header.writeUInt32LE(totalLength + headerLength - 8, 4);
    // Update data sub-chunk size (bytes 40-43)
    header.writeUInt32LE(totalLength, 40);

    const finalBuffer = Buffer.concat([header, ...audioData]);
    await fsPromises.writeFile(outputPath, finalBuffer);
    
    return outputPath.replace(path.join(process.cwd(), 'public'), '');
}


const generateAnnouncementFlow = ai.defineFlow(
  {
    name: 'generateAnnouncementFlow',
    inputSchema: AnnouncementInputSchema,
    outputSchema: AnnouncementOutputSchema,
  },
  async ({ routeId, platform, category }) => {
    const { route, translations, audioFiles } = await getRouteData(routeId);
    if (!route) {
        throw new Error('Train route not found');
    }

    const announcements: any[] = [];
    const languages = ['en', 'hi', 'mr', 'gu'];

    for (const lang of languages) {
        const template = await getTemplate(category, lang);
        if (!template || !template.text) continue;

        const translationData = translations.find(t => t.language_code === lang);
        const audioData = audioFiles.find(a => a.language_code === lang);
        
        if (!translationData) continue;

        // 1. Generate Text
        const text = replacePlaceholders(template.text, translationData, platform, route.train_number);
        
        // 2. Generate Audio
        let finalAudioPath: string | null = null;
        if(audioData && template.audio_parts) {
            const placeholderRegex = /({[a-zA-Z0-9_]+})/g;
            const textParts = template.text.split(placeholderRegex).filter(p => p.length > 0);
            
            const audioSnippets: (string | null)[] = [];
            let staticAudioIndex = 0;
            
            for (const part of textParts) {
                if (placeholderRegex.test(part)) {
                    const placeholder = part.slice(1, -1); // remove {}
                    switch(placeholder) {
                        case 'train_number':
                            audioSnippets.push(audioData.train_number_audio_path ? path.join(process.cwd(), 'public', audioData.train_number_audio_path) : null);
                            break;
                        case 'train_name':
                             audioSnippets.push(audioData.train_name_audio_path ? path.join(process.cwd(), 'public', audioData.train_name_audio_path) : null);
                            break;
                        case 'start_station':
                             audioSnippets.push(audioData.start_station_audio_path ? path.join(process.cwd(), 'public', audioData.start_station_audio_path) : null);
                            break;
                        case 'end_station':
                             audioSnippets.push(audioData.end_station_audio_path ? path.join(process.cwd(), 'public', audioData.end_station_audio_path) : null);
                            break;
                        case 'platform':
                            audioSnippets.push(await generatePlatformAudio(platform, lang));
                            break;
                    }
                } else if (part.trim().length > 0) {
                     const staticAudioPart = template.audio_parts.find((p: string | null) => p?.includes(`part_${staticAudioIndex}.wav`));
                     if (staticAudioPart) {
                        audioSnippets.push(path.join(process.cwd(), 'public', staticAudioPart));
                     }
                     staticAudioIndex++;
                }
            }
            
            const outputFileName = `announcement_${route.train_number}_${category}_${lang}_${Date.now()}.wav`;
            finalAudioPath = await concatenateAudio(audioSnippets, outputFileName);
            
            // Clean up temporary files
            const tempDir = path.join(process.cwd(), 'public', 'audio', '_temp');
            if (fs.existsSync(tempDir)) {
                 await fsPromises.rm(tempDir, { recursive: true, force: true });
            }
        }
        
        announcements.push({ language_code: lang, text, audio_path: finalAudioPath });
    }
    
    return { announcements, isl_video_playlist: [] };
  }
);


export async function generateAnnouncement(input: AnnouncementInput): Promise<AnnouncementOutput> {
  return await generateAnnouncementFlow(input);
}


// --- New Flow for Template Audio Generation ---

const TemplateAudioInputSchema = z.object({
    templateText: z.string(),
    category: z.string(),
    languageCode: z.string(),
});

const TemplateAudioOutputSchema = z.array(z.string().nullable());

const generateTemplateAudioFlow = ai.defineFlow({
    name: 'generateTemplateAudioFlow',
    inputSchema: TemplateAudioInputSchema,
    outputSchema: TemplateAudioOutputSchema,
}, async ({ templateText, category, languageCode }) => {
    
    const placeholderRegex = /({[a-zA-Z0-9_]+})/g;
    const parts = templateText.split(placeholderRegex);
    const audioFilePaths: (string | null)[] = [];
    
    const audioDir = path.join(process.cwd(), 'public', 'audio', 'templates', category, languageCode);
    await fsPromises.mkdir(audioDir, { recursive: true });

    let staticPartIndex = 0;
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (placeholderRegex.test(part)) {
            // It's a placeholder like {train_name}, push null and continue
            audioFilePaths.push(null);
        } else if (part.trim().length > 0) {
            // It's a static text part
            const cleanText = part.trim(); 
            
            if (cleanText.length === 0) {
                continue;
            }
            
            const audioContent = await generateSpeech(cleanText, languageCode);
            if (audioContent) {
                const filePath = path.join(audioDir, `part_${staticPartIndex}.wav`);
                await fsPromises.writeFile(filePath, audioContent);
                audioFilePaths.push(filePath.replace(path.join(process.cwd(), 'public'), ''));
            } else {
                audioFilePaths.push(null);
            }
            staticPartIndex++;
        } else {
            // Empty part, push null
            audioFilePaths.push(null);
        }
    }
    
    return audioFilePaths;
});

export async function generateTemplateAudio(input: z.infer<typeof TemplateAudioInputSchema>): Promise<(string | null)[]> {
    return await generateTemplateAudioFlow(input);
}
