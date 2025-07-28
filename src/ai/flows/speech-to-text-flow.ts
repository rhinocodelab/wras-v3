
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
    
    const request = {
      audio: {
        content: audioBytes,
      },
      config: {
        encoding: 'LINEAR16' as const, // Assuming WAV, needs to be dynamic for MP3 etc.
        sampleRateHertz: 16000, // Common for voice, might need adjustment
        languageCode: languageCode,
      },
    };
    
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
