'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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

export default function DailyTipsPage() {
  const { supabase } = useAuth();
  const router = useRouter();
  const [dailyTips, setDailyTips] = useState<DailyTip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchTerm, setSearchTerm] = useState('');

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Link
              href="/"
              className="text-text-tertiary hover:text-text-primary transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-4xl font-bold text-text-primary">Consejos del Día</h1>
          </div>
          <p className="text-text-secondary ml-9">
            Gestiona los consejos motivacionales que se muestran cada día
          </p>
        </div>

        {/* Controles */}
        <div className="bg-bg-secondary/80 backdrop-blur-sm border border-border rounded-2xl p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Búsqueda */}
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar consejos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 pl-11 bg-bg-tertiary border border-border rounded-xl text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                />
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-tertiary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Filtros */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  filterStatus === 'all'
                    ? 'bg-brand-blue text-white'
                    : 'bg-bg-tertiary text-text-secondary hover:bg-border'
                }`}
              >
                Todos ({dailyTips.length})
              </button>
              <button
                onClick={() => setFilterStatus('active')}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  filterStatus === 'active'
                    ? 'bg-success text-white'
                    : 'bg-bg-tertiary text-text-secondary hover:bg-border'
                }`}
              >
                Activos ({dailyTips.filter(t => t.is_active).length})
              </button>
              <button
                onClick={() => setFilterStatus('inactive')}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  filterStatus === 'inactive'
                    ? 'bg-error text-white'
                    : 'bg-bg-tertiary text-text-secondary hover:bg-border'
                }`}
              >
                Inactivos ({dailyTips.filter(t => !t.is_active).length})
              </button>
            </div>

            {/* Botón crear */}
            <Link
              href="/daily-tips/new"
              className="px-6 py-3 bg-brand-blue hover:bg-brand-blue/90 text-white rounded-xl font-medium transition-all duration-200 flex items-center gap-2 shadow-lg shadow-brand-blue/30"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nuevo Consejo
            </Link>
          </div>
        </div>

        {/* Resultados */}
        <div className="text-sm text-text-tertiary mb-4">
          Mostrando {filteredTips.length} de {dailyTips.length} consejos
        </div>

        {/* Lista de consejos */}
        {filteredTips.length === 0 ? (
          <div className="bg-bg-secondary/50 border border-border rounded-2xl p-12 text-center">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-text-tertiary"
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
            <h3 className="text-xl font-bold text-text-primary mb-2">
              No se encontraron consejos
            </h3>
            <p className="text-text-secondary mb-6">
              {searchTerm || filterStatus !== 'all'
                ? 'Intenta con otros filtros o búsqueda'
                : 'Comienza creando tu primer consejo del día'}
            </p>
            {dailyTips.length === 0 && (
              <Link
                href="/daily-tips/new"
                className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue hover:bg-brand-blue/90 text-white rounded-xl font-medium transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Crear primer consejo
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredTips.map((tip) => (
              <div
                key={tip.id}
                className="bg-bg-secondary/80 backdrop-blur-sm border border-border rounded-2xl p-6 hover:border-brand-blue/50 transition-all duration-200 group"
              >
                <div className="flex items-start gap-4">
                  {/* Icono */}
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-blue/20 to-brand-blue/5 border border-brand-blue/30 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-brand-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>

                  {/* Contenido */}
                  <div className="flex-1 min-w-0">
                    <p className="text-text-primary mb-2">{getTextPreview(tip.daily_tip_translations)}</p>
                    <div className="flex items-center gap-4 text-sm text-text-tertiary">
                      <span>{tip.daily_tip_translations.length} idiomas</span>
                      <span>•</span>
                      <span>Creado: {new Date(tip.created_at).toLocaleDateString('es-ES')}</span>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Toggle activo */}
                    <button
                      onClick={() => toggleActive(tip.id, tip.is_active)}
                      className={`px-3 py-2 rounded-xl font-medium text-sm transition-all ${
                        tip.is_active
                          ? 'bg-success/10 text-success border border-success/30'
                          : 'bg-error/10 text-error border border-error/30'
                      }`}
                    >
                      {tip.is_active ? 'Activo' : 'Inactivo'}
                    </button>

                    {/* Editar */}
                    <Link
                      href={`/daily-tips/${tip.id}`}
                      className="p-2 bg-brand-blue/10 hover:bg-brand-blue/20 border border-brand-blue/30 text-brand-blue rounded-xl transition-all"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </Link>

                    {/* Eliminar */}
                    <button
                      onClick={() => {
                        setTipToDelete(tip.id);
                        setShowDeleteModal(true);
                      }}
                      className="p-2 bg-error/10 hover:bg-error/20 border border-error/30 text-error rounded-xl transition-all"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-bg-secondary border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-error/10 border border-error/30 flex items-center justify-center">
                <svg className="w-6 h-6 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-text-primary">Eliminar consejo</h3>
            </div>
            <p className="text-text-secondary mb-6">
              ¿Estás seguro de que deseas eliminar este consejo? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setTipToDelete(null);
                }}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-bg-tertiary hover:bg-border border border-border text-text-primary rounded-xl font-medium transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-error hover:bg-error/90 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
