
'use server';

import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { z } from 'zod';

const client = new TextToSpeechClient();

const localeMap: { [key: string]: string } = {
    'en': 'en-IN',
    'mr': 'mr-IN',
    'hi': 'hi-IN',
    'gu': 'gu-IN',
};

const voiceMap: { [key: string]: string } = {
    'en': 'en-IN-Chirp3-HD-Achernar',
    'mr': 'mr-IN-Chirp3-HD-Achernar',
    'hi': 'hi-IN-Chirp3-HD-Achernar',
    'gu': 'gu-IN-Chirp3-HD-Achernar',
}

export async function generateSpeech(text: string, languageCode: string): Promise<Uint8Array | null> {
    if (!text) {
        return null;
    }

    try {
        const request = {
            input: { text: text },
            voice: { 
                languageCode: localeMap[languageCode] || 'en-IN', 
                name: voiceMap[languageCode] || 'en-IN-Chirp3-HD-Achernar'
            },
            audioConfig: { audioEncoding: 'LINEAR16' as const },
        };

        const [response] = await client.synthesizeSpeech(request);
        
        if (response.audioContent instanceof Uint8Array) {
            return response.audioContent;
        }
        return null;
    } catch (error) {
        console.error(`Error during TTS generation for lang '${languageCode}':`, error);
        return null;
    }
}

