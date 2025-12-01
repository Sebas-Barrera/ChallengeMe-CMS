'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function BulkUploadChallengesPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvProgress, setCsvProgress] = useState<{ current: number; total: number; errors: string[] }>({
    current: 0,
    total: 0,
    errors: []
  });
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleCSVUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!csvFile) {
      alert('Por favor selecciona un archivo CSV');
      return;
    }

    setIsLoading(true);
    setCsvProgress({ current: 0, total: 0, errors: [] });

    try {
      const text = await csvFile.text();
      const lines = text.split('\n').filter(line => line.trim());

      if (lines.length < 2) {
        alert('El archivo CSV está vacío o no tiene datos');
        setIsLoading(false);
        return;
      }

      // Parsear header
      const headers = lines[0].split(',').map(h => h.trim());
      const requiredHeaders = ['challenge_category_id', 'icon', 'is_premium', 'is_active', 'content_es', 'content_en'];
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
        if (!row.challenge_category_id) {
          errors.push(`Fila ${i + 1}: Falta el ID de la categoría`);
          continue;
        }
        if (!row.content_es || !row.content_en) {
          errors.push(`Fila ${i + 1}: Falta contenido en español o inglés`);
          continue;
        }

        challenges.push({
          challenge_category_id: row.challenge_category_id,
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

      // Usar Supabase client
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
              challenge_category_id: challenge.challenge_category_id,
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

      if (successCount > 0) {
        setShowSuccessModal(true);
      } else {
        alert('No se pudo insertar ningún reto. Revisa los errores.');
      }

    } catch (error: any) {
      console.error('Error:', error);
      alert('Error al procesar el archivo: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadExample = () => {
    const exampleCSV = `challenge_category_id,icon,is_premium,is_active,content_es,content_en,content_fr,content_it,content_pt
b07421cb-248c-4099-8b29-e91a782939b3,🎯,false,true,Cuenta un chiste,Tell a joke,Raconte une blague,Racconta una barzelletta,Conte uma piada
b07421cb-248c-4099-8b29-e91a782939b3,🎭,false,true,Imita a un famoso,Imitate a celebrity,Imite une celebrite,Imita una celebrita,Imite uma celebridade
56f6d22e-0db5-4ce3-acd7-e6460e604936,🎵,true,true,Canta una cancion,Sing a song,Chante une chanson,Canta una canzone,Cante uma musica`;

    const blob = new Blob([exampleCSV], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ejemplo_retos_masivo.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-bg-primary relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-yellow/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-purple/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10">
        <header className="bg-bg-secondary/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <div className="flex items-center gap-4">
                <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
                  <Image
                    src="/logos/ChallengeMe-05.png"
                    alt="ChallengeMe"
                    width={48}
                    height={48}
                    className="object-contain"
                  />
                </Link>
                <div className="h-10 w-px bg-border"></div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-yellow/20 to-brand-yellow/5 border border-brand-yellow/30 flex items-center justify-center">
                    <svg className="w-6 h-6 text-brand-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-text-primary">Upload Masivo de Retos</h1>
                    <p className="text-xs text-text-secondary">Sube múltiples retos de diferentes categorías</p>
                  </div>
                </div>
              </div>
              <Link href="/challenges/categories">
                <button className="px-5 py-2.5 bg-bg-tertiary hover:bg-border text-text-primary font-semibold rounded-xl transition-all duration-200">
                  Volver
                </button>
              </Link>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-bg-secondary/80 backdrop-blur-sm border border-border rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-text-primary mb-6">Sube tus Retos</h2>

            <div className="mb-6 p-4 bg-brand-yellow/10 border border-brand-yellow/30 rounded-xl">
              <h3 className="font-bold text-brand-yellow mb-2">📋 Formato del CSV:</h3>
              <p className="text-sm text-text-secondary mb-2">El archivo debe incluir estas columnas:</p>
              <ul className="text-sm text-text-secondary list-disc list-inside space-y-1">
                <li><strong>challenge_category_id:</strong> UUID de la categoría (requerido)</li>
                <li><strong>icon:</strong> Emoji del reto (opcional)</li>
                <li><strong>is_premium:</strong> true o false</li>
                <li><strong>is_active:</strong> true o false</li>
                <li><strong>content_es:</strong> Contenido en español (requerido)</li>
                <li><strong>content_en:</strong> Contenido en inglés (requerido)</li>
                <li><strong>content_fr, content_it, content_pt:</strong> Traducciones opcionales</li>
              </ul>
              <button
                onClick={handleDownloadExample}
                className="mt-4 px-4 py-2 bg-brand-yellow text-black rounded-lg text-sm font-semibold hover:bg-brand-yellow/90 transition-colors"
              >
                Descargar CSV de ejemplo
              </button>
            </div>

            <form onSubmit={handleCSVUpload} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Archivo CSV
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-yellow file:text-black hover:file:bg-brand-yellow/90 file:cursor-pointer cursor-pointer"
                  disabled={isLoading}
                />
              </div>

              {csvProgress.total > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-text-secondary">
                    <span>Progreso: {csvProgress.current} / {csvProgress.total}</span>
                    <span>{Math.round((csvProgress.current / csvProgress.total) * 100)}%</span>
                  </div>
                  <div className="w-full bg-bg-tertiary rounded-full h-2">
                    <div
                      className="bg-brand-yellow h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(csvProgress.current / csvProgress.total) * 100}%` }}
                    ></div>
                  </div>
                  {csvProgress.errors.length > 0 && (
                    <div className="mt-4 p-4 bg-error/10 border border-error/30 rounded-xl max-h-60 overflow-y-auto">
                      <h4 className="font-bold text-error mb-2">Errores encontrados:</h4>
                      <ul className="text-sm text-error space-y-1">
                        {csvProgress.errors.map((error, idx) => (
                          <li key={idx}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !csvFile}
                className="w-full px-6 py-3 bg-brand-yellow hover:bg-brand-yellow/90 text-black font-bold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                    Subiendo retos...
                  </span>
                ) : (
                  'Subir Retos'
                )}
              </button>
            </form>
          </div>
        </main>
      </div>

      {/* Modal de éxito */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowSuccessModal(false)} />
          <div className="relative z-10 bg-bg-secondary border-2 border-success rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-success mb-2">¡Éxito!</h3>
              <p className="text-text-secondary mb-6">Los retos se han subido correctamente</p>
              <button
                onClick={() => router.push('/challenges/categories')}
                className="px-6 py-3 bg-brand-yellow hover:bg-brand-yellow/90 text-black font-bold rounded-xl transition-all"
              >
                Volver a Categorías
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
