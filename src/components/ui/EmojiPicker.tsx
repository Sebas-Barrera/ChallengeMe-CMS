'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface EmojiPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  helperText?: string;
}

const COMMON_EMOJIS = [
  // Bebidas
  '🍺', '🍻', '🥂', '🍷', '🍾', '🥃', '🍹', '🍸', '🍶', '🧃', '🧉', '☕',
  // Fiesta y celebración
  '🎉', '🎊', '🎈', '🎁', '🎀', '🎆', '🎇', '✨', '🪅', '🎐', '🎏', '🎭',
  // Juegos
  '🎮', '🎯', '🎲', '🃏', '🎰', '🎪', '🎨', '🎬', '🎤', '🎧', '🎸', '🎹',
  // Emociones
  '😂', '😎', '🤪', '🥳', '🤩', '😜', '😏', '🙈', '🙊', '🙉', '😱', '🤯',
  '😇', '😈', '👻', '💀', '🤡', '👾', '🤖', '👽', '😺', '😸', '😹', '😻',
  // Personas y gestos (tono de piel claro)
  '💃🏻', '🕺🏻', '👏🏻', '👍🏻', '✌🏻', '🤘🏻', '💪🏻', '🙌🏻', '👊🏻', '✊🏻', '🤝', '🙏🏻',
  '👋🏻', '🤙🏻', '🤞🏻', '🖐🏻', '✋🏻', '👌🏻', '🤏🏻', '👈🏻', '👉🏻', '👆🏻', '👇🏻', '☝🏻',
  // Amor y corazones
  '❤️', '💕', '💖', '💗', '💓', '💝', '💋', '😘', '😍', '🥰', '😻', '💑',
  '💘', '💞', '💌', '💟', '❣️', '💔', '❤️‍🔥', '❤️‍🩹', '🧡', '💛',
  // Símbolos y efectos
  '🔥', '⚡', '💥', '💫', '⭐', '🌟', '✨', '🌈', '☀️', '🌙', '⚡', '💧',
  // Animales
  '🦄', '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁',
  '🐮', '🐷', '🐸', '🐵', '🙈', '🙉', '🙊', '🐔', '🐧', '🐦', '🦆', '🦅',
  // Comida
  '🍕', '🍔', '🌮', '🌭', '🍟', '🍿', '🧈', '🍖', '🍗', '🥓', '🍞', '🥐',
  '🎂', '🍰', '🧁', '🥧', '🍪', '🍩', '🍫', '🍬', '🍭', '🍮', '🍦', '🍨',
  // Frutas
  '🍎', '🍏', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑',
  // Deportes
  '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🏓', '🏸',
];

