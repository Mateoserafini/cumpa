# Catálogo de Endpoints de la API REST — Cumpa 🐾

Este documento detalla de forma concisa todos los endpoints disponibles en el Backend de Cumpa, especificando método HTTP, autenticación requerida, parámetros de entrada y respuesta esperada.

**URL Base Local:** `http://localhost:3000`  
**Encabezado de Autenticación:** `Authorization: Bearer <token_jwt>` (para rutas protegidas)

---

## 0. Salud del Servidor

| Método y Ruta | Auth / Rol | Requiere | Retorna |
|---|---|---|---|
| `GET /health` | Público | Nada | `200 OK` `{ status: "ok", timestamp: string, service: "Cumpa API" }` |

---

## 1. Módulo de Autenticación (`/api/auth`)

| Método y Ruta | Auth / Rol | Requiere | Retorna |
|---|---|---|---|
| `POST /api/auth/register` | Público | **Body JSON:** `{ email, password, name, role, province, city, phone? }`<br>*`role`: "PARTICULAR" \| "VETERINARIA" \| "INSTITUCION"* | `201 Created` `{ message, userId }` *(despacha email de activación)* |
| `POST /api/auth/login` | Público *(Rate limit: 3 fallos)* | **Body JSON:** `{ email, password }`<br>*Exige `isEmailVerified: true`* | `200 OK` `{ token, user: { id, email, name, role, isEmailVerified, avatarUrl } }`<br>*`403` si email no verificado, `429` si supera 3 fallos* |
| `GET /api/auth/verify-email/:token` | Público | **Param:** `token` (hex de 64 chars) | `200 OK` `{ message, verified: true }` |
| `POST /api/auth/resend-verification` | Público | **Body JSON:** `{ email }` | `200 OK` `{ message }` *(anti-enumeración)* |
| `POST /api/auth/forgot-password` | Público | **Body JSON:** `{ email }` | `200 OK` `{ message }` *(anti-enumeración; token vence en 1h)* |
| `POST /api/auth/reset-password` | Público | **Body JSON:** `{ token, newPassword }` | `200 OK` `{ message }` *(notifica por email el cambio)* |
| `GET /api/auth/me` | JWT (Cualquiera) | Header `Authorization` | `200 OK` `{ id, email, name, role, isEmailVerified, avatarUrl, institutionalProfile, ... }` |
| `GET /api/auth/google` | Público | Redirección del navegador | Redirección a Google OAuth 2.0 |
| `GET /api/auth/google/callback` | Público | Query provisto por Google (`code`) | `302 Redirect` a `${FRONTEND_URL}/oauth-success?token=<jwt>` |

---

## 2. Módulo de Usuarios y Perfiles (`/api/users`)

| Método y Ruta | Auth / Rol | Requiere | Retorna |
|---|---|---|---|
| `GET /api/users/profile` | JWT (Cualquiera) | Header `Authorization` | `200 OK` Datos de perfil y personería jurídica institucional |
| `PUT /api/users/profile` | JWT (Cualquiera) | **Body JSON:** `{ name?, phone?, province?, city?, address?, avatarUrl? }` | `200 OK` `{ message, user: { ... } }` |
| `POST /api/users/institutional-verification` | JWT (`INSTITUCION` o `VETERINARIA`) | **Multipart/Form-Data:**<br>- `legalName`: string<br>- `cuit`: string (11 dígitos, validación Módulo 11)<br>- `websiteUrl?`, `instagramUrl?`<br>- `documentFile?`: Archivo PDF/imagen (≤ 5MB) | `201 Created` `{ message, profileId, status: "PENDIENTE" }`<br>*`409` si ya está APROBADA o PENDIENTE* |
| `GET /api/users/institutional-status` | JWT (`INSTITUCION` o `VETERINARIA`) | Header `Authorization` | `200 OK` `{ id, legalName, cuit, verificationStatus, verificationNotes, verifiedAt, documentUrl }` |

---

## 3. Módulo de Publicaciones de Animales (`/api/animals`)

