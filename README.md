# GARITA.APP

**Sistema premium de control de acceso para condominios y residenciales**  
Desarrollado por **SISDEL**

---

## Descripción

GARITA.APP es un sistema integral de gestión de acceso para condominios y residenciales que soporta 4 métodos de ingreso:

- **Cámara LPR** — Lectura automática de placas
- **Código QR** — Escaneo de código QR
- **Tag / RFID** — Lectura de tag de proximidad
- **Manual** — Ingreso manual por placa

## Roles del Sistema

| Rol | Descripción |
|---|---|
| **Master** | Dueño del sistema. Gestiona condominios, administradores y mensajes globales |
| **Administrador** | Gestiona usuarios, vehículos y configuración del condominio |
| **Co-Administrador** | Mismas funciones que el administrador |
| **Vecino** | Registra visitas, ve sus vehículos e historial |
| **Policía** | Opera el panel de garita con acceso a LPR, QR, Tag y búsqueda manual |

## Stack Tecnológico

- **Frontend:** Next.js 14 (App Router) + TypeScript
- **Estilos:** Tailwind CSS + diseño premium personalizado
- **Base de datos:** Firebase Firestore
- **Estado:** Zustand (persistente en localStorage)
- **Iconos:** Lucide React
- **Notificaciones:** Sonner

## Inicio Rápido

### 1. Configurar Firebase (Firestore)

1. Crear/abrir un proyecto en [Firebase Console](https://console.firebase.google.com)
2. Ir a **Firestore Database** → **Crear base de datos**
3. Seleccionar **Modo de prueba** (para desarrollo) y crearla
4. Ir a **Configuración del proyecto** → **Tus apps** → **Web (</>)** y copiar el `firebaseConfig`

### 2. Variables de Entorno

```bash
cp .env.local.example .env.local
```

Editar `.env.local` con tus credenciales de Firebase:

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_APP_PREFIX=garita
```

### 3. Crear Usuario Master

En Firestore, crea un documento en la colección `garita_usuarios` con estos campos:

- `codigo`: `MAS001`
- `nombre`: tu nombre
- `telefono`: tu teléfono
- `rol`: `master`
- `activo`: `true`
- `moroso`: `false`
- `condominio_id`: `null`
- `email`: (opcional)
- `lote_casa`: (opcional)
- `fecha_creacion`: (ISO string)

### 4. Ejecutar

```bash
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000) e ingresar el código `MAS001`.

## Estructura del Proyecto

```
src/
├── app/
│   ├── page.tsx              # Login
│   ├── master/               # Panel Master
│   │   ├── condominios/      # CRUD Condominios
│   │   └── mensajes/         # Sistema de mensajes
│   ├── admin/                # Panel Administrador
│   │   ├── usuarios/         # Gestión de usuarios
│   │   ├── vehiculos/        # Gestión de vehículos
│   │   ├── visitas/          # Historial de visitas
│   │   └── registros/        # Registros de acceso
│   ├── vecino/               # Panel Vecino
│   │   ├── visitas/          # Registro y historial de visitas
│   │   └── vehiculos/        # Ver mis vehículos
│   └── garita/               # Panel de Garita (Policía)
├── components/
│   ├── sidebar.tsx           # Navegación lateral
│   ├── access-screen.tsx     # Overlay de acceso a color
│   ├── data-table.tsx        # Tabla de datos reutilizable
│   ├── modal.tsx             # Modal reutilizable
│   ├── page-header.tsx       # Header de página
│   └── stat-card.tsx         # Card de estadísticas
├── lib/
│   ├── types.ts              # Tipos TypeScript
│   ├── utils.ts              # Utilidades
│   ├── store.ts              # Estado global (Zustand)
│   └── supabase/client.ts    # Cliente Supabase
└── supabase/
    └── migrations/           # SQL Schema
```

## Pantallas de Acceso (Garita)

El sistema muestra pantallas a color completo cuando se registra un acceso:

| Estado | Color | Significado |
|---|---|---|
| Verificado | 🟢 Verde | Vecino registrado y al día |
| Moroso | 🟠 Naranja | Vecino registrado pero moroso |
| No Registrado | 🔴 Rojo | Vehículo no encontrado en el sistema |
| Visita | 🔵 Azul | Visita autorizada por un vecino |

---

© 2026 SISDEL — Todos los derechos reservados
