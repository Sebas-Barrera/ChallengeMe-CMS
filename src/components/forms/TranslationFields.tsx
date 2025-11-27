'use client';

import { useState } from 'react';
import { getLanguageByCode } from '@/constants/languages';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';

interface Translation {
  language_code: string;
  title: string;
  description: string;
  instructions: string;
  tags: string;
}

interface TranslationFieldsProps {
  selectedLanguages: string[];
  translations: Record<string, Translation>;
  onChange: (languageCode: string, field: keyof Translation, value: string) => void;
  onAutoTranslate?: (targetLanguage: string) => Promise<void>;
  errors?: Record<string, Partial<Record<keyof Translation, string>>>;
}

export default function TranslationFields({
  selectedLanguages,
  translations,
  onChange,
  onAutoTranslate,
  errors = {},
}: TranslationFieldsProps) {
  const [translatingLanguage, setTranslatingLanguage] = useState<string | null>(null);

  const handleAutoTranslate = async (targetLanguage: string) => {
    if (!onAutoTranslate) return;
    setTranslatingLanguage(targetLanguage);
    try {
      await onAutoTranslate(targetLanguage);
    } finally {
      setTranslatingLanguage(null);
    }
  };

  if (selectedLanguages.length === 0) {
    return (
      <div className="bg-bg-secondary/50 border border-border rounded-xl p-6 text-center">
        <svg
          className="w-12 h-12 mx-auto mb-3 text-text-tertiary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
          />
        </svg>
        <p className="text-text-secondary">
          Selecciona al menos un idioma para agregar traducciones
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {selectedLanguages.map((languageCode, index) => {
        const language = getLanguageByCode(languageCode);
        if (!language) return null;

        const translation = translations[languageCode] || {
          language_code: languageCode,
          title: '',
          description: '',
          instructions: '',
          tags: '',
        };

        const fieldErrors = errors[languageCode] || {};

        return (
          <div
            key={languageCode}
            className="bg-bg-secondary/80 backdrop-blur-sm border border-border rounded-2xl p-6 shadow-lg shadow-black/10"
          >
            {/* Header del idioma */}
            <div className="flex items-center justify-between gap-3 mb-6 pb-4 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-yellow/20 to-brand-yellow/5 border border-brand-yellow/30 flex items-center justify-center">
                  <span className="text-2xl">{language.flag}</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-text-primary">
                    {language.nativeName}
                  </h3>
                  <p className="text-xs text-text-secondary">
                    {language.name} ({language.code.toUpperCase()})
                  </p>
                </div>
              </div>

              {/* Botón de auto-traducción (solo si NO es español y existe la función) */}
              {languageCode !== 'es' && onAutoTranslate && (
                <button
                  type="button"
                  onClick={() => handleAutoTranslate(languageCode)}
                  disabled={translatingLanguage !== null}
                  className="px-3 py-2 bg-brand-purple/10 hover:bg-brand-purple/20 border border-brand-purple/30 text-brand-purple rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
                >
                  {translatingLanguage === languageCode ? (
                    <>
                      <svg
                        className="w-4 h-4 animate-spin"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      <span>Traduciendo...</span>
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                        />
                      </svg>
                      <span className="hidden sm:inline">Auto-traducir desde ES</span>
                      <span className="sm:hidden">Traducir</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Campos */}
            <div className="space-y-4">
              <Input
                label="Título"
                placeholder={`Título en ${language.nativeName}`}
                value={translation.title}
                onChange={(e) => onChange(languageCode, 'title', e.target.value)}
                error={fieldErrors.title}
                required
              />

              <Textarea
                label="Descripción"
                placeholder={`Descripción en ${language.nativeName}`}
                value={translation.description}
                onChange={(e) => onChange(languageCode, 'description', e.target.value)}
                error={fieldErrors.description}
                rows={3}
              />

              <Textarea
                label="Instrucciones"
                placeholder={`Instrucciones en ${language.nativeName}`}
                value={translation.instructions}
                onChange={(e) => onChange(languageCode, 'instructions', e.target.value)}
                error={fieldErrors.instructions}
                rows={3}
              />

              <Input
                label="Tags"
                placeholder="fiesta, grupo, diversión (separados por coma)"
                value={translation.tags}
                onChange={(e) => onChange(languageCode, 'tags', e.target.value)}
                helperText="Separa los tags con comas"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
