
'use server';

/**
 * @fileOverview A Genkit flow for translating train route data.
 *
 * - translateAllRoutes - A function that handles the translation process for all routes.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { TrainRoute, Translation } from '@/app/actions';
import { googleAI } from '@genkit-ai/googleai';
import { join } from 'path';
import { readFileSync } from 'fs';
import { Translate } from '@google-cloud/translate/build/src/v2';

// Set the GOOGLE_APPLICATION_CREDENTIALS environment variable at module level
const credentialsPath = join(process.cwd(), 'config', 'isl.json');
process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialsPath;


export async function translateText(text: string, targetLanguage: string, sourceLanguage: string): Promise<string> {
    if (!text || !targetLanguage || targetLanguage === sourceLanguage) {
        return text;
    }
    
    try {
        console.log(`Translating from ${sourceLanguage} to ${targetLanguage}: "${text}"`);
        
        // Set the GOOGLE_APPLICATION_CREDENTIALS environment variable
        const credentialsPath = join(process.cwd(), 'config', 'isl.json');
        process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialsPath;
        
        console.log('Using GOOGLE_APPLICATION_CREDENTIALS:', credentialsPath);
        
        // Creates a client using the Translate class from @google-cloud/translate
        const translate = new Translate();
        
        // Translates the text into the target language
        const [translations] = await translate.translate(text, targetLanguage);
        const translatedText = Array.isArray(translations) ? translations[0] : translations;
        console.log('Translation result:', translatedText);
        
        return translatedText;
        
    } catch (error) {
        console.error(`Error during Google Cloud Translation from '${sourceLanguage}' to '${targetLanguage}':`, error);
        console.log('Returning original text due to API error');
        return text;
    }
}

const hindiDigitMap: { [key: string]: string } = {
    '0': 'शून्य', '1': 'एक', '2': 'दो', '3': 'तीन', '4': 'चार',
    '5': 'पांच', '6': 'छह', '7': 'सात', '8': 'आठ', '9': 'नौ'
};

const marathiDigitMap: { [key: string]: string } = {
    '0': 'शून्य', '1': 'एक', '2': 'दोन', '3': 'तीन', '4': 'चार',
    '5': 'पाच', '6': 'सहा', '7': 'सात', '8': 'आठ', '9': 'नऊ'
};

const gujaratiDigitMap: { [key: string]: string } = {
    '0': 'શૂન્ય', '1': 'એક', '2': 'બે', '3': 'ત્રણ', '4': 'ચાર',
    '5': 'પાંચ', '6': 'છ', '7': 'સાત', '8': 'આઠ', '9': 'નવ'
};

const digitMaps: { [key: string]: { [key: string]: string } } = {
    'hi': hindiDigitMap,
    'mr': marathiDigitMap,
    'gu': gujaratiDigitMap
};

const translateRouteFlow = ai.defineFlow(
    {
        name: 'translateRouteFlow',
        inputSchema: z.object({ route: z.any(), languageCode: z.string() }),
        outputSchema: z.any(),
    },
    async ({ route, languageCode }) => {
        
        let trainNumberTranslation: string;
        
        if (digitMaps[languageCode]) {
            const trainNumberStr = String(route['Train Number'] || '');
            trainNumberTranslation = trainNumberStr.split('').map(digit => digitMaps[languageCode][digit] || digit).join(' ');
        } else {
            trainNumberTranslation = await translateText(String(route['Train Number'] || ''), languageCode, 'en');
        }

        const [
            trainNameTranslation,
            startStationTranslation,
            endStationTranslation
        ] = await Promise.all([
            translateText(route['Train Name'], languageCode, 'en'),
            translateText(route['Start Station'], languageCode, 'en'),
            translateText(route['End Station'], languageCode, 'en'),
        ]);

        return {
            route_id: route.id,
            language_code: languageCode,
            train_number_translation: trainNumberTranslation,
            train_name_translation: trainNameTranslation,
            start_station_translation: startStationTranslation,
            end_station_translation: endStationTranslation,
        };
    }
);

export async function translateAllRoutes(routes: TrainRoute[]): Promise<Translation[]> {
  const allTranslations: Translation[] = [];
  
  for (const route of routes) {
      if (!route.id) continue;
      
      const languagePromises = ['en', 'mr', 'hi', 'gu'].map(langCode => 
        translateRouteFlow({route, languageCode: langCode})
      );
      
      const results = await Promise.all(languagePromises);
      allTranslations.push(...results);
  }

  return allTranslations;
}
