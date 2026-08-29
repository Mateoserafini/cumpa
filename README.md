# Cumpa 🐾 — Propuesta de Proyecto

> **Trabajo Final Integrador** — Tecnicatura Universitaria en Programación a Distancia (TUPaD)  
> **Universidad Tecnológica Nacional (UTN)**

---

## 👥 Información del Proyecto

- **Integrantes:**
  - Mateo Serafini
  - Gonzalo Vega
- **Grupo:** Nº 195
- **Materia:** Trabajo Final Integrador
- **Tutor:** Juan Ignacio Schiavonni
- **Fecha de Entrega:** 30/08/2026
- **Repositorio GitHub:** [Mateoserafini/cumpa](https://github.com/Mateoserafini/cumpa)

---

## 📑 Índice

1. [Propuesta del Proyecto](#1-propuesta-del-proyecto)
   - [Descripción del problema](#descripción-del-problema)
   - [Solución propuesta](#solución-propuesta)
   - [A quién va dirigido](#a-quién-va-dirigido)
   - [Valor que aporta](#valor-que-aporta)
2. [Plan de Trabajo](#2-plan-de-trabajo)
   - [Alcance del MVP](#alcance-del-mvp)
     - [Incluye](#incluye)
     - [Queda explícitamente fuera del MVP (v2)](#queda-explícitamente-fuera-del-mvp-v2)
   - [Etapas estimadas](#etapas-estimadas)
   - [Riesgos y mitigaciones](#riesgos-y-mitigaciones)
   - [Criterios de éxito del MVP](#criterios-de-éxito-del-mvp)
3. [Stack Tecnológico](#3-stack-tecnológico)
   - [Frontend](#frontend)
   - [Backend](#backend)
   - [Base de datos](#base-de-datos)
   - [Almacenamiento de Multimedia](#almacenamiento-de-multimedia)
4. [Repositorio](#4-repositorio)

---

## 1. Propuesta del Proyecto

### Descripción del problema
En Argentina existe una gran cantidad de personas dispuestas a ayudar a animales que necesitan hogar, ya sea adoptándolos de forma definitiva o brindándoles tránsito temporario. Sin embargo, actualmente no existe un lugar o solución que facilite la conexión entre quienes tienen un animal que necesita hogar (particulares, veterinarias, refugios, casas de paso) y quienes están en condiciones de recibirlo.

Actualmente, la información circula de forma fragmentada a través de grupos de redes sociales, publicaciones informales y canales no indexados. Esta falta de centralización y trazabilidad genera una alta fricción en la búsqueda, desorganización en el contacto y la pérdida frecuente del rastro sobre el bienestar del animal tras ser entregado, haciendo casi imposible verificar el cumplimiento de los compromisos de adopción.

### Solución propuesta
Proponemos crear una plataforma web, que denominaremos **"Cumpa"**. Será una aplicación web que centraliza y facilita la conexión entre quienes tienen animales que necesitan hogar y quienes desean adoptarlos o darles tránsito. La plataforma permite publicar animales disponibles, buscarlos con filtros relevantes y contactar al publicador de forma directa y organizada.

### A quién va dirigido
- Particulares que encontraron un animal y no pueden quedárselo.
- Veterinarias con animales en situación de abandono o rescate.
- Instituciones y refugios de animales.
- Personas interesadas en adoptar o dar tránsito a un animal.

### Valor que aporta
- Centraliza la información que hoy está dispersa en redes sociales.
- Facilita el contacto directo entre partes de forma ordenada.
- Permite encontrar animales disponibles en cualquier punto del país.
- Incluye un mecanismo de seguimiento post-adopción que otorga trazabilidad al proceso.

---

## 2. Plan de Trabajo

### Alcance del MVP
El MVP se centra exclusivamente en el núcleo de la plataforma: **conectar a quienes publican animales en búsqueda de hogar con quienes desean recibirlos**.

#### Incluye:
- **Registro y login de usuarios:** Autenticación mediante email/contraseña y OAuth con Google.
- **Distinción de tipo de usuario:** Particular, veterinaria, institución.
- **Publicación de animales:** Carga de datos relevantes (especie, edad, tamaño, ubicación, fotos, descripción).
- **Búsqueda y filtrado:** Filtrado de publicaciones por ubicación, especie, tamaño y tipo de hogar buscado (tránsito o adopción definitiva).
- **Vista de detalle de publicación:** Con botón de contacto.
- **Formulario y registro de contacto:** Al postularse, el sistema envía notificaciones por correo electrónico a ambas partes y además almacena la solicitud en la plataforma, permitiendo al publicador gestionar el historial y estado de interesados directamente desde su panel web ante eventuales problemas con filtros de spam.
- **Seguimiento post-adopción:** El adoptante debe subir una foto del animal una vez por mes durante 6 meses; si no cumple, el sistema envía notificaciones y alerta a quien gestionó la adopción.
- **Panel de administración:** Para validación y aprobación de cuentas institucionales.

#### Queda explícitamente fuera del MVP (v2):
- Donaciones e integración con Mercado Pago (la arquitectura del MVP contempla esta integración futura).
- Rendición de cuentas de instituciones donatarias.
- Chat interno entre usuarios.
- Funcionalidades específicas para veterinarias como actor diferenciado.

---

### Etapas estimadas

| Etapa | Plazo (estimado) | Contenido |
| :--- | :---: | :--- |
| **1 - Planificación** | 1 semana | Definición de entidades, flujos, wireframes, estructura del repositorio, configuración del entorno. |
| **2 - Base del proyecto** | 1 semana | Configuración de DB, modelos, autenticación (JWT + OAuth), estructura base de API y frontend. |
| **3 - Core funcional** | 2-3 semanas | CRUD de publicaciones, búsqueda/filtrado, sistema de contacto por mail. |
| **4 - Seguimiento y admin** | 1-2 semanas | Seguimiento post-adopción, panel admin, validación de instituciones. |
| **5 - Pruebas y ajustes** | 1 semana | Testing, corrección de bugs, ajustes de UX. |
| **6 - Deploy y entrega** | 1 semana | Despliegue en producción, documentación final. |

---

### Riesgos y mitigaciones

| Riesgo | Mitigación |
| :--- | :--- |
| **Publicaciones con datos falsos o animales inexistentes** | Sistema de reportes por parte de usuarios; moderación reactiva por el equipo admin. |
| **Instituciones no verificadas que se registren como tales** | Las cuentas institucionales requieren carga de nombre legal y CUIT; un admin aprueba manualmente antes de activar la cuenta. |
| **Adoptante que no cumpla con el seguimiento mensual** | El sistema envía notificaciones automáticas al adoptante; si no responde, alerta a quien gestionó la adopción. |
| **Pérdida de datos de usuarios** | Backups diarios prioritarios y semanales generales en Neon (PostgreSQL gestionado). |
| **Cold start del servidor en Render (plan gratuito)** | Implementación de endpoint `/health` con ping periódico mediante Uptime Robot. |
| **Cuentas creadas con identidades falsas** | Verificación de email obligatoria al registrarse; OAuth con Google como alternativa de identidad validada. |
| **Pérdida o demora en la recepción de correos de contacto por filtros de spam** | Almacenamiento de cada solicitud en base de datos para consulta directa desde el panel de usuario, complementando la notificación por email. |

---

### Criterios de éxito del MVP
- Los usuarios pueden registrarse, publicar animales y contactar a otros sin fricciones.
- La búsqueda permite encontrar publicaciones filtrando por ubicación y características del animal.
- El sistema de mails funciona correctamente en ambas direcciones (publicador e interesado).
- Las instituciones pasan por validación antes de operar.
- El seguimiento post-adopción registra las fotos y dispara alertas ante incumplimiento.
- La aplicación es responsive y funciona correctamente desde cualquier dispositivo.

---

## 3. Stack Tecnológico

### Frontend
- **Lenguaje:** TypeScript
- **Framework:** React
- **Justificación:** TypeScript aporta tipado estático que reduce errores en tiempo de desarrollo, especialmente útil al manejar entidades con muchas relaciones. React es el framework con el que el equipo cuenta con mayor experiencia, lo que reduce el costo de aprendizaje y permite avanzar más rápido hacia el core del producto.
- **Plataforma de despliegue:** Netlify — despliegue continuo desde rama principal, CDN global, plan gratuito suficiente para el MVP.

### Backend
- **Lenguaje:** TypeScript
- **Framework:** Express
- **Justificación:** Permite unificar el lenguaje en todo el stack, facilitando el trabajo en equipo y la reutilización de tipos. Express es minimalista y flexible, adecuado para construir una API REST sin overhead innecesario para el alcance del MVP.
- **Plataforma de despliegue:** Render — con endpoint `/health` y monitoreo mediante Uptime Robot para evitar cold starts.

### Base de datos
- **Tipo:** Relacional (SQL)
- **Motor:** PostgreSQL
- **Plataforma:** Neon
- **Justificación:** La naturaleza del problema implica entidades bien definidas con relaciones claras (usuarios, publicaciones, animales, seguimientos, contactos), integridad transaccional y consistencia de datos. PostgreSQL es la opción más sólida para este modelo. Neon provee PostgreSQL gestionado con backups automáticos y plan gratuito adecuado para el MVP.
- **Consideraciones:** Todas las entidades implementarán *soft delete*; backups diarios prioritarios y semanales generales.

### Almacenamiento de Multimedia
- **Servicio:** Cloudinary
- **Justificación:** Dado que el MVP requiere carga de imágenes tanto para las publicaciones de animales como para el seguimiento fotográfico mensual, se utiliza un servicio externo especializado para evitar almacenar archivos binarios pesados en PostgreSQL y sortear la limitación del sistema de archivos efímero de Render. Cloudinary ofrece un plan gratuito adecuado, optimización automática de imágenes y entrega vía CDN.

---

## 4. Repositorio

- **GitHub:** [https://github.com/Mateoserafini/cumpa](https://github.com/Mateoserafini/cumpa)