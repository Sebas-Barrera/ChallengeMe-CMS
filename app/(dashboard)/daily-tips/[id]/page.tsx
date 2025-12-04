'use client';

import { useState, useEffect, use } from 'react';
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

interface DailyTip {
  id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditDailyTipPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const tipId = resolvedParams.id;
  const { supabase } = useAuth();
  const router = useRouter();
  const [tip, setTip] = useState<DailyTip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [translations, setTranslations] = useState<Record<string, Translation>>({});
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isTranslating, setIsTranslating] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);

  useEffect(() => {
    loadTip();
  }, [tipId]);

  const loadTip = async () => {
    try {
      setIsLoading(true);

      // Cargar el tip con sus traducciones
      const { data: tipData, error: tipError } = await supabase
        .from('daily_tips')
        .select(`
          *,
          daily_tip_translations (
            language_code,
            text
          )
        `)
        .eq('id', tipId)
        .single();

      if (tipError) throw tipError;

      setTip(tipData);
      setIsActive(tipData.is_active);

      // Cargar traducciones
      const translationsMap: Record<string, Translation> = {};
      const languages: string[] = [];

      tipData.daily_tip_translations.forEach((t: Translation) => {
        translationsMap[t.language_code] = t;
        languages.push(t.language_code);
      });

      // Asegurar que español e inglés estén presentes (obligatorios)
      const requiredLanguages = ['es', 'en'];
      requiredLanguages.forEach((lang) => {
        if (!languages.includes(lang)) {
          languages.push(lang);
          translationsMap[lang] = {
            language_code: lang,
            text: '',
          };
        }
      });

      setTranslations(translationsMap);
      setSelectedLanguages(languages);
    } catch (error) {
      console.error('Error loading tip:', error);
      setToast({ message: 'Error al cargar el consejo', type: 'error' });
      setTimeout(() => {
        router.push('/daily-tips');
      }, 2000);
    } finally {
      setIsLoading(false);
    }
  };

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
      // 1. Actualizar el daily tip
      const { error: tipError } = await supabase
        .from('daily_tips')
        .update({
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tipId);

      if (tipError) throw tipError;

      // 2. Eliminar las traducciones existentes
      const { error: deleteError } = await supabase
        .from('daily_tip_translations')
        .delete()
        .eq('tip_id', tipId);

      if (deleteError) throw deleteError;

      // 3. Insertar las nuevas traducciones
      const translationsToInsert = selectedLanguages.map((lang) => ({
        tip_id: tipId,
        language_code: lang,
        text: translations[lang].text.trim(),
      }));

      const { error: insertError } = await supabase
        .from('daily_tip_translations')
        .insert(translationsToInsert);

      if (insertError) throw insertError;

      // Mostrar éxito y redirigir
      setToast({ message: '¡Consejo actualizado exitosamente!', type: 'success' });
      setTimeout(() => {
        router.push('/daily-tips');
      }, 1500);
    } catch (error) {
      console.error('Error updating daily tip:', error);
      setToast({ message: 'Error al actualizar el consejo. Por favor, intenta nuevamente.', type: 'error' });
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  if (!tip) {
    return null;
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Link
              href="/daily-tips"
              className="text-text-tertiary hover:text-text-primary transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-4xl font-bold text-text-primary">Editar Consejo del Día</h1>
          </div>
          <p className="text-text-secondary ml-9">
            Modifica el consejo motivacional en múltiples idiomas
          </p>
        </div>

        {/* Info del consejo */}
        <div className="bg-brand-blue/10 border border-brand-blue/30 rounded-2xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-brand-blue mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm text-text-primary">
                <span className="font-medium">Creado:</span> {new Date(tip.created_at).toLocaleString('es-ES')}
              </p>
              <p className="text-sm text-text-primary">
                <span className="font-medium">Última actualización:</span> {new Date(tip.updated_at).toLocaleString('es-ES')}
              </p>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Estado */}
          <div className="bg-bg-secondary/80 backdrop-blur-sm border border-border rounded-2xl p-6 shadow-lg shadow-black/10">
            <h3 className="text-lg font-bold text-text-primary mb-4">Estado</h3>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 focus:ring-offset-bg-secondary ${
                  isActive ? 'bg-success' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    isActive ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
              <div>
                <p className="text-sm font-medium text-text-primary">
                  {isActive ? 'Activo' : 'Inactivo'}
                </p>
                <p className="text-xs text-text-secondary">
                  {isActive
                    ? 'Este consejo será visible para los usuarios'
                    : 'Este consejo no será visible para los usuarios'}
                </p>
              </div>
            </div>
          </div>

          {/* Idiomas */}
          <div className="bg-bg-secondary/80 backdrop-blur-sm border border-border rounded-2xl p-6 shadow-lg shadow-black/10">
            <LanguageSelector
              selectedLanguages={selectedLanguages}
              onChange={handleLanguageChange}
            />
          </div>

          {/* Traducciones */}
          <div className="bg-bg-secondary/80 backdrop-blur-sm border border-border rounded-2xl p-6 shadow-lg shadow-black/10">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-text-primary mb-1">Contenido del Consejo</h3>
              <p className="text-sm text-text-secondary">
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
          <div className="flex gap-4 justify-between sticky bottom-6 bg-bg-primary/80 backdrop-blur-sm border border-border rounded-2xl p-4 shadow-2xl">
            <div className="flex gap-4">
              <button
                type="button"
                onClick={handleAutoTranslateAll}
                disabled={isTranslating || isSaving || !translations['es']?.text}
                className="px-6 py-3 bg-brand-purple/10 hover:bg-brand-purple/20 border border-brand-purple/30 text-brand-purple rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                className="px-6 py-3 bg-bg-tertiary hover:bg-border border border-border text-text-primary rounded-xl font-medium transition-all duration-200"
              >
                Cancelar
              </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-3 bg-brand-blue hover:bg-brand-blue/90 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-brand-blue/30"
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
                  <span>Guardar Cambios</span>
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
