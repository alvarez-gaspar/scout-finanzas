'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Scout {
  id: number;
  nombre: string;
  apellido: string;
  pagado_inscripcion: number;
  formalizado: number;
}

function fmt(n: number) {
  return n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
}

export default function InscripcionesPage() {
  const router = useRouter();
  const [scouts, setScouts] = useState<Scout[]>([]);
  const [config, setConfig] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [descripcion, setDescripcion] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(d => {
      setScouts(d.scouts);
      setConfig(d.config);
    });
  }, []);

  const toggle = (id: number) =>
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const pendientes = scouts.filter(s => !s.formalizado);
  const cuotaInscripcion = config.cuota_inscripcion ?? 5000;
  const totalGasto = selected.size * cuotaInscripcion;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selected.size === 0) { setError('Selecciona al menos un scout'); return; }
    setError('');
    setLoading(true);

    const items = Array.from(selected).map(scout_id => ({
      tipo: 'inscripcion',
      scout_id,
      monto: cuotaInscripcion,
    }));

    const fd = new FormData();
    fd.append('fecha', fecha);
    fd.append('descripcion', descripcion || `Inscripción ${selected.size} scout(s)`);
    fd.append('items', JSON.stringify(items));
    if (file) fd.append('comprobante', file);

    const res = await fetch('/api/gastos', { method: 'POST', body: fd });
    if (res.ok) {
      router.push('/');
    } else {
      const d = await res.json();
      setError(d.error ?? 'Error al guardar');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Formalizar Inscripciones</h1>
      <p className="text-sm text-gray-500">
        Registra el gasto de inscripción ante la asociación. Un solo comprobante puede cubrir múltiples scouts.
        Cada scout descuenta {fmt(cuotaInscripcion)} de su fondo de inscripción.
      </p>

      <form onSubmit={submit} className="bg-white rounded-xl border shadow-sm p-6 space-y-5">
        {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded p-2">{error}</p>}

        {/* Selección de scouts */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Scouts a inscribir ({selected.size} seleccionados)
          </label>
          {pendientes.length === 0 ? (
            <p className="text-gray-400 text-sm py-4 text-center">Todos los scouts ya están formalizados.</p>
          ) : (
            <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
              {pendientes.map(s => {
                const tieneFondos = s.pagado_inscripcion >= cuotaInscripcion;
                return (
                  <label key={s.id}
                    className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-50 ${!tieneFondos ? 'opacity-60' : ''}`}>
                    <input type="checkbox" checked={selected.has(s.id)}
                      onChange={() => toggle(s.id)}
                      className="rounded border-gray-300 text-violet-700 focus:ring-violet-600" />
                    <span className="flex-1 text-sm font-medium">{s.apellido}, {s.nombre}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${tieneFondos ? 'bg-violet-100 text-violet-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {tieneFondos ? `Pagó ${fmt(s.pagado_inscripcion)}` : `Faltan fondos (${fmt(s.pagado_inscripcion)})`}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
          {scouts.filter(s => s.formalizado).length > 0 && (
            <p className="text-xs text-gray-400 mt-1">
              {scouts.filter(s => s.formalizado).length} scout(s) ya formalizados no aparecen en la lista.
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
            <input type="date" required value={fecha}
              onChange={e => setFecha(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <input type="text" value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              placeholder="Inscripción 2025..."
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Comprobante de transferencia</label>
          <input type="file" accept="image/*,.pdf"
            onChange={e => setFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100" />
          {file && <p className="text-xs text-gray-500 mt-1">{file.name}</p>}
        </div>

        {selected.size > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
            Se registrará un gasto de <strong>{fmt(totalGasto)}</strong> ({selected.size} × {fmt(cuotaInscripcion)})
            descontado del fondo de inscripciones.
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <button type="submit" disabled={loading || selected.size === 0}
            className="flex-1 bg-violet-700 text-white py-2 rounded-lg text-sm font-medium hover:bg-violet-800 disabled:opacity-50">
            {loading ? 'Guardando...' : `Formalizar ${selected.size > 0 ? selected.size : ''} inscripción${selected.size !== 1 ? 'es' : ''}`}
          </button>
          <button type="button" onClick={() => router.back()}
            className="flex-1 border text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
