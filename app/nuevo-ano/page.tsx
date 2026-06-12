'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const MESES = [
  { v: 1, l: 'Enero' }, { v: 2, l: 'Febrero' }, { v: 3, l: 'Marzo' },
  { v: 4, l: 'Abril' }, { v: 5, l: 'Mayo' }, { v: 6, l: 'Junio' },
  { v: 7, l: 'Julio' }, { v: 8, l: 'Agosto' }, { v: 9, l: 'Septiembre' },
  { v: 10, l: 'Octubre' }, { v: 11, l: 'Noviembre' }, { v: 12, l: 'Diciembre' },
];

export default function NuevoAnoPage() {
  const router = useRouter();
  const [paso, setPaso] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    año: new Date().getFullYear() + 1,
    mes_inicio: 4,
    mes_fin: 11,
    cuota_inscripcion: '',
    cuota_monto_abono: '',
    cuota_monto_unidad: '',
  });

  function set(k: string, v: string | number) {
    setForm(f => ({ ...f, [k]: v }));
  }

  async function confirmar() {
    setLoading(true);
    const res = await fetch('/api/nuevo-ano', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      router.push('/');
    } else {
      alert('Error al iniciar el nuevo año. Intenta de nuevo.');
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Iniciar Nuevo Año</h1>

      {paso === 1 && (
        <div className="bg-white rounded-xl border shadow-sm p-6 space-y-5">
          <p className="text-sm text-gray-600">
            Configura los parámetros de la nueva temporada. Cuando confirmes en el paso siguiente,
            se eliminarán todos los pagos y gastos registrados. <strong>Los pioneros se conservan.</strong>
          </p>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Año</label>
            <input type="number" value={form.año} onChange={e => set('año', parseInt(e.target.value))}
              className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Mes de inicio</label>
              <select value={form.mes_inicio} onChange={e => set('mes_inicio', parseInt(e.target.value))}
                className="w-full border rounded-lg px-3 py-2 text-sm">
                {MESES.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Mes de fin</label>
              <select value={form.mes_fin} onChange={e => set('mes_fin', parseInt(e.target.value))}
                className="w-full border rounded-lg px-3 py-2 text-sm">
                {MESES.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Costo inscripción anual ($)</label>
            <input type="number" value={form.cuota_inscripcion} onChange={e => set('cuota_inscripcion', e.target.value)}
              placeholder="ej: 5000" className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Cuota → abono ($)</label>
              <input type="number" value={form.cuota_monto_abono} onChange={e => set('cuota_monto_abono', e.target.value)}
                placeholder="ej: 10000" className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Cuota → unidad ($)</label>
              <input type="number" value={form.cuota_monto_unidad} onChange={e => set('cuota_monto_unidad', e.target.value)}
                placeholder="ej: 5000" className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>

          <button
            onClick={() => setPaso(2)}
            disabled={!form.cuota_inscripcion || !form.cuota_monto_abono || !form.cuota_monto_unidad}
            className="w-full bg-violet-700 text-white py-2 rounded-lg text-sm font-semibold hover:bg-violet-800 disabled:opacity-40">
            Continuar →
          </button>
        </div>
      )}

      {paso === 2 && (
        <div className="bg-white rounded-xl border shadow-sm p-6 space-y-5">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700 space-y-1">
            <p className="font-bold">⚠️ Atención: esta acción no se puede deshacer</p>
            <p>Se eliminarán permanentemente todos los pagos e inscripciones registrados. Los pioneros se conservarán.</p>
          </div>

          <div className="text-sm space-y-2 text-gray-700">
            <p><strong>Año:</strong> {form.año}</p>
            <p><strong>Temporada:</strong> {MESES.find(m => m.v === form.mes_inicio)?.l} – {MESES.find(m => m.v === form.mes_fin)?.l}</p>
            <p><strong>Inscripción:</strong> ${Number(form.cuota_inscripcion).toLocaleString('es-CL')}</p>
            <p><strong>Cuota mensual:</strong> ${Number(form.cuota_monto_abono).toLocaleString('es-CL')} abono + ${Number(form.cuota_monto_unidad).toLocaleString('es-CL')} unidad</p>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setPaso(1)}
              className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">
              ← Volver
            </button>
            <button onClick={confirmar} disabled={loading}
              className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50">
              {loading ? 'Procesando...' : 'Confirmar y resetear datos'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
