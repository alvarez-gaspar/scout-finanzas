'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import ExportButton from '@/components/ExportButton';

interface Scout {
  id: number;
  nombre: string;
  apellido: string;
  seccion: string | null;
  total_inscripcion: number;
  saldo_abono: number;
}

function fmt(n: number) {
  return n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
}

export default function PionerosPage() {
  const [scouts, setScouts] = useState<Scout[]>([]);
  const [config, setConfig] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch('/api/scouts').then(r => r.json()).then(d => {
      setScouts(d.scouts);
      setConfig(d.config);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Pioneros ({scouts.length})</h1>
        <div className="flex items-center gap-2">
          <ExportButton href="/api/export/scouts" label="Exportar pioneros" />
          <Link href="/scouts/nuevo" className="bg-violet-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-violet-800">
            + Agregar Pionero
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left">Nombre</th>
              <th className="px-4 py-3 text-left">Sección</th>
              <th className="px-4 py-3 text-right">Saldo Abono</th>
              <th className="px-4 py-3 text-center">Inscripción</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {scouts.map(s => (
              <tr key={s.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{s.apellido}, {s.nombre}</td>
                <td className="px-4 py-3 text-gray-500">{s.seccion ?? '—'}</td>
                <td className="px-4 py-3 text-right font-mono">{fmt(s.saldo_abono)}</td>
                <td className="px-4 py-3 text-center">
                  {s.total_inscripcion >= parseFloat(config.cuota_inscripcion ?? '0')
                    ? <span className="inline-block bg-violet-100 text-violet-700 text-xs px-2 py-0.5 rounded-full font-semibold">Pagada ✓</span>
                    : <span className="inline-block bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">Pendiente</span>}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/scouts/${s.id}`} className="text-violet-700 hover:underline text-xs">Ver detalle →</Link>
                </td>
              </tr>
            ))}
            {scouts.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                Sin pioneros. <Link href="/scouts/nuevo" className="underline text-violet-700">Agrega el primero</Link>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
