'use client';

import { getLanguageByCode } from '@/constants/languages';
import Input from '@/components/ui/Input';

interface DeepTalkCategoryTranslation {
  language_code: string;
  name: string;
}

interface DeepTalkCategoryTranslationFieldsProps {
  selectedLanguages: string[];
  translations: Record<string, DeepTalkCategoryTranslation>;
  onChange: (languageCode: string, name: string) => void;
  onAutoTranslate?: (targetLanguage: string) => void;
  errors?: Record<string, string>;
}

export default function DeepTalkCategoryTranslationFields({
  selectedLanguages,
  translations,
  onChange,
  onAutoTranslate,
  errors = {},
}: DeepTalkCategoryTranslationFieldsProps) {
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
          name: '',
        };

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

              {/* Botón de auto-traducir (solo si no es español y hay función de traducción) */}
              {languageCode !== 'es' && onAutoTranslate && (
                <button
                  type="button"
                  onClick={() => onAutoTranslate(languageCode)}
                  className="px-4 py-2 bg-brand-blue/10 hover:bg-brand-blue/20 border border-brand-blue/30 text-brand-blue rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 hover:scale-105"
                >
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
                  Auto-traducir desde ES
                </button>
              )}
            </div>

            {/* Campo de nombre */}
            <Input
              label="Nombre de la Categoría"
              placeholder={`Nombre en ${language.nativeName}`}
              value={translation.name}
              onChange={(e) => onChange(languageCode, e.target.value)}
              error={errors[languageCode]}
              required
              helperText="Nombre visible de la categoría para los usuarios"
            />
          </div>
        );
      })}
    </div>
  );
}
