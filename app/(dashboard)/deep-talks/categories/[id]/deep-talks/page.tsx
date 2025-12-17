'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import * as IoIcons from 'react-icons/io5';
import ConfirmModal from '@/components/ui/ConfirmModal';
import SuccessModal from '@/components/ui/SuccessModal';

interface DeepTalkTranslation {
  language_code: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  intensity: string | null;
}

interface DeepTalk {
  id: string;
  deep_talk_category_id: string;
  icon: string | null;
  gradient_colors: string[] | null;
  estimated_time: number | null;
  is_active: boolean;
  sort_order: number;
  deep_talk_translations: DeepTalkTranslation[];
}

interface FilterTranslation {
  language_code: string;
  name: string;
}

interface Filter {
  id: string;
  label: string;
  icon: string | null;
  color: string | null;
  deep_talk_categories_translations: FilterTranslation[];
}

// Helper para obtener el icono de Ionicons dinámicamente
const getIonIcon = (iconName: string | null) => {
  if (!iconName) return null;

  // Convertir nombre de icono a formato PascalCase para Ionicons v5
  // Ejemplos: trophy -> IoTrophy, rocket -> IoRocket, heart-circle -> IoHeartCircle
  const pascalCase = 'Io' + iconName
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  const IconComponent = (IoIcons as Record<string, React.ComponentType<{ className?: string }>>)[pascalCase];

  return IconComponent || null;
};

