'use client';

import { useState } from 'react';
import { getLanguageByCode } from '@/constants/languages';
import Textarea from '@/components/ui/Textarea';

interface Translation {
  language_code: string;
  text: string;
}

interface DailyTipTranslationFieldsProps {
  selectedLanguages: string[];
  translations: Record<string, Translation>;
  onChange: (languageCode: string, value: string) => void;
  errors?: Record<string, string>;
}

export default function DailyTipTranslationFields({
  selectedLanguages,
  translations,
  onChange,
  errors = {},
}: DailyTipTranslationFieldsProps) {

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
      {selectedLanguages.map((languageCode) => {
        const language = getLanguageByCode(languageCode);
        if (!language) return null;

        const translation = translations[languageCode] || {
          language_code: languageCode,
          text: '',
        };

        const fieldError = errors[languageCode];

        return (
          <div
            key={languageCode}
            className="bg-bg-secondary/80 backdrop-blur-sm border border-border rounded-2xl p-6 shadow-lg shadow-black/10"
          >
            {/* Header del idioma */}
            <div className="flex items-center justify-between gap-3 mb-6 pb-4 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-blue/20 to-brand-blue/5 border border-brand-blue/30 flex items-center justify-center">
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
            </div>

            {/* Campo de texto */}
            <div>
              <Textarea
                label="Consejo del día"
                placeholder={`Escribe el consejo en ${language.nativeName}...`}
                value={translation.text}
                onChange={(e) => onChange(languageCode, e.target.value)}
                error={fieldError}
                rows={4}
                required
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
