
'use server';
/**
 * @fileOverview A Genkit flow for transcribing audio to text.
 *
 * - transcribeAudio - A function that handles the transcription process.
 * - TranscribeAudioInput - The input type for the transcribeAudio function.
 * - TranscribeAudioOutput - The return type for the transcribeAudio function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { googleAI } from '@genkit-ai/googleai';
import { SpeechClient } from '@google-cloud/speech';
import { join } from 'path';

// Set the GOOGLE_APPLICATION_CREDENTIALS environment variable at module level
const credentialsPath = join(process.cwd(), 'config', 'isl.json');
process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialsPath;

const TranscribeAudioInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "An audio file, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  languageCode: z.string().describe('The language of the audio.'),
});
export type TranscribeAudioInput = z.infer<typeof TranscribeAudioInputSchema>;

const TranscribeAudioOutputSchema = z.object({
  transcription: z.string().describe('The transcribed text from the audio.'),
});
export type TranscribeAudioOutput = z.infer<typeof TranscribeAudioOutputSchema>;


const transcribeAudioFlow = ai.defineFlow(
  {
    name: 'transcribeAudioFlow',
    inputSchema: TranscribeAudioInputSchema,
    outputSchema: TranscribeAudioOutputSchema,
  },
  async ({ audioDataUri, languageCode }) => {
    const speechClient = new SpeechClient();
    
    const base64Data = audioDataUri.split(',')[1];
    const audioBytes = Buffer.from(base64Data, 'base64');
    
    // Function to detect WAV file properties
    function getWavProperties(buffer: Buffer): { sampleRate: number; encoding: string } {
      // WAV header structure: RIFF + size + WAVE + fmt + size + audioFormat + channels + sampleRate + byteRate + blockAlign + bitsPerSample
      if (buffer.length < 44) {
        return { sampleRate: 16000, encoding: 'LINEAR16' };
      }
      
      // Check if it's a WAV file (RIFF header)
      const riffHeader = buffer.toString('ascii', 0, 4);
      if (riffHeader !== 'RIFF') {
        return { sampleRate: 16000, encoding: 'LINEAR16' };
      }
      
      // Extract sample rate from WAV header (bytes 24-27)
      const sampleRate = buffer.readUInt32LE(24);
      
      // Extract bits per sample (bytes 34-35)
      const bitsPerSample = buffer.readUInt16LE(34);
      
      // Determine encoding based on bits per sample
      let encoding: string;
      if (bitsPerSample === 16) {
        encoding = 'LINEAR16';
      } else if (bitsPerSample === 8) {
        encoding = 'LINEAR8';
      } else {
        encoding = 'LINEAR16'; // Default fallback
      }
      
      console.log(`Detected WAV properties: sampleRate=${sampleRate}, bitsPerSample=${bitsPerSample}, encoding=${encoding}`);
      
      return { sampleRate, encoding };
    }
    
    // Detect audio properties
    const { sampleRate, encoding } = getWavProperties(audioBytes);
    
    const request = {
      audio: {
        content: audioBytes,
      },
      config: {
        encoding: encoding as any,
        sampleRateHertz: sampleRate,
        languageCode: languageCode,
      },
    };
    
    console.log(`Using audio config: encoding=${encoding}, sampleRateHertz=${sampleRate}, languageCode=${languageCode}`);
    
    try {
        const [response] = await speechClient.recognize(request);
        const transcription = response.results
            ?.map(result => result.alternatives?.[0].transcript)
            .join('\n');

        return {
            transcription: transcription || '',
        };
    } catch(error) {
        console.error("Speech-to-text transcription failed:", error);
        throw new Error("Failed to transcribe audio.");
    }
  }
);


export async function transcribeAudio(input: TranscribeAudioInput): Promise<TranscribeAudioOutput> {
  return await transcribeAudioFlow(input);
}
