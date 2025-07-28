
'use server';

/**
 * @fileOverview A Genkit flow for translating train route data.
 *
 * - translateAllRoutes - A function that handles the translation process for all routes.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { TrainRoute, Translation } from '@/app/actions';
import { TranslationServiceClient } from '@google-cloud/translate';
import { googleAI } from '@genkit-ai/googleai';


export async function translateText(text: string, targetLanguage: string, sourceLanguage: string): Promise<string> {
    if (!text || !targetLanguage || targetLanguage === sourceLanguage) {
        return text;
    }
    
    // The TranslationServiceClient will automatically use the credentials
    // from the GOOGLE_APPLICATION_CREDENTIALS environment variable.
    const translationClient = new TranslationServiceClient();
    const projectId = (await translationClient.getProjectId());

    try {
        const [response] = await translationClient.translateText({
            parent: `projects/${projectId}/locations/global`,
            contents: [text],
            mimeType: 'text/plain',
            sourceLanguageCode: sourceLanguage, // Explicitly set source language
            targetLanguageCode: targetLanguage,
        });

        if (response.translations && response.translations.length > 0 && response.translations[0].translatedText) {
            return response.translations[0].translatedText;
        }
        
        return text; 
    } catch (error) {
        console.error(`Error during translation from '${sourceLanguage}' to '${targetLanguage}':`, error);
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
