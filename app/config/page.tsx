'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Config {
  cuota_monto_abono: string;
  cuota_monto_unidad: string;
  cuota_inscripcion: string;
}

function fmt(n: number) {
  return n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
}

export default function ConfigPage() {
  const [cfg, setCfg] = useState<Config>({ cuota_monto_abono: '', cuota_monto_unidad: '', cuota_inscripcion: '' });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/config').then(r => r.json()).then(setCfg);
  }, []);

  const totalCuota = (parseInt(cfg.cuota_monto_abono) || 0) + (parseInt(cfg.cuota_monto_unidad) || 0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    await fetch('/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cfg),
    });
    setSaved(true);
    setLoading(false);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Configuración</h1>

      <form onSubmit={submit} className="bg-white rounded-xl border shadow-sm p-6 space-y-6">

        {/* Distribución de cuotas */}
        <div>
          <h2 className="font-semibold text-gray-700 mb-1">Distribución de cuotas mensuales</h2>
          <p className="text-xs text-gray-500 mb-4">
            Define cuánto de cada cuota va al abono del joven y cuánto al fondo de la unidad.
            La suma es el valor total de la cuota mensual.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Abono por cuota (CLP)
              </label>
              <input
                type="number" min="0" required
                value={cfg.cuota_monto_abono}
                onChange={e => setCfg(c => ({ ...c, cuota_monto_abono: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unidad por cuota (CLP)
              </label>
              <input
                type="number" min="0" required
                value={cfg.cuota_monto_unidad}
                onChange={e => setCfg(c => ({ ...c, cuota_monto_unidad: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
              />
            </div>
          </div>

          {totalCuota > 0 && (
            <div className="mt-3 bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
              <span className="font-medium">Cuota total:</span> {fmt(totalCuota)}
              {' · '}
              <span className="text-blue-700">{fmt(parseInt(cfg.cuota_monto_abono) || 0)} al abono</span>
              {' + '}
              <span className="text-violet-700">{fmt(parseInt(cfg.cuota_monto_unidad) || 0)} a la unidad</span>
            </div>
          )}
        </div>

        {/* Inscripción */}
        <div>
          <h2 className="font-semibold text-gray-700 mb-1">Monto de inscripción</h2>
          <p className="text-xs text-gray-500 mb-3">
            Monto mínimo que debe pagar un joven para considerarse inscrito.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Costo inscripción (CLP)</label>
            <input
              type="number" min="0" required
              value={cfg.cuota_inscripcion}
              onChange={e => setCfg(c => ({ ...c, cuota_inscripcion: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
            />
          </div>
        </div>

        <button
          type="submit" disabled={loading}
          className="w-full bg-violet-700 text-white py-2 rounded-lg text-sm font-medium hover:bg-violet-800 disabled:opacity-50"
        >
          {loading ? 'Guardando...' : 'Guardar configuración'}
        </button>

        {saved && (
          <p className="text-center text-violet-700 text-sm font-medium">✓ Configuración guardada</p>
        )}
      </form>

      <div className="bg-white rounded-xl border shadow-sm p-6">
        <h2 className="font-semibold text-gray-700 mb-1">Nuevo año</h2>
        <p className="text-xs text-gray-500 mb-4">
          Reinicia los datos financieros para comenzar una nueva temporada. Los pioneros se conservan.
        </p>
        <Link href="/nuevo-ano"
          className="inline-block w-full text-center border border-red-300 text-red-600 py-2 rounded-lg text-sm font-medium hover:bg-red-50">
          Iniciar nuevo año →
        </Link>
      </div>
    </div>
  );
}
