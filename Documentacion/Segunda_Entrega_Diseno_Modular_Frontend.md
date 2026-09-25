# Cumpa 🐾 — Documentación de Diseño Modular del Frontend

> **Trabajo Final Integrador (TFI)** — Tecnicatura Universitaria en Programación a Distancia (TUPaD)  
> **Universidad Tecnológica Nacional (UTN)**  
> **Grupo Nº:** 195  
> **Alumnos:** Mateo Serafini, Gonzalo Vega  
> **Tutor:** Juan Ignacio Schiavonni  
> **Etapa:** 2.ª Entrega — Diseño y Módulos del Sistema  
> **Stack Técnico Frontend:** React 18+ | TypeScript | Tailwind CSS | React Router v6 

---

## 📑 Tabla de Contenidos
1. [Introducción y Criterio Arquitectónico](#1-introducción-y-criterio-arquitectónico)
2. [Estructura del Directorio Frontend (`/frontend/src`)](#2-estructura-del-directorio-frontend-frontendsrc)
   - [Árbol de Directorios Completo](#árbol-de-directorios-completo)
   - [Responsabilidad por Directorio y Convenciones](#responsabilidad-por-directorio-y-convenciones)
3. [Fichas Técnicas por Módulo del Frontend](#3-fichas-técnicas-por-módulo-del-frontend)
   - [Módulo A: Autenticación, Registro y Perfil (`features/auth`)](#módulo-a-autenticación-registro-y-perfil-featuresauth)
   - [Módulo B: Exploración y Búsqueda (`features/exploration`)](#módulo-b-exploración-y-búsqueda-featuresexploration)
   - [Módulo C: Gestión de Publicaciones y Multimedia (`features/pets`)](#módulo-c-gestión-de-publicaciones-y-multimedia-featurespets)
   - [Módulo D: Contacto y Solicitudes de Adopción (`features/adoptions`)](#módulo-d-contacto-y-solicitudes-de-adopción-featuresadoptions)
   - [Módulo E: Seguimiento Post-Adopción (`features/tracking`)](#módulo-e-seguimiento-post-adopción-featurestracking)
   - [Módulo F: Administración y Moderación (`features/admin`)](#módulo-f-administración-y-moderación-featuresadmin)
4. [Estrategia de Enrutamiento y Control de Acceso (RBAC)](#4-estrategia-de-enrutamiento-y-control-de-acceso-rbac)
5. [Guía de Scaffolding y Comandos de Inicialización](#5-guía-de-scaffolding-y-comandos-de-inicialización)
   - [Inicialización con Vite + React + TS](#inicialización-con-vite--react--ts)
   - [Creación Automatizada de la Estructura de Carpetas](#creación-automatizada-de-la-estructura-de-carpetas)
   - [Primer Commit en Git](#primer-commit-en-git)

---

## 1. Introducción y Criterio Arquitectónico

Para el desarrollo del frontend de la plataforma **Cumpa**, se ha seleccionado una **Arquitectura Guiada por Características (Feature-Driven Architecture)** combinada con principios de **Separación de Incumbencias (Separation of Concerns - SoC)**.

### Justificación Técnica:
1. **Alta cohesión y bajo acoplamiento:** Los componentes, hooks, servicios y tipos que resuelven una necesidad de negocio concreta residen juntos dentro del mismo módulo funcional (`features/<nombre-modulo>`).
2. **Escalabilidad:** A medida que la plataforma crezca hacia versiones posteriores (v2 con donaciones y pasarela de pago), se pueden incorporar nuevos módulos sin alterar los existentes.
3. **Mantenibilidad:** El código compartido transversalmente (UI Kit genérico, utilidades de fecha, validadores universales, layout base) reside en carpetas globales (`components/ui`, `layouts`, `services`, `utils`), evitando la duplicación de código.
4. **Tipado Estricto con TypeScript:** Todo el flujo de datos entre la API REST y la interfaz gráfica cuenta con contratos formales (DTOs e Interfaces), minimizando bugs en tiempo de ejecución.

---

## 2. Estructura del Directorio Frontend (`/frontend/src`)

### Árbol de Directorios Completo

```text
frontend/
├── public/
│   ├── favicon.ico
│   └── robots.txt
├── src/
│   ├── assets/                      # Recursos estáticos (logos, SVGs, ilustraciones)
│   │   ├── icons/
│   │   └── images/
│   ├── components/                  # Componentes de UI transversales y reutilizables
│   │   ├── feedback/                # Feedback al usuario (Alert, Toast, Spinner, Skeleton, EmptyState)
│   │   └── ui/                      # Átomos y moléculas de interfaz (Button, Input, Badge, Modal, Card, Dropdown)
│   ├── config/                      # Variables de entorno y configuración centralizada
│   │   └── env.config.ts
│   ├── context/                     # Contextos globales de React (Estado transversal)
│   │   ├── AuthContext.tsx
│   │   └── NotificationContext.tsx
│   ├── features/                    # MÓDULOS DE NEGOCIO PRINCIPALES (Feature-Based)
│   │   ├── auth/                    # [Módulo A] Autenticación, Registro y Perfil
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   └── types/
│   │   ├── exploration/             # [Módulo B] Catálogo y Búsqueda de Mascotas
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   └── types/
│   │   ├── pets/                    # [Módulo C] Gestión de Publicaciones y Multimedia
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   └── types/
│   │   ├── adoptions/               # [Módulo D] Contacto y Solicitudes de Adopción
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   └── types/
│   │   ├── tracking/                # [Módulo E] Seguimiento Post-Adopción
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   └── types/
│   │   └── admin/                   # [Módulo F] Administración y Moderación
│   │       ├── components/
│   │       ├── hooks/
│   │       ├── services/
│   │       └── types/
│   ├── hooks/                       # Custom hooks globales (useDebounce, useMediaQuery, useLocalStorage)
│   ├── layouts/                     # Plantillas estructurales de página
│   │   ├── AdminLayout.tsx
│   │   ├── AuthLayout.tsx
│   │   ├── DashboardLayout.tsx
│   │   └── MainLayout.tsx
│   ├── pages/                       # Vistas conectadas al enrutador (Entry points de cada ruta)
│   │   ├── admin/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── exploration/
│   │   ├── pets/
│   │   ├── tracking/
│   │   ├── HomePage.tsx
│   │   └── NotFoundPage.tsx
│   ├── routes/                      # Definición y control de rutas
│   │   ├── AppRoutes.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── RoleGuard.tsx
│   ├── services/                    # Capa de comunicación HTTP base
│   │   ├── apiClient.ts             # Instancia de Axios/Fetch con interceptores JWT
│   │   └── endpoints.ts             # Constantes con URLs del backend
│   ├── types/                       # Definiciones de tipos globales y respuestas API comunes
│   │   ├── api.types.ts
│   │   └── common.types.ts
│   ├── utils/                       # Funciones utilitarias puras y helpers
│   │   ├── cuitValidator.ts
│   │   ├── dateFormatter.ts
│   │   └── storage.ts
│   ├── App.tsx                      # Componente raíz de la aplicación
│   ├── index.css                    # Directivas base de Tailwind CSS y tipografías
│   └── main.tsx                     # Punto de entrada de Vite (ReactDOM.createRoot)
├── .env.example                     # Plantilla de variables de entorno (VITE_API_URL, etc.)
├── index.html                       # HTML base de Vite
├── package.json                     # Manifiesto de dependencias y scripts
├── postcss.config.js                # Configuración de PostCSS para Tailwind
├── tailwind.config.js               # Paleta de colores, tipografías y extensiones
├── tsconfig.json                    # Configuración estricta de TypeScript
└── vite.config.ts                   # Configuración del bundler Vite
```

### Responsabilidad por Directorio y Convenciones

| Directorio | Responsabilidad Técnica y Alcance | Convención de Nomenclatura |
| :--- | :--- | :--- |
| `src/assets/` | Archivos estáticos empaquetados por Vite (imágenes SVG, logotipos, marcas). | `kebab-case` para carpetas y archivos (ej. `logo-cumpa.svg`). |
| `src/components/ui/` | Componentes atómicos de diseño universal sin lógica de negocio (botones, inputs, modales, badges). | `PascalCase.tsx` (ej. `Button.tsx`, `Modal.tsx`). |
| `src/components/feedback/` | Elementos de retroalimentación asíncrona (spinners, alertas de error, skeletons). | `PascalCase.tsx` (ej. `SkeletonLoader.tsx`). |
| `src/features/<modulo>/` | Núcleo modular del negocio. Cada carpeta agrupa exclusivamente los componentes, hooks, servicios y contratos de tipos de dicho dominio. | `kebab-case` para la feature (ej. `auth`, `pets`). |
| `src/features/<modulo>/components/` | Componentes visuales especializados con lógica particular del módulo. | `PascalCase.tsx` (ej. `PetFilters.tsx`, `TimelineView.tsx`). |
| `src/features/<modulo>/hooks/` | Custom hooks que manejan el estado local/asíncrono del módulo. | `camelCase.ts` iniciando con `use` (ej. `usePetSearch.ts`). |
| `src/features/<modulo>/services/` | Funciones de llamada a la API REST específicas de ese módulo. | `camelCase.ts` terminando en `Service` (ej. `petService.ts`). |
| `src/features/<modulo>/types/` | Interfaces y tipos TypeScript asociados al modelo de datos del módulo. | `kebab-case.types.ts` (ej. `pet.types.ts`). |
| `src/context/` | Proveedores de contexto de React para estados globales persistentes (sesión, notificaciones). | `PascalCase.tsx` terminando en `Context` (ej. `AuthContext.tsx`). |
| `src/layouts/` | Estructuras de página (header, sidebar, footer, main container) que envuelven las vistas. | `PascalCase.tsx` terminando en `Layout` (ej. `MainLayout.tsx`). |
| `src/pages/` | Vistas completas vinculadas a una ruta URL. Coordinan layouts y features, sin contener lógica de bajo nivel. | `PascalCase.tsx` terminando en `Page` (ej. `PetDetailPage.tsx`). |
| `src/routes/` | Configuración de enrutamiento con React Router, protecciones de autenticación y guardas de rol. | `PascalCase.tsx` (ej. `AppRoutes.tsx`, `RoleGuard.tsx`). |
| `src/services/` | Cliente HTTP base (`apiClient.ts`), interceptores de tokens JWT, manejo centralizado de errores 401/403/500. | `camelCase.ts` (ej. `apiClient.ts`). |
| `src/types/` | Tipos genéricos de respuestas HTTP (`ApiResponse<T>`, `PaginatedResponse<T>`). | `kebab-case.types.ts` (ej. `api.types.ts`). |
| `src/utils/` | Funciones puras independientes sin dependencias de React (formateo de fechas, validación de CUIT argentino). | `camelCase.ts` (ej. `cuitValidator.ts`). |

---

## 3. Fichas Técnicas por Módulo del Frontend

---

### Módulo A: Autenticación, Registro y Perfil (`features/auth`)

- **Nombre Funcional:** Módulo de Identidad, Acceso y Perfiles de Usuario.
- **Responsabilidad y Alcance:**
  - Gestión integral del ciclo de vida de la sesión (inicio de sesión mediante credenciales, inicio de sesión federado vía Google OAuth, y cierre de sesión).
  - Registro diferenciado por tipo de actor:
    - **Adoptante / Particular:** Registro simplificado con datos de contacto básicos.
    - **Institución / Refugio / Veterinaria:** Carga de datos institucionales obligatorios (Razón Social y CUIT), quedando la cuenta en estado de revisión hasta su validación por el administrador.
  - Almacenamiento seguro del token JWT en memoria y persistencia controlada, con inyección en cabeceras HTTP.
  - Consulta y actualización de datos de perfil del usuario logueado.

#### Rutas y Vistas Asociadas
| Ruta (Path) | Visibilidad | Propósito / Vista |
| :--- | :--- | :--- |
| `/login` | Pública (solo no autenticados) | Formulario de acceso por credenciales y botón de Google OAuth. |
| `/registro` | Pública (solo no autenticados) | Selector inicial de tipo de cuenta (Particular vs. Institución). |
| `/registro/particular` | Pública | Formulario de datos para adoptantes particulares. |
| `/registro/institucion` | Pública | Formulario para ONGs/refugios con validación de CUIT y Razón Social. |
| `/auth/callback` | Pública (técnica) | Recepción de token y resolución del flujo OAuth con Google. |
| `/perfil` | Privada (Todos los roles) | Vista de datos de perfil, estado de verificación y accesos rápidos. |
| `/perfil/editar` | Privada (Todos los roles) | Formulario de actualización de teléfono, dirección y bio. |

#### Componentes Principales
- `LoginForm`: Formulario de acceso con inputs controlados, validación de email/password y feedback de error.
- `GoogleAuthButton`: Botón con diseño oficial para iniciar el flujo de autenticación federada con Google.
- `AccountTypeSelector`: Selector visual interactivo para elegir entre cuenta de particular o institución.
- `AdopterRegisterForm`: Formulario con validaciones para personas físicas (nombre, apellido, localidad, teléfono).
- `InstitutionRegisterForm`: Formulario especializado para personas jurídicas con validación de formato CUIT y razón social.
- `ProfileCard`: Tarjeta de resumen de usuario con avatar, rol asignado y badge de estado (`Activo`, `Pendiente de Aprobación`).
- `VerificationStatusBanner`: Banner informativo para instituciones advirtiendo que su cuenta está bajo revisión admin.

#### Servicios y Contratos con el Backend (`authService.ts`)
- **Login de Usuario:**
  - *Endpoint:* `POST /api/auth/login`
  - *Datos enviados (Request Body):*
    ```typescript
    interface LoginRequest {
      email: string;
      password: string;
    }
    ```
  - *Datos recibidos (Response Body):*
    ```typescript
    interface AuthResponse {
      token: string;
      user: {
        id: string;
        email: string;
        fullName: string;
        role: 'ADOPTER' | 'INSTITUTION' | 'ADMIN';
        status: 'ACTIVE' | 'PENDING_APPROVAL' | 'SUSPENDED';
      };
    }
    ```
- **Registro de Institución:**
  - *Endpoint:* `POST /api/auth/register/institution`
  - *Datos enviados (Request Body):*
    ```typescript
    interface RegisterInstitutionRequest {
      legalName: string;
      cuit: string; // Formato XX-XXXXXXXX-X
      email: string;
      password: string;
      phone: string;
      address: {
        province: string;
        city: string;
        street: string;
      };
      description?: string;
    }
    ```
  - *Datos recibidos (Response Body):*
    ```typescript
    interface RegisterInstitutionResponse {
      message: string;
      institutionId: string;
      status: 'PENDING_APPROVAL';
    }
    ```
- **Obtención de Perfil:**
  - *Endpoint:* `GET /api/users/profile`
  - *Datos enviados:* Headers con `Authorization: Bearer <token>`
  - *Datos recibidos:* Perfil completo del usuario con metadatos de auditoría y estado.

---

### Módulo B: Exploración y Búsqueda (`features/exploration`)

- **Nombre Funcional:** Catálogo General y Búsqueda Avanzada de Mascotas.
- **Responsabilidad y Alcance:**
  - Presentar a los usuarios el catálogo público y paginado de animales disponibles para adopción definitiva o tránsito.
  - Proveer un sistema de filtrado multifactorial en tiempo real sincronizado con los parámetros de la URL (`searchParams`) para permitir compartir búsquedas.
  - Implementar búsqueda textual por nombre y palabras clave con técnica de *debounce* para optimizar llamadas al backend.
  - Manejar estados asíncronos de carga mediante esqueletos visuales (skeletons) y estados vacíos amigables cuando no haya resultados.

#### Rutas y Vistas Asociadas
| Ruta (Path) | Visibilidad | Propósito / Vista |
| :--- | :--- | :--- |
| `/` | Pública | Portada principal (Hero banner, llamados a la acción y mascotas recientes). |
| `/explorar` | Pública | Catálogo general con panel lateral de filtros, ordenamiento y paginación. |

#### Componentes Principales
- `PetCatalog`: Grilla responsiva que renderiza la colección de tarjetas de mascotas.
- `PetCard`: Tarjeta de previsualización que muestra foto principal, nombre, edad estimada, badges de especie/tamaño/ubicación y tipo de publicación (adopción/tránsito).
- `PetFilters`: Panel de filtros con controles para especie (Perro/Gato/Otro), tamaño (Pequeño/Mediano/Grande), sexo, rango de edad y provincia.
- `PetSearchBar`: Input de búsqueda con retardo (*debounce*) que dispara búsquedas semánticas.
- `CatalogPagination`: Control de navegación de páginas con selector de límite de resultados por vista.
- `EmptyCatalogState`: Componente ilustrado con mensaje motivacional cuando la combinación de filtros no arroja resultados.
- `CatalogSkeleton`: Indicador visual animado que simula la carga de tarjetas mientras se esperan los datos de la red.

#### Servicios y Contratos con el Backend (`explorationService.ts`)
- **Consulta Paginada y Filtrada:**
  - *Endpoint:* `GET /api/pets`
  - *Parámetros enviados (Query Params):*
    ```typescript
    interface PetQueryParams {
      page?: number;
      limit?: number;
      species?: 'PERRO' | 'GATO' | 'OTRO';
      size?: 'PEQUENO' | 'MEDIANO' | 'GRANDE';
      modality?: 'ADOPCION' | 'TRANSITO';
      province?: string;
      city?: string;
      search?: string;
      sortBy?: 'createdAt_desc' | 'age_asc';
    }
    ```
  - *Datos recibidos (Response Body):*
    ```typescript
    interface PaginatedPetsResponse {
      data: Array<{
        id: string;
        name: string;
        species: 'PERRO' | 'GATO' | 'OTRO';
        size: 'PEQUENO' | 'MEDIANO' | 'GRANDE';
        gender: 'MACHO' | 'HEMBRA';
        estimatedAge: string;
        mainPhotoUrl: string;
        location: {
          province: string;
          city: string;
        };
        modality: 'ADOPCION' | 'TRANSITO';
        publisherType: 'PARTICULAR' | 'INSTITUTION';
        isUrgent: boolean;
      }>;
      meta: {
        totalItems: number;
        currentPage: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
      };
    }
    ```

---

### Módulo C: Gestión de Publicaciones y Multimedia (`features/pets`)

- **Nombre Funcional:** Gestión de Publicaciones de Mascotas y Carga Multimedia.
- **Responsabilidad y Alcance:**
  - Permitir a los usuarios particulares e instituciones registradas crear y editar publicaciones detalladas de animales.
  - Integrar la carga optimizada de fotografías hacia **Cloudinary** mediante carga directa firmada (*signed upload*), almacenando únicamente las URLs HTTPS seguras en la base de datos PostgreSQL.
  - Exponer la vista pública de detalle de la mascota con carrusel multimedia, ficha de salud (vacunas, castración, tratamientos) e historia.
  - Implementar la **baja lógica (*soft delete*)** de la publicación, actualizando su estado sin destruir físicamente el registro en la base de datos para mantener integridad histórica.

#### Rutas y Vistas Asociadas
| Ruta (Path) | Visibilidad | Propósito / Vista |
| :--- | :--- | :--- |
| `/mascotas/:id` | Pública | Detalle exhaustivo de la mascota con botón de postulación / contacto. |
| `/mis-publicaciones` | Privada (Adoptantes e Instituciones) | Panel de control de publicaciones creadas por el usuario autenticado. |
| `/publicar` | Privada (Cuentas activas) | Formulario de alta para publicar una nueva mascota. |
| `/mis-publicaciones/:id/editar` | Privada (Propietario de la publicación) | Formulario de edición de datos, estado y fotos. |

#### Componentes Principales
- `PetForm`: Formulario con validaciones de campos obligatorios, características físicas, temperamento y estado de salud.
- `CloudinaryUploader`: Componente interactivo drag-and-drop para seleccionar fotos, previsualizarlas localmente, gestionar la barra de progreso de subida y ordenar la imagen principal.
- `PetDetailHero`: Encabezado visual que contiene el visor o carrusel de fotos, badges de condición y botón principal de contacto.
- `PetHealthAttributes`: Grilla de indicadores con iconos que detallan si el animal está vacunado, desparasitado, castrado o posee necesidades especiales.
- `PublisherInfoCard`: Bloque con información de contacto del publicador, insignia de verificación institucional y reputación.
- `MyPublicationsTable`: Listado de publicaciones propias con acciones rápidas: pausar, marcar como adoptado, editar o eliminar.
- `DeletePetConfirmModal`: Modal de confirmación para aplicar baja lógica con justificación de motivo.

#### Servicios y Contratos con el Backend (`petService.ts` y `cloudinaryService.ts`)
- **Obtención de Firma para Subida a Cloudinary:**
  - *Endpoint:* `POST /api/uploads/signature`
  - *Datos enviados:* `{ folder: 'cumpa/pets' }`
  - *Datos recibidos:*
    ```typescript
    interface CloudinarySignatureResponse {
      signature: string;
      timestamp: number;
      apiKey: string;
      cloudName: string;
      folder: string;
    }
    ```
- **Alta de Publicación:**
  - *Endpoint:* `POST /api/pets`
  - *Datos enviados (Request Body):*
    ```typescript
    interface CreatePetRequest {
      name: string;
      species: 'PERRO' | 'GATO' | 'OTRO';
      breed?: string;
      gender: 'MACHO' | 'HEMBRA';
      estimatedAge: string;
      size: 'PEQUENO' | 'MEDIANO' | 'GRANDE';
      description: string;
      modality: 'ADOPCION' | 'TRANSITO';
      healthStatus: {
        isVaccinated: boolean;
        isDewormed: boolean;
        isCastrated: boolean;
        hasSpecialNeeds: boolean;
        specialNeedsNotes?: string;
      };
      location: {
        province: string;
        city: string;
      };
      photoUrls: string[]; // URLs seguras obtenidas de Cloudinary
    }
    ```
  - *Datos recibidos:* `{ id: string; status: 'DISPONIBLE'; createdAt: string }`
- **Baja Lógica de Publicación (*Soft Delete*):**
  - *Endpoint:* `DELETE /api/pets/:id`
  - *Datos enviados:* Headers con token de autenticación.
  - *Datos recibidos:*
    ```typescript
    interface SoftDeleteResponse {
      message: "Publicación dada de baja exitosamente";
      petId: string;
      deletedAt: string;
    }
    ```

---

### Módulo D: Contacto y Solicitudes de Adopción (`features/adoptions`)

- **Nombre Funcional:** Gestión de Solicitudes de Adopción y Contacto Responsable.
- **Responsabilidad y Alcance:**
  - Formalizar el interés de un adoptante mediante un formulario estructurado de preguntas clave sobre tenencia responsable (tipo de vivienda, cerramientos, convivencia con otros animales, tiempo en solitario).
  - Persistir cada solicitud en la base de datos, garantizando que el publicador no pierda oportunidades ante eventuales fallas o filtros de spam en los correos electrónicos.
  - Proveer una bandeja de entrada y salida con estados de solicitud: `PENDIENTE`, `EN_EVALUACION`, `APROBADA` o `RECHAZADA`.
  - Disparar la transición hacia el seguimiento post-adopción cuando el publicador apruebe formalmente a un adoptante.

#### Rutas y Vistas Asociadas
| Ruta (Path) | Visibilidad | Propósito / Vista |
| :--- | :--- | :--- |
| `/mascotas/:id/adoptar` | Privada (Adoptantes) | Formulario de postulación y declaración de tenencia responsable. |
| `/solicitudes` | Privada (Todos los usuarios) | Bandeja general con pestañas de "Solicitudes Recibidas" y "Solicitudes Enviadas". |
| `/solicitudes/:id` | Privada (Partes interesadas) | Vista en detalle del cuestionario presentado y chat/historial de interacción. |

#### Componentes Principales
- `AdoptionForm`: Formulario de postulación con campos de ambiente hogareño (patio, niños, ingresos aproximados para veterinaria, acuerdo familiar).
- `RequestStatusBadge`: Indicador cromático según el estado actual de la postulación (`Amarillo = Pendiente`, `Azul = En Evaluación`, `Verde = Aprobada`, `Rojo = Rechazada`).
- `ReceivedRequestsTab`: Vista para publicadores que agrupa solicitudes recibidas por mascota, con botón de revisión rápida.
- `SentRequestsTab`: Vista para adoptantes con el estado de sus postulaciones cursadas.
- `ApplicantDetailModal`: Diálogo con las respuestas del postulante que permite al publicador contactarlo por teléfono/email y cambiar el estado.
- `ConfirmAdoptionModal`: Modal de confirmación final que concreta la entrega del animal y crea automáticamente el registro de seguimiento post-adopción.

#### Servicios y Contratos con el Backend (`adoptionService.ts`)
- **Envío de Solicitud:**
  - *Endpoint:* `POST /api/adoptions/requests`
  - *Datos enviados (Request Body):*
    ```typescript
    interface SubmitAdoptionRequest {
      petId: string;
      housingType: 'CASA' | 'DEPARTAMENTO';
      hasYard: boolean;
      hasFencing: boolean;
      hasOtherPets: boolean;
      otherPetsDescription?: string;
      hoursAlonePerDay: number;
      familyAgrees: boolean;
      adoptionMotivation: string;
      contactPhone: string;
    }
    ```
  - *Datos recibidos:* `{ requestId: string; status: 'PENDIENTE'; createdAt: string }`
- **Actualización de Estado de Solicitud:**
  - *Endpoint:* `PATCH /api/adoptions/requests/:id/status`
  - *Datos enviados (Request Body):*
    ```typescript
    interface UpdateRequestStatusPayload {
      status: 'EN_EVALUACION' | 'APROBADA' | 'RECHAZADA';
      reviewNotes?: string;
    }
    ```
  - *Datos recibidos:*
    ```typescript
    interface UpdateRequestStatusResponse {
      requestId: string;
      newStatus: 'EN_EVALUACION' | 'APROBADA' | 'RECHAZADA';
      trackingCreated: boolean; // True si pasa a APROBADA
      trackingId?: string;
    }
    ```

---

### Módulo E: Seguimiento Post-Adopción (`features/tracking`)

- **Nombre Funcional:** Seguimiento Post-Adopción y Auditoría de Bienestar Animal.
- **Responsabilidad y Alcance:**
  - Gestionar el compromiso asumido por el adoptante de presentar 1 reporte fotográfico mensual durante un período de 6 meses posteriores a la adopción.
  - Ofrecer una visualización cronológica (Timeline) del ciclo de vida del seguimiento con estados por mes: `Cumplido`, `Pendiente`, `En Mora` o `Alerta Activada`.
  - Habilitar la carga de la foto mensual a Cloudinary y descripción de adaptación/salud por parte del adoptante.
  - Proveer al publicador original (particular o institución) una herramienta de supervisión remota para monitorear el bienestar del animal entregado.

#### Rutas y Vistas Asociadas
| Ruta (Path) | Visibilidad | Propósito / Vista |
| :--- | :--- | :--- |
| `/seguimientos` | Privada (Adoptantes y Publicadores) | Panel central de seguimientos activos asignados al usuario. |
| `/seguimientos/:id` | Privada (Adoptante y Publicador del caso) | Línea de tiempo interactiva con los 6 meses de seguimiento y galería histórica. |
| `/seguimientos/:id/reportar/:mes` | Privada (Solo Adoptante asignado) | Formulario de entrega de reporte mensual con fotografía y notas. |

#### Componentes Principales
- `TrackingTimeline`: Componente visual que ilustra los 6 hitos mensuales, fechas límites de presentación y estado de cumplimiento.
- `MonthlyReportCard`: Tarjeta de cada mes que expone la fotografía enviada, fecha de entrega y comentarios del adoptante.
- `UploadReportModal`: Diálogo para subir la foto mensual, registrar peso aproximado del animal y responder preguntas breves de salud.
- `TrackingAlertBanner`: Notificación destacada que advierte cuando faltan pocos días para el vencimiento o cuando el plazo expiró sin reporte.
- `FollowupAuditHistory`: Registro histórico que documenta las alertas automáticas enviadas y las acciones de contacto realizadas.

#### Servicios y Contratos con el Backend (`trackingService.ts`)
- **Detalle de Seguimiento:**
  - *Endpoint:* `GET /api/trackings/:id`
  - *Datos enviados:* Headers con token.
  - *Datos recibidos (Response Body):*
    ```typescript
    interface TrackingDetailResponse {
      id: string;
      pet: {
        id: string;
        name: string;
        species: string;
        mainPhotoUrl: string;
      };
      adopter: {
        id: string;
        fullName: string;
        email: string;
      };
      publisher: {
        id: string;
        name: string;
      };
      startDate: string;
      totalMilestones: 6;
      reports: Array<{
        monthNumber: number; // 1 a 6
        dueDate: string;
        submittedAt?: string;
        photoUrl?: string;
        notes?: string;
        status: 'PENDING' | 'SUBMITTED' | 'OVERDUE';
      }>;
      isCompleted: boolean;
    }
    ```
- **Presentación de Reporte Mensual:**
  - *Endpoint:* `POST /api/trackings/:id/reports`
  - *Datos enviados (Request Body):*
    ```typescript
    interface SubmitMonthlyReportRequest {
      monthNumber: number;
      photoUrl: string; // URL provista por Cloudinary
      notes: string;
      petHealthCondition: 'OPTIMO' | 'BUENO' | 'EN_OBSERVACION';
    }
    ```
  - *Datos recibidos:* `{ reportId: string; status: 'SUBMITTED'; submittedAt: string }`

---

### Módulo F: Administración y Moderación (`features/admin`)

- **Nombre Funcional:** Panel de Administración, Moderación de Contenidos y Verificación Institucional.
- **Responsabilidad y Alcance:**
  - Acceso restringido exclusivamente a usuarios con rol `ROLE_ADMIN`.
  - Validación manual de instituciones y refugios registrados: cotejo de CUIT, razón social y datos fiscales antes de habilitarles la publicación.
  - Moderación de reportes y denuncias emitidas por la comunidad ante sospechas de publicaciones falsas, comercio no autorizado o maltrato.
  - Dashboard con métricas globales del sistema (adopciones concretadas, volumen de mascotas activas, seguimientos al día vs. con alertas).

#### Rutas y Vistas Asociadas
| Ruta (Path) | Visibilidad | Propósito / Vista |
| :--- | :--- | :--- |
| `/admin` | Privada (Exclusiva `ROLE_ADMIN`) | Métricas principales y resumen ejecutivo de la plataforma. |
| `/admin/instituciones` | Privada (Exclusiva `ROLE_ADMIN`) | Listado de instituciones en espera de aprobación y verificadas. |
| `/admin/reportes` | Privada (Exclusiva `ROLE_ADMIN`) | Cola de moderación de denuncias sobre publicaciones o usuarios. |
| `/admin/auditoria` | Privada (Exclusiva `ROLE_ADMIN`) | Registro de acciones realizadas por el equipo de moderación. |

#### Componentes Principales
- `AdminGuard`: Componente de control de acceso que verifica el rol de administrador en el token antes de permitir la renderización.
- `InstitutionVerificationTable`: Tabla interactiva con CUIT, Razón Social, datos de contacto y botones de acción (Aprobar, Rechazar, Observar).
- `RejectionReasonModal`: Ventana emergente para tipificar el motivo del rechazo de una institución o publicación denunciada.
- `ReportModerationCard`: Elemento visual que exhibe la publicación acusada, el motivo de la denuncia y las opciones de resolución.
- `AdminKpiMetrics`: Bloque de tarjetas con indicadores clave de rendimiento (tasa de adopción, tiempo de resolución de reportes).

#### Servicios y Contratos con el Backend (`adminService.ts`)
- **Listar Instituciones Pendientes:**
  - *Endpoint:* `GET /api/admin/institutions/pending`
  - *Datos enviados:* Token de administrador en Headers.
  - *Datos recibidos:*
    ```typescript
    interface PendingInstitutionDto {
      id: string;
      legalName: string;
      cuit: string;
      email: string;
      phone: string;
      createdAt: string;
      status: 'PENDING_APPROVAL';
    }
    ```
- **Aprobar / Rechazar Institución:**
  - *Endpoint:* `PATCH /api/admin/institutions/:id/verify`
  - *Datos enviados (Request Body):*
    ```typescript
    interface VerifyInstitutionRequest {
      action: 'APPROVE' | 'REJECT';
      rejectionReason?: string;
    }
    ```
  - *Datos recibidos:* `{ institutionId: string; newStatus: 'ACTIVE' | 'REJECTED'; message: string }`
- **Gestión de Denuncias:**
  - *Endpoint:* `POST /api/admin/reports/:id/resolve`
  - *Datos enviados (Request Body):*
    ```typescript
    interface ResolveReportRequest {
      resolution: 'DISMISS' | 'REMOVE_PUBLICATION' | 'SUSPEND_USER';
      justification: string;
    }
    ```
  - *Datos recibidos:* `{ reportId: string; resolved: true; timestamp: string }`

---

## 4. Estrategia de Enrutamiento y Control de Acceso (RBAC)

El enrutamiento se gestiona mediante **React Router v6**, implementando componentes de orden superior (*High-Order Components*) para la protección de rutas y el control de acceso basado en roles (Role-Based Access Control - RBAC).

### Definición de Guardas de Ruta
1. **Rutas Públicas:** Accesibles para cualquier visitante (`/`, `/explorar`, `/mascotas/:id`).
2. **Rutas de Invitado (Guest-Only):** Solo para usuarios no logueados (`/login`, `/registro`). Si existe una sesión activa, redireccionan automáticamente al home o dashboard.
3. **Rutas Protegidas Comunes (`ProtectedRoute`):** Exigen un token JWT válido. Si no existe sesión, redireccionan a `/login` preservando la URL de destino original.
4. **Rutas Restringidas por Rol (`RoleGuard`):**
   - Rutas para cuentas verificadas (`/publicar`, `/mascotas/:id/editar`).
   - Rutas exclusivas de administración (`/admin/*`), que verifican `user.role === 'ADMIN'`.

---

## 5. Guía de Scaffolding y Comandos de Inicialización

A continuación se presentan los comandos exactos para inicializar el proyecto vacío de Frontend con **Vite + React + TypeScript** y estructurar el árbol de carpetas con archivos `.gitkeep`, de modo que el repositorio quede listo para su versionado en GitHub sin requerir la implementación de código previo.

### Inicialización con Vite + React + TS

Ejecutar desde la raíz del repositorio (`cumpa/`):

```bash
# 1. Crear el proyecto frontend utilizando la plantilla oficial de React + TypeScript
npm create vite@latest frontend -- --template react-ts

# 2. Ingresar al directorio del frontend
cd frontend

# 3. Instalar las dependencias base
npm install

# 4. Instalar React Router y librerías de utilidad
npm install react-router-dom

# 5. Instalar Tailwind CSS, PostCSS y Autoprefixer como dependencias de desarrollo
npm install -D tailwindcss postcss autoprefixer

# 6. Inicializar la configuración de Tailwind CSS
npx tailwindcss init -p
```

---

*Documento elaborado para la cátedra de Trabajo Final Integrador (TUPaD - UTN), Grupo Nº 195.*
