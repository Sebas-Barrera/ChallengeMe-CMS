'use client';

import { SUPPORTED_LANGUAGES } from '@/constants/languages';

interface LanguageSelectorProps {
  selectedLanguages: string[];
  onChange: (languages: string[]) => void;
}

export default function LanguageSelector({
  selectedLanguages,
  onChange,
}: LanguageSelectorProps) {
  // Idiomas obligatorios
  const requiredLanguages = ['es', 'en'];

  const toggleLanguage = (code: string) => {
    // No permitir deseleccionar idiomas obligatorios
    if (requiredLanguages.includes(code)) {
      return;
    }

    if (selectedLanguages.includes(code)) {
      // No permitir deseleccionar el último idioma
      if (selectedLanguages.length === 1) return;
      onChange(selectedLanguages.filter((lang) => lang !== code));
    } else {
      onChange([...selectedLanguages, code]);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-text-primary mb-3">
        Idiomas <span className="text-error">*</span>
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {SUPPORTED_LANGUAGES.map((language) => {
          const isSelected = selectedLanguages.includes(language.code);
          const isRequired = requiredLanguages.includes(language.code);
          const isOnlySelected = isSelected && selectedLanguages.length === 1;

          return (
            <button
              key={language.code}
              type="button"
              onClick={() => toggleLanguage(language.code)}
              disabled={isOnlySelected || isRequired}
              className={`
                relative px-4 py-3 rounded-xl border-2 transition-all duration-200
                ${
                  isSelected
                    ? 'border-brand-yellow bg-brand-yellow/10 shadow-lg shadow-brand-yellow/20'
                    : 'border-border bg-bg-tertiary hover:border-border-light'
                }
                ${isOnlySelected || isRequired ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'}
                group
              `}
            >
              {/* Checkmark o Required Badge */}
              {isSelected && (
                <div className={`absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center ${
                  isRequired ? 'bg-brand-blue' : 'bg-brand-yellow'
                }`}>
                  <svg
                    className={`w-3 h-3 ${isRequired ? 'text-white' : 'text-black'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}

              {/* Badge de obligatorio */}
              {isRequired && (
                <div className="absolute -top-2 -left-2">
                  <span className="px-2 py-0.5 bg-brand-blue text-white text-xs font-bold rounded-md shadow-lg">
                    Obligatorio
                  </span>
                </div>
              )}

              <div className="text-center">
                <div className="text-2xl mb-1">{language.flag}</div>
                <p className={`text-sm font-medium ${
                  isSelected ? 'text-text-primary' : 'text-text-secondary'
                }`}>
                  {language.nativeName}
                </p>
                <p className="text-xs text-text-tertiary">{language.code.toUpperCase()}</p>
              </div>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-sm text-text-tertiary">
        <span className="font-medium text-brand-blue">Español e Inglés son obligatorios.</span> Puedes agregar idiomas adicionales.
      </p>
    </div>
  );
}
