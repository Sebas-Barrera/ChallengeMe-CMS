# Challengeme CMS - Setup Guide

Este es el CMS (Sistema de Gestión de Contenido) para la aplicación móvil Challengeme.

## Requisitos Previos

- Node.js 18+ y npm
- Una cuenta de Supabase
- (Opcional) Google Cloud API Key para traducción automática

## Configuración Inicial

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd challengeme-cms
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copia el archivo `.env.example` a `.env.local`:

```bash
cp .env.example .env.local
```

Edita `.env.local` y completa las siguientes variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase

# Google Translate API (Opcional)
GOOGLE_TRANSLATE_API_KEY=tu_clave_api_de_google_translate
```

### 4. Configurar Supabase MCP (Opcional)

Si estás usando Supabase local con MCP:

```bash
cp .mcp.json.example .mcp.json
```

Edita `.mcp.json` con tus credenciales locales de Supabase.

### 5. Ejecutar el proyecto

```bash
npm run dev
```

El CMS estará disponible en `http://localhost:3000`

## Estructura del Proyecto

- `/app` - Páginas y rutas de Next.js 14
  - `/(auth)` - Páginas de autenticación (login, registro)
  - `/(dashboard)` - Páginas del dashboard (challenges, deep-talks, etc.)
  - `/api` - API routes de Next.js
- `/src/components` - Componentes reutilizables
- `/src/contexts` - React Contexts (AuthContext)
- `/src/types` - Tipos de TypeScript
- `/public` - Archivos estáticos

## Características

- ✅ Sistema de autenticación con Supabase
- ✅ Gestión de categorías y retos (Challenges)
- ✅ Gestión de Deep Talks (filtros y categorías)
- ✅ Soporte multiidioma
- ✅ Auto-traducción con Google Translate API
- ✅ Selector de iconos de Ionicons
- ✅ Selector de emojis
- ✅ Modales de confirmación y éxito
- ✅ Interfaz moderna con Tailwind CSS

## Notas de Seguridad

**IMPORTANTE:** Nunca subas a GitHub los siguientes archivos:
- `.env.local` - Contiene tus claves API
- `.mcp.json` - Contiene configuración local de Supabase
- `.claude/settings.local.json` - Configuración local de Claude Code

Estos archivos ya están en `.gitignore` para prevenir commits accidentales.

## Soporte

Para preguntas o problemas, contacta al equipo de desarrollo.