// Mapa de nombres/descripciones de emojis para búsqueda
const EMOJI_NAMES: Record<string, string> = {
  // Bebidas
  '🍺': 'cerveza beer bebida alcohol',
  '🍻': 'brindis cheers bebida cerveza',
  '🥂': 'copa brindis champagne celebrar',
  '🍷': 'vino wine copa alcohol',
  '🍾': 'champagne botella celebracion',
  '🥃': 'whisky whiskey alcohol copa',
  '🍹': 'coctel cocktail bebida tropical',
  '🍸': 'martini coctel bebida',
  '🍶': 'sake bebida japonesa',
  '🧃': 'jugo juice caja bebida',
  '🧉': 'mate yerba bebida',
  '☕': 'cafe coffee bebida caliente',
  // Fiesta
  '🎉': 'fiesta party celebracion confeti',
  '🎊': 'confeti celebration fiesta',
  '🎈': 'globo balloon fiesta decoracion',
  '🎁': 'regalo gift presente sorpresa',
  '🎀': 'moño lazo decoracion regalo',
  '🎆': 'fuegos artificiales fireworks celebrar',
  '🎇': 'bengala sparkler fuegos',
  '✨': 'brillos sparkles estrellas',
  '🪅': 'piñata fiesta dulces',
  '🎐': 'campana wind chime',
  '🎏': 'bandera carpa koinobori',
  '🎭': 'teatro mascara drama',
  // Juegos y entretenimiento
  '🎮': 'videojuego game play gaming',
  '🎯': 'diana target objetivo blanco',
  '🎲': 'dado dice juego azar',
  '🃏': 'joker carta naipe juego',
  '🎰': 'casino slot machine azar',
  '🎪': 'circo carnival carpa',
  '🎨': 'arte paint paleta pintura',
  '🎬': 'cine movie film claqueta',
  '🎤': 'microfono karaoke cantar',
  '🎧': 'audifonos headphones musica',
  '🎸': 'guitarra rock musica',
  '🎹': 'piano teclado musica',
  // Emociones
  '😂': 'risa laugh lol llorar',
  '😎': 'cool genial gafas sol',
  '🤪': 'loco crazy divertido',
  '🥳': 'fiesta party celebrar gorro',
  '🤩': 'wow asombrado estrellas',
  '😜': 'guiño lengua jugueton',
  '😏': 'picaro smirk malicioso',
  '🙈': 'mono ojos tapados vergüenza',
  '🙊': 'mono boca tapada secreto',
  '🙉': 'mono oidos tapados sordo',
  '😱': 'miedo terror grito',
  '🤯': 'mente explotada sorprendido',
  '😇': 'angel inocente aureola',
  '😈': 'diablo demonio cuernos',
  '👻': 'fantasma ghost boo',
  '💀': 'calavera skull muerte',
  '🤡': 'payaso clown circo',
  '👾': 'alien space invader juego',
  '🤖': 'robot automata maquina',
  '👽': 'extraterrestre alien et',
  '😺': 'gato feliz sonrisa',
  '😸': 'gato riendo alegre',
  '😹': 'gato llorando risa',
  '😻': 'gato corazon amor',
  // Gestos
  '💃🏻': 'bailar dance mujer baile',
  '🕺🏻': 'bailar dance hombre baile',
  '👏🏻': 'aplaudir clap aplauso bien',
  '👍🏻': 'like pulgar arriba bien ok',
  '✌🏻': 'paz peace victoria dedos',
  '🤘🏻': 'rock metal cuernos devil',
  '💪🏻': 'fuerte strong musculo biceps',
  '🙌🏻': 'manos arriba celebrar victoria',
  '👊🏻': 'puño fist fuerza golpe',
  '✊🏻': 'puño levantado poder',
  '🤝': 'apretón manos acuerdo trato',
  '🙏🏻': 'rezar orar gracias namaste',
  '👋🏻': 'hola adios saludo mano',
  '🤙🏻': 'hang loose shaka surf',
  '🤞🏻': 'dedos cruzados suerte',
  '🖐🏻': 'mano abierta cinco dedos',
  '✋🏻': 'alto stop mano',
  '👌🏻': 'ok perfecto bien',
  '🤏🏻': 'pequeño poquito pellizco',
  '👈🏻': 'izquierda señalar dedo',
  '👉🏻': 'derecha señalar dedo',
  '👆🏻': 'arriba señalar dedo',
  '👇🏻': 'abajo señalar dedo',
  '☝🏻': 'uno primero arriba dedo',
  // Amor
  '❤️': 'corazon love amor rojo',
  '💕': 'corazones love amor rosa dos',
  '💖': 'corazon brillante amor sparkle',
  '💗': 'corazon creciendo amor grande',
  '💓': 'corazon latiendo amor pulso',
  '💝': 'corazon regalo amor presente',
  '💋': 'beso kiss labios',
  '😘': 'beso volado amor',
  '😍': 'enamorado amor corazones ojos',
  '🥰': 'amor cariño corazones',
  '😻': 'gato amor corazones',
  '💑': 'pareja amor novios',
  '💘': 'corazon flecha cupido amor',
  '💞': 'corazones girando amor',
  '💌': 'carta amor mensaje',
  '💟': 'corazon decoracion amor',
  '❣️': 'corazon exclamacion amor',
  '💔': 'corazon roto sad tristeza',
  '❤️‍🔥': 'corazon fuego pasion amor',
  '❤️‍🩹': 'corazon curado sanando',
  '🧡': 'corazon naranja amor',
  '💛': 'corazon amarillo amor',
  // Símbolos
  '🔥': 'fuego fire hot caliente',
  '⚡': 'rayo lightning electrico energia',
  '💥': 'explosion boom crash',
  '💫': 'mareado dizzy estrellas',
  '⭐': 'estrella star',
  '🌟': 'estrella brillante star glow',
  '✨': 'brillos sparkles estrellas',
  '🌈': 'arcoiris rainbow colores',
  '☀️': 'sol sun dia',
  '🌙': 'luna moon noche',
  '💧': 'gota agua water',
  // Animales
  '🦄': 'unicornio unicorn magico',
  '🐶': 'perro dog cachorro mascota',
  '🐱': 'gato cat gatito mascota',
  '🐭': 'raton mouse animal',
  '🐹': 'hamster roedor mascota',
  '🐰': 'conejo rabbit bunny',
  '🦊': 'zorro fox animal',
  '🐻': 'oso bear animal',
  '🐼': 'panda oso animal',
  '🐨': 'koala australia animal',
  '🐯': 'tigre tiger animal',
  '🦁': 'leon lion animal',
  '🐮': 'vaca cow animal',
  '🐷': 'cerdo pig animal',
  '🐸': 'rana frog animal',
  '🐵': 'mono monkey animal',
  '🐔': 'pollo chicken gallo',
  '🐧': 'pinguino penguin animal',
  '🐦': 'pajaro bird ave',
  '🦆': 'pato duck animal',
  '🦅': 'aguila eagle ave',
  // Comida
  '🍕': 'pizza comida italiana',
  '🍔': 'hamburguesa burger comida',
  '🌮': 'taco mexicano comida',
  '🌭': 'hot dog perro caliente',
  '🍟': 'papas fritas french fries',
  '🍿': 'palomitas popcorn cine',
  '🧈': 'mantequilla butter',
  '🍖': 'carne meat hueso',
  '🍗': 'pollo chicken muslo',
  '🥓': 'tocino bacon',
  '🍞': 'pan bread',
  '🥐': 'croissant pan frances',
  // Postres
  '🎂': 'pastel cake cumpleaños',
  '🍰': 'pastel cake postre rebanada',
  '🧁': 'cupcake magdalena postre',
  '🥧': 'pie tarta postre',
  '🍪': 'galleta cookie postre',
  '🍩': 'dona donut dulce postre',
  '🍫': 'chocolate dulce',
  '🍬': 'dulce candy caramelo',
  '🍭': 'paleta lollipop dulce',
  '🍮': 'flan pudding postre',
  '🍦': 'helado soft serve postre',
  '🍨': 'helado ice cream postre',
  // Frutas
  '🍎': 'manzana apple fruta roja',
  '🍏': 'manzana verde apple fruta',
  '🍊': 'naranja orange fruta citrico',
  '🍋': 'limon lemon fruta acido',
  '🍌': 'banana platano fruta',
  '🍉': 'sandia watermelon fruta',
  '🍇': 'uvas grapes fruta',
  '🍓': 'fresa strawberry fruta',
  '🫐': 'arandanos blueberries fruta',
  '🍈': 'melon honeydew fruta',
  '🍒': 'cerezas cherries fruta',
  '🍑': 'durazno peach fruta',
  // Deportes
  '⚽': 'futbol soccer balon deporte',
  '🏀': 'basketball basquetbol deporte',
  '🏈': 'futbol americano football',
  '⚾': 'baseball beisbol deporte',
  '🥎': 'softball deporte',
  '🎾': 'tenis tennis deporte',
  '🏐': 'voleibol volleyball deporte',
  '🏉': 'rugby deporte',
  '🥏': 'frisbee disco deporte',
  '🎱': 'billar pool bola ocho',
  '🏓': 'ping pong tenis mesa',
  '🏸': 'badminton deporte',
};

