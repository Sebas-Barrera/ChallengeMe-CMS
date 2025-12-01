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

  // Modo de entrada: manual o CSV
  const [inputMode, setInputMode] = useState<'manual' | 'csv'>('manual');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvProgress, setCsvProgress] = useState<{ current: number; total: number; errors: string[] }>({ current: 0, total: 0, errors: [] });

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

  const handleCSVUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!csvFile) {
      alert('Por favor selecciona un archivo CSV');
      return;
    }

    setIsLoading(true);
    setCsvProgress({ current: 0, total: 0, errors: [] });

    try {
      // Leer el archivo CSV
      const text = await csvFile.text();
      const lines = text.split('\n').filter(line => line.trim());

      if (lines.length < 2) {
        alert('El archivo CSV está vacío o no tiene datos');
        setIsLoading(false);
        return;
      }

      // Parsear header
      const headers = lines[0].split(',').map(h => h.trim());
      const requiredHeaders = ['icon', 'is_premium', 'is_active', 'content_es', 'content_en'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

      if (missingHeaders.length > 0) {
        alert(`Faltan columnas requeridas en el CSV: ${missingHeaders.join(', ')}`);
        setIsLoading(false);
        return;
      }

      const challenges = [];
      const errors: string[] = [];

      // Parsear datos
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        const values = line.split(',').map(v => v.trim());
        const row: Record<string, string> = {};

        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });

        // Validar datos requeridos
        if (!row.content_es || !row.content_en) {
          errors.push(`Fila ${i + 1}: Falta contenido en español o inglés`);
          continue;
        }

        challenges.push({
          icon: row.icon || null,
          is_premium: row.is_premium === 'true' || row.is_premium === '1',
          is_active: row.is_active === 'true' || row.is_active === '1',
          translations: {
            es: row.content_es,
            en: row.content_en,
            fr: row.content_fr || '',
            it: row.content_it || '',
            pt: row.content_pt || '',
          }
        });
      }

      if (challenges.length === 0) {
        alert('No se encontraron retos válidos en el CSV');
        setIsLoading(false);
        return;
      }

      setCsvProgress({ current: 0, total: challenges.length, errors });

      // Usar Supabase client para insertar
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      let successCount = 0;
      const insertErrors: string[] = [...errors];

      // Insertar retos uno por uno
      for (let i = 0; i < challenges.length; i++) {
        const challenge = challenges[i];
        setCsvProgress(prev => ({ ...prev, current: i + 1 }));

        try {
          // 1. Insertar el challenge
          const { data: challengeData, error: challengeError } = await supabase
            .from('challenges')
            .insert({
              challenge_category_id: categoryId,
              icon: challenge.icon,
              is_active: challenge.is_active,
              is_premium: challenge.is_premium,
            })
            .select('id')
            .single();

          if (challengeError) {
            insertErrors.push(`Reto ${i + 1}: ${challengeError.message}`);
            continue;
          }

          // 2. Insertar traducciones
          const translationsToInsert = Object.entries(challenge.translations)
            .filter(([_, content]) => content.trim() !== '')
            .map(([lang, content]) => ({
              challenge_id: challengeData.id,
              language_code: lang,
              content: content,
              icon: challenge.icon,
            }));

          const { error: translationsError } = await supabase
            .from('challenge_translations')
            .insert(translationsToInsert);

          if (translationsError) {
            // Si falla, eliminar el challenge
            await supabase.from('challenges').delete().eq('id', challengeData.id);
            insertErrors.push(`Reto ${i + 1}: Error en traducciones - ${translationsError.message}`);
            continue;
          }

          successCount++;
        } catch (error: any) {
          insertErrors.push(`Reto ${i + 1}: ${error.message}`);
        }
      }

      setCsvProgress(prev => ({ ...prev, errors: insertErrors }));

      // Mostrar resumen
      if (successCount > 0) {
        alert(`✅ Importación completada:\n\n${successCount} reto(s) importado(s) exitosamente\n${insertErrors.length} error(es)`);
        router.push(`/challenges/categories/${categoryId}/challenges`);
      } else {
        alert('❌ No se pudo importar ningún reto. Revisa los errores.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al procesar el archivo CSV: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setIsLoading(false);
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
        {/* Selector de modo */}
        <div className="bg-bg-secondary/80 backdrop-blur-sm border border-border rounded-2xl p-6 shadow-lg shadow-black/10 mb-8">
          <h2 className="text-xl font-bold text-text-primary mb-4">Método de Entrada</h2>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setInputMode('manual')}
              className={`flex-1 px-6 py-4 rounded-xl font-medium transition-all ${
                inputMode === 'manual'
                  ? 'bg-brand-yellow text-black shadow-lg shadow-brand-yellow/20'
                  : 'bg-bg-tertiary border border-border text-text-secondary hover:border-brand-yellow/50'
              }`}
            >
              <svg className="w-6 h-6 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Crear Manualmente
            </button>
            <button
              type="button"
              onClick={() => setInputMode('csv')}
              className={`flex-1 px-6 py-4 rounded-xl font-medium transition-all ${
                inputMode === 'csv'
                  ? 'bg-brand-purple text-white shadow-lg shadow-brand-purple/20'
                  : 'bg-bg-tertiary border border-border text-text-secondary hover:border-brand-purple/50'
              }`}
            >
              <svg className="w-6 h-6 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Importar CSV
            </button>
          </div>
        </div>

        {inputMode === 'csv' ? (
          /* Formulario CSV */
          <form onSubmit={handleCSVUpload} className="space-y-8">
            <div className="bg-bg-secondary/80 backdrop-blur-sm border border-border rounded-2xl p-6 shadow-lg shadow-black/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-purple/20 to-brand-purple/5 border border-brand-purple/30 flex items-center justify-center">
                  <svg className="w-6 h-6 text-brand-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-text-primary">Importar Retos desde CSV</h2>
                  <p className="text-sm text-text-secondary">Sube un archivo CSV con múltiples retos</p>
                </div>
              </div>

              {/* File input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Archivo CSV
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-3 bg-bg-tertiary border border-border rounded-xl text-text-primary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-purple file:text-white hover:file:bg-brand-purple/90 transition-all"
                />
                <p className="text-xs text-text-tertiary mt-2">
                  Formato requerido: icon,is_premium,is_active,content_es,content_en,content_fr,content_de,content_pt
                </p>
              </div>

              {/* Descargable ejemplo */}
              <div className="bg-brand-purple/10 border border-brand-purple/30 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-brand-purple flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-brand-purple mb-2">
                      Descarga el archivo de ejemplo para ver el formato correcto
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const csvContent = `icon,is_premium,is_active,content_es,content_en,content_fr,content_de,content_pt
🎯,false,true,Cuenta un chiste que haga reír a todos,Tell a joke that makes everyone laugh,Raconte une blague qui fait rire tout le monde,Erzähle einen Witz der alle zum Lachen bringt,Conte uma piada que faça todos rirem
🎤,false,true,Canta una canción sin música,Sing a song without music,Chante une chanson sans musique,Singe ein Lied ohne Musik,Cante uma música sem música
🤸,false,true,Haz 10 flexiones,Do 10 push-ups,Fais 10 pompes,Mache 10 Liegestütze,Faça 10 flexões
💃,true,true,Baila durante 1 minuto,Dance for 1 minute,Danse pendant 1 minute,Tanze für 1 Minute,Dance por 1 minuto
🎭,false,true,Imita a alguien de la sala,Imitate someone in the room,Imite quelqu'un dans la salle,Imitiere jemanden im Raum,Imite alguém na sala`;
                        const blob = new Blob([csvContent], { type: 'text/csv' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'ejemplo_retos.csv';
                        a.click();
                      }}
                      className="px-4 py-2 bg-brand-purple text-white rounded-lg text-sm font-medium hover:bg-brand-purple/90 transition-colors"
                    >
                      Descargar ejemplo.csv
                    </button>
                  </div>
                </div>
              </div>

              {/* Progress */}
              {csvProgress.total > 0 && (
                <div className="bg-bg-tertiary border border-border rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-text-primary">
                      Progreso: {csvProgress.current} / {csvProgress.total}
                    </span>
                    <span className="text-sm text-text-secondary">
                      {Math.round((csvProgress.current / csvProgress.total) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-bg-primary rounded-full h-2">
                    <div
                      className="bg-brand-purple h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(csvProgress.current / csvProgress.total) * 100}%` }}
                    ></div>
                  </div>
                  {csvProgress.errors.length > 0 && (
                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <p className="text-sm font-medium text-red-500 mb-2">
                        Errores ({csvProgress.errors.length}):
                      </p>
                      <ul className="text-xs text-red-400 space-y-1 max-h-40 overflow-y-auto">
                        {csvProgress.errors.map((error: string, index: number) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Submit button */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" isLoading={isLoading} disabled={!csvFile}>
                {isLoading ? 'Importando...' : 'Importar Retos'}
              </Button>
            </div>
          </form>
        ) : (
          /* Formulario Manual */
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
        )}
      </main>
    </div>
  );
}
