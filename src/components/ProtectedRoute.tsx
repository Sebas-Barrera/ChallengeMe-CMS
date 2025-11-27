'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      console.log('No user found, redirecting to login');
      router.replace('/login');
    }
  }, [user, loading, router]);

  // Mientras está cargando, mostrar spinner
  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-brand-yellow/30 border-t-brand-yellow rounded-full animate-spin"></div>
          <p className="text-text-secondary">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // Si ya terminó de cargar y no hay usuario, mostrar spinner mientras redirige
  if (!user) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-brand-yellow/30 border-t-brand-yellow rounded-full animate-spin"></div>
          <p className="text-text-secondary">Redirigiendo...</p>
        </div>
      </div>
    );
  }

  // Usuario autenticado, mostrar contenido
  console.log('User authenticated, showing protected content');
  return <>{children}</>;
}
