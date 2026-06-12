'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Pago {
  id: number;
  tipo: 'inscripcion' | 'cuota' | 'unidad';
  monto: number;
  fecha: string;
  descripcion: string | null;
  comprobante_url: string | null;
}

function fmt(n: number) {
  return n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
}

const tipoLabel: Record<string, string> = {
  inscripcion: '🪪 Inscripción',
  cuota: '📅 Cuota',
  unidad: '🏕 Unidad',
};

export default function DetallePionero() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [scout, setScout] = useState<{
    nombre: string; apellido: string; seccion: string | null;
    formalizado: number; cuotas_pagadas: number; cuotas_debidas: number;
  } | null>(null);
  const [config, setConfig] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(d => {
      const s = d.scouts.find((x: { id: number }) => x.id === parseInt(id));
      setScout(s ?? null);
      setConfig(d.config);
    });
    fetch(`/api/scouts/${id}/pagos`).then(r => r.json()).then(setPagos);
  }, [id]);

  if (!scout) return <p className="text-gray-500">Cargando...</p>;

  const totalInscripcion = pagos.filter(p => p.tipo === 'inscripcion').reduce((a, p) => a + p.monto, 0);
  const totalCuotas = pagos.filter(p => p.tipo === 'cuota').reduce((a, p) => a + p.monto, 0);
  const montoAbono = config.cuota_monto_abono ?? 10000;
  const montoUnidad = config.cuota_monto_unidad ?? 5000;
  const ratioAbono = (montoAbono + montoUnidad) > 0 ? montoAbono / (montoAbono + montoUnidad) : 0;
  const saldoAbono = totalCuotas * ratioAbono;
  const pagaInscripcion = totalInscripcion >= (config.cuota_inscripcion ?? 5000);
  const formalizado = !!scout?.formalizado;
  const cuotasAtrasadas = Math.max(0, (scout.cuotas_debidas ?? 0) - (scout.cuotas_pagadas ?? 0));

  return (
    <div className="space-y-6 max-w-2xl">
      <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-800">← Volver</button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{scout.apellido}, {scout.nombre}</h1>
          {scout.seccion && <p className="text-gray-500 text-sm mt-0.5">Sección: {scout.seccion}</p>}
        </div>
        <Link href={`/pagos?scout=${id}`}
          className="bg-violet-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-violet-800">
          + Registrar Pago
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-xs text-blue-600 font-semibold uppercase">Saldo Abono</p>
          <p className="text-2xl font-bold text-blue-800 mt-1">{fmt(saldoAbono)}</p>
        </div>
        <div className={`${cuotasAtrasadas > 0 ? 'bg-orange-50 border-orange-200' : 'bg-violet-50 border-violet-200'} border rounded-xl p-4`}>
          <p className={`text-xs font-semibold uppercase ${cuotasAtrasadas > 0 ? 'text-orange-600' : 'text-violet-600'}`}>Cuotas</p>
          <p className={`text-2xl font-bold mt-1 ${cuotasAtrasadas > 0 ? 'text-orange-700' : 'text-violet-700'}`}>
            {cuotasAtrasadas > 0 ? `${cuotasAtrasadas} atrás` : 'Al día ✓'}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{scout.cuotas_pagadas ?? 0} / {scout.cuotas_debidas ?? 0} pagadas</p>
        </div>
        <div className={`${formalizado ? 'bg-green-50 border-green-200' : pagaInscripcion ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'} border rounded-xl p-4`}>
          <p className={`text-xs font-semibold uppercase ${formalizado ? 'text-green-600' : pagaInscripcion ? 'text-amber-600' : 'text-red-500'}`}>Inscripción</p>
          <p className={`text-lg font-bold mt-1 ${formalizado ? 'text-green-700' : pagaInscripcion ? 'text-amber-700' : 'text-red-600'}`}>
            {formalizado ? 'Formalizada ✓' : pagaInscripcion ? 'Sin formalizar' : `${fmt(totalInscripcion)} / ${fmt(config.cuota_inscripcion ?? 5000)}`}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <h2 className="font-semibold text-gray-700 px-5 py-4 border-b">Historial de Pagos</h2>
        {pagos.length === 0
          ? <p className="px-5 py-8 text-center text-gray-400">Sin pagos registrados</p>
          : <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                <tr>
                  <th className="px-4 py-2 text-left">Fecha</th>
                  <th className="px-4 py-2 text-left">Tipo</th>
                  <th className="px-4 py-2 text-right">Monto</th>
                  <th className="px-4 py-2 text-left">Descripción</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {pagos.map(p => (
                  <tr key={p.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-500">{p.fecha}</td>
                    <td className="px-4 py-2">{tipoLabel[p.tipo]}</td>
                    <td className="px-4 py-2 text-right font-mono">{fmt(p.monto)}</td>
                    <td className="px-4 py-2 text-gray-500">{p.descripcion ?? '—'}</td>
                    <td className="px-4 py-2 text-right">
                      {p.comprobante_url && (
                        <a href={p.comprobante_url} target="_blank" rel="noreferrer"
                          className="text-blue-600 hover:underline text-xs">Ver comprobante</a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        }
      </div>
    </div>
  );
}
