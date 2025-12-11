'use client';

import { useState, useEffect } from 'react';
import EmojiPicker from './EmojiPicker';
import IconPicker from './IconPicker';
import * as IoIcons from 'react-icons/io5';

interface EmojiOrIconPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  helperText?: string;
}

// Función helper para convertir nombre de ionicon a React Icon
const convertToReactIconName = (ionicName: string): string => {
  return 'Io' + ionicName
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
};

// Función para verificar si un valor es un ionicon válido
const isValidIcon = (value: string): boolean => {
  if (!value || value.trim() === '') return false;
  const iconName = convertToReactIconName(value);
  return iconName in IoIcons;
};

export default function EmojiOrIconPicker({
  label,
  value,
  onChange,
  helperText,
}: EmojiOrIconPickerProps) {
  // Determinar el tipo inicial basado en el valor
  // Verificar si es un icono válido de Ionicons
  const initialType = value && isValidIcon(value) ? 'icon' : 'emoji';
  const [selectedType, setSelectedType] = useState<'emoji' | 'icon'>(initialType);
  const [isInitialized, setIsInitialized] = useState(false);

  // Solo detectar el tipo automáticamente una vez al montar el componente
  // NO cambiar el tipo mientras el usuario está escribiendo
  useEffect(() => {
    if (!isInitialized && value && value.trim() !== '') {
      const detectedType = isValidIcon(value) ? 'icon' : 'emoji';
      setSelectedType(detectedType);
      setIsInitialized(true);
    } else if (!isInitialized) {
      setIsInitialized(true);
    }
  }, [value, isInitialized]);

  const handleTypeChange = (type: 'emoji' | 'icon') => {
    setSelectedType(type);
    // NO limpiar el valor - dejar que el usuario seleccione
  };

  return (
    <div className="space-y-4">
      {/* Tabs para seleccionar tipo */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => handleTypeChange('emoji')}
          className={`
            flex-1 px-4 py-3 rounded-xl font-semibold transition-all duration-200
            flex items-center justify-center gap-2
            ${
              selectedType === 'emoji'
                ? 'bg-brand-yellow text-black shadow-lg shadow-brand-yellow/20'
                : 'bg-bg-tertiary text-text-secondary hover:bg-border border border-border'
            }
          `}
        >
          <span className="text-xl">😊</span>
          <span>Emoji</span>
        </button>

        <button
          type="button"
          onClick={() => handleTypeChange('icon')}
          className={`
            flex-1 px-4 py-3 rounded-xl font-semibold transition-all duration-200
            flex items-center justify-center gap-2
            ${
              selectedType === 'icon'
                ? 'bg-brand-purple text-white shadow-lg shadow-brand-purple/20'
                : 'bg-bg-tertiary text-text-secondary hover:bg-border border border-border'
            }
          `}
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
              d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
            />
          </svg>
          <span>Icono</span>
        </button>
      </div>

      {/* Renderizar el picker correspondiente */}
      {selectedType === 'emoji' ? (
        <EmojiPicker
          label={label}
          value={value}
          onChange={onChange}
          helperText={helperText}
        />
      ) : (
        <IconPicker
          label={label}
          value={value}
          onChange={onChange}
          helperText={helperText}
        />
      )}
    </div>
  );
}
