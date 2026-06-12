'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import GraficoFondos from '@/components/GraficoFondos';
import ExportButton from '@/components/ExportButton';

interface ScoutResumen {
  id: number;
  nombre: string;
  apellido: string;
  fecha_nacimiento: string | null;
  etapa: string | null;
  comunidad: string | null;
  pagado_inscripcion: number;
  saldo_abono: number;
  formalizado: number;
  cuotas_pagadas: number;
  cuotas_debidas: number;
}

interface DashboardData {
  fondo_inscripcion: number;
  fondo_unidad: number;
  fondo_abonos: number;
  total_scouts: number;
  inscritos: number;
  pagaron_inscripcion: number;
  no_inscritos: number;
  scouts: ScoutResumen[];
  config: Record<string, number>;
  cuotas_debidas_temporada: number;
}

function calcularEdad(fecha: string | null): string {
  if (!fecha) return '—';
  const hoy = new Date();
  const nac = new Date(fecha);
  let años = hoy.getFullYear() - nac.getFullYear();
  let meses = hoy.getMonth() - nac.getMonth();
  if (meses < 0 || (meses === 0 && hoy.getDate() < nac.getDate())) { años--; meses += 12; }
  if (hoy.getDate() < nac.getDate()) { meses--; if (meses < 0) meses += 12; }
  if (años < 0) return '—';
  return meses > 0 ? `${años}a ${meses}m` : `${años} años`;
}

