'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LanguageSelector from '@/components/forms/LanguageSelector';
import DailyTipTranslationFields from '@/components/forms/DailyTipTranslationFields';
import { translateText } from '@/lib/translate';
import Toast from '@/components/ui/Toast';

interface Translation {
  language_code: string;
  text: string;
}

export default function NewDailyTipPage() {
  const { supabase } = useAuth();
  const router = useRouter();
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['es', 'en']);
  const [translations, setTranslations] = useState<Record<string, Translation>>({
    es: { language_code: 'es', text: '' },
    en: { language_code: 'en', text: '' },
  });
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isTranslating, setIsTranslating] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);

  const handleLanguageChange = (languages: string[]) => {
    setSelectedLanguages(languages);

    // Agregar traducciones para nuevos idiomas
    const newTranslations = { ...translations };
    languages.forEach((lang) => {
      if (!newTranslations[lang]) {
        newTranslations[lang] = {
          language_code: lang,
          text: '',
        };
      }
    });

    // Remover traducciones de idiomas no seleccionados
    Object.keys(newTranslations).forEach((lang) => {
      if (!languages.includes(lang)) {
        delete newTranslations[lang];
      }
    });

    setTranslations(newTranslations);
  };

  const handleTranslationChange = (languageCode: string, value: string) => {
    setTranslations((prev) => ({
      ...prev,
      [languageCode]: {
        language_code: languageCode,
        text: value,
      },
    }));

    // Limpiar error de este campo
    if (errors[languageCode]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[languageCode];
        return newErrors;
      });
    }
  };

  const handleAutoTranslateAll = async () => {
    const esTranslation = translations['es'];
    if (!esTranslation?.text) {
      setToast({ message: 'Primero debes escribir el consejo en español para poder auto-traducir', type: 'warning' });
      return;
    }

    // Obtener idiomas que no son español
    const languagesToTranslate = selectedLanguages.filter(lang => lang !== 'es');

    if (languagesToTranslate.length === 0) {
      setToast({ message: 'No hay otros idiomas seleccionados para traducir', type: 'warning' });
      return;
    }

    setIsTranslating(true);

    try {
      // Traducir a cada idioma
      for (const targetLang of languagesToTranslate) {
        const translatedText = await translateText({
          text: esTranslation.text,
          targetLanguage: targetLang,
          sourceLanguage: 'es',
        });

        // Actualizar la traducción
        setTranslations((prev) => ({
          ...prev,
          [targetLang]: {
            language_code: targetLang,
            text: translatedText,
          },
        }));
      }

      setToast({ message: '¡Traducciones completadas exitosamente!', type: 'success' });
    } catch (error) {
      console.error('Error translating:', error);
      setToast({ message: 'Error al traducir. Verifica tu conexión y la configuración de la API de Google Translate.', type: 'error' });
    } finally {
      setIsTranslating(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validar que español e inglés estén presentes y completos
    const requiredLanguages = ['es', 'en'];
    requiredLanguages.forEach((lang) => {
      if (!selectedLanguages.includes(lang)) {
        newErrors[lang] = `${lang === 'es' ? 'Español' : 'Inglés'} es obligatorio`;
      } else {
        const translation = translations[lang];
        if (!translation?.text?.trim()) {
          newErrors[lang] = `El texto en ${lang === 'es' ? 'español' : 'inglés'} es requerido`;
        }
      }
    });

    // Validar el resto de idiomas seleccionados
    selectedLanguages.forEach((lang) => {
      if (!requiredLanguages.includes(lang)) {
        const translation = translations[lang];
        if (!translation?.text?.trim()) {
          newErrors[lang] = 'El texto del consejo es requerido';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setToast({ message: 'Por favor, completa todos los campos requeridos', type: 'warning' });
      return;
    }

    setIsSaving(true);

    try {
      // 1. Crear el daily tip
      const { data: tipData, error: tipError } = await supabase
        .from('daily_tips')
        .insert({
          is_active: isActive,
        })
        .select()
        .single();

      if (tipError) {
        console.error('Error al crear daily tip:', tipError);
        throw new Error(tipError.message || 'Error al crear el consejo');
      }

      if (!tipData) {
        throw new Error('No se pudo crear el consejo');
      }

      // 2. Crear las traducciones
      const translationsToInsert = selectedLanguages.map((lang) => ({
        tip_id: tipData.id,
        language_code: lang,
        text: translations[lang].text.trim(),
      }));

      const { error: translationsError } = await supabase
        .from('daily_tip_translations')
        .insert(translationsToInsert);

      if (translationsError) {
        console.error('Error al crear traducciones:', translationsError);
        throw new Error(translationsError.message || 'Error al crear las traducciones');
      }

      // Mostrar éxito y redirigir
      setToast({ message: '¡Consejo creado exitosamente!', type: 'success' });
      setTimeout(() => {
        router.push('/daily-tips');
      }, 1500);
    } catch (error) {
      console.error('Error creating daily tip:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al crear el consejo. Por favor, intenta nuevamente.';
      setToast({ message: errorMessage, type: 'error' });
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Link
              href="/daily-tips"
              className="text-[#999999] hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-4xl font-bold text-white">Nuevo Consejo del Día</h1>
          </div>
          <p className="text-[#CCCCCC] ml-9">
            Crea un nuevo consejo motivacional en múltiples idiomas
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Estado */}
          <div className="bg-[#2A2A2A] border border-[#333333] rounded-2xl p-6 shadow-lg shadow-black/20">
            <h3 className="text-lg font-bold text-white mb-4">Estado</h3>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#FD8616] focus:ring-offset-2 focus:ring-offset-[#2A2A2A] ${
                  isActive ? 'bg-[#BDF522]' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    isActive ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
              <div>
                <p className="text-sm font-medium text-white">
                  {isActive ? 'Activo' : 'Inactivo'}
                </p>
                <p className="text-xs text-[#999999]">
                  {isActive
                    ? 'Este consejo será visible para los usuarios'
                    : 'Este consejo no será visible para los usuarios'}
                </p>
              </div>
            </div>
          </div>

          {/* Idiomas */}
          <div className="bg-[#2A2A2A] border border-[#333333] rounded-2xl p-6 shadow-lg shadow-black/20">
            <LanguageSelector
              selectedLanguages={selectedLanguages}
              onChange={handleLanguageChange}
            />
          </div>

          {/* Traducciones */}
          <div className="bg-[#2A2A2A] border border-[#333333] rounded-2xl p-6 shadow-lg shadow-black/20">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-white mb-1">Contenido del Consejo</h3>
              <p className="text-sm text-[#999999]">
                Escribe el consejo motivacional en cada idioma seleccionado
              </p>
            </div>
            <DailyTipTranslationFields
              selectedLanguages={selectedLanguages}
              translations={translations}
              onChange={handleTranslationChange}
              errors={errors}
            />
          </div>

          {/* Botones de acción */}
          <div className="flex gap-4 justify-between sticky bottom-6 bg-[#2A2A2A]/95 backdrop-blur-sm border border-[#333333] rounded-2xl p-4 shadow-2xl">
            <div className="flex gap-4">
              <button
                type="button"
                onClick={handleAutoTranslateAll}
                disabled={isTranslating || isSaving || !translations['es']?.text}
                className="px-6 py-3 bg-[#7B46F8]/10 hover:bg-[#7B46F8]/20 border border-[#7B46F8]/30 text-[#7B46F8] rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isTranslating ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5"
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
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                      />
                    </svg>
                    <span>Traducir Todo</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex gap-4">
              <Link
                href="/daily-tips"
                className="px-6 py-3 bg-[#1A1A1A] hover:bg-[#333333] border border-[#333333] text-white rounded-xl font-medium transition-all duration-200"
              >
                Cancelar
              </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-3 bg-[#FD8616] hover:bg-[#FD8616]/90 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-[#FD8616]/30"
            >
              {isSaving ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
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
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Crear Consejo</span>
                </>
              )}
            </button>
            </div>
          </div>
        </form>
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
