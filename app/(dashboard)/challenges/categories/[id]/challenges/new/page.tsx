'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import EmojiPicker from '@/components/ui/EmojiPicker';
import LanguageSelector from '@/components/forms/LanguageSelector';
import ChallengeTranslationFields from '@/components/forms/ChallengeTranslationFields';

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
        alert('Por favor, completa primero el contenido en español antes de auto-traducir');
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
        alert('Error al traducir. Intenta de nuevo.');
      }
    } catch (error) {
      console.error('Error al auto-traducir:', error);
      alert('Error al traducir. Intenta de nuevo.');
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
        alert('Por favor, completa el contenido para todos los idiomas seleccionados');
        setIsLoading(false);
        return;
      }

      // Usar Supabase client para insertar
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // 1. Insertar el challenge
      const { data: challenge, error: challengeError } = await supabase
        .from('challenges')
        .insert({
          challenge_category_id: categoryId,
          icon: formData.icon || null,
          is_active: formData.is_active,
          is_premium: formData.is_premium,
        })
        .select('id')
        .single();

      if (challengeError) {
        throw new Error(challengeError.message);
      }

      // 2. Insertar traducciones
      const translationsToInsert = selectedLanguages.map((lang) => ({
        challenge_id: challenge.id,
        language_code: lang,
        content: translations[lang].content,
        icon: formData.icon || null,
      }));

      const { error: translationsError } = await supabase
        .from('challenge_translations')
        .insert(translationsToInsert);

      if (translationsError) {
        // Si falla, eliminar el challenge
        await supabase.from('challenges').delete().eq('id', challenge.id);
        throw new Error(translationsError.message);
      }

      // Éxito - redirigir
      alert(`¡Reto creado exitosamente! ID: ${challenge.id}`);
      router.push(`/challenges/categories/${categoryId}/challenges`);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al crear el reto. Por favor, intenta de nuevo.';
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="bg-bg-secondary/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex-shrink-0">
                <Image
                  src="/logos/ChallengeMe-05.png"
                  alt="ChallengeMe"
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </Link>
              <Link
                href={`/challenges/categories/${categoryId}/challenges`}
                className="w-10 h-10 rounded-xl bg-bg-tertiary hover:bg-border border border-border flex items-center justify-center transition-colors"
              >
                <svg
                  className="w-5 h-5 text-text-primary"
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
              <div>
                <h1 className="text-lg font-bold text-text-primary">Nuevo Reto</h1>
                <p className="text-xs text-text-secondary">
                  Agregar reto a la categoría
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Emoji del Reto */}
          <div className="bg-bg-secondary/80 backdrop-blur-sm border border-border rounded-2xl p-6 shadow-lg shadow-black/10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-yellow/20 to-brand-yellow/5 border border-brand-yellow/30 flex items-center justify-center text-2xl">
                {formData.icon || '🎯'}
              </div>
              <div>
                <h2 className="text-xl font-bold text-text-primary">Emoji del Reto</h2>
                <p className="text-sm text-text-secondary">
                  Selecciona el emoji que identificará este reto
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <EmojiPicker
                label="Emoji"
                value={formData.icon || ''}
                onChange={(value) => setFormData({ ...formData, icon: value || '' })}
                helperText="Selecciona un emoji para identificar visualmente este reto"
              />
            </div>
          </div>

          {/* Información General */}
          <div className="bg-bg-secondary/80 backdrop-blur-sm border border-border rounded-2xl p-6 shadow-lg shadow-black/10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-yellow/20 to-brand-yellow/5 border border-brand-yellow/30 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-brand-yellow"
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
                <h2 className="text-xl font-bold text-text-primary">Información General</h2>
                <p className="text-sm text-text-secondary">
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
                    className="w-5 h-5 rounded border-border text-brand-yellow focus:ring-2 focus:ring-brand-yellow/50 bg-bg-tertiary"
                  />
                  <span className="text-sm text-text-primary font-medium">
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
                    className="w-5 h-5 rounded border-border text-brand-yellow focus:ring-2 focus:ring-brand-yellow/50 bg-bg-tertiary"
                  />
                  <span className="text-sm text-text-primary font-medium">
                    Reto Activo
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Idiomas */}
          <div className="bg-bg-secondary/80 backdrop-blur-sm border border-border rounded-2xl p-6 shadow-lg shadow-black/10">
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
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
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
  );
}