| Método y Ruta | Auth / Rol | Requiere | Retorna |
|---|---|---|---|
| `GET /api/animals` | Público | **Query:** `species?`, `size?`, `sex?`, `ageCategory?`, `modality?`, `province?`, `city?`, `vaccinated?`, `dewormed?`, `castrated?`, `page?`, `limit?` | `200 OK` `{ total, totalPages, page, limit, data: Animal[] }`<br>*(Solo `DISPONIBLE` y `EN_PROCESO`)* |
| `GET /api/animals/my-publications` | JWT (Cualquiera) | Header `Authorization` | `200 OK` `Animal[]` (todas las del usuario en sesión con fotos) |
| `GET /api/animals/:id` | Público | **Param:** `id` (UUID) | `200 OK` Ficha completa del animal con fotos y datos del publicador |
| `POST /api/animals` | JWT (`PARTICULAR`, o Institución con personería `APROBADA`) | **Multipart/Form-Data:**<br>- `name`, `species`, `sex`, `size`, `ageCategory`, `modality`, `province`, `city`<br>- `breed?`, `approximateAge?`, `description?`<br>- `isVaccinated?`, `isDewormed?`, `isCastrated?`, `hasSpecialNeeds?`, `specialNeedsDescription?`<br>- `images`: 1 a 5 fotos (JPG/PNG/WebP, ≤ 5MB) | `201 Created` `{ message, animalId, status: "DISPONIBLE" }` |
| `PUT /api/animals/:id` | JWT (Dueño o `ADMIN`) | **Body JSON:** Campos editables (ficha, salud, descripción) | `200 OK` `{ message, animal: Animal }` |
| `PATCH /api/animals/:id/status` | JWT (Dueño o `ADMIN`) | **Body JSON:** `{ status: "DISPONIBLE" \| "EN_PROCESO" \| "PAUSADA" \| "CANCELADA" }` | `200 OK` `{ message, newStatus }` |
| `DELETE /api/animals/:id` | JWT (Dueño o `ADMIN`) | **Param:** `id` (UUID) | `200 OK` `{ message }` *(Baja lógica: `deletedAt`)* |

---

## 4. Módulo de Contactos y Postulaciones (`/api/contacts`)

| Método y Ruta | Auth / Rol | Requiere | Retorna |
|---|---|---|---|
| `POST /api/contacts/apply` | JWT (Cualquiera excepto publicador) | **Body JSON:**<br>- `animalId`: UUID<br>- `type`: "ADOPCION_DEFINITIVA" \| "TRANSITO_TEMPORARIO"<br>- `message`, `phone`<br>- `address?`, `hasOtherPets`: boolean, `hasYard`: boolean, `housingType?`, `landlordAllowsPets?` | `201 Created` `{ message, requestId, status: "PENDIENTE" }`<br>*(Notifica a ambas partes por email; `409` si ya tiene postulación activa)* |
| `GET /api/contacts/my-applications` | JWT (Cualquiera) | Header `Authorization` | `200 OK` `AdoptionRequest[]` (postulaciones emitidas por el adoptante con foto del animal) |
| `GET /api/contacts/animal/:animalId` | JWT (Publicador o `ADMIN`) | **Param:** `animalId` (UUID) | `200 OK` `AdoptionRequest[]` (bandeja de postulaciones recibidas para ese animal con datos del adoptante) |
| `PATCH /api/contacts/:id/status` | JWT (Publicador o `ADMIN`) | **Param:** `id` (UUID)<br>**Body JSON:** `{ status: "APROBADA" \| "RECHAZADA" \| "EN_REVISION", rejectionReason? }` | `200 OK` `{ message, followUpCreated, followUpId }`<br>*Al aprobar: animal pasa a `ADOPTADO`/`EN_TRANSITO`, se cancelan las demás postulaciones en DB, se crea `FollowUp` de 6 meses y se notifica exclusivamente al adjudicado*. |

---

## 5. Módulo de Seguimiento Post-Adopción (`/api/followups`)

