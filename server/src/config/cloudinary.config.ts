import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { HttpError } from "../middlewares/errorHandler.middleware";

const isConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET &&
  !process.env.CLOUDINARY_CLOUD_NAME.includes("tu_cloudinary")
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
} else {
  console.warn("⚠️ [Cloudinary] Credenciales no configuradas. Se operará en Modo Fallback (URLs simuladas).");
}

// Configuración de Multer en memoria (MemoryStorage) para recibir los buffers directamente
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Máximo 5MB por archivo
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg", "application/pdf"];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new HttpError(400, "Formato de archivo no soportado. Se permiten JPG, PNG, WEBP y PDF."));
    }
  },
});

export interface UploadResult {
  url: string;
  publicId: string;
}

/**
 * Sube un buffer de archivo a Cloudinary o devuelve una URL simulada en desarrollo
 */
export async function uploadToCloudinary(
  fileBuffer: Buffer,
  folder: string = "cumpa",
  originalFilename?: string
): Promise<UploadResult> {
  if (!isConfigured) {
    const mockId = `mock_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    return {
      url: `https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=800&auto=format&fit=crop`,
      publicId: `${folder}/${mockId}`,
    };
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "auto",
        public_id: originalFilename ? `${Date.now()}_${originalFilename.replace(/\.[^/.]+$/, "")}` : undefined,
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error("Error desconocido al subir a Cloudinary"));
        } else {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
}

export default cloudinary;