function fmt(n: number) {
  return n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);

  const load = () => fetch('/api/dashboard').then(r => r.json()).then(setData);

  useEffect(() => {
    load();
    const id = setInterval(load, 10000);
    return () => clearInterval(id);
  }, []);

  if (!data) return <p className="text-gray-500">Cargando...</p>;

  const { fondo_inscripcion, fondo_unidad, fondo_abonos, inscritos, no_inscritos,
    pagaron_inscripcion, scouts, config, cuotas_debidas_temporada } = data;

  const atrasados = scouts.filter(s => s.cuotas_pagadas < s.cuotas_debidas);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <div className="flex items-center gap-2">
          <ExportButton href="/api/export/pagos" label="Exportar pagos" />
          <ExportButton href="/api/export/scouts" label="Exportar pioneros" />
        </div>
      </div>

      {/* Fondos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card color="violet" title="Fondo Unidad" value={fmt(fondo_unidad)} sub={`${fmt(config.cuota_monto_unidad)} por cuota + pagos directos`} />
        <Card color="blue" title="Fondo Abonos" value={fmt(fondo_abonos)} sub={`${fmt(config.cuota_monto_abono)} por cuota (total acumulado)`} />
        <Card color="purple" title="Fondo Inscripciones" value={fmt(fondo_inscripcion)} sub={`${pagaron_inscripcion} pagaron · ${inscritos} formalizados`} />
      </div>

      <GraficoFondos />

      {/* Cuotas atrasadas */}
      {cuotas_debidas_temporada > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-700">
              Estado de Cuotas
              <span className="ml-2 text-xs font-normal text-gray-400">
                Temporada abr–nov · {cuotas_debidas_temporada} cuota{cuotas_debidas_temporada !== 1 ? 's' : ''} vencida{cuotas_debidas_temporada !== 1 ? 's' : ''}
              </span>
            </h2>
            {atrasados.length > 0
              ? <span className="text-xs bg-orange-100 text-orange-700 font-semibold px-2 py-1 rounded-full">{atrasados.length} con atraso</span>
              : <span className="text-xs bg-violet-100 text-violet-700 font-semibold px-2 py-1 rounded-full">Todos al día ✓</span>
            }
          </div>
          {atrasados.length > 0 && (
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-500 uppercase border-b">
                <tr>
                  <th className="pb-2 text-left">Pionero</th>
                  <th className="pb-2 text-center">Pagadas</th>
                  <th className="pb-2 text-center">Debidas</th>
                  <th className="pb-2 text-center font-semibold text-orange-600">Atraso</th>
                </tr>
              </thead>
              <tbody>
                {atrasados.sort((a, b) => (b.cuotas_debidas - b.cuotas_pagadas) - (a.cuotas_debidas - a.cuotas_pagadas)).map(s => {
                  const atraso = s.cuotas_debidas - s.cuotas_pagadas;
                  return (
                    <tr key={s.id} className="border-t">
                      <td className="py-2">
                        <Link href={`/scouts/${s.id}`} className="text-violet-700 hover:underline font-medium">
                          {s.apellido}, {s.nombre}
                        </Link>
                      </td>
                      <td className="py-2 text-center text-gray-600">{s.cuotas_pagadas}</td>
                      <td className="py-2 text-center text-gray-600">{s.cuotas_debidas}</td>
                      <td className="py-2 text-center">
                        <span className="inline-block bg-orange-100 text-orange-700 font-semibold text-xs px-2 py-0.5 rounded-full">
                          {atraso} {atraso === 1 ? 'mes' : 'meses'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Estado inscripciones */}
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-700">Estado de Inscripciones</h2>
          <Link href="/inscripciones" className="text-xs bg-violet-700 text-white px-3 py-1 rounded-lg hover:bg-violet-800">
            Formalizar inscripciones →
          </Link>
        </div>
        <div className="flex gap-6 mb-4">
          <span className="text-violet-700 font-bold">{inscritos} formalizados ✓</span>
          <span className="text-amber-600 font-bold">{pagaron_inscripcion - inscritos} pagaron, sin formalizar</span>
          <span className="text-red-600 font-bold">{no_inscritos} sin pagar</span>
        </div>
        {no_inscritos > 0 && (
          <ul className="text-sm text-red-600 space-y-1">
            {scouts.filter(s => !s.formalizado && s.pagado_inscripcion < config.cuota_inscripcion).map(s => (
              <li key={s.id}>
                ⚠ <Link href={`/scouts/${s.id}`} className="underline hover:text-red-800">
                  {s.apellido}, {s.nombre}
                </Link>
                {' '}— pagó {fmt(s.pagado_inscripcion)} de {fmt(config.cuota_inscripcion)}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Tabla pioneros */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold text-gray-700">Saldos por Pionero</h2>
          <Link href="/scouts/nuevo" className="text-sm bg-violet-700 text-white px-3 py-1 rounded-lg hover:bg-violet-800">+ Agregar Pionero</Link>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th className="px-4 py-2 text-left">Pionero</th>
              <th className="px-4 py-2 text-left">Edad</th>
              <th className="px-4 py-2 text-left">Etapa</th>
              <th className="px-4 py-2 text-left">Comunidad</th>
              <th className="px-4 py-2 text-right">Abono</th>
              <th className="px-4 py-2 text-center">Cuotas</th>
              <th className="px-4 py-2 text-center">Inscripción</th>
            </tr>
          </thead>
          <tbody>
            {scouts.map(s => {
              const atraso = Math.max(0, s.cuotas_debidas - s.cuotas_pagadas);
              return (
                <tr key={s.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <Link href={`/scouts/${s.id}`} className="text-violet-700 hover:underline font-medium">
                      {s.apellido}, {s.nombre}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-gray-500">{calcularEdad(s.fecha_nacimiento)}</td>
                  <td className="px-4 py-2 text-gray-600">{s.etapa ?? '—'}</td>
                  <td className="px-4 py-2 text-gray-600">{s.comunidad ?? '—'}</td>
                  <td className="px-4 py-2 text-right font-mono">{fmt(s.saldo_abono)}</td>
                  <td className="px-4 py-2 text-center">
                    {cuotas_debidas_temporada === 0
                      ? <span className="text-gray-400 text-xs">Fuera de temporada</span>
                      : atraso > 0
                        ? <span className="inline-block bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full">{atraso} atrás</span>
                        : <span className="text-violet-600 font-semibold text-xs">Al día ✓</span>
                    }
                  </td>
                  <td className="px-4 py-2 text-center">
                    {s.formalizado
                      ? <span className="text-violet-600 font-semibold">✓</span>
                      : <span className="text-red-500 text-xs">Pendiente</span>}
                  </td>
                </tr>
              );
            })}
            {scouts.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                No hay pioneros aún. <Link href="/scouts/nuevo" className="underline text-violet-700">Agrega el primero</Link>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Card({ color, title, value, sub }: { color: string; title: string; value: string; sub: string }) {
  const colors: Record<string, string> = {
    violet: 'border-violet-200 bg-violet-50',
    blue: 'border-blue-200 bg-blue-50',
    purple: 'border-purple-200 bg-purple-50',
  };
  const text: Record<string, string> = {
    violet: 'text-violet-800',
    blue: 'text-blue-800',
    purple: 'text-purple-800',
  };
  return (
    <div className={`rounded-xl border p-5 ${colors[color]}`}>
      <p className={`text-xs font-semibold uppercase tracking-wide ${text[color]} mb-1`}>{title}</p>
      <p className={`text-2xl font-bold ${text[color]}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{sub}</p>
    </div>
  );
}
