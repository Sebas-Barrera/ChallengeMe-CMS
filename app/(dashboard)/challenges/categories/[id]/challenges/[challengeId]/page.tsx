'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import Toast from '@/components/ui/Toast';
import EmojiOrIconPicker from '@/components/ui/EmojiOrIconPicker';
import LanguageSelector from '@/components/forms/LanguageSelector';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import { getLanguageByCode } from '@/constants/languages';
import * as IoIcons from 'react-icons/io5';

interface Translation {
  language_code: string;
  content: string;
}

interface FormData {
  icon: string | null;
  is_active: boolean;
  is_premium: boolean;
}

interface PageProps {
  params: Promise<{ id: string; challengeId: string }>;
}

// Función helper para convertir nombre de ionicon a React Icon
const convertToReactIconName = (ionicName: string): string => {
  return 'Io' + ionicName
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
};

export default function EditChallengePage({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const categoryId = resolvedParams.id;
  const challengeId = resolvedParams.challengeId;
  const { supabase } = useAuth();
  const { toast, showToast, hideToast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Idiomas seleccionados
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

  // Traducciones
  const [translations, setTranslations] = useState<Record<string, Translation>>({});

  // Auto-traducción
  const [translatingLanguage, setTranslatingLanguage] = useState<string | null>(null);

  // Datos del formulario principal
  const [formData, setFormData] = useState<FormData>({
    icon: null,
    is_active: true,
    is_premium: false,
  });

  // Cargar datos del reto
  useEffect(() => {
    fetchChallengeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challengeId]);

  const fetchChallengeData = async () => {
    try {
      setIsLoadingData(true);

      // Obtener reto con sus traducciones
      const { data: challengeData, error: challengeError } = await supabase
        .from('challenges')
        .select(`
          *,
          challenge_translations (
            language_code,
            content
          )
        `)
        .eq('id', challengeId)
        .single();

      // Verificar si el reto no existe
      if (challengeError || !challengeData) {
        // Redirigir a la página not-found que automáticamente llevará a /challenges/categories
        notFound();
      }

      // Llenar formData
      setFormData({
        icon: challengeData.icon,
        is_active: challengeData.is_active,
        is_premium: challengeData.is_premium,
      });

      // Llenar traducciones
      const translationsData: Record<string, Translation> = {};
      const languages: string[] = [];

      challengeData.challenge_translations.forEach((trans: any) => {
        languages.push(trans.language_code);
        translationsData[trans.language_code] = {
          language_code: trans.language_code,
          content: trans.content || '',
        };
      });

      setSelectedLanguages(languages);
      setTranslations(translationsData);
    } catch (error: any) {
      console.error('Error al cargar reto:', error);
      // Si hay un error al cargar, redirigir a not-found
      notFound();
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleTranslationChange = (languageCode: string, value: string) => {
    setTranslations((prev) => ({
      ...prev,
      [languageCode]: {
        language_code: languageCode,
        content: value,
      },
    }));
  };

  const handleAutoTranslate = async (targetLanguage: string) => {
    try {
      setTranslatingLanguage(targetLanguage);

      // Obtener la traducción en español
      const esTranslation = translations['es'];

      if (!esTranslation || !esTranslation.content || esTranslation.content.trim() === '') {
        showToast({ message: 'Por favor, completa primero el contenido en español antes de auto-traducir', type: 'warning' });
        return;
      }

      // Hacer la llamada a la API de traducción
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: esTranslation.content,
          targetLanguages: [targetLanguage],
        }),
      });

      const result = await response.json();

      if (result.success && result.translations[targetLanguage]) {
        setTranslations((prev) => ({
          ...prev,
          [targetLanguage]: {
            language_code: targetLanguage,
            content: result.translations[targetLanguage],
          },
        }));
      } else {
        throw new Error(result.error || 'Error al traducir');
      }
    } catch (error: any) {
      console.error('Error al auto-traducir:', error);
      showToast({ message: 'Error al traducir: ' + (error.message || 'Intenta de nuevo'), type: 'error' });
    } finally {
      setTranslatingLanguage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validar que todas las traducciones tengan contenido
      const missingContent = selectedLanguages.filter(
        (lang) => !translations[lang]?.content || translations[lang].content.trim() === ''
      );

      if (missingContent.length > 0) {
        showToast({ message: 'Por favor, completa el contenido para todos los idiomas seleccionados', type: 'warning' });
        setIsLoading(false);
        return;
      }

      // Preparar datos del reto
      const challengeData = {
        icon: formData.icon || null,
        is_active: formData.is_active,
        is_premium: formData.is_premium,
      };

      // Preparar traducciones
      const translationsToInsert = selectedLanguages.map((lang) => ({
        language_code: lang,
        content: translations[lang].content,
      }));

      // Usar Server Action para actualizar el reto
      const { updateChallenge } = await import('@/actions/challenges');
      const result = await updateChallenge(challengeId, challengeData, translationsToInsert);

      if (!result.success) {
        throw new Error(result.error);
      }

      // Éxito - redirigir
      showToast({ message: '¡Reto actualizado exitosamente!', type: 'success' });
      setTimeout(() => {
        router.push(`/challenges/categories/${categoryId}/challenges`);
      }, 1000);
    } catch (error: any) {
      console.error('Error:', error);
      showToast({ message: error.message || 'Error al actualizar el reto. Por favor, intenta de nuevo.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-[#BDF522]/30 border-t-[#BDF522] rounded-full animate-spin"></div>
          <p className="text-[#999999]">Cargando reto...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1A1A] relative overflow-hidden">
      {/* Formas decorativas de fondo */}
      <div className="absolute top-0 left-0 w-full pointer-events-none opacity-15">
        <Image
          src="/resources/top-shapes.png"
          alt=""
          width={1920}
          height={300}
          className="w-full h-auto"
          priority
        />
      </div>
      <div className="absolute bottom-0 left-0 w-full pointer-events-none opacity-15">
        <Image
          src="/resources/bottom-shapes.png"
          alt=""
          width={1920}
          height={300}
          className="w-full h-auto"
          priority
        />
      </div>

      <div className="relative z-10">
      {/* Header */}
      <header className="bg-[#2A2A2A]/80 backdrop-blur-sm border-b border-[#333333] sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <Link href="/" className="shrink-0">
                <div className="relative w-14 h-14 flex items-center justify-center">
                  <Image
                    src="/logos/ChallengeMe-05.png"
                    alt="ChallengeMe"
                    width={56}
                    height={56}
                    className="object-contain"
                  />
                </div>
              </Link>
              <Link
                href={`/challenges/categories/${categoryId}/challenges`}
                className="w-10 h-10 rounded-xl bg-[#1A1A1A] hover:bg-[#333333] border border-[#333333] flex items-center justify-center transition-colors"
              >
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </Link>
              <div className="h-10 w-px bg-[#333333]"></div>
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight">Editar Reto</h1>
                <p className="text-xs text-[#999999] font-medium">Modificar reto existente</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Icono o Emoji del Reto */}
          <div className="bg-[#2A2A2A] border border-[#333333] rounded-2xl p-6 shadow-lg shadow-black/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-linear-to-br from-[#BDF522]/20 to-[#BDF522]/5 border border-[#BDF522]/30 flex items-center justify-center">
                {(() => {
                  if (!formData.icon) return null;

                  // Intentar convertir a React Icon
                  const IconComponent = IoIcons[convertToReactIconName(formData.icon) as keyof typeof IoIcons];

                  // Si existe el componente, es un ionicon
                  if (IconComponent) {
                    return <IconComponent size={28} className="text-[#BDF522]" />;
                  }

                  // Si no existe el componente, es un emoji
                  return <span className="text-2xl">{formData.icon}</span>;
                })()}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Icono o Emoji del Reto</h2>
                <p className="text-sm text-[#999999]">Elige un emoji o un icono de Ionicons para representar este reto</p>
              </div>
            </div>

            <EmojiOrIconPicker
              label="Icono / Emoji"
              value={formData.icon || ''}
              onChange={(value) => setFormData({ ...formData, icon: value || null })}
              helperText="Selecciona un emoji o un icono para identificar visualmente este reto"
            />
          </div>

          {/* Información General */}
          <div className="bg-[#2A2A2A] border border-[#333333] rounded-2xl p-6 shadow-lg shadow-black/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-linear-to-br from-[#BDF522]/20 to-[#BDF522]/5 border border-[#BDF522]/30 flex items-center justify-center">
                {formData.icon ? (
                  (() => {
                    // Intentar convertir a React Icon
                    const IconComponent = IoIcons[convertToReactIconName(formData.icon) as keyof typeof IoIcons];

                    // Si existe el componente, es un ionicon
                    if (IconComponent) {
                      return <IconComponent size={28} className="text-[#BDF522]" />;
                    }

                    // Si no existe el componente, es un emoji
                    return <span className="text-2xl">{formData.icon}</span>;
                  })()
                ) : (
                  <svg
                    className="w-6 h-6 text-[#BDF522]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Información General</h2>
                <p className="text-sm text-[#999999]">Configuración básica del reto</p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_premium}
                  onChange={(e) =>
                    setFormData({ ...formData, is_premium: e.target.checked })
                  }
                  className="w-5 h-5 rounded border-[#333333] text-[#BDF522] focus:ring-2 focus:ring-[#BDF522]/50 bg-[#1A1A1A]"
                />
                <span className="text-sm text-white font-medium">
                  Es contenido Premium
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 rounded border-[#333333] text-[#BDF522] focus:ring-2 focus:ring-[#BDF522]/50 bg-[#1A1A1A]"
                />
                <span className="text-sm text-white font-medium">Reto Activo</span>
              </label>
            </div>
          </div>

          {/* Idiomas */}
          <div className="bg-[#2A2A2A] border border-[#333333] rounded-2xl p-6 shadow-lg shadow-black/20">
            <LanguageSelector
              selectedLanguages={selectedLanguages}
              onChange={(languages) => {
                setSelectedLanguages(languages);
                // Agregar traducciones vacías para nuevos idiomas
                const newTranslations = { ...translations };
                languages.forEach((lang) => {
                  if (!newTranslations[lang]) {
                    newTranslations[lang] = {
                      language_code: lang,
                      content: '',
                    };
                  }
                });
                setTranslations(newTranslations);
              }}
            />
          </div>

          {/* Traducciones */}
          <div className="space-y-6">
            {selectedLanguages.length === 0 ? (
              <div className="bg-[#2A2A2A]/50 border border-[#333333] rounded-xl p-6 text-center">
                <svg
                  className="w-12 h-12 mx-auto mb-3 text-[#666666]"
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
                <p className="text-[#999999]">
                  Selecciona al menos un idioma para agregar traducciones
                </p>
              </div>
            ) : (
              selectedLanguages.map((languageCode) => {
                const language = getLanguageByCode(languageCode);
                if (!language) return null;

                const translation = translations[languageCode] || {
                  language_code: languageCode,
                  content: '',
                };

                return (
                  <div
                    key={languageCode}
                    className="bg-[#2A2A2A] border border-[#333333] rounded-2xl p-6 shadow-lg shadow-black/20"
                  >
                    {/* Header del idioma */}
                    <div className="flex items-center justify-between gap-3 mb-6 pb-4 border-b border-[#333333]/50">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-linear-to-br from-[#BDF522]/20 to-[#BDF522]/5 border border-[#BDF522]/30 flex items-center justify-center">
                          <span className="text-2xl">{language.flag}</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">
                            {language.nativeName}
                          </h3>
                          <p className="text-xs text-[#999999]">
                            {language.name} ({language.code.toUpperCase()})
                          </p>
                        </div>
                      </div>

                      {/* Botón de auto-traducción */}
                      {languageCode !== 'es' && (
                        <button
                          type="button"
                          onClick={() => handleAutoTranslate(languageCode)}
                          disabled={translatingLanguage !== null}
                          className="px-3 py-2 bg-[#7B46F8]/10 hover:bg-[#7B46F8]/20 border border-[#7B46F8]/30 text-[#7B46F8] rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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

                    {/* Campo de contenido */}
                    <Textarea
                      label="Contenido del Reto"
                      placeholder={`Escribe el contenido del reto en ${language.nativeName}...`}
                      value={translation.content}
                      onChange={(e) => handleTranslationChange(languageCode, e.target.value)}
                      rows={4}
                      required
                      helperText="Escribe el desafío que los usuarios verán en la app"
                    />
                  </div>
                );
              })
            )}
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-[#333333]">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={isLoading}>
              {isLoading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </main>
      </div>

      {/* Toast notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={hideToast}
        />
      )}
    </div>
  );
}
