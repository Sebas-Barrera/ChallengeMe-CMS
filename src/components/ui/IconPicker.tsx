'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import * as IoIcons from 'react-icons/io5';

// Catálogo extenso de íconos de Ionicons
const POPULAR_ICONS = [
  // Trofeos y Premios
  'IoTrophy', 'IoMedal', 'IoRibbon', 'IoDiamond',

  // Bebidas y Comida
  'IoBeer', 'IoBeerOutline', 'IoWine', 'IoCafe', 'IoCafeOutline',
  'IoPizza', 'IoFastFood', 'IoIceCream', 'IoRestaurant', 'IoNutrition',

  // Gaming y Entretenimiento
  'IoGameController', 'IoGameControllerOutline',
  'IoFilm', 'IoTv', 'IoRadio', 'IoHeadset', 'IoDisc', 'IoAlbums',

  // Emociones y Expresiones
  'IoHeart', 'IoHeartOutline', 'IoHeartHalf', 'IoHeartDislike', 'IoThumbsUp',
  'IoThumbsDown', 'IoHappy', 'IoHappyOutline', 'IoSad', 'IoSadOutline',

  // Efectos y Magia
  'IoFlame', 'IoStar', 'IoStarOutline', 'IoStarHalf', 'IoSparkles',
  'IoFlash', 'IoFlashOutline', 'IoThunderstorm', 'IoColorWand',
  'IoRocket',

  // Celebración
  'IoBalloon', 'IoBalloonOutline', 'IoGift', 'IoGiftOutline',

  // Música
  'IoMusicalNotes', 'IoMusicalNotesOutline', 'IoMusicalNote', 'IoMusicalNoteOutline',
  'IoMic', 'IoMicOutline', 'IoMicOff', 'IoVolumeMedium', 'IoVolumeHigh', 'IoVolumeMute',

  // Comunicación
  'IoChatbubbles', 'IoChatbubblesOutline', 'IoChatbubble', 'IoChatbubbleOutline',
  'IoMail', 'IoMailOutline', 'IoSend', 'IoShareSocial', 'IoCall', 'IoVideocam',

  // Personas y Social
  'IoPeople', 'IoPeopleOutline', 'IoPerson', 'IoPersonOutline',
  'IoMale', 'IoMaleOutline', 'IoFemale', 'IoFemaleOutline',
  'IoMan', 'IoManOutline', 'IoWoman', 'IoWomanOutline',
  'IoBody', 'IoBodyOutline', 'IoAccessibility', 'IoAccessibilityOutline',

  // Deportes y Actividad
  'IoBasketball', 'IoBasketballOutline', 'IoFootball', 'IoFootballOutline',
  'IoTennisball', 'IoTennisballOutline', 'IoBarbell',
  'IoFitness', 'IoFitnessOutline',
  'IoWalk', 'IoBoatOutline',

  // Transporte
  'IoCar', 'IoCarOutline', 'IoCarSport', 'IoCarSportOutline', 'IoBus', 'IoBusOutline',
  'IoAirplane', 'IoAirplaneOutline', 'IoTrain', 'IoTrainOutline', 'IoBoat',
  'IoBicycle', 'IoBicycleOutline', 'IoRocketOutline',

  // Arte y Creatividad
  'IoBrush', 'IoBrushOutline', 'IoCamera', 'IoCameraOutline', 'IoColorPalette', 'IoColorPaletteOutline',
  'IoPencil', 'IoPencilOutline', 'IoCreate', 'IoCreateOutline', 'IoImage', 'IoImageOutline',
  'IoImages', 'IoImagesOutline', 'IoEasel', 'IoEaselOutline',

  // Educación
  'IoBook', 'IoBookOutline', 'IoLibrary', 'IoLibraryOutline', 'IoSchool', 'IoSchoolOutline',
  'IoReader', 'IoReaderOutline', 'IoNewspaper', 'IoNewspaperOutline',
  'IoJournal', 'IoJournalOutline', 'IoBookmark', 'IoBookmarkOutline',

  // Tecnología
  'IoBulb', 'IoBulbOutline', 'IoCellular', 'IoCellularOutline',
  'IoDesktop', 'IoDesktopOutline', 'IoLaptop', 'IoLaptopOutline', 'IoTabletPortrait', 'IoTabletLandscape',
  'IoPhonePortrait', 'IoPhoneLandscape', 'IoWatchOutline', 'IoHeadsetOutline', 'IoKeyboardOutline',

  // Clima
  'IoSunny', 'IoSunnyOutline', 'IoMoon', 'IoMoonOutline', 'IoCloud', 'IoCloudOutline',
  'IoRainy', 'IoRainyOutline', 'IoSnow', 'IoSnowOutline', 'IoThunderstormOutline',
  'IoPartlySunny', 'IoPartlySunnyOutline', 'IoCloudyNight', 'IoCloudyNightOutline',

  // Naturaleza
  'IoLeaf', 'IoLeafOutline', 'IoFlower', 'IoFlowerOutline',
  'IoPaw', 'IoPawOutline', 'IoBug', 'IoFish', 'IoFishOutline',
  'IoBonfire', 'IoBonfireOutline',

  // Accesorios
  'IoGlasses', 'IoGlassesOutline', 'IoShirt', 'IoShirtOutline', 'IoWatch',

  // Compras y Dinero
  'IoCart', 'IoCartOutline', 'IoStorefront', 'IoStorefrontOutline',
  'IoCard', 'IoCardOutline', 'IoCash', 'IoCashOutline', 'IoPricetag', 'IoPricetagOutline',
  'IoPricetags', 'IoPricetagsOutline', 'IoWallet', 'IoWalletOutline',

  // Lugares
  'IoHome', 'IoHomeOutline', 'IoBusiness', 'IoBusinessOutline', 'IoRestaurantOutline', 'IoBed', 'IoBedOutline',

  // Salud
  'IoBandage', 'IoBandageOutline', 'IoMedkit', 'IoMedkitOutline', 'IoPulse', 'IoPulseOutline', 'IoWater', 'IoWaterOutline',

  // Ubicación y Mapas
  'IoGlobe', 'IoGlobeOutline', 'IoEarth', 'IoEarthOutline', 'IoPin', 'IoPinOutline',
  'IoLocation', 'IoLocationOutline', 'IoCompass', 'IoCompassOutline',
  'IoMap', 'IoMapOutline', 'IoNavigate', 'IoNavigateOutline',

  // Espacio
  'IoPlanet', 'IoPlanetOutline', 'IoAperture', 'IoApertureOutline',

  // Herramientas
  'IoMagnet', 'IoMagnetOutline', 'IoHammer', 'IoHammerOutline', 'IoBuild', 'IoBuildOutline',
  'IoConstruct', 'IoConstructOutline', 'IoCog', 'IoCogOutline',
  'IoSettings', 'IoSettingsOutline', 'IoOptions', 'IoOptionsOutline',

  // Tiempo
  'IoTime', 'IoTimeOutline', 'IoTimer', 'IoTimerOutline', 'IoStopwatch', 'IoStopwatchOutline',
  'IoAlarm', 'IoAlarmOutline', 'IoHourglass', 'IoHourglassOutline',

  // Seguridad
  'IoLockClosed', 'IoLockClosedOutline', 'IoLockOpen', 'IoLockOpenOutline',
  'IoKey', 'IoKeyOutline', 'IoShield', 'IoShieldOutline',
  'IoShieldCheckmark', 'IoShieldCheckmarkOutline', 'IoFingerPrint', 'IoFingerPrintOutline',

  // Documentos
  'IoDocument', 'IoDocumentOutline', 'IoDocumentText', 'IoDocumentTextOutline',
  'IoFolder', 'IoFolderOutline', 'IoFolderOpen', 'IoFolderOpenOutline',
  'IoArchive', 'IoArchiveOutline', 'IoClipboard', 'IoClipboardOutline',

  // Media
  'IoPlayOutline', 'IoPlayCircle', 'IoPlayCircleOutline', 'IoPause', 'IoPauseOutline',
  'IoStop', 'IoStopOutline', 'IoPlaySkipForward', 'IoPlaySkipBackward',
  'IoPlayBack', 'IoPlayForward', 'IoReload', 'IoReloadOutline', 'IoShuffle', 'IoShuffleOutline',

  // Acciones
  'IoAdd', 'IoAddOutline', 'IoRemove', 'IoRemoveOutline', 'IoClose', 'IoCloseOutline',
  'IoCheckmark', 'IoCheckmarkOutline', 'IoCheckmarkDone', 'IoCheckmarkDoneOutline',
  'IoSave', 'IoSaveOutline', 'IoTrash', 'IoTrashOutline',

  // Direcciones
  'IoArrowUp', 'IoArrowUpOutline', 'IoArrowDown', 'IoArrowDownOutline',
  'IoArrowBack', 'IoArrowBackOutline', 'IoArrowForward', 'IoArrowForwardOutline',
  'IoChevronUp', 'IoChevronDown', 'IoChevronBack', 'IoChevronForward',

  // Extras
  'IoEye', 'IoEyeOutline', 'IoEyeOff', 'IoEyeOffOutline', 'IoSearch', 'IoSearchOutline',
  'IoFilter', 'IoFilterOutline', 'IoFunnel', 'IoFunnelOutline', 'IoGrid', 'IoGridOutline',
  'IoList', 'IoListOutline', 'IoMenu', 'IoMenuOutline', 'IoEllipsisVertical', 'IoEllipsisHorizontal',
  'IoNotifications', 'IoNotificationsOutline', 'IoWarning', 'IoWarningOutline',
  'IoAlert', 'IoAlertOutline', 'IoInformation', 'IoInformationOutline',
  'IoHelp', 'IoHelpOutline', 'IoShapes', 'IoShapesOutline',
  'IoExtensionPuzzle', 'IoExtensionPuzzleOutline', 'IoCube', 'IoCubeOutline',
  'IoGitBranch', 'IoGitBranchOutline', 'IoCode', 'IoCodeOutline',
  'IoTerminal', 'IoTerminalOutline', 'IoBugOutline',
  'IoSkull', 'IoSkullOutline', 'IoFootsteps', 'IoFootstepsOutline',
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

// Convertir nombre de Ionicons a nombre de React Icons
// Ejemplo: trophy -> IoTrophy, game-controller -> IoGameController
const convertToReactIconName = (ionicName: string): string => {
  return 'Io' + ionicName
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
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
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      });

      // Asegurar que el input mantenga el foco después de abrir el dropdown
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [isOpen]);

  // Deshabilitar scroll del body cuando el dropdown está abierto
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

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
      // Abrir dropdown sin perder el foco
      requestAnimationFrame(() => {
        setIsOpen(true);
      });
    }
  };

  // Obtener el componente del ícono actual
  const CurrentIcon = value
    ? IoIcons[convertToReactIconName(value) as keyof typeof IoIcons] || null
    : null;

  return (
    <div className="relative">
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
            ref={buttonRef}
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

      {/* Dropdown de íconos - Renderizado con Portal */}
      {mounted && isOpen && createPortal(
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 z-99999"
            onMouseDown={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
            onWheel={(e) => e.preventDefault()}
          />

          {/* Icon Grid Dropdown */}
          <div
            className="fixed z-100000 bg-bg-secondary border border-border rounded-xl shadow-2xl shadow-black/50 p-4 max-h-96 overflow-y-auto"
            onMouseDown={(e) => {
              // Evitar que el backdrop cierre el dropdown cuando se hace click en él
              e.stopPropagation();
            }}
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`,
            }}
          >
            {filteredIcons.length > 0 ? (
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
        </>,
        document.body
      )}
    </div>
  );
}
