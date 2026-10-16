import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, X, Star, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/utils/cn';

interface CloudinaryUploaderProps {
  images: File[];
  onChange: (images: File[]) => void;
  maxFiles?: number;
  disabled?: boolean;
  error?: string;
}

interface ImagePreview {
  file: File;
  previewUrl: string;
}

export const CloudinaryUploader: React.FC<CloudinaryUploaderProps> = ({
  images,
  onChange,
  maxFiles = 5,
  disabled = false,
  error,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [previews, setPreviews] = useState<ImagePreview[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sincronizar previews cuando cambia la lista de archivos
  useEffect(() => {
    const newPreviews = images.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setPreviews(newPreviews);

    // Liberar memoria de los ObjectURLs creados
    return () => {
      newPreviews.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, [images]);

  const handleFiles = (incomingFiles: FileList | null) => {
    if (!incomingFiles || incomingFiles.length === 0) return;
    setLocalError(null);

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const validFiles: File[] = [];

    for (let i = 0; i < incomingFiles.length; i++) {
      const file = incomingFiles[i];
      if (!validTypes.includes(file.type)) {
        setLocalError('Solo se permiten imágenes en formato JPG, PNG o WebP.');
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        setLocalError('Cada imagen debe pesar un máximo de 5MB.');
        continue;
      }
      validFiles.push(file);
    }

    const totalFiles = [...images, ...validFiles];
    if (totalFiles.length > maxFiles) {
      setLocalError(`Puedes subir hasta un máximo de ${maxFiles} fotografías.`);
      onChange(totalFiles.slice(0, maxFiles));
    } else {
      onChange(totalFiles);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!disabled) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleRemove = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleSetMain = (index: number) => {
    if (index === 0) return;
    const item = images[index];
    const rest = images.filter((_, i) => i !== index);
    onChange([item, ...rest]);
  };

  return (
    <div className="space-y-3">
      {/* Zona de Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={cn(
          'relative border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all duration-200 cursor-pointer select-none',
          isDragging
            ? 'border-brand-600 bg-brand-50/50 scale-[1.01]'
            : 'border-slate-300 hover:border-brand-500 bg-slate-50/70 hover:bg-brand-50/20',
          disabled && 'opacity-60 cursor-not-allowed hover:border-slate-300 hover:bg-slate-50',
          error ? 'border-rose-300 bg-rose-50/20' : ''
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={disabled}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center mb-1 shadow-xs">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">
              Arrastra y suelta fotos aquí, o{' '}
              <span className="text-brand-700 hover:underline">explora tus archivos</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">
              JPG, PNG o WebP de hasta 5MB. Mínimo 1, máximo {maxFiles} fotos.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-[11px] font-medium text-slate-600">
            <ImageIcon className="w-3.5 h-3.5 text-brand-600" />
            <span>Almacenamiento optimizado en Cloudinary</span>
          </div>
        </div>
      </div>

      {/* Errores */}
      {(localError || error) && (
        <div className="flex items-center gap-2 text-xs text-rose-600 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{localError || error}</span>
        </div>
      )}

      {/* Galería de Miniaturas Previsualizadas */}
      {previews.length > 0 && (
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              Fotografías cargadas: <strong>{previews.length}</strong> de {maxFiles}
            </span>
            <span className="text-[11px]">
              * La primera foto será la portada principal de la tarjeta.
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {previews.map((preview, index) => {
              const isMain = index === 0;

              return (
                <div
                  key={preview.previewUrl}
                  className={cn(
                    'group relative aspect-square rounded-xl overflow-hidden border-2 bg-slate-100 shadow-xs transition',
                    isMain ? 'border-brand-600 ring-2 ring-brand-500/20' : 'border-slate-200'
                  )}
                >
                  <img
                    src={preview.previewUrl}
                    alt={`Foto ${index + 1}`}
                    className="w-full h-full object-cover"
                  />

                  {/* Badge de Portada Principal */}
                  {isMain && (
                    <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-brand-600 text-white text-[10px] font-bold shadow-xs flex items-center gap-1">
                      <Star className="w-3 h-3 fill-white" /> Portada
                    </span>
                  )}

                  {/* Overlay de Acciones */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
                    {!isMain && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetMain(index);
                        }}
                        className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-slate-800 transition"
                        title="Hacer foto principal"
                      >
                        <Star className="w-4 h-4 text-amber-500" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(index);
                      }}
                      className="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition"
                      title="Eliminar foto"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CloudinaryUploader;
