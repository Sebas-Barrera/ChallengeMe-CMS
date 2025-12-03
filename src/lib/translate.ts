/**
 * Servicio de traducción usando Google Cloud Translation API
 */

const GOOGLE_TRANSLATE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_TRANSLATE_API_KEY || process.env.GOOGLE_TRANSLATE_API_KEY;
const GOOGLE_TRANSLATE_API_URL = 'https://translation.googleapis.com/language/translate/v2';

// Mapeo de códigos de idioma a códigos de Google Translate
const LANGUAGE_CODE_MAP: Record<string, string> = {
  'es': 'es',
  'en': 'en',
  'fr': 'fr',
  'de': 'de',
  'pt': 'pt',
};

export interface TranslateOptions {
  text: string;
  targetLanguage: string;
  sourceLanguage?: string;
}

export async function translateText({ text, targetLanguage, sourceLanguage = 'es' }: TranslateOptions): Promise<string> {
  if (!GOOGLE_TRANSLATE_API_KEY) {
    throw new Error('Google Translate API key no está configurada');
  }

  // Si el texto está vacío, retornar vacío
  if (!text.trim()) {
    return '';
  }

  // Si el idioma de origen y destino son el mismo, retornar el texto original
  if (sourceLanguage === targetLanguage) {
    return text;
  }

  try {
    const targetLangCode = LANGUAGE_CODE_MAP[targetLanguage] || targetLanguage;
    const sourceLangCode = LANGUAGE_CODE_MAP[sourceLanguage] || sourceLanguage;

    const response = await fetch(`${GOOGLE_TRANSLATE_API_URL}?key=${GOOGLE_TRANSLATE_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        source: sourceLangCode,
        target: targetLangCode,
        format: 'text',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Error de traducción: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();

    if (!data.data?.translations?.[0]?.translatedText) {
      throw new Error('Respuesta de traducción inválida');
    }

    return data.data.translations[0].translatedText;
  } catch (error) {
    console.error('Error translating text:', error);
    throw error;
  }
}

export async function translateMultipleTexts({ texts, targetLanguage, sourceLanguage = 'es' }: {
  texts: string[];
  targetLanguage: string;
  sourceLanguage?: string;
}): Promise<string[]> {
  if (!GOOGLE_TRANSLATE_API_KEY) {
    throw new Error('Google Translate API key no está configurada');
  }

  // Si no hay textos, retornar array vacío
  if (texts.length === 0) {
    return [];
  }

  // Si el idioma de origen y destino son el mismo, retornar los textos originales
  if (sourceLanguage === targetLanguage) {
    return texts;
  }

  try {
    const targetLangCode = LANGUAGE_CODE_MAP[targetLanguage] || targetLanguage;
    const sourceLangCode = LANGUAGE_CODE_MAP[sourceLanguage] || sourceLanguage;

    const response = await fetch(`${GOOGLE_TRANSLATE_API_URL}?key=${GOOGLE_TRANSLATE_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: texts,
        source: sourceLangCode,
        target: targetLangCode,
        format: 'text',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Error de traducción: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();

    if (!data.data?.translations) {
      throw new Error('Respuesta de traducción inválida');
    }

    return data.data.translations.map((t: any) => t.translatedText);
  } catch (error) {
    console.error('Error translating texts:', error);
    throw error;
  }
}