export default function DeepTalksListPage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = params.id as string;

  const [filter, setFilter] = useState<Filter | null>(null);
  const [deepTalks, setDeepTalks] = useState<DeepTalk[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [deepTalkToDelete, setDeepTalkToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [categoryId]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch filter info
      const { data: filterData, error: filterError } = await supabase
        .from('deep_talk_categories')
        .select(`
          id,
          label,
          icon,
          color,
          deep_talk_categories_translations (
            language_code,
            name
          )
        `)
        .eq('id', categoryId)
        .single();

      if (filterError) throw filterError;
      setFilter(filterData);

      // Fetch deep talks (categorías)
      const { data: deepTalksData, error: deepTalksError } = await supabase
        .from('deep_talks')
        .select(`
          id,
          deep_talk_category_id,
          icon,
          gradient_colors,
          estimated_time,
          is_active,
          sort_order,
          deep_talk_translations (
            language_code,
            title,
            subtitle,
            description,
            intensity
          )
        `)
        .eq('deep_talk_category_id', categoryId)
        .order('sort_order', { ascending: true });

      if (deepTalksError) throw deepTalksError;
      setDeepTalks(deepTalksData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Error al cargar las categorías');
    } finally {
      setIsLoading(false);
    }
  };

  const getTranslation = (translations: any[], languageCode: string = 'es') => {
    return translations?.find((t) => t.language_code === languageCode);
  };

  const handleDeleteClick = (deepTalkId: string) => {
    setDeepTalkToDelete(deepTalkId);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deepTalkToDelete) return;

    setIsDeleting(true);
    try {
      // 1. Eliminar preguntas asociadas
      const { error: questionsError } = await supabase
        .from('deep_talk_questions')
        .delete()
        .eq('deep_talk_id', deepTalkToDelete);

      if (questionsError) {
        throw new Error(questionsError.message);
      }

      // 2. Eliminar traducciones asociadas
      const { error: translationsError } = await supabase
        .from('deep_talk_translations')
        .delete()
        .eq('deep_talk_id', deepTalkToDelete);

      if (translationsError) {
        throw new Error(translationsError.message);
      }

      // 3. Eliminar la categoría
      const { error: deepTalkError } = await supabase
        .from('deep_talks')
        .delete()
        .eq('id', deepTalkToDelete);

      if (deepTalkError) {
        throw new Error(deepTalkError.message);
      }

      // Éxito - mostrar modal y actualizar lista
      setShowDeleteModal(false);
      setShowSuccessModal(true);

      // Recargar datos
      fetchData();
    } catch (error) {
      console.error('Error al eliminar:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Error al eliminar la categoría. Por favor, intenta de nuevo.';
      alert(errorMessage);
    } finally {
      setIsDeleting(false);
      setDeepTalkToDelete(null);
    }
  };

  const stats = {
    total: deepTalks.length,
    active: deepTalks.filter((dt) => dt.is_active).length,
    inactive: deepTalks.filter((dt) => !dt.is_active).length,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-[#BDF522]/30 border-t-[#BDF522] rounded-full animate-spin"></div>
          <p className="text-[#999999]">Cargando categorías...</p>
        </div>
      </div>
    );
  }

  if (!filter) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center">
        <p className="text-[#999999]">Filtro no encontrado</p>
      </div>
    );
  }

  const filterName = getTranslation(filter.deep_talk_categories_translations, 'es')?.name || filter.label;

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
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
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
                href="/deep-talks/categories"
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
              <div className="flex items-center gap-3">
                {filter.icon && (
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center border-2"
                    style={{
                      backgroundColor: filter.color ? `${filter.color}20` : '#BDF52220',
                      borderColor: filter.color ? `${filter.color}50` : '#BDF52250',
                    }}
                  >
                    {(() => {
                      const FilterIcon = getIonIcon(filter.icon);
                      return FilterIcon ? (
                        <div style={{ color: filter.color || '#BDF522' }}>
                          <FilterIcon className="w-6 h-6" />
                        </div>
                      ) : (
                        <span className="text-2xl">{filter.icon}</span>
                      );
                    })()}
                  </div>
                )}
                <div>
                  <h1 className="text-xl font-bold text-white tracking-tight">{filterName}</h1>
                  <p className="text-xs text-[#999999] font-medium">Todas las Categorías</p>
                </div>
              </div>
            </div>
            <Link
              href={`/deep-talks/categories/${categoryId}/deep-talks/new`}
              className="px-5 py-2.5 bg-[#BDF522] hover:bg-[#BDF522]/90 text-black font-semibold rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg shadow-[#BDF522]/20 hover:shadow-[#BDF522]/30"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span className="hidden sm:inline">Nueva Categoría</span>
              <span className="sm:hidden">Nueva</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <div className="text-center">
            <div className="text-3xl font-bold text-[#BDF522] mb-2">{stats.total}</div>
            <div className="text-sm text-[#999999]">Total Categorías</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-[#BDF522] mb-2">{stats.active}</div>
            <div className="text-sm text-[#999999]">Activas</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-[#999999] mb-2">{stats.inactive}</div>
            <div className="text-sm text-[#999999]">Inactivas</div>
          </div>
        </div>

        {/* Deep Talks Grid */}
        {deepTalks.length === 0 ? (
          <div className="bg-[#2A2A2A] border border-[#333333] rounded-2xl p-12 text-center shadow-lg shadow-black/20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#BDF522]/20 to-[#BDF522]/5 border border-[#BDF522]/30 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-[#BDF522]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">
              No hay categorías todavía
            </h3>
            <p className="text-[#CCCCCC] mb-8 max-w-md mx-auto leading-relaxed">
              Comienza creando tu primera categoría de pláticas profundas
            </p>
            <Link
              href={`/deep-talks/categories/${categoryId}/deep-talks/new`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#BDF522] hover:bg-[#BDF522]/90 text-black font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-[#BDF522]/20"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Crear Primera Categoría
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {deepTalks.map((deepTalk) => {
              const translation = getTranslation(deepTalk.deep_talk_translations, 'es');
              const gradientColors = deepTalk.gradient_colors || ['#8B5CF6', '#6366F1'];
              const DeepTalkIcon = getIonIcon(deepTalk.icon);

              return (
                <div
                  key={deepTalk.id}
                  className="group bg-[#2A2A2A] border border-[#333333] rounded-2xl overflow-hidden shadow-lg shadow-black/20 hover:border-[#BDF522]/30 transition-all duration-300"
                >
                  {/* Header con gradiente */}
                  <div
                    className="relative h-32 flex items-center justify-center overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, ${gradientColors[0]}, ${gradientColors[1] || gradientColors[0]})`,
                    }}
                  >
                    {/* Pattern decorativo */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2"></div>
                      <div className="absolute bottom-0 right-0 w-32 h-32 bg-black rounded-full blur-2xl translate-x-1/2 translate-y-1/2"></div>
                    </div>

                    {/* Icono */}
                    <div className="relative z-10">
                      {DeepTalkIcon ? (
                        <DeepTalkIcon className="w-16 h-16 text-white drop-shadow-lg" />
                      ) : (
                        <span className="text-5xl drop-shadow-lg">{deepTalk.icon || '💬'}</span>
                      )}
                    </div>

                    {/* Badge en el header */}
                    {!deepTalk.is_active && (
                      <div className="absolute top-3 right-3">
                        <span className="px-2.5 py-1 bg-black/30 backdrop-blur-sm text-white/70 border border-white/20 rounded-lg text-xs font-bold">
                          INACTIVA
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Contenido */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#BDF522] transition-colors line-clamp-2">
                      {translation?.title || 'Sin título'}
                    </h3>
                    {translation?.subtitle && (
                      <p className="text-sm text-[#CCCCCC] mb-4 line-clamp-2">
                        {translation.subtitle}
                      </p>
                    )}

                    {/* Metadata */}
                    <div className="flex items-center flex-wrap gap-3 mb-4 text-xs">
                      {deepTalk.estimated_time && (
                        <div className="flex items-center gap-1.5 text-[#999999]">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{deepTalk.estimated_time} min</span>
                        </div>
                      )}
                      {translation?.intensity && (
                        <div className="flex items-center gap-1.5 text-[#999999]">
                          <span className="font-medium">
                            {translation.intensity === 'LOW' && '🟢 Baja'}
                            {translation.intensity === 'MEDIUM' && '🟡 Media'}
                            {translation.intensity === 'HIGH' && '🔴 Alta'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Acciones */}
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => router.push(`/deep-talks/categories/${categoryId}/deep-talks/${deepTalk.id}/questions`)}
                        className="w-full px-4 py-2.5 bg-[#BDF522] hover:bg-[#BDF522]/90 text-black rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-[#BDF522]/20"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        Temas Profundos
                      </button>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => router.push(`/deep-talks/categories/${categoryId}/deep-talks/${deepTalk.id}`)}
                          className="flex-1 px-4 py-2.5 bg-[#2A2A2A] hover:bg-[#333333] border border-[#333333] hover:border-[#BDF522]/30 text-white rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-black/30"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteClick(deepTalk.id)}
                          className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      </div>

      {/* Modal de confirmación de eliminación */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeepTalkToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Eliminar categoría"
        message="¿Estás seguro de que deseas eliminar esta categoría? Esta acción también eliminará todas las preguntas asociadas y no se puede deshacer."
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isDeleting}
      />

      {/* Modal de éxito */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
        }}
        title="¡Categoría eliminada!"
        message="La categoría y todas sus preguntas han sido eliminadas exitosamente."
      />
    </div>
  );
}
