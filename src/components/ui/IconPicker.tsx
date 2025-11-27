'use client';

import { useState, useRef, useEffect } from 'react';
import * as IoIcons from 'react-icons/io5';

// Lista de íconos populares de Ionicons (puedes agregar más)
const POPULAR_ICONS = [
  'IoTrophy',
  'IoBeer',
  'IoGameController',
  'IoHeart',
  'IoFlame',
  'IoStar',
  'IoRocket',
  'IoBalloon',
  'IoGift',
  'IoMusicalNotes',
  'IoChatbubbles',
  'IoThumbsUp',
  'IoHappy',
  'IoSad',
  'IoSkull',
  'IoPizza',
  'IoCafe',
  'IoWine',
  'IoBicycle',
  'IoCar',
  'IoAirplane',
  'IoBoat',
  'IoBus',
  'IoBasketball',
  'IoFootball',
  'IoTennisball',
  'IoDumbbell',
  'IoFitness',
  'IoBrush',
  'IoCamera',
  'IoFilm',
  'IoMic',
  'IoHeadset',
  'IoBook',
  'IoSchool',
  'IoBulb',
  'IoFlash',
  'IoThunderstorm',
  'IoSunny',
  'IoMoon',
  'IoCloud',
  'IoRainy',
  'IoSnow',
  'IoLeaf',
  'IoFlower',
  'IoNutrition',
  'IoPaw',
  'IoBug',
  'IoBonfire',
  'IoCellular',
  'IoDesktop',
  'IoWatch',
  'IoGameControllerOutline',
  'IoGlasses',
  'IoCart',
  'IoStorefront',
  'IoHome',
  'IoRestaurant',
  'IoFastFood',
  'IoIceCream',
  'IoCake',
  'IoColorPalette',
  'IoShirt',
  'IoFootsteps',
  'IoBody',
  'IoBed',
  'IoBandage',
  'IoMedkit',
  'IoBarbell',
  'IoWalk',
  'IoAccessibility',
  'IoPeople',
  'IoPerson',
  'IoMale',
  'IoFemale',
  'IoMan',
  'IoWoman',
  'IoCard',
  'IoCash',
  'IoDiamond',
  'IoRibbon',
  'IoMedal',
  'IoRadio',
  'IoMusicalNote',
  'IoAlbums',
  'IoDisc',
  'IoGlobe',
  'IoEarth',
  'IoPin',
  'IoLocation',
  'IoCompass',
  'IoMap',
  'IoPlanet',
  'IoSparkles',
  'IoColorWand',
  'IoMagnet',
  'IoHammer',
  'IoBuild',
  'IoConstruct',
  'IoCog',
  'IoSettings',
];

// Convertir nombre de React Icons a nombre de Ionicons
// Ejemplo: IoTrophy -> trophy
const convertToIoniconsName = (reactIconName: string): string => {
  return reactIconName
    .replace(/^Io/, '') // Quitar prefijo "Io"
    .replace(/([A-Z])/g, '-$1') // Agregar guión antes de mayúsculas
    .toLowerCase()
    .substring(1); // Quitar el primer guión
};

interface IconPickerProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  helperText?: string;
  error?: string;
  required?: boolean;
}

export default function IconPicker({
  label,
  value,
  onChange,
  placeholder = 'Buscar ícono...',
  helperText,
  error,
  required,
}: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtrar íconos basado en el término de búsqueda
  const filteredIcons = POPULAR_ICONS.filter((iconName) => {
    const ionicName = convertToIoniconsName(iconName);
    const search = searchTerm.toLowerCase();
    return ionicName.includes(search) || iconName.toLowerCase().includes(search);
  });

  const handleIconSelect = (iconName: string) => {
    const ionicName = convertToIoniconsName(iconName);
    onChange(ionicName);
    setSearchTerm('');
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);
    setSearchTerm(val);
    if (!isOpen && val.length > 0) {
      setIsOpen(true);
    }
  };

  // Obtener el componente del ícono actual
  const CurrentIcon = value
    ? IoIcons[
        ('Io' +
          value
            .split('-')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join('')) as keyof typeof IoIcons
      ] || null
    : null;

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-text-primary mb-2">
          {label}
          {required && <span className="text-danger ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {/* Input con preview del ícono */}
        <div className="relative">
          {CurrentIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-primary">
              <CurrentIcon size={20} />
            </div>
          )}
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className={`
              w-full ${CurrentIcon ? 'pl-11' : 'pl-4'} pr-10 py-2.5
              bg-bg-tertiary border rounded-xl
              text-text-primary placeholder-text-tertiary
              focus:outline-none focus:ring-2 focus:ring-brand-yellow/50
              transition-all duration-200
              ${error ? 'border-danger' : 'border-border focus:border-brand-yellow'}
            `}
          />
          {/* Botón para abrir/cerrar dropdown */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary transition-colors"
          >
            <svg
              className={`w-5 h-5 transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>

        {/* Dropdown de íconos */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-2 bg-bg-secondary border border-border rounded-xl shadow-xl shadow-black/20 max-h-80 overflow-y-auto">
            {filteredIcons.length > 0 ? (
              <div className="p-2">
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {filteredIcons.map((iconName) => {
                    const IconComponent =
                      IoIcons[iconName as keyof typeof IoIcons];
                    const ionicName = convertToIoniconsName(iconName);
                    const isSelected = value === ionicName;

                    return (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => handleIconSelect(iconName)}
                        className={`
                          group relative p-3 rounded-xl border transition-all duration-200
                          hover:border-brand-yellow/50 hover:bg-brand-yellow/10
                          ${
                            isSelected
                              ? 'border-brand-yellow bg-brand-yellow/10'
                              : 'border-border bg-bg-tertiary'
                          }
                        `}
                        title={ionicName}
                      >
                        <div className="flex flex-col items-center gap-1.5">
                          {IconComponent && (
                            <IconComponent
                              size={24}
                              className={`
                                transition-colors
                                ${
                                  isSelected
                                    ? 'text-brand-yellow'
                                    : 'text-text-secondary group-hover:text-brand-yellow'
                                }
                              `}
                            />
                          )}
                          <span className="text-[10px] text-text-tertiary group-hover:text-text-secondary truncate w-full text-center">
                            {ionicName.split('-')[0]}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-6 text-center">
                <svg
                  className="w-12 h-12 mx-auto mb-3 text-text-tertiary"
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
                <p className="text-sm text-text-secondary">
                  No se encontraron íconos
                </p>
                <p className="text-xs text-text-tertiary mt-1">
                  Intenta con otro término de búsqueda
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Helper text o error */}
      {(helperText || error) && (
        <p
          className={`mt-1.5 text-xs ${
            error ? 'text-danger' : 'text-text-tertiary'
          }`}
        >
          {error || helperText}
        </p>
      )}
    </div>
  );
}