export default function EmojiPicker({ label, value, onChange, helperText }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      });
      // Focus en el input de búsqueda cuando se abre
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      // Limpiar búsqueda cuando se cierra
      setSearchTerm('');
    }
  }, [isOpen]);

  // Deshabilitar scroll del body cuando el dropdown está abierto
  useEffect(() => {
    if (isOpen) {
      // Guardar el overflow actual
      const originalOverflow = document.body.style.overflow;
      // Deshabilitar scroll
      document.body.style.overflow = 'hidden';

      // Restaurar al desmontar o cuando se cierre
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  const handleSelect = (emoji: string) => {
    onChange(emoji);
    setIsOpen(false);
  };

  // Filtrar emojis según el término de búsqueda
  const filteredEmojis = searchTerm.trim() === ''
    ? COMMON_EMOJIS
    : COMMON_EMOJIS.filter(emoji => {
        const searchLower = searchTerm.toLowerCase();
        const emojiName = EMOJI_NAMES[emoji] || '';
        return emojiName.toLowerCase().includes(searchLower) || emoji.includes(searchTerm);
      });

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-text-primary mb-2">
        {label}
      </label>

      {/* Selected Emoji Display */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-bg-tertiary border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-yellow/50 transition-all hover:bg-border flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          {value ? (
            <>
              <span className="text-3xl">{value}</span>
              <span className="text-sm text-text-secondary">Emoji seleccionado</span>
            </>
          ) : (
            <span className="text-sm text-text-tertiary">Selecciona un emoji...</span>
          )}
        </div>
        <svg
          className={`w-5 h-5 text-text-secondary transition-transform ${
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

      {/* Helper Text */}
      {helperText && (
        <p className="mt-1.5 text-xs text-text-tertiary">{helperText}</p>
      )}

      {/* Emoji Grid - Renderizado con Portal */}
      {mounted && isOpen && createPortal(
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 z-99999"
            onClick={() => setIsOpen(false)}
            onWheel={(e) => e.preventDefault()}
          />

          {/* Emoji Grid Dropdown */}
          <div
            className="fixed z-100000 bg-bg-secondary border border-border rounded-xl shadow-2xl shadow-black/50 p-6 max-h-[600px] overflow-y-auto"
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: '520px',
            }}
          >
            {/* Direct Emoji Input */}
            <div className="mb-4 sticky top-0 bg-bg-secondary pb-3 z-10 border-b border-border">
              <label className="block text-sm font-semibold text-text-primary mb-2">
                O escribe/pega tu emoji
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Pega o escribe un emoji aquí..."
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full px-4 py-3 bg-bg-tertiary border border-border rounded-lg text-text-primary text-3xl text-center placeholder:text-base placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-yellow/50"
                  maxLength={10}
                />
              </div>
            </div>

            {/* Search Input */}
            <div className="mb-4 sticky top-0 bg-bg-secondary pb-3 z-10">
              <label className="block text-sm font-semibold text-text-primary mb-2">
                Buscar en la lista
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg
                    className="w-5 h-5 text-text-tertiary"
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
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Buscar... (fiesta, amor, comida)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full pl-11 pr-4 py-3 bg-bg-tertiary border border-border rounded-lg text-text-primary text-base placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-yellow/50"
                />
              </div>
            </div>

            {/* Emoji Grid */}
            {filteredEmojis.length > 0 ? (
              <div className="grid grid-cols-8 gap-3">
                {filteredEmojis.map((emoji, index) => (
                  <button
                    key={`${emoji}-${index}`}
                    type="button"
                    onClick={() => handleSelect(emoji)}
                    className={`w-14 h-14 flex items-center justify-center rounded-lg text-3xl transition-all hover:bg-bg-tertiary hover:scale-110 ${
                      value === emoji ? 'bg-brand-yellow/20 border-2 border-brand-yellow' : 'border border-transparent'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-text-tertiary">
                <div className="text-5xl mb-3">🔍</div>
                <p className="text-base font-medium">No se encontraron emojis</p>
              </div>
            )}

            {/* Clear Selection */}
            {value && (
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setIsOpen(false);
                }}
                className="mt-6 w-full px-4 py-3 bg-bg-tertiary hover:bg-border border border-border text-text-secondary rounded-lg text-base font-semibold transition-colors"
              >
                Limpiar selección
              </button>
            )}
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
