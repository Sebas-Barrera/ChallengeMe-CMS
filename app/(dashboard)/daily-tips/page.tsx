'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface DailyTipTranslation {
  language_code: string;
  text: string;
}

interface DailyTip {
  id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  daily_tip_translations: DailyTipTranslation[];
}

type FilterStatus = 'all' | 'active' | 'inactive';

export default function DailyTipsPage() {
  const router = useRouter();
  const [dailyTips, setDailyTips] = useState<DailyTip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Estados para eliminar
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [tipToDelete, setTipToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadDailyTips();
  }, []);

  const loadDailyTips = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('daily_tips')
        .select(`
          *,
          daily_tip_translations (
            language_code,
            text
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDailyTips(data || []);
    } catch (error) {
      console.error('Error loading daily tips:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('daily_tips')
        .update({ is_active: !currentStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      // Actualizar localmente
      setDailyTips(prev => prev.map(tip =>
        tip.id === id ? { ...tip, is_active: !currentStatus } : tip
      ));
    } catch (error) {
      console.error('Error toggling tip status:', error);
      alert('Error al cambiar el estado del consejo');
    }
  };

  const handleDelete = async () => {
    if (!tipToDelete) return;

    try {
      setIsDeleting(true);

      // Eliminar traducciones primero
      const { error: translationsError } = await supabase
        .from('daily_tip_translations')
        .delete()
        .eq('tip_id', tipToDelete);

      if (translationsError) throw translationsError;

      // Eliminar el tip
      const { error: tipError } = await supabase
        .from('daily_tips')
        .delete()
        .eq('id', tipToDelete);

      if (tipError) throw tipError;

      // Actualizar localmente
      setDailyTips(prev => prev.filter(tip => tip.id !== tipToDelete));
      setShowDeleteModal(false);
      setTipToDelete(null);
    } catch (error) {
      console.error('Error deleting tip:', error);
      alert('Error al eliminar el consejo');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtrar tips
  const filteredTips = dailyTips.filter(tip => {
    // Filtro por estado
    if (filterStatus === 'active' && !tip.is_active) return false;
    if (filterStatus === 'inactive' && tip.is_active) return false;

    // Filtro por búsqueda
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const hasMatch = tip.daily_tip_translations.some(t =>
        t.text.toLowerCase().includes(searchLower)
      );
      if (!hasMatch) return false;
    }

    return true;
  });

  const getTextPreview = (translations: DailyTipTranslation[]) => {
    const esTranslation = translations.find(t => t.language_code === 'es');
    const anyTranslation = translations[0];
    const text = esTranslation?.text || anyTranslation?.text || 'Sin texto';
    return text.length > 100 ? text.substring(0, 100) + '...' : text;
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
        {/* Header mejorado */}
        <header className="bg-[#2A2A2A]/80 backdrop-blur-sm border-b border-[#333333] sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                <div className="h-10 w-px bg-[#333333]"></div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FD8616]/20 to-[#FD8616]/5 border border-[#FD8616]/30 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-[#FD8616]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-white tracking-tight">
                      Consejos del Día
                    </h1>
                    <p className="text-xs text-[#999999] font-medium">
                      Gestiona los consejos motivacionales
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link href="/daily-tips/new">
                  <button className="px-5 py-2.5 bg-[#FD8616] hover:bg-[#FD8616]/90 text-white font-semibold rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg shadow-[#FD8616]/20 hover:shadow-[#FD8616]/30">
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
                    <span className="hidden sm:inline">Nuevo Consejo</span>
                    <span className="sm:hidden">Nuevo</span>
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Hero Section */}
          <div className="mb-10">
            <p className="text-lg text-[#999999] mb-2 font-medium">
              ¡Bienvenido de nuevo!
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2 tracking-tight">
              ¡Inspira a tus Usuarios!
            </h2>
            <p className="text-base text-[#CCCCCC]">
              Crea y gestiona los consejos motivacionales que se muestran cada día
            </p>
          </div>

          {/* Stats mejoradas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <div className="text-center">
              <div className="text-3xl font-bold text-[#FD8616] mb-2">{dailyTips.length}</div>
              <div className="text-sm text-[#999999]">Total de Consejos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#BDF522] mb-2">
                {dailyTips.filter((t) => t.is_active).length}
              </div>
              <div className="text-sm text-[#999999]">Activos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-500 mb-2">
                {dailyTips.filter((t) => !t.is_active).length}
              </div>
              <div className="text-sm text-[#999999]">Inactivos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#7B46F8] mb-2">
                {dailyTips.reduce((sum, tip) => sum + tip.daily_tip_translations.length, 0)}
              </div>
              <div className="text-sm text-[#999999]">Traducciones Totales</div>
            </div>
          </div>

          {/* Lista de consejos mejorada */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 border-4 border-[#FD8616]/30 border-t-[#FD8616] rounded-full animate-spin"></div>
                <p className="text-[#999999]">Cargando consejos...</p>
              </div>
            </div>
          ) : dailyTips.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-bold text-white">
                  Todos los Consejos
                </h3>
                <div className="flex items-center gap-2 relative">
                  <button
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className="px-3 py-2 bg-[#2A2A2A] hover:bg-[#333333] border border-[#333333] text-[#999999] rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Filtrar
                  </button>

                  {/* Dropdown de filtros */}
                  {isFilterOpen && (
                    <>
                      {/* Backdrop */}
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsFilterOpen(false)}
                      />

                      {/* Menu */}
                      <div className="absolute right-0 top-12 z-20 bg-[#2A2A2A] border border-[#333333] rounded-xl shadow-2xl shadow-black/50 p-4 min-w-[280px]">
                        {/* Estado */}
                        <div>
                          <label className="block text-xs font-medium text-[#999999] mb-2">
                            Estado
                          </label>
                          <div className="space-y-2">
                            <button
                              onClick={() => {
                                setFilterStatus('all');
                                setIsFilterOpen(false);
                              }}
                              className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                                filterStatus === 'all'
                                  ? 'bg-[#FD8616]/20 border-2 border-[#FD8616] text-[#FD8616]'
                                  : 'bg-[#1A1A1A] hover:bg-[#333333] text-white'
                              }`}
                            >
                              Todos
                            </button>
                            <button
                              onClick={() => {
                                setFilterStatus('active');
                                setIsFilterOpen(false);
                              }}
                              className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                                filterStatus === 'active'
                                  ? 'bg-[#BDF522]/20 border-2 border-[#BDF522] text-[#BDF522]'
                                  : 'bg-[#1A1A1A] hover:bg-[#333333] text-white'
                              }`}
                            >
                              Activos
                            </button>
                            <button
                              onClick={() => {
                                setFilterStatus('inactive');
                                setIsFilterOpen(false);
                              }}
                              className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                                filterStatus === 'inactive'
                                  ? 'bg-red-500/20 border-2 border-red-500 text-red-500'
                                  : 'bg-[#1A1A1A] hover:bg-[#333333] text-white'
                              }`}
                            >
                              Inactivos
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="grid gap-4">
                {filteredTips.map((tip) => (
                  <div
                    key={tip.id}
                    className="group bg-[#2A2A2A] border border-[#333333] rounded-2xl overflow-hidden shadow-lg shadow-black/20 hover:border-[#FD8616]/30 transition-all duration-300"
                  >
                    <div className="p-6">
                      <div className="flex items-start gap-4">
                        {/* Icono */}
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FD8616]/20 to-[#FD8616]/5 border border-[#FD8616]/30 flex items-center justify-center shrink-0">
                          <svg className="w-6 h-6 text-[#FD8616]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        </div>

                        {/* Contenido */}
                        <div className="flex-1 min-w-0">
                          <p className="text-lg text-white mb-3 group-hover:text-[#FD8616] transition-colors">
                            {getTextPreview(tip.daily_tip_translations)}
                          </p>

                          {/* Metadata */}
                          <div className="flex items-center flex-wrap gap-3 mb-4 text-xs">
                            <div className="flex items-center gap-1.5 text-[#999999]">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                              </svg>
                              <span>{tip.daily_tip_translations.length} idiomas</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[#999999]">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span>Creado: {new Date(tip.created_at).toLocaleDateString('es-ES')}</span>
                            </div>
                            {tip.is_active ? (
                              <span className="px-2.5 py-1 bg-[#BDF522]/20 border border-[#BDF522]/30 text-[#BDF522] rounded-lg text-xs font-bold">
                                ACTIVO
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 bg-red-500/20 border border-red-500/30 text-red-500 rounded-lg text-xs font-bold">
                                INACTIVO
                              </span>
                            )}
                          </div>

                          {/* Acciones */}
                          <div className="flex items-center gap-3">
                            <Link
                              href={`/daily-tips/${tip.id}`}
                              className="flex-1 px-4 py-2.5 bg-[#FD8616]/10 hover:bg-[#FD8616]/20 border border-[#FD8616]/30 hover:border-[#FD8616] text-[#FD8616] rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-black/20"
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
                            <button
                              onClick={() => toggleActive(tip.id, tip.is_active)}
                              className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-black/20 ${
                                tip.is_active
                                  ? 'bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500 text-red-500'
                                  : 'bg-[#BDF522]/10 hover:bg-[#BDF522]/20 border border-[#BDF522]/30 hover:border-[#BDF522] text-[#BDF522]'
                              }`}
                              title={tip.is_active ? 'Desactivar' : 'Activar'}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {tip.is_active ? (
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                )}
                              </svg>
                              {tip.is_active ? 'Desactivar' : 'Activar'}
                            </button>
                            <button
                              onClick={() => {
                                setTipToDelete(tip.id);
                                setShowDeleteModal(true);
                              }}
                              className="flex-1 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500 text-red-500 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-black/20"
                              title="Eliminar"
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
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Empty state mejorado */
            <div className="bg-[#2A2A2A] border border-[#333333] rounded-2xl p-12 text-center shadow-lg shadow-black/20">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#FD8616]/20 to-[#FD8616]/5 border border-[#FD8616]/30 flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-[#FD8616]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                No hay consejos aún
              </h3>
              <p className="text-[#CCCCCC] mb-8 max-w-md mx-auto leading-relaxed">
                Crea tu primer consejo del día para comenzar a inspirar a tus usuarios con mensajes motivacionales
              </p>
              <Link href="/daily-tips/new">
                <button className="px-6 py-3 bg-[#FD8616] hover:bg-[#FD8616]/90 text-white font-semibold rounded-xl transition-all duration-200 flex items-center gap-2 mx-auto shadow-lg shadow-[#FD8616]/20">
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
                  Crear Primer Consejo
                </button>
              </Link>
            </div>
          )}
        </main>
      </div>

      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !isDeleting && setShowDeleteModal(false)}
          />

          {/* Modal */}
          <div className="relative z-10 bg-[#2A2A2A] border-2 border-red-500 rounded-2xl shadow-2xl shadow-red-500/30 p-6 max-w-md w-full mx-4">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-red-500/30">
              <div className="w-12 h-12 rounded-xl bg-red-500/30 border-2 border-red-500 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-red-500">
                  ¡CONFIRMAR ELIMINACIÓN!
                </h3>
                <p className="text-sm text-red-500/80">Esta acción no se puede deshacer</p>
              </div>
            </div>

            {/* Content */}
            <div className="mb-6">
              <p className="text-white mb-4 text-base">
                ¿Estás seguro que quieres eliminar este consejo del día?
              </p>
              <div className="bg-red-500/20 border-2 border-red-500 rounded-lg p-4">
                <p className="text-sm text-red-500 font-bold">
                  ⚠️ Esta acción eliminará el consejo y todas sus traducciones de forma permanente.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setTipToDelete(null);
                }}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 bg-[#1A1A1A] hover:bg-[#333333] border border-[#333333] text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-black/30"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-500/80 text-white rounded-xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/30 border-2 border-red-500"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ELIMINANDO...
                  </>
                ) : (
                  <>
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
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    SÍ, ELIMINAR
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
