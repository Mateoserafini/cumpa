import "dotenv/config";
import {
  PrismaClient,
  Role,
  VerificationStatus,
  Species,
  Sex,
  Size,
  AgeCategory,
  Modality,
  AnimalStatus,
  RequestStatus,
  FollowUpStatus,
  ReportStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { validateCuit } from "../src/utils/cuitValidator";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 [Seed] Iniciando inicialización de datos de prueba en la base de datos...\n");

  // 1. Limpieza preventiva de datos previos para asegurar idempotencia
  const seedEmails = ["admin@cumpa.org", "particular@cumpa.org", "refugio@cumpa.org"];
  const existingUsers = await prisma.user.findMany({
    where: { email: { in: seedEmails } },
    select: { id: true },
  });

  if (existingUsers.length > 0) {
    const userIds = existingUsers.map((u) => u.id);
    console.log("🧹 [Seed] Purgando registros previos de pruebas...");

    // Eliminar relaciones en cascada
    await prisma.followUpReport.deleteMany({
      where: { followUp: { OR: [{ adopterId: { in: userIds } }, { guardianId: { in: userIds } }] } },
    });
    await prisma.followUp.deleteMany({
      where: { OR: [{ adopterId: { in: userIds } }, { guardianId: { in: userIds } }] },
    });
    await prisma.adoptionRequest.deleteMany({
      where: { OR: [{ applicantId: { in: userIds } }, { animal: { publisherId: { in: userIds } } }] },
    });
    await prisma.animalImage.deleteMany({
      where: { animal: { publisherId: { in: userIds } } },
    });
    await prisma.animal.deleteMany({
      where: { publisherId: { in: userIds } },
    });
    await prisma.institutionalProfile.deleteMany({
      where: { userId: { in: userIds } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: userIds } },
    });
    console.log("✅ [Seed] Base limpia para re-inserción.\n");
  }

  // 2. Hasheo seguro de contraseñas
  const salt = await bcrypt.genSalt(10);
  const passwordAdmin = await bcrypt.hash("AdminPassword123!", salt);
  const passwordParticular = await bcrypt.hash("Particular123!", salt);
  const passwordRefugio = await bcrypt.hash("Refugio123!", salt);

  // 3. Crear Usuario 1: ADMIN
  console.log("👤 [Seed] Creando usuario con rol ADMIN...");
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@cumpa.org",
      passwordHash: passwordAdmin,
      name: "Administrador General Cumpa",
      role: Role.ADMIN,
      phone: "+54 11 4000-0001",
      province: "Buenos Aires",
      city: "Ciudad Autónoma de Buenos Aires",
      address: "Av. Corrientes 1234, Piso 5",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop",
      isEmailVerified: true,
    },
  });
  console.log(`✅ [Seed] ADMIN creado con ID: ${adminUser.id} (${adminUser.email})`);

  // 4. Crear Usuario 2: PARTICULAR verificado
  console.log("👤 [Seed] Creando usuario PARTICULAR verificado...");
  const particularUser = await prisma.user.create({
    data: {
      email: "particular@cumpa.org",
      passwordHash: passwordParticular,
      name: "Carlos Gómez (Particular)",
      role: Role.PARTICULAR,
      phone: "+54 11 5555-1234",
      province: "Buenos Aires",
      city: "La Plata",
      address: "Calle 50 Nro. 789",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop",
      isEmailVerified: true,
    },
  });
  console.log(`✅ [Seed] PARTICULAR creado con ID: ${particularUser.id} (${particularUser.email})`);

  // 5. Crear Usuario 3: INSTITUCION con CUIT validado por Módulo 11 y personería APROBADA
  const cuitString = "30-71234567-1";
  const cuitValidation = validateCuit(cuitString);
  if (!cuitValidation.isValid) {
    throw new Error(`Error fatal: CUIT ${cuitString} no pasa la validación de Módulo 11: ${cuitValidation.errorMessage}`);
  }
  console.log(`🔍 [Seed] CUIT validado con éxito mediante Algoritmo Módulo 11 AFIP: ${cuitValidation.cleanCuit}`);

  console.log("🏢 [Seed] Creando usuario INSTITUCION con personería jurídica APROBADA...");
  const institutionUser = await prisma.user.create({
    data: {
      email: "refugio@cumpa.org",
      passwordHash: passwordRefugio,
      name: "Refugio Patitas del Sur",
      role: Role.INSTITUCION,
      phone: "+54 11 6789-4321",
      province: "Buenos Aires",
      city: "Quilmes",
      address: "Av. Mitre 2500",
      avatarUrl: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=300&auto=format&fit=crop",
      isEmailVerified: true,
      institutionalProfile: {
        create: {
          legalName: "Asociación Civil Protectora Patitas del Sur",
          cuit: cuitValidation.cleanCuit,
          verificationStatus: VerificationStatus.APROBADA,
          verificationNotes: "Personería jurídica N° 98234/2021 y constancia de AFIP verificadas por auditoría legal.",
          verifiedAt: new Date(),
          verifiedByAdminId: adminUser.id,
          documentUrl: "https://cumpa.org/docs/personeria-patitas-del-sur.pdf",
          websiteUrl: "https://patitasdelsur.org",
          instagramUrl: "https://instagram.com/patitasdelsur_ok",
        },
      },
    },
    include: {
      institutionalProfile: true,
    },
  });
  console.log(`✅ [Seed] INSTITUCION creada con ID: ${institutionUser.id} (CUIT: ${institutionUser.institutionalProfile?.cuit})`);

  // 6. Crear 4 publicaciones de animales con fotos en diferentes estados
  console.log("\n🐾 [Seed] Publicando 4 animales de prueba con diferentes estados...");

  // Animal 1: DISPONIBLE (Perro publicado por la Institución)
  const animal1 = await prisma.animal.create({
    data: {
      publisherId: institutionUser.id,
      name: "Firulais",
      species: Species.PERRO,
      breed: "Mestizo / Criollo",
      sex: Sex.MACHO,
      size: Size.MEDIANO,
      ageCategory: AgeCategory.ADULTO,
      approximateAgeMonths: 36,
      description: "Firulais fue rescatado en la vía pública. Es un perro sumamente guardián, leal y cariñoso con adultos y niños. Camina bien con correa y adora salir a pasear.",
      healthDetails: "Vacunación antirrábica y séxtuple completa, castrado y desparasitado en marzo de 2026.",
      isNeutered: true,
      isVaccinated: true,
      isDewormed: true,
      specialNeeds: false,
      modality: Modality.ADOPCION_DEFINITIVA,
      status: AnimalStatus.DISPONIBLE,
      province: "Buenos Aires",
      city: "Quilmes",
      images: {
        create: [
          {
            url: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=800&auto=format&fit=crop",
            publicId: "cumpa/animales/firulais_1",
            isMain: true,
            order: 0,
          },
          {
            url: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?q=80&w=800&auto=format&fit=crop",
            publicId: "cumpa/animales/firulais_2",
            isMain: false,
            order: 1,
          },
        ],
      },
    },
  });
  console.log(`  1. [DISPONIBLE] ${animal1.name} (Perro Mediano) - ID: ${animal1.id}`);

  // Animal 2: DISPONIBLE (Gata publicada por el Particular)
  const animal2 = await prisma.animal.create({
    data: {
      publisherId: particularUser.id,
      name: "Luna",
      species: Species.GATO,
      breed: "Común Europeo Tricolor",
      sex: Sex.HEMBRA,
      size: Size.CHICO,
      ageCategory: AgeCategory.JOVEN,
      approximateAgeMonths: 14,
      description: "Luna es una gatita muy curiosa, independiente y ronroneadora. Se adaptaría perfectamente a un departamento seguro con protección en ventanas.",
      healthDetails: "Desparasitada internamente, libre de VIF/ViLeF, castrada.",
      isNeutered: true,
      isVaccinated: true,
      isDewormed: true,
      specialNeeds: false,
      modality: Modality.AMBAS,
      status: AnimalStatus.DISPONIBLE,
      province: "Buenos Aires",
      city: "La Plata",
      images: {
        create: [
          {
            url: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=800&auto=format&fit=crop",
            publicId: "cumpa/animales/luna_1",
            isMain: true,
            order: 0,
          },
          {
            url: "https://images.unsplash.com/photo-1573865526739-10659fec78a5?q=80&w=800&auto=format&fit=crop",
            publicId: "cumpa/animales/luna_2",
            isMain: false,
            order: 1,
          },
        ],
      },
    },
  });
  console.log(`  2. [DISPONIBLE] ${animal2.name} (Gata Joven) - ID: ${animal2.id}`);

  // Animal 3: EN_PROCESO (Cachorro con postulación en revisión)
  const animal3 = await prisma.animal.create({
    data: {
      publisherId: institutionUser.id,
      name: "Rocky",
      species: Species.PERRO,
      breed: "Cachorro Mestizo Labrador",
      sex: Sex.MACHO,
      size: Size.CHICO,
      ageCategory: AgeCategory.CACHORRO,
      approximateAgeMonths: 4,
      description: "Cachorrito enérgico y juguetón. Requiere una familia con paciencia para enseñarle hábitos higiénicos y brindarle estimulación diaria.",
      healthDetails: "Primeras 2 dosis séxtuples colocadas. Desparasitación al día. Compromiso de castración a los 6 meses.",
      isNeutered: false,
      isVaccinated: true,
      isDewormed: true,
      specialNeeds: false,
      modality: Modality.TRANSITO_TEMPORARIO,
      status: AnimalStatus.EN_PROCESO,
      province: "Buenos Aires",
      city: "Quilmes",
      images: {
        create: [
          {
            url: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?q=80&w=800&auto=format&fit=crop",
            publicId: "cumpa/animales/rocky_1",
            isMain: true,
            order: 0,
          },
        ],
      },
    },
  });

  // Postulación en revisión para Rocky
  await prisma.adoptionRequest.create({
    data: {
      animalId: animal3.id,
      applicantId: particularUser.id,
      type: Modality.TRANSITO_TEMPORARIO,
      status: RequestStatus.EN_REVISION,
      message: "Hola! Cuento con espacio y tiempo en casa durante los próximos 4 meses para brindar tránsito temporario a Rocky mientras completa su plan de vacunación.",
      phone: particularUser.phone || "+54 11 5555-1234",
      hasOtherPets: true,
      hasYard: true,
      housingType: "Casa con jardín cercado",
      landlordAllowsPets: true,
    },
  });
  console.log(`  3. [EN_PROCESO] ${animal3.name} (Cachorro en Tránsito con postulación EN_REVISION) - ID: ${animal3.id}`);

  // Animal 4: ADOPTADO (Animal con postulación APROBADA y expediente Follow-Up de 6 meses)
  const animal4 = await prisma.animal.create({
    data: {
      publisherId: institutionUser.id,
      name: "Milo",
      species: Species.PERRO,
      breed: "Golden Retriever Cruza",
      sex: Sex.MACHO,
      size: Size.GRANDE,
      ageCategory: AgeCategory.ADULTO,
      approximateAgeMonths: 48,
      description: "Milo es un gigante bonachón de temperamento calmo y protector. Fue rescatado de una fábrica abandonada y ya ha encontrado su hogar definitivo.",
      healthDetails: "Plan sanitario completo, castrado, microchip de identificación colocado.",
      isNeutered: true,
      isVaccinated: true,
      isDewormed: true,
      specialNeeds: false,
      modality: Modality.ADOPCION_DEFINITIVA,
      status: AnimalStatus.ADOPTADO,
      province: "Buenos Aires",
      city: "Quilmes",
      images: {
        create: [
          {
            url: "https://images.unsplash.com/photo-1552053831-71594a27632d?q=80&w=800&auto=format&fit=crop",
            publicId: "cumpa/animales/milo_1",
            isMain: true,
            order: 0,
          },
        ],
      },
    },
  });
  console.log(`  4. [ADOPTADO] ${animal4.name} (Perro Grande) - ID: ${animal4.id}`);

  // 7. Crear Postulación Aprobada y Expediente de Seguimiento Post-Adopción (6 meses)
  console.log("\n📋 [Seed] Generando expediente de seguimiento activo (FollowUp) de 6 meses para Milo...");

  const adoptionApplication = await prisma.adoptionRequest.create({
    data: {
      animalId: animal4.id,
      applicantId: particularUser.id,
      type: Modality.ADOPCION_DEFINITIVA,
      status: RequestStatus.APROBADA,
      message: "Queremos adoptar a Milo para que viva con nosotros en nuestra quinta en La Plata. Tenemos experiencia con perros grandes y atención veterinaria de confianza.",
      phone: particularUser.phone || "+54 11 5555-1234",
      hasOtherPets: false,
      hasYard: true,
      housingType: "Quinta familiar",
      landlordAllowsPets: true,
    },
  });

  const now = new Date();
  // El seguimiento inició hace 35 días
  const startDate = new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000);
  const endDate = new Date(startDate.getTime() + 180 * 24 * 60 * 60 * 1000);

  const followUp = await prisma.followUp.create({
    data: {
      animalId: animal4.id,
      adopterId: particularUser.id,
      guardianId: institutionUser.id,
      startDate,
      endDate,
      durationMonths: 6,
      status: FollowUpStatus.ACTIVO,
    },
  });

  // Generar exactamente 6 reportes mensuales con fechas límite correlativas
  const reportsData = [];
  for (let month = 1; month <= 6; month++) {
    const dueDate = new Date(startDate.getTime() + month * 30 * 24 * 60 * 60 * 1000);

    if (month === 1) {
      // Mes 1 ya fue cumplido y auditado por el tutor
      reportsData.push({
        followUpId: followUp.id,
        monthNumber: 1,
        dueDate,
        submittedAt: new Date(startDate.getTime() + 28 * 24 * 60 * 60 * 1000),
        imageUrl: "https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?q=80&w=800&auto=format&fit=crop",
        imagePublicId: "cumpa/seguimientos/milo_mes1",
        notes: "Milo está súper adaptado a la casa, duerme adentro y ya juega con su pelota todos los días en el patio.",
        status: ReportStatus.CUMPLIDO,
        reviewedByGuardian: true,
        guardianFeedback: "Excelente estado físico y adaptación familiar. ¡Felicitaciones a los adoptantes!",
      });
    } else {
      // Meses 2 a 6 en estado PENDIENTE con su respectiva fecha límite a futuro
      reportsData.push({
        followUpId: followUp.id,
        monthNumber: month,
        dueDate,
        status: ReportStatus.PENDIENTE,
        reviewedByGuardian: false,
      });
    }
  }

  await prisma.followUpReport.createMany({
    data: reportsData,
  });

  console.log(`✅ [Seed] Expediente FollowUp creado con éxito (ID: ${followUp.id}) con 6 reportes mensuales asociados.`);
  console.log("   - Mes 1: CUMPLIDO y Aprobado con fotografía.");
  console.log("   - Meses 2 a 6: PENDIENTE con vencimientos futuros programados.");

  console.log("\n🎉 [Seed] Proceso de inicialización de datos completado exitosamente.");
}

main()
  .catch((e) => {
    console.error("❌ Error durante la ejecución del seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
