'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import Toast from '@/components/ui/Toast';
import EmojiOrIconPicker from '@/components/ui/EmojiOrIconPicker';
import LanguageSelector from '@/components/forms/LanguageSelector';
import ChallengeTranslationFields from '@/components/forms/ChallengeTranslationFields';
import { useToast } from '@/hooks/useToast';

interface ChallengeTranslation {
  language_code: string;
  content: string;
}

interface FormData {
  icon: string;
  is_active: boolean;
  is_premium: boolean;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function NewChallengePage({ params }: PageProps) {
  const resolvedParams = use(params);
  const categoryId = resolvedParams.id;
  const router = useRouter();
  const { toast, showToast, hideToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Idiomas seleccionados
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['es', 'en']);

  // Traducciones
  const [translations, setTranslations] = useState<Record<string, ChallengeTranslation>>({
    es: {
      language_code: 'es',
      content: '',
    },
    en: {
      language_code: 'en',
      content: '',
    },
  });

  // Datos del formulario principal
  const [formData, setFormData] = useState<FormData>({
    icon: '',
    is_active: true,
    is_premium: false,
  });

  const handleTranslationChange = (languageCode: string, content: string) => {
    setTranslations((prev) => ({
      ...prev,
      [languageCode]: {
        language_code: languageCode,
        content,
      },
    }));
  };

  const handleAutoTranslate = async (targetLanguage: string) => {
    try {
      // Obtener la traducción en español
      const esTranslation = translations['es'];

      if (!esTranslation || !esTranslation.content || esTranslation.content.trim() === '') {
        showToast({ message: 'Por favor, completa primero el contenido en español antes de auto-traducir', type: 'warning' });
        return;
      }

      // Llamar a la API de traducción
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
        // Actualizar la traducción
        setTranslations((prev) => ({
          ...prev,
          [targetLanguage]: {
            language_code: targetLanguage,
            content: result.translations[targetLanguage],
          },
        }));
      } else {
        showToast({ message: 'Error al traducir. Intenta de nuevo.', type: 'error' });
      }
    } catch (error) {
      console.error('Error al auto-traducir:', error);
      showToast({ message: 'Error al traducir. Intenta de nuevo.', type: 'error' });
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
        challenge_category_id: categoryId,
        icon: formData.icon || null,
        is_active: formData.is_active,
        is_premium: formData.is_premium,
      };

      // Preparar traducciones
      const translationsToInsert = selectedLanguages.map((lang) => ({
        language_code: lang,
        content: translations[lang].content,
      }));

      // Usar Server Action para crear el reto
      const { createChallenge } = await import('@/actions/challenges');
      const result = await createChallenge(challengeData, translationsToInsert);

      if (!result.success) {
        throw new Error(result.error);
      }

      // Éxito - redirigir
      showToast({ message: `¡Reto creado exitosamente!`, type: 'success' });
      setTimeout(() => {
        router.push(`/challenges/categories/${categoryId}/challenges`);
      }, 1000);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al crear el reto. Por favor, intenta de nuevo.';
      showToast({ message: errorMessage, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

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
                <h1 className="text-lg font-bold text-white tracking-tight">Nuevo Reto</h1>
                <p className="text-xs text-[#999999] font-medium">
                  Agregar reto a la categoría
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 lg:px-8 py-8">
        {/* Formulario Manual */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Emoji del Reto */}
          <div className="bg-[#2A2A2A] border border-[#333333] rounded-2xl p-6 shadow-lg shadow-black/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-linear-to-br from-[#BDF522]/20 to-[#BDF522]/5 border border-[#BDF522]/30 flex items-center justify-center text-2xl">
                🎨
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Icono o Emoji del Reto</h2>
                <p className="text-sm text-[#999999]">
                  Elige un emoji o un icono de Ionicons para representar este reto
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <EmojiOrIconPicker
                label="Icono / Emoji"
                value={formData.icon || ''}
                onChange={(value) => setFormData({ ...formData, icon: value || '' })}
                helperText="Selecciona un emoji o un icono para identificar visualmente este reto"
              />
            </div>
          </div>

          {/* Información General */}
          <div className="bg-[#2A2A2A] border border-[#333333] rounded-2xl p-6 shadow-lg shadow-black/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#BDF522]/20 to-[#BDF522]/5 border border-[#BDF522]/30 flex items-center justify-center">
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
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Información General</h2>
                <p className="text-sm text-[#999999]">
                  Configuración básica del reto
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {/* Checkboxes */}
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
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.checked })
                    }
                    className="w-5 h-5 rounded border-[#333333] text-[#BDF522] focus:ring-2 focus:ring-[#BDF522]/50 bg-[#1A1A1A]"
                  />
                  <span className="text-sm text-white font-medium">
                    Reto Activo
                  </span>
                </label>
              </div>
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
          <div>
            <ChallengeTranslationFields
              selectedLanguages={selectedLanguages}
              translations={translations}
              onChange={handleTranslationChange}
              onAutoTranslate={handleAutoTranslate}
            />
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
              {isLoading ? 'Guardando...' : 'Crear Reto'}
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
