import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ShieldAlert, MessageSquare, CheckCircle2, KeyRound, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export const ContactPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('Soporte de cuenta / Seguridad');
  const [message, setMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!name.trim()) {
      errors.name = 'Tu nombre es obligatorio';
    }
    if (!email.trim()) {
      errors.email = 'El correo electrónico es obligatorio';
    } else if (!emailRegex.test(email.trim())) {
      errors.email = 'Ingresa un correo electrónico válido';
    }
    if (!message.trim()) {
      errors.message = 'El mensaje es obligatorio';
    } else if (message.trim().length < 10) {
      errors.message = 'El mensaje debe tener al menos 10 caracteres';
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitted(true);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-semibold uppercase tracking-wider mb-2">
          🐾 Centro de Ayuda
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Contacto y Soporte
        </h1>
        <p className="text-sm text-slate-600 mt-1 max-w-2xl">
          Si tienes dudas sobre adopciones, verificación institucional o notas actividad inusual en tu cuenta, estamos para ayudarte.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Columna izquierda: Canales y Alerta de Seguridad */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-rose-50/80 border border-rose-200 rounded-2xl p-6 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-rose-900">
                ¿No reconoces un cambio de contraseña?
              </h2>
            </div>
            <p className="text-xs text-rose-800 leading-relaxed">
              Si recibiste un aviso de actualización de clave que no solicitaste, restablece tu contraseña de inmediato para asegurar tu cuenta.
            </p>
            <Link to="/recuperar-clave" className="inline-block pt-1">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<KeyRound className="w-3.5 h-3.5" />}
                className="border-rose-300 text-rose-800 hover:bg-rose-100"
              >
                Restablecer mi contraseña
              </Button>
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center">
                <Mail className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900">Canales Directos</h2>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div>
                <span className="font-semibold text-slate-800 block">Correo de Soporte</span>
                <a
                  href="mailto:soporte@cumpa.org"
                  className="text-brand-700 hover:underline font-medium"
                >
                  soporte@cumpa.org
                </a>
              </div>
              <div>
                <span className="font-semibold text-slate-800 block">Denuncias sobre publicaciones</span>
                <p className="leading-relaxed">
                  Podés reportar cualquier publicación sospechosa directamente desde su ficha técnica usando el botón <strong>Reportar</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Columna derecha: Formulario de consulta */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-2.5 pb-4 mb-6 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Envíanos un mensaje</h2>
                <p className="text-xs text-slate-500">
                  Te responderemos a la brevedad a tu casilla de correo.
                </p>
              </div>
            </div>

            {submitted ? (
              <div className="py-8 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">¡Consulta registrada!</h3>
                <p className="text-sm text-slate-600 max-w-md mx-auto">
                  Gracias, <strong>{name}</strong>. Recibimos tu mensaje y el equipo de Cumpa se pondrá en contacto a <strong>{email}</strong>.
                </p>
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => {
                    setSubmitted(false);
                    setMessage('');
                  }}
                >
                  Enviar otra consulta
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    id="contact-name"
                    name="name"
                    label="Tu Nombre"
                    placeholder="Nombre y apellido"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: '' }));
                    }}
                    error={fieldErrors.name}
                    required
                  />
                  <Input
                    id="contact-email"
                    name="email"
                    type="email"
                    label="Correo Electrónico"
                    placeholder="tu@correo.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }));
                    }}
                    error={fieldErrors.email}
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5 text-left">
                  <label
                    htmlFor="contact-subject"
                    className="text-xs font-semibold uppercase tracking-wider text-slate-700"
                  >
                    Motivo de la consulta
                  </label>
                  <select
                    id="contact-subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-500"
                  >
                    <option value="Soporte de cuenta / Seguridad">Soporte de cuenta / Seguridad</option>
                    <option value="Verificación institucional (CUIT)">Verificación institucional (CUIT)</option>
                    <option value="Seguimiento post-adopción">Seguimiento post-adopción</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5 text-left">
                  <label
                    htmlFor="contact-message"
                    className="text-xs font-semibold uppercase tracking-wider text-slate-700"
                  >
                    Mensaje <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    id="contact-message"
                    rows={4}
                    placeholder="Contanos en qué te podemos ayudar..."
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      if (fieldErrors.message) setFieldErrors((prev) => ({ ...prev, message: '' }));
                    }}
                    required
                    className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-200 transition ${
                      fieldErrors.message
                        ? 'border-rose-400 focus:border-rose-500'
                        : 'border-slate-300 focus:border-brand-500'
                    }`}
                  />
                  {fieldErrors.message && (
                    <p className="text-xs font-medium text-rose-600">{fieldErrors.message}</p>
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    rightIcon={<Send className="w-4 h-4" />}
                    className="font-semibold shadow-md shadow-brand-600/20"
                  >
                    Enviar mensaje
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
