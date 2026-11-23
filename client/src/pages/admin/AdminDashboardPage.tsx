import React, { useState, useEffect } from 'react';
import { adminService } from '@/features/admin/services/adminService';
import type {
  AdminStats,
  PendingInstitution,
  AdminReportItem,
} from '@/features/admin/types/admin.types';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/feedback/Alert';
import { Button } from '@/components/ui/Button';
import {
  ShieldAlert,
  Users,
  PawPrint,
  Heart,
  FileCheck,
  CheckCircle,
  AlertTriangle,
  Building2,
  ExternalLink,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'STATS' | 'INSTITUTIONS' | 'REPORTS'>('STATS');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [institutions, setInstitutions] = useState<PendingInstitution[]>([]);
  const [reports, setReports] = useState<AdminReportItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      const data = await adminService.getStats();
      setStats(data);
    } catch (err: unknown) {
      console.error('Error al cargar stats:', err);
    }
  };

  const fetchInstitutions = async () => {
    try {
      const data = await adminService.getPendingInstitutions();
      setInstitutions(data);
    } catch (err: unknown) {
      console.error('Error al cargar instituciones:', err);
    }
  };

  const fetchReports = async () => {
    try {
      const data = await adminService.getReports();
      setReports(data.data);
    } catch (err: unknown) {
      console.error('Error al cargar reportes:', err);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await Promise.all([fetchStats(), fetchInstitutions(), fetchReports()]);
    } catch (err: unknown) {
      const apiError = err as Error;
      setError(apiError.message || 'Error al conectar con la administración.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleVerifyInstitution = async (id: string, status: 'APROBADA' | 'RECHAZADA') => {
    const notes = window.prompt(
      status === 'APROBADA'
        ? 'Notas de aprobación (opcional):'
        : 'Motivo del rechazo de la personería:'
    );
    if (status === 'RECHAZADA' && !notes?.trim()) {
      alert('Debes indicar un motivo de rechazo para notificar a la entidad.');
      return;
    }

    setProcessingId(id);
    setActionSuccess(null);
    try {
      await adminService.verifyInstitution(id, status, notes || undefined);
      setActionSuccess(`Institución dictaminada exitosamente (${status}).`);
      void fetchInstitutions();
      void fetchStats();
    } catch (err: unknown) {
      const apiError = err as Error;
      setError(apiError.message || 'Error al procesar la verificación.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleResolveReport = async (
    id: string,
    status: 'RESUELTO' | 'DESESTIMADO',
    takeAction?: 'BAN_USER' | 'DELETE_ANIMAL' | 'NONE'
  ) => {
    const notes = window.prompt('Notas de resolución de la denuncia:') || 'Dictamen de moderación.';

    setProcessingId(id);
    setActionSuccess(null);
    try {
      await adminService.resolveReport(id, {
        status,
        resolutionNotes: notes,
        takeAction,
      });
      setActionSuccess(`Denuncia procesada (${status}).`);
      void fetchReports();
      void fetchStats();
    } catch (err: unknown) {
      const apiError = err as Error;
      setError(apiError.message || 'Error al resolver la denuncia.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Encabezado */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold uppercase tracking-wider mb-2">
          <ShieldAlert className="w-3.5 h-3.5" /> Panel de Control de Administrador
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Administración y Moderación Cumpa
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Supervisión de métricas, validación de personería jurídica institucional y moderación de denuncias.
        </p>
      </div>

      {actionSuccess && (
        <Alert variant="success" title="Operación Exitosa" onClose={() => setActionSuccess(null)}>
          {actionSuccess}
        </Alert>
      )}

      {error && (
        <Alert variant="error" title="Aviso" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('STATS')}
          className={`px-4 py-2 text-sm font-semibold rounded-xl transition flex items-center gap-2 ${
            activeTab === 'STATS'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <PawPrint className="w-4 h-4" /> Métricas Globales
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('INSTITUTIONS')}
          className={`px-4 py-2 text-sm font-semibold rounded-xl transition flex items-center gap-2 ${
            activeTab === 'INSTITUTIONS'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" /> Verificación CUIT ({institutions.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('REPORTS')}
          className={`px-4 py-2 text-sm font-semibold rounded-xl transition flex items-center gap-2 ${
            activeTab === 'REPORTS'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="w-4 h-4" /> Denuncias ({reports.length})
        </button>
      </div>

      {isLoading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center p-8 gap-3">
          <Spinner size="xl" variant="brand" />
          <p className="text-sm font-medium text-slate-500 animate-pulse">
            Cargando datos del panel de administración...
          </p>
        </div>
      ) : activeTab === 'STATS' && stats ? (
        /* VISTA DE MÉTRICAS */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-slate-500 uppercase">Usuarios</span>
            </div>
            <div className="text-3xl font-extrabold text-slate-900">{stats.totalUsers}</div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <PawPrint className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-slate-500 uppercase">Disponibles</span>
            </div>
            <div className="text-3xl font-extrabold text-emerald-600">{stats.totalActiveAnimals}</div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Heart className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-slate-500 uppercase">Adopciones</span>
            </div>
            <div className="text-3xl font-extrabold text-purple-600">{stats.totalAdoptionsCompleted}</div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <FileCheck className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-slate-500 uppercase">Seguimientos</span>
            </div>
            <div className="text-3xl font-extrabold text-amber-600">{stats.activeFollowUps}</div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <CheckCircle className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-slate-500 uppercase">Cumplimiento</span>
            </div>
            <div className="text-3xl font-extrabold text-teal-600">{stats.complianceRatePercentage}%</div>
          </div>
        </div>
      ) : activeTab === 'INSTITUTIONS' ? (
        /* VISTA DE INSTITUCIONES */
        institutions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
            No hay instituciones pendientes de verificación en este momento.
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-4">Razón Social</th>
                    <th className="p-4">CUIT Fiscal</th>
                    <th className="p-4">Usuario Registrado</th>
                    <th className="p-4">Ubicación</th>
                    <th className="p-4">Comprobante</th>
                    <th className="p-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {institutions.map((inst) => (
                    <tr key={inst.id} className="hover:bg-slate-50/50">
                      <td className="p-4 font-semibold text-slate-900">{inst.legalName}</td>
                      <td className="p-4 font-mono">{inst.cuit}</td>
                      <td className="p-4">
                        {inst.user.name} ({inst.user.email})
                      </td>
                      <td className="p-4">
                        {inst.user.city}, {inst.user.province}
                      </td>
                      <td className="p-4">
                        {inst.documentUrl ? (
                          <a
                            href={inst.documentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-brand-600 hover:underline"
                          >
                            Ver Archivo <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-slate-400">Sin archivo</span>
                        )}
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={processingId === inst.id}
                          onClick={() => handleVerifyInstitution(inst.id, 'APROBADA')}
                        >
                          Aprobar
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          disabled={processingId === inst.id}
                          onClick={() => handleVerifyInstitution(inst.id, 'RECHAZADA')}
                        >
                          Rechazar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        /* VISTA DE DENUNCIAS */
        reports.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
            No hay denuncias pendientes de moderación.
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((rep) => (
              <div
                key={rep.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                      {rep.reason}
                    </span>
                    <span className="text-xs text-slate-400">
                      Tipo: {rep.targetType} (ID: {rep.targetId.substring(0, 8)}...)
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-800">"{rep.description}"</p>
                  <p className="text-xs text-slate-500">
                    Denunciante: {rep.reporter.name} ({rep.reporter.email})
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={processingId === rep.id}
                    onClick={() => handleResolveReport(rep.id, 'DESESTIMADO', 'NONE')}
                  >
                    Desestimar
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={processingId === rep.id}
                    onClick={() =>
                      handleResolveReport(
                        rep.id,
                        'RESUELTO',
                        rep.targetType === 'ANIMAL' ? 'DELETE_ANIMAL' : 'BAN_USER'
                      )
                    }
                  >
                    Sancionar y Resolver
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default AdminDashboardPage;