| Método y Ruta | Auth / Rol | Requiere | Retorna |
|---|---|---|---|
| `GET /api/followups/as-adopter` | JWT (Cualquiera) | Header `Authorization` | `200 OK` `FollowUp[]` (expedientes donde el usuario es Adoptante, con datos del animal, tutor y sus 6 reportes) |
| `GET /api/followups/as-guardian` | JWT (Cualquiera) | Header `Authorization` | `200 OK` `FollowUp[]` (expedientes donde el usuario es Tutor rescatista supervisor) |
| `GET /api/followups/:id` | JWT (Participante o `ADMIN`) | **Param:** `id` (UUID) | `200 OK` Expediente detallado con sus 6 meses programados, fechas límite (`dueDate`) y estados de entrega |
| `POST /api/followups/:followUpId/report/:monthNumber` | JWT (Solo Adoptante titular) | **Param:** `followUpId` (UUID), `monthNumber` (1 a 6)<br>**Multipart/Form-Data:**<br>- `image`: Foto obligatoria del animal (JPG/PNG/WebP, ≤ 5MB)<br>- `notes?`: string con comentarios sobre bienestar | `200 OK` `{ message, reportId, monthNumber, status: "CUMPLIDO", submittedAt }`<br>*(Si regulariza el último reporte vencido, el expediente vuelve a `ACTIVO` o `COMPLETADO`)* |
| `PATCH /api/followups/report/:reportId/review` | JWT (Solo Tutor o `ADMIN`) | **Param:** `reportId` (UUID)<br>**Body JSON:** `{ reviewedByGuardian: boolean, guardianFeedback? }` | `200 OK` `{ message, report: FollowUpReport }` |

---

## 6. Módulo de Administración y Denuncias (`/api/admin`)

| Método y Ruta | Auth / Rol | Requiere | Retorna |
|---|---|---|---|
| `POST /api/admin/reports` | JWT (Cualquiera) | **Body JSON:**<br>- `targetType`: "ANIMAL" \| "USER"<br>- `targetId`: UUID<br>- `reason`: "DATOS_FALSOS" \| "MALTRATO" \| "ESTAFA" \| "SPAM" \| "OTRO"<br>- `description`: string | `201 Created` `{ message, reportId }` |
| `GET /api/admin/institutions/pending` | JWT (`ADMIN`) | Header `Authorization` | `200 OK` `InstitutionalProfile[]` pendientes de revisión con datos del usuario solicitante |
| `PATCH /api/admin/institutions/:id/verify` | JWT (`ADMIN`) | **Param:** `id` (UUID)<br>**Body JSON:** `{ status: "APROBADA" \| "RECHAZADA", notes? }` | `200 OK` `{ message, institutionId, newStatus }`<br>*(Despacha dictamen formal por email a la institución)* |
| `GET /api/admin/reports` | JWT (`ADMIN`) | **Query:** `status?`, `targetType?`, `page?`, `limit?` | `200 OK` `{ total, totalPages, page, limit, data: Report[] }` |
| `PATCH /api/admin/reports/:id/resolve` | JWT (`ADMIN`) | **Param:** `id` (UUID)<br>**Body JSON:**<br>- `status`: "RESUELTO" \| "DESESTIMADO"<br>- `resolutionNotes`: string<br>- `takeAction?`: "BAN_USER" \| "DELETE_ANIMAL" \| "NONE" | `200 OK` `{ message, reportId, status }`<br>*(Aplica sanción atómica si fue solicitada)* |
| `GET /api/admin/stats` | JWT (`ADMIN`) | Header `Authorization` | `200 OK` `{ totalUsers, totalActiveAnimals, totalAdoptionsCompleted, activeFollowUps, complianceRatePercentage }` |

---

## 7. Códigos de Estado HTTP Estándar

- `200 OK`: Operación exitosa con datos de retorno.
- `201 Created`: Recurso creado exitosamente (registro, publicación, postulación).
- `400 Bad Request`: Datos de entrada inválidos (errores capturados por `express-validator` o tipos no permitidos).
- `401 Unauthorized`: Token JWT ausente, expirado o credenciales inválidas.
- `403 Forbidden`: Correo no verificado, permisos insuficientes para el rol o falta de personería institucional aprobada.
- `404 Not Found`: Recurso no encontrado o dado de baja lógica (`deletedAt != null`).
- `409 Conflict`: Conflicto de estado (email ya registrado, CUIT duplicado, institución ya verificada/en trámite, postulación ya resuelta, reporte ya entregado).
- `429 Too Many Requests`: Límite de 3 intentos fallidos de login superado (bloqueo temporal de 15 min).
- `500 Internal Server Error`: Error no controlado del servidor o base de datos.
