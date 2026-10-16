import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../app";
import { db, resetMockDb } from "./mockDb";
import { seedUser, seedAnimal, seedInstitutionalProfile, generateTestToken } from "./helpers";
import { Role, Species, Sex, Size, AgeCategory, Modality, AnimalStatus, VerificationStatus } from "@prisma/client";

describe("Animals Integration Tests (/api/animals)", () => {
  beforeEach(() => {
    resetMockDb();
  });

  describe("GET /api/animals (Catálogo público paginado y con filtros)", () => {
    it("debe retornar el catálogo paginado con metadatos de paginación", async () => {
      const publisher = await seedUser({ role: Role.PARTICULAR });

      // Creamos 15 animales disponibles
      for (let i = 1; i <= 15; i++) {
        seedAnimal(publisher.id, {
          name: `Animal ${i}`,
          species: Species.PERRO,
          status: AnimalStatus.DISPONIBLE,
        });
      }

      const response = await request(app)
        .get("/api/animals?page=1&limit=10");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("total", 15);
      expect(response.body).toHaveProperty("totalPages", 2);
      expect(response.body).toHaveProperty("page", 1);
      expect(response.body).toHaveProperty("limit", 10);
      expect(response.body.data).toHaveLength(10);
    });

    it("debe paginar correctamente accediendo a la segunda página", async () => {
      const publisher = await seedUser();
      for (let i = 1; i <= 15; i++) {
        seedAnimal(publisher.id, { name: `Mascota ${i}` });
      }

      const response = await request(app)
        .get("/api/animals?page=2&limit=10");

      expect(response.status).toBe(200);
      expect(response.body.page).toBe(2);
      expect(response.body.data).toHaveLength(5);
    });

    it("debe filtrar correctamente por especie (GATO)", async () => {
      const publisher = await seedUser();
      seedAnimal(publisher.id, { name: "Rex", species: Species.PERRO });
      seedAnimal(publisher.id, { name: "Michi", species: Species.GATO });
      seedAnimal(publisher.id, { name: "Pelusa", species: Species.GATO });

      const response = await request(app).get("/api/animals?species=GATO");

      expect(response.status).toBe(200);
      expect(response.body.total).toBe(2);
      expect(response.body.data.every((a: any) => a.species === "GATO")).toBe(true);
    });

    it("debe filtrar por tamaño, sexo y modalidad de adopción", async () => {
      const publisher = await seedUser();
      seedAnimal(publisher.id, {
        name: "Lola",
        size: Size.CHICO,
        sex: Sex.HEMBRA,
        modality: Modality.TRANSITO_TEMPORARIO,
      });
      seedAnimal(publisher.id, {
        name: "Thor",
        size: Size.GRANDE,
        sex: Sex.MACHO,
        modality: Modality.ADOPCION_DEFINITIVA,
      });

      const response = await request(app).get(
        "/api/animals?size=CHICO&sex=HEMBRA&modality=TRANSITO_TEMPORARIO"
      );

      expect(response.status).toBe(200);
      expect(response.body.total).toBe(1);
      expect(response.body.data[0].name).toBe("Lola");
    });

    it("debe permitir búsqueda libre por término de texto en nombre o descripción", async () => {
      const publisher = await seedUser();
      seedAnimal(publisher.id, { name: "Toby", description: "Perro rescatado muy juguetón" });
      seedAnimal(publisher.id, { name: "Rocky", description: "Gato tranquilo para departamento" });

      const response = await request(app).get("/api/animals?search=juguetón");

      expect(response.status).toBe(200);
      expect(response.body.total).toBe(1);
      expect(response.body.data[0].name).toBe("Toby");
    });

    it("no debe mostrar animales con estado ADOPTADO o CANCELADA en el catálogo público", async () => {
      const publisher = await seedUser();
      seedAnimal(publisher.id, { name: "Disponible", status: AnimalStatus.DISPONIBLE });
      seedAnimal(publisher.id, { name: "Adoptado Ya", status: AnimalStatus.ADOPTADO });
      seedAnimal(publisher.id, { name: "Publicación Cancelada", status: AnimalStatus.CANCELADA });

      const response = await request(app).get("/api/animals");

      expect(response.status).toBe(200);
      expect(response.body.total).toBe(1);
      expect(response.body.data[0].name).toBe("Disponible");
    });
  });

  describe("POST /api/animals (Publicación con autenticación)", () => {
    it("debe responder con 401 si no se envía token de autenticación", async () => {
      const response = await request(app)
        .post("/api/animals")
        .field("name", "Firu");

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/Token no proporcionado/i);
    });

    it("debe permitir publicar exitosamente a un usuario PARTICULAR con al menos una imagen", async () => {
      const particular = await seedUser({ role: Role.PARTICULAR });
      const token = generateTestToken(particular);

      const fakeImageBuffer = Buffer.from("fake-image-bytes-jpeg-test");

      const response = await request(app)
        .post("/api/animals")
        .set("Authorization", `Bearer ${token}`)
        .field("name", "Manchitas")
        .field("species", Species.PERRO)
        .field("breed", "Dálmata cruza")
        .field("sex", Sex.MACHO)
        .field("size", Size.MEDIANO)
        .field("ageCategory", AgeCategory.JOVEN)
        .field("approximateAgeMonths", "14")
        .field("description", "Hermoso perrito de 14 meses en busca de una familia responsable que le dé mucho amor.")
        .field("modality", Modality.ADOPCION_DEFINITIVA)
        .field("province", "Buenos Aires")
        .field("city", "Quilmes")
        .attach("images", fakeImageBuffer, "manchitas.jpg");

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id");
      expect(response.body.name).toBe("Manchitas");
      expect(response.body.imagesCount).toBe(1);

      // Verificar persistencia en base de datos
      const animalInDb = db.animals.find((a) => a.id === response.body.id);
      expect(animalInDb).toBeDefined();
      expect(animalInDb?.publisherId).toBe(particular.id);
    });

    it("debe fallar con 400 si no se adjunta ninguna imagen", async () => {
      const particular = await seedUser({ role: Role.PARTICULAR });
      const token = generateTestToken(particular);

      const response = await request(app)
        .post("/api/animals")
        .set("Authorization", `Bearer ${token}`)
        .field("name", "Sin Foto")
        .field("species", Species.GATO)
        .field("sex", Sex.HEMBRA)
        .field("size", Size.CHICO)
        .field("ageCategory", AgeCategory.ADULTO)
        .field("description", "Hermosa gatita de tres años pero el usuario no adjunta ninguna foto.")
        .field("modality", Modality.ADOPCION_DEFINITIVA)
        .field("province", "Buenos Aires")
        .field("city", "La Plata");

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/al menos una fotografía/i);
    });
  });

  describe("POST /api/animals (Validación de CUIT para instituciones)", () => {
    it("debe rechazar con 403 a una INSTITUCIÓN con CUIT en estado PENDIENTE", async () => {
      const institucion = await seedUser({
        name: "Refugio Sin Aprobar",
        role: Role.INSTITUCION,
      });
      seedInstitutionalProfile(institucion.id, {
        cuit: "30-77777777-1",
        verificationStatus: VerificationStatus.PENDIENTE,
      });

      const token = generateTestToken(institucion);
      const fakeImageBuffer = Buffer.from("fake-image-bytes");

      const response = await request(app)
        .post("/api/animals")
        .set("Authorization", `Bearer ${token}`)
        .field("name", "Cachorro Refugio")
        .field("species", Species.PERRO)
        .field("sex", Sex.MACHO)
        .field("size", Size.CHICO)
        .field("ageCategory", AgeCategory.CACHORRO)
        .field("description", "Cachorrito en adopción publicado por una institución aún no verificada.")
        .field("modality", Modality.ADOPCION_DEFINITIVA)
        .field("province", "Santa Fe")
        .field("city", "Rosario")
        .attach("images", fakeImageBuffer, "cachorro.jpg");

      expect(response.status).toBe(403);
      expect(response.body.message).toMatch(/requiere aprobación previa del CUIT/i);
    });

    it("debe rechazar con 403 a una INSTITUCIÓN con CUIT RECHAZADO", async () => {
      const institucion = await seedUser({
        name: "Refugio Rechazado",
        role: Role.INSTITUCION,
      });
      seedInstitutionalProfile(institucion.id, {
        cuit: "30-88888888-2",
        verificationStatus: VerificationStatus.RECHAZADA,
      });

      const token = generateTestToken(institucion);
      const fakeImageBuffer = Buffer.from("fake-image-bytes");

      const response = await request(app)
        .post("/api/animals")
        .set("Authorization", `Bearer ${token}`)
        .field("name", "Cachorro")
        .field("species", Species.PERRO)
        .field("sex", Sex.MACHO)
        .field("size", Size.CHICO)
        .field("ageCategory", AgeCategory.CACHORRO)
        .field("description", "Descripción válida de más de veinte caracteres.")
        .field("modality", Modality.ADOPCION_DEFINITIVA)
        .field("province", "Córdoba")
        .field("city", "Córdoba")
        .attach("images", fakeImageBuffer, "foto.jpg");

      expect(response.status).toBe(403);
      expect(response.body.message).toMatch(/requiere aprobación previa del CUIT/i);
    });

    it("debe permitir publicar a una INSTITUCIÓN con CUIT verificado y APROBADO", async () => {
      const institucion = await seedUser({
        name: "Asociación Protectora Sarmiento",
        role: Role.INSTITUCION,
      });
      seedInstitutionalProfile(institucion.id, {
        cuit: "30-99999999-3",
        verificationStatus: VerificationStatus.APROBADA,
      });

      const token = generateTestToken(institucion);
      const fakeImageBuffer = Buffer.from("fake-image-bytes");

      const response = await request(app)
        .post("/api/animals")
        .set("Authorization", `Bearer ${token}`)
        .field("name", "Barcino")
        .field("species", Species.GATO)
        .field("sex", Sex.MACHO)
        .field("size", Size.MEDIANO)
        .field("ageCategory", AgeCategory.ADULTO)
        .field("description", "Gato rescatado en operativo institucional, vacunado y castrado listo para adopción.")
        .field("modality", Modality.ADOPCION_DEFINITIVA)
        .field("province", "Buenos Aires")
        .field("city", "Avellaneda")
        .attach("images", fakeImageBuffer, "barcino.jpg");

      expect(response.status).toBe(201);
      expect(response.body.name).toBe("Barcino");

      const savedInDb = db.animals.find((a) => a.id === response.body.id);
      expect(savedInDb).toBeDefined();
      expect(savedInDb?.publisherId).toBe(institucion.id);
    });
  });
});
