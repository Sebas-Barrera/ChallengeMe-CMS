'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    // Redirigir automáticamente a la página principal de categorías de retos
    router.replace('/challenges/categories');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 border-4 border-[#FD8616]/30 border-t-[#FD8616] rounded-full animate-spin"></div>
        <p className="text-[#999999]">Redirigiendo...</p>
      </div>
    </div>
  );
}
