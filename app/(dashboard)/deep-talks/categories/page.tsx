'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import * as IoIcons from 'react-icons/io5';

interface Filter {
  id: string;
  label: string;
  icon: string | null;
  color: string | null;
  route: string | null;
  sort_order: number;
  is_active: boolean;
  is_premium: boolean;
  deep_talk_count: number;
  translations: Record<string, { name: string }>;
}

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
  category: {
    id: string;
    label: string;
    color: string | null;
    deep_talk_categories_translations: { language_code: string; name: string }[];
  };
}

// Helper para obtener el icono de Ionicons dinámicamente
const getIonIcon = (iconName: string | null) => {
  if (!iconName) return null;

  // Convertir nombre de icono a formato PascalCase para Ionicons v5
  // Ejemplos: trophy -> IoTrophy, rocket -> IoRocket, star -> IoStar
  const pascalCase = 'Io' + iconName.charAt(0).toUpperCase() + iconName.slice(1);
  const IconComponent = (IoIcons as Record<string, React.ComponentType<{ className?: string }>>)[pascalCase];

  return IconComponent || null;
};

export default function DeepTalkCategoriesPage() {
  const { supabase } = useAuth();
  const [filters, setFilters] = useState<Filter[]>([]);
  const [deepTalks, setDeepTalks] = useState<DeepTalk[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilterSelector, setShowFilterSelector] = useState(false);

  useEffect(() => {
    fetchFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchFilters = async () => {
    try {
      setIsLoading(true);

      // Obtener filtros con sus traducciones
      const { data: filtersData, error: filtersError } = await supabase
        .from('deep_talk_categories')
        .select(`
          id,
          label,
          icon,
          color,
          route,
          sort_order,
          is_active,
          is_premium,
          deep_talk_categories_translations (
            language_code,
            name
          )
        `)
        .order('sort_order', { ascending: true });

      if (filtersError) {
        console.error('Error fetching filters:', filtersError);
        return;
      }

      // Obtener todas las categorías (deep_talks) con sus traducciones
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
          ),
          deep_talk_categories (
            id,
            label,
            color,
            deep_talk_categories_translations (
              language_code,
              name
            )
          )
        `)
        .order('sort_order', { ascending: true });

      if (deepTalksError) {
        console.error('Error fetching deep talks:', deepTalksError);
      } else {
        // Formatear deep talks
        const formattedDeepTalks: DeepTalk[] = (deepTalksData || []).map((dt: any) => ({
          id: dt.id,
          deep_talk_category_id: dt.deep_talk_category_id,
          icon: dt.icon,
          gradient_colors: dt.gradient_colors,
          estimated_time: dt.estimated_time,
          is_active: dt.is_active,
          sort_order: dt.sort_order,
          deep_talk_translations: dt.deep_talk_translations || [],
          category: dt.deep_talk_categories,
        }));
        setDeepTalks(formattedDeepTalks);
      }

      // Obtener conteo de categorías (deep_talks) por filtro
      const counts: Record<string, number> = {};
      deepTalksData?.forEach((item: any) => {
        counts[item.deep_talk_category_id] = (counts[item.deep_talk_category_id] || 0) + 1;
      });

      // Formatear datos
      const formattedFilters: Filter[] = (filtersData || []).map((filter: any) => {
        const translations: Record<string, { name: string }> = {};

        filter.deep_talk_categories_translations.forEach((trans: any) => {
          translations[trans.language_code] = {
            name: trans.name,
          };
        });

        return {
          id: filter.id,
          label: filter.label || '',
          icon: filter.icon,
          color: filter.color,
          route: filter.route,
          sort_order: filter.sort_order,
          is_active: filter.is_active,
          is_premium: filter.is_premium,
          deep_talk_count: counts[filter.id] || 0,
          translations,
        };
      });

      setFilters(formattedFilters);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary relative overflow-hidden">
      {/* Formas decorativas de fondo */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-purple/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-pink/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10">
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
                <div className="h-8 w-px bg-border"></div>
                <div>
                  <h1 className="text-lg font-bold text-text-primary">
                    Filtros de Pláticas Profundas
                  </h1>
                  <p className="text-xs text-text-secondary">
                    Gestiona los filtros de Deep Talks
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Hero Section */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-text-primary mb-2">
              Pláticas Profundas
            </h2>
            <p className="text-text-secondary">
              Gestiona los filtros para organizar las categorías de conversaciones
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="group bg-bg-secondary/80 backdrop-blur-sm border border-border rounded-2xl p-6 shadow-lg shadow-black/10 hover:border-brand-purple/50 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-purple/20 to-brand-purple/5 border border-brand-purple/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
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
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-text-primary mb-1">{filters.length}</p>
              <p className="text-sm text-text-secondary">Total de Filtros</p>
            </div>

            <div className="group bg-bg-secondary/80 backdrop-blur-sm border border-border rounded-2xl p-6 shadow-lg shadow-black/10 hover:border-success/50 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-success/20 to-success/5 border border-success/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg
                    className="w-6 h-6 text-success"
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
              <p className="text-3xl font-bold text-success mb-1">
                {filters.filter((c) => c.is_active).length}
              </p>
              <p className="text-sm text-text-secondary">Activos</p>
            </div>

            <div className="group bg-bg-secondary/80 backdrop-blur-sm border border-border rounded-2xl p-6 shadow-lg shadow-black/10 hover:border-brand-pink/50 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-pink/20 to-brand-pink/5 border border-brand-pink/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg
                    className="w-6 h-6 text-brand-pink"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                    />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-brand-pink mb-1">
                {filters.filter((c) => c.is_premium).length}
              </p>
              <p className="text-sm text-text-secondary">Premium</p>
            </div>

            <div className="group bg-bg-secondary/80 backdrop-blur-sm border border-border rounded-2xl p-6 shadow-lg shadow-black/10 hover:border-brand-blue/50 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-blue/20 to-brand-blue/5 border border-brand-blue/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg
                    className="w-6 h-6 text-brand-blue"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-brand-blue mb-1">
                {filters.reduce((sum, cat) => sum + cat.deep_talk_count, 0)}
              </p>
              <p className="text-sm text-text-secondary">Total de Categorías</p>
            </div>
          </div>

          {/* Lista de filtros */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-16 h-16 border-4 border-brand-purple/30 border-t-brand-purple rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {/* Filtros */}
              {filters.length > 0 && (
                <div className="mb-12">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-text-primary">
                      Todos los Filtros
                    </h3>
                    <Link href="/deep-talks/categories/new">
                      <button className="px-4 py-2 bg-brand-yellow hover:bg-brand-yellow/90 text-black font-semibold rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg shadow-brand-yellow/20 hover:scale-105">
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
                        Nuevo Filtro
                      </button>
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filters.map((category) => {
                      const IconComponent = getIonIcon(category.icon);

                      return (
                  <div
                    key={category.id}
                    className="group bg-bg-secondary/80 backdrop-blur-sm border border-border rounded-xl overflow-hidden shadow-lg shadow-black/10 hover:border-brand-purple/50 transition-all duration-300 hover:shadow-brand-purple/10"
                  >
                    {/* Header con color - más compacto */}
                    <div
                      className="relative h-20 flex items-center justify-center"
                      style={{
                        backgroundColor: category.color || '#8B5CF6',
                      }}
                    >
                      {/* Icono dinámico de Ionicons */}
                      <div className="relative z-10">
                        {IconComponent ? (
                          <IconComponent className="w-10 h-10 text-white drop-shadow-lg" />
                        ) : (
                          <svg
                            className="w-10 h-10 text-white drop-shadow-lg"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                          </svg>
                        )}
                      </div>

                      {/* Badges en el header */}
                      <div className="absolute top-2 right-2 flex items-center gap-1.5">
                        {category.is_premium && (
                          <span className="px-2 py-0.5 bg-black/30 backdrop-blur-sm text-white border border-white/30 rounded-md text-[10px] font-bold shadow-lg">
                            PREMIUM
                          </span>
                        )}
                        {category.is_active ? (
                          <span className="px-2 py-0.5 bg-success/90 backdrop-blur-sm text-white border border-white/30 rounded-md text-[10px] font-bold shadow-lg">
                            ACTIVA
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-black/30 backdrop-blur-sm text-white/70 border border-white/20 rounded-md text-[10px] font-bold">
                            INACTIVA
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Contenido más compacto */}
                    <div className="p-4">
                      <h3 className="text-lg font-bold text-text-primary mb-1 group-hover:text-brand-purple transition-colors line-clamp-1">
                        {category.translations.es.name}
                      </h3>
                      <p className="text-xs text-text-tertiary mb-3 font-mono">
                        {category.label}
                      </p>

                      {/* Metadata más compacta */}
                      <div className="flex items-center justify-between mb-3 text-xs">
                        <div className="flex items-center gap-1.5 text-text-tertiary">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                          </svg>
                          <span className="font-medium">{category.deep_talk_count}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                            />
                          </svg>
                          {Object.keys(category.translations).map((lang, idx) => (
                            <span
                              key={lang}
                              className="text-[10px] font-semibold text-text-secondary"
                            >
                              {lang.toUpperCase()}{idx < Object.keys(category.translations).length - 1 ? ',' : ''}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Acciones en columna */}
                      <div className="flex flex-col gap-2">
                        <Link
                          href={`/deep-talks/categories/${category.id}`}
                          className="w-full px-3 py-2 bg-bg-tertiary hover:bg-border border border-border text-text-primary rounded-lg text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1.5 group/btn"
                        >
                          <svg
                            className="w-3.5 h-3.5 group-hover/btn:text-brand-purple transition-colors"
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
                        </Link>
                        <Link
                          href={`/deep-talks/categories/${category.id}/deep-talks`}
                          className="w-full px-3 py-2 bg-brand-purple/10 hover:bg-brand-purple/20 border border-brand-purple/30 text-brand-purple rounded-lg text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1.5 hover:scale-[1.02]"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                          </svg>
                          Ver Categorías
                        </Link>
                      </div>
                    </div>
                  </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Categorías (Deep Talks) */}
              {deepTalks.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-text-primary">
                      Todas las Categorías
                    </h3>
                    <button
                      onClick={() => setShowFilterSelector(true)}
                      className="px-4 py-2 bg-brand-yellow hover:bg-brand-yellow/90 text-black font-semibold rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg shadow-brand-yellow/20 hover:scale-105"
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
                      Crear Nueva Categoría
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {deepTalks.map((deepTalk) => {
                      const translation = deepTalk.deep_talk_translations.find(
                        (t) => t.language_code === 'es'
                      );
                      const categoryTranslation = deepTalk.category?.deep_talk_categories_translations?.find(
                        (t) => t.language_code === 'es'
                      );
                      const gradientColors = deepTalk.gradient_colors || ['#8B5CF6', '#6366F1'];
                      const DeepTalkIcon = getIonIcon(deepTalk.icon);

                      return (
                        <div
                          key={deepTalk.id}
                          className="bg-bg-secondary/80 backdrop-blur-sm border border-border rounded-2xl p-6 hover:border-brand-purple/50 transition-all duration-200 hover:shadow-lg hover:shadow-brand-purple/10 group"
                        >
                          {/* Header with icon and filter tag */}
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
                            <div className="flex flex-col items-end gap-2">
                              {deepTalk.category && (
                                <span
                                  className="px-2 py-1 text-xs rounded-lg font-medium border"
                                  style={{
                                    backgroundColor: deepTalk.category.color ? `${deepTalk.category.color}20` : '#8B5CF620',
                                    borderColor: deepTalk.category.color ? `${deepTalk.category.color}50` : '#8B5CF650',
                                    color: deepTalk.category.color || '#8B5CF6',
                                  }}
                                >
                                  {categoryTranslation?.name || deepTalk.category.label}
                                </span>
                              )}
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
                            <Link
                              href={`/deep-talks/categories/${deepTalk.deep_talk_category_id}/deep-talks/${deepTalk.id}`}
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
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Empty state cuando no hay filtros */}
              {filters.length === 0 && deepTalks.length === 0 && (
                <div className="bg-bg-secondary/80 backdrop-blur-sm border border-border rounded-2xl p-12 text-center shadow-lg shadow-black/10">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-brand-purple/20 to-brand-purple/5 border border-brand-purple/30 flex items-center justify-center">
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
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-text-primary mb-3">
                    No hay filtros aún
                  </h3>
                  <p className="text-text-secondary mb-8 max-w-md mx-auto">
                    Crea tu primer filtro de pláticas profundas para comenzar a organizar las categorías
                  </p>
                  <Link href="/deep-talks/categories/new">
                    <button className="px-6 py-3 bg-brand-yellow hover:bg-brand-yellow/90 text-black font-semibold rounded-xl transition-all duration-200 flex items-center gap-2 mx-auto shadow-lg shadow-brand-yellow/20 hover:scale-105">
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
                      Crear Primer Filtro
                    </button>
                  </Link>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Modal de Selección de Filtro */}
      {showFilterSelector && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-bg-secondary border border-border rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-text-primary">Seleccionar Filtro</h2>
                  <p className="text-sm text-text-secondary mt-1">
                    Elige el filtro al que pertenecerá la nueva categoría
                  </p>
                </div>
                <button
                  onClick={() => setShowFilterSelector(false)}
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Lista de Filtros */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-1 gap-3">
                {filters.map((filter) => {
                  const FilterIcon = getIonIcon(filter.icon);

                  return (
                    <Link
                      key={filter.id}
                      href={`/deep-talks/categories/${filter.id}/deep-talks/new`}
                      onClick={() => setShowFilterSelector(false)}
                      className="group flex items-center gap-4 p-4 bg-bg-tertiary hover:bg-border border border-border rounded-xl transition-all duration-200 hover:border-brand-purple/50"
                    >
                      {/* Icono */}
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: filter.color || '#8B5CF6' }}
                      >
                        {FilterIcon ? (
                          <FilterIcon className="w-7 h-7 text-white" />
                        ) : (
                          <svg
                            className="w-7 h-7 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                          </svg>
                        )}
                      </div>

                      {/* Información */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-text-primary group-hover:text-brand-purple transition-colors">
                          {filter.translations.es?.name || filter.label}
                        </h3>
                        <p className="text-sm text-text-tertiary font-mono mt-0.5">
                          {filter.label}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-text-tertiary">
                            {filter.deep_talk_count} categorías
                          </span>
                          {filter.is_premium && (
                            <span className="px-1.5 py-0.5 bg-brand-pink/20 text-brand-pink text-[10px] font-bold rounded">
                              PREMIUM
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Flecha */}
                      <svg
                        className="w-5 h-5 text-text-tertiary group-hover:text-brand-purple transition-colors"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
