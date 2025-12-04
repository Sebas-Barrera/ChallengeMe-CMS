import { NextRequest, NextResponse } from 'next/server';

interface TranslateRequest {
  text: string;
  targetLanguages: string[]; // ['en', 'pt', 'fr', etc.]
}

// Mapeo de códigos de idioma estándar a códigos de Google Translate
const LANGUAGE_MAP: Record<string, string> = {
  es: 'es',
  en: 'en',
  pt: 'pt',
  fr: 'fr',
  de: 'de',
  it: 'it',
  ja: 'ja',
  ko: 'ko',
  zh: 'zh-CN', // Chino simplificado
  ru: 'ru',
  ar: 'ar',
  hi: 'hi',
  nl: 'nl',
  sv: 'sv',
  pl: 'pl',
  tr: 'tr',
};

export async function POST(request: NextRequest) {
  try {
    const { text, targetLanguages } = (await request.json()) as TranslateRequest;

    // Validaciones
    if (!text || text.trim() === '') {
      return NextResponse.json(
        { error: 'El texto a traducir no puede estar vacío' },
        { status: 400 }
      );
    }

    if (!targetLanguages || targetLanguages.length === 0) {
      return NextResponse.json(
        { error: 'Debe especificar al menos un idioma de destino' },
        { status: 400 }
      );
    }

    // Verificar que exista la API key
    // Primero intentar con la variable sin prefijo, luego con NEXT_PUBLIC_
    const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_TRANSLATE_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google Translate API key no configurada' },
        { status: 500 }
      );
    }

    // Mapear idiomas a códigos de Google
    const googleTargetLanguages = targetLanguages
      .map((lang) => LANGUAGE_MAP[lang] || lang)
      .filter((lang, index, self) => self.indexOf(lang) === index); // Eliminar duplicados

    // Hacer las peticiones a Google Translate API (una por idioma)
    const translationPromises = googleTargetLanguages.map(async (targetLang) => {
      const url = new URL('https://translation.googleapis.com/language/translate/v2');
      url.searchParams.append('key', apiKey);
      url.searchParams.append('q', text);
      url.searchParams.append('source', 'es');
      url.searchParams.append('target', targetLang);
      url.searchParams.append('format', 'text');

      const response = await fetch(url.toString(), {
        method: 'GET',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error al traducir a ${targetLang}: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      return {
        language: targetLang,
        translation: data.data.translations[0].translatedText,
      };
    });

    const results = await Promise.all(translationPromises);

    // Procesar respuesta
    const translations: Record<string, string> = {};

    results.forEach((result) => {
      // Mapear de vuelta a nuestros códigos de idioma
      const ourLangCode = Object.entries(LANGUAGE_MAP).find(
        ([, googleCode]) => googleCode === result.language
      )?.[0] || result.language;

      translations[ourLangCode] = result.translation;
    });

    return NextResponse.json({
      success: true,
      translations,
    });
  } catch (error: any) {
    console.error('Error en /api/translate:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', message: error.message },
      { status: 500 }
    );
  }
}
