'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    // Redirigir automáticamente a la página principal de categorías de deep talks
    router.replace('/deep-talks/categories');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 border-4 border-[#7B46F8]/30 border-t-[#7B46F8] rounded-full animate-spin"></div>
        <p className="text-[#999999]">Redirigiendo...</p>
      </div>
    </div>
  );
}
