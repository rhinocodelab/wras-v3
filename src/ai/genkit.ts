import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Genkit and the Google AI plugin will automatically detect the
// GOOGLE_APPLICATION_CREDENTIALS environment variable and use it for authentication.
//
// The Vertex AI API uses Google Cloud Application Default Credentials for
// authentication, which will be automatically discovered by the plugin.
export const ai = genkit({
  plugins: [
    googleAI(),
  ],
});
