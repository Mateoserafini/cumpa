# Diagrama Entidad-Relación (ERD) — Cumpa 🐾

Este archivo contiene el diagrama interactivo de la base de datos de **Cumpa** modelado en formato **Mermaid**.  
Es renderizado visualmente por GitHub, VS Code y visores de Markdown.

```mermaid
erDiagram
    User ||--o| InstitutionalProfile : "posee (1 a 0..1)"
    User ||--o{ Animal : "publica (1 a N)"
    Animal ||--|{ AnimalImage : "tiene (1 a N)"
    Animal ||--o{ AdoptionRequest : "recibe (1 a N)"
    User ||--o{ AdoptionRequest : "postula (1 a N)"
    Animal ||--o| FollowUp : "origina al adoptarse (1 a 0..1)"
    User ||--o{ FollowUp : "adopta (1 a N)"
    User ||--o{ FollowUp : "supervisa como tutor (1 a N)"
    FollowUp ||--|{ FollowUpReport : "comprende 6 meses (1 a 6)"
    User ||--o{ Report : "emite denuncias (1 a N)"

    User {
        string id PK "UUID"
        string email "VARCHAR(255) UNIQUE"
        string passwordHash "VARCHAR(255) nullable"
        string googleId "VARCHAR(255) UNIQUE nullable"
        string role "ENUM: PARTICULAR, VETERINARIA, INSTITUCION, ADMIN"
        string name "VARCHAR(150)"
        string phone "VARCHAR(50) nullable"
        string province "VARCHAR(100)"
        string city "VARCHAR(100)"
        string address "VARCHAR(255) nullable"
        string avatarUrl "VARCHAR(500) nullable"
        boolean isEmailVerified "DEFAULT false"
        string verificationToken "VARCHAR(255) nullable"
        string resetPasswordToken "VARCHAR(255) nullable"
        datetime resetPasswordExpires "TIMESTAMP nullable"
        datetime createdAt "TIMESTAMP"
        datetime updatedAt "TIMESTAMP"
        datetime deletedAt "TIMESTAMP nullable (Soft Delete)"
    }

    InstitutionalProfile {
        string id PK "UUID"
        string userId FK "UUID UNIQUE"
        string legalName "VARCHAR(200) Razon Social"
        string cuit "VARCHAR(20) CUIT fiscal UNIQUE"
        string verificationStatus "ENUM: PENDIENTE, APROBADA, RECHAZADA"
        string verificationNotes "TEXT nullable"
        datetime verifiedAt "TIMESTAMP nullable"
        string verifiedByAdminId "UUID nullable"
        string documentUrl "VARCHAR(500) Constancia CUIT"
        string websiteUrl "VARCHAR(255) nullable"
        string instagramUrl "VARCHAR(255) nullable"
        datetime createdAt "TIMESTAMP"
        datetime updatedAt "TIMESTAMP"
        datetime deletedAt "TIMESTAMP nullable"
    }

    Animal {
        string id PK "UUID"
        string publisherId FK "UUID"
        string name "VARCHAR(100)"
        string species "ENUM: PERRO, GATO, OTRO"
        string breed "VARCHAR(100) nullable"
        string sex "ENUM: MACHO, HEMBRA"
        string size "ENUM: CHICO, MEDIANO, GRANDE"
        string ageCategory "ENUM: CACHORRO, JOVEN, ADULTO, SENIOR"
        int approximateAgeMonths "INT nullable"
        string description "TEXT"
        string healthDetails "TEXT nullable"
        boolean isNeutered "DEFAULT false"
        boolean isVaccinated "DEFAULT false"
        boolean isDewormed "DEFAULT false"
        boolean specialNeeds "DEFAULT false"
        string specialNeedsDescription "TEXT nullable"
        string modality "ENUM: ADOPCION_DEFINITIVA, TRANSITO_TEMPORARIO, AMBAS"
        string status "ENUM: DISPONIBLE, EN_PROCESO, ADOPTADO, EN_TRANSITO, PAUSADA, CANCELADA"
        string province "VARCHAR(100)"
        string city "VARCHAR(100)"
        datetime createdAt "TIMESTAMP"
        datetime updatedAt "TIMESTAMP"
        datetime deletedAt "TIMESTAMP nullable"
    }

    AnimalImage {
        string id PK "UUID"
        string animalId FK "UUID"
        string url "VARCHAR(500) Cloudinary CDN"
        string publicId "VARCHAR(255) Cloudinary ID"
        boolean isMain "DEFAULT false"
        int order "DEFAULT 0"
        datetime createdAt "TIMESTAMP"
    }

    AdoptionRequest {
        string id PK "UUID"
        string animalId FK "UUID"
        string applicantId FK "UUID"
        string type "ENUM: ADOPCION_DEFINITIVA, TRANSITO_TEMPORARIO"
        string status "ENUM: PENDIENTE, EN_REVISION, APROBADA, RECHAZADA, CANCELADA"
        string message "TEXT"
        string phone "VARCHAR(50)"
        string address "VARCHAR(255) nullable"
        boolean hasOtherPets "DEFAULT false"
        boolean hasYard "DEFAULT false"
        string housingType "VARCHAR(50) Casa, Depto"
        boolean landlordAllowsPets "BOOLEAN nullable"
        string rejectionReason "TEXT nullable"
        datetime createdAt "TIMESTAMP"
        datetime updatedAt "TIMESTAMP"
        datetime deletedAt "TIMESTAMP nullable"
    }

    FollowUp {
        string id PK "UUID"
        string animalId FK "UUID UNIQUE"
        string adopterId FK "UUID"
        string guardianId FK "UUID"
        datetime startDate "TIMESTAMP"
        datetime endDate "TIMESTAMP (+6 meses)"
        int durationMonths "DEFAULT 6 (fijo)"
        string status "ENUM: ACTIVO, COMPLETADO, EN_MORA, ALERTA_DISPARADA"
        datetime createdAt "TIMESTAMP"
        datetime updatedAt "TIMESTAMP"
        datetime deletedAt "TIMESTAMP nullable"
    }

    FollowUpReport {
        string id PK "UUID"
        string followUpId FK "UUID"
        int monthNumber "1 a 6"
        datetime dueDate "TIMESTAMP"
        datetime submittedAt "TIMESTAMP nullable"
        string imageUrl "VARCHAR(500) Cloudinary nullable"
        string imagePublicId "VARCHAR(255) nullable"
        string notes "TEXT nullable"
        string status "ENUM: PENDIENTE, CUMPLIDO, ATRASADO, INCUMPLIDO"
        datetime reminderSentAt "TIMESTAMP nullable"
        datetime alertSentAt "TIMESTAMP nullable"
        boolean reviewedByGuardian "DEFAULT false"
        string guardianFeedback "TEXT nullable"
        datetime createdAt "TIMESTAMP"
        datetime updatedAt "TIMESTAMP"
    }

    Report {
        string id PK "UUID"
        string reporterId FK "UUID"
        string targetType "ENUM: ANIMAL, USER"
        string targetId "UUID"
        string reason "ENUM: DATOS_FALSOS, MALTRATO, ESTAFA, SPAM, OTRO"
        string description "TEXT"
        string status "ENUM: PENDIENTE, EN_REVISION, RESUELTO, DESESTIMADO"
        string resolutionNotes "TEXT nullable"
        string resolvedByAdminId "UUID nullable"
        datetime resolvedAt "TIMESTAMP nullable"
        datetime createdAt "TIMESTAMP"
        datetime updatedAt "TIMESTAMP"
        datetime deletedAt "TIMESTAMP nullable"
    }
```
