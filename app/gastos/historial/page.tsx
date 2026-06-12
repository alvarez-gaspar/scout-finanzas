'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import ExportButton from '@/components/ExportButton';

interface GastoItem {
  id: number;
  gasto_id: number;
  tipo: string;
  scout_id: number | null;
  monto: number;
  nombre: string | null;
  apellido: string | null;
}

interface Gasto {
  id: number;
  fecha: string;
  descripcion: string | null;
  comprobante_url: string | null;
  total: number;
}

const tipoLabel: Record<string, string> = {
  unidad: '🏕 Unidad',
  abono: '👤 Abono',
  inscripcion: '🪪 Inscripción',
};

function fmt(n: number) {
  return n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
}

export default function HistorialGastos() {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [items, setItems] = useState<GastoItem[]>([]);

  useEffect(() => {
    fetch('/api/gastos').then(r => r.json()).then(d => {
      setGastos(d.gastos);
      setItems(d.items);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Historial de Gastos</h1>
        <div className="flex items-center gap-2">
          <ExportButton href="/api/export/gastos" label="Exportar gastos" />
          <Link href="/gastos" className="bg-red-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-800">
            + Registrar Gasto
          </Link>
        </div>
      </div>

      {gastos.length === 0 && (
        <p className="text-gray-400 text-center py-12">Sin gastos registrados aún.</p>
      )}

      <div className="space-y-3">
        {gastos.map(g => {
          const gItems = items.filter(i => i.gasto_id === g.id);
          return (
            <div key={g.id} className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b bg-gray-50">
                <div>
                  <span className="font-medium text-gray-800">{g.descripcion ?? 'Sin descripción'}</span>
                  <span className="text-gray-400 text-xs ml-3">{g.fecha}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-red-700">−{fmt(g.total)}</span>
                  {g.comprobante_url && (
                    <a href={g.comprobante_url} target="_blank" rel="noreferrer"
                      className="text-xs text-blue-600 hover:underline">Comprobante</a>
                  )}
                </div>
              </div>
              <div className="divide-y">
                {gItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between px-5 py-2 text-sm">
                    <span className="text-gray-600">{tipoLabel[item.tipo]}</span>
                    {(item.nombre || item.apellido) && (
                      <span className="text-gray-500 flex-1 ml-3">{item.apellido}, {item.nombre}</span>
                    )}
                    <span className="font-mono text-gray-700 ml-auto">−{fmt(item.monto)}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
