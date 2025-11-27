'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
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
  // Ejemplos: trophy -> IoTrophy, rocket -> IoRocket, chatbubbles -> IoChatbubbles
  const pascalCase = 'Io' + iconName.charAt(0).toUpperCase() + iconName.slice(1);
  const IconComponent = (IoIcons as Record<string, React.ComponentType<{ className?: string }>>)[pascalCase];

  return IconComponent || null;
};

export default function DeepTalksListPage() {
  const params = useParams();
  const router = useRouter();
  const { supabase } = useAuth();
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
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-brand-purple/30 border-t-brand-purple rounded-full animate-spin" />
          <p className="text-text-secondary">Cargando categorías...</p>
        </div>
      </div>
    );
  }

  if (!filter) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <p className="text-text-secondary">Filtro no encontrado</p>
      </div>
    );
  }

  const filterName = getTranslation(filter.deep_talk_categories_translations, 'es')?.name || filter.label;

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="bg-bg-secondary/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
                <Image
                  src="/logos/ChallengeMe-05.png"
                  alt="ChallengeMe"
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </Link>
              <Link
                href="/deep-talks/categories"
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
              <div className="flex items-center gap-3">
                {filter.icon && (
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center border-2"
                    style={{
                      backgroundColor: filter.color ? `${filter.color}20` : '#8B5CF620',
                      borderColor: filter.color ? `${filter.color}50` : '#8B5CF650',
                    }}
                  >
                    {(() => {
                      const FilterIcon = getIonIcon(filter.icon);
                      return FilterIcon ? (
                        <div style={{ color: filter.color || '#8B5CF6' }}>
                          <FilterIcon className="w-6 h-6" />
                        </div>
                      ) : (
                        <span className="text-2xl">{filter.icon}</span>
                      );
                    })()}
                  </div>
                )}
                <div>
                  <h1 className="text-lg font-bold text-text-primary">{filterName}</h1>
                  <p className="text-xs text-text-secondary">Todas las Categorías</p>
                </div>
              </div>
            </div>
            <Link
              href={`/deep-talks/categories/${categoryId}/deep-talks/new`}
              className="px-4 py-2 bg-brand-purple hover:bg-brand-purple/90 text-white rounded-xl font-medium transition-all duration-200 flex items-center gap-2 hover:scale-105"
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
              Nueva Categoría
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-brand-purple/10 to-brand-purple/5 border border-brand-purple/20 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary mb-1">Total Categorías</p>
                <p className="text-3xl font-bold text-text-primary">{stats.total}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-brand-purple/20 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-brand-purple"
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
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary mb-1">Activas</p>
                <p className="text-3xl font-bold text-text-primary">{stats.active}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-500/10 to-gray-500/5 border border-gray-500/20 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary mb-1">Inactivas</p>
                <p className="text-3xl font-bold text-text-primary">{stats.inactive}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gray-500/20 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Deep Talks Grid */}
        {deepTalks.length === 0 ? (
          <div className="bg-bg-secondary/50 border border-border rounded-2xl p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-brand-purple/20 to-brand-purple/5 border border-brand-purple/30 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-brand-purple"
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
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              No hay categorías todavía
            </h3>
            <p className="text-text-secondary mb-6">
              Comienza creando tu primera categoría de pláticas profundas
            </p>
            <Link
              href={`/deep-talks/categories/${categoryId}/deep-talks/new`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-purple hover:bg-brand-purple/90 text-white rounded-xl font-medium transition-all duration-200 hover:scale-105"
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {deepTalks.map((deepTalk) => {
              const translation = getTranslation(deepTalk.deep_talk_translations, 'es');
              const gradientColors = deepTalk.gradient_colors || ['#8B5CF6', '#6366F1'];
              const DeepTalkIcon = getIonIcon(deepTalk.icon);

              return (
                <div
                  key={deepTalk.id}
                  className="bg-bg-secondary/80 backdrop-blur-sm border border-border rounded-2xl p-6 hover:border-brand-purple/50 transition-all duration-200 hover:shadow-lg hover:shadow-brand-purple/10 group"
                >
                  {/* Header with icon */}
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, ${gradientColors[0]}, ${gradientColors[1] || gradientColors[0]})`,
                      }}
                    >
                      {DeepTalkIcon ? (
                        <DeepTalkIcon className="w-7 h-7 text-white" />
                      ) : (
                        <span className="text-2xl">{deepTalk.icon || '💬'}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {!deepTalk.is_active && (
                        <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded-lg border border-gray-500/30">
                          Inactiva
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-text-primary mb-1 line-clamp-2">
                      {translation?.title || 'Sin título'}
                    </h3>
                    {translation?.subtitle && (
                      <p className="text-sm text-text-secondary line-clamp-2">
                        {translation.subtitle}
                      </p>
                    )}
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center gap-4 mb-4 text-xs text-text-tertiary">
                    {deepTalk.estimated_time && (
                      <div className="flex items-center gap-1">
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
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {deepTalk.estimated_time} min
                      </div>
                    )}
                    {translation?.intensity && (
                      <div className="flex items-center gap-1">
                        <span className="font-medium">
                          {translation.intensity === 'LOW' && '🟢 Baja'}
                          {translation.intensity === 'MEDIUM' && '🟡 Media'}
                          {translation.intensity === 'HIGH' && '🔴 Alta'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-4 border-t border-border/50">
                    <button
                      onClick={() => router.push(`/deep-talks/categories/${categoryId}/deep-talks/${deepTalk.id}`)}
                      className="flex-1 px-3 py-2 bg-brand-blue/10 hover:bg-brand-blue/20 border border-brand-blue/30 text-brand-blue rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2"
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
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteClick(deepTalk.id)}
                      className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2"
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      Eliminar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

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
