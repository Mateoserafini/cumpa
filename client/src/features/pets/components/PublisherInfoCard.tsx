import React from 'react';
import {
  User,
  ShieldCheck,
  Building2,
  Calendar,
  MapPin,
  ExternalLink,
  Instagram,
  Lock,
} from 'lucide-react';
import type { DetailedAnimal } from './PetDetailHero';

interface PublisherInfoCardProps {
  publisher: DetailedAnimal['publisher'];
}

export const PublisherInfoCard: React.FC<PublisherInfoCardProps> = ({ publisher }) => {
  const isInstitution =
    publisher.role === 'INSTITUCION' || publisher.role === 'VETERINARIA';
  const isVerified =
    publisher.institutionalProfile?.verificationStatus === 'APROBADA';

  const memberYear = new Date(publisher.createdAt).getFullYear();

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-100 shadow-soft space-y-6">
      <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
        <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center">
          <User className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Responsable de la Publicación
          </h3>
          <p className="text-xs text-slate-500">
            Tutor que coordina el proceso de adopción y seguimiento.
          </p>
        </div>
      </div>

      {/* Datos del Publicador */}
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-700 border border-brand-100 flex items-center justify-center text-xl font-bold uppercase shadow-inner shrink-0">
          {publisher.avatarUrl ? (
            <img
              src={publisher.avatarUrl}
              alt={publisher.name}
              className="w-full h-full object-cover rounded-2xl"
            />
          ) : (
            publisher.name[0]
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h4 className="text-lg font-bold text-slate-900 truncate">
              {publisher.name}
            </h4>
            {isVerified && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                <ShieldCheck className="w-3.5 h-3.5" /> Verificado
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {publisher.city}, {publisher.province}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Miembro desde {memberYear}
            </span>
          </div>
        </div>
      </div>

      {/* Detalle Institucional si aplica */}
      {isInstitution && publisher.institutionalProfile && (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-slate-700 font-semibold">
            <Building2 className="w-4 h-4 text-brand-600" />
            <span>{publisher.institutionalProfile.legalName}</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-slate-500 pt-1">
            <span>CUIT: {publisher.institutionalProfile.cuit}</span>

            {publisher.institutionalProfile.websiteUrl && (
              <a
                href={publisher.institutionalProfile.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-brand-700 hover:underline"
              >
                <span>Sitio Web</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}

            {publisher.institutionalProfile.instagramUrl && (
              <a
                href={publisher.institutionalProfile.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-pink-600 hover:underline"
              >
                <Instagram className="w-3 h-3" />
                <span>Instagram</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* Aviso de Privacidad y Seguridad */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5 text-xs text-slate-500 leading-relaxed">
        <Lock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <span>
          Por seguridad de ambas partes, los números telefónicos y direcciones exactas solo se revelan una vez enviada y evaluada la postulación.
        </span>
      </div>
    </div>
  );
};

export default PublisherInfoCard;
