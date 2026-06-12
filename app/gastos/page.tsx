'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Scout { id: number; nombre: string; apellido: string; }
interface Item { tipo: 'unidad' | 'abono' | 'inscripcion'; scout_id: string; monto: string; }

const TIPOS = [
  { value: 'unidad', label: '🏕 Fondo Unidad', needsScout: false },
  { value: 'abono', label: '👤 Abono scout', needsScout: true },
  { value: 'inscripcion', label: '🪪 Inscripción scout', needsScout: true },
];

function fmt(n: number) {
  return n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
}

function emptyItem(): Item { return { tipo: 'unidad', scout_id: '', monto: '' }; }

export default function GastosPage() {
  const router = useRouter();
  const [scouts, setScouts] = useState<Scout[]>([]);
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [descripcion, setDescripcion] = useState('');
  const [items, setItems] = useState<Item[]>([emptyItem()]);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/scouts').then(r => r.json()).then(d => setScouts(d.scouts));
  }, []);

  const updateItem = (i: number, patch: Partial<Item>) =>
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, ...patch } : it));

  const total = items.reduce((s, it) => s + (parseFloat(it.monto) || 0), 0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const parsed = items.map(it => ({
      tipo: it.tipo,
      scout_id: it.scout_id ? parseInt(it.scout_id) : null,
      monto: parseFloat(it.monto),
    }));

    const fd = new FormData();
    fd.append('fecha', fecha);
    fd.append('descripcion', descripcion);
    fd.append('items', JSON.stringify(parsed));
    if (file) fd.append('comprobante', file);

    const res = await fetch('/api/gastos', { method: 'POST', body: fd });
    if (res.ok) {
      router.push('/gastos/historial');
    } else {
      const d = await res.json();
      setError(d.error ?? 'Error al guardar');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Registrar Gasto</h1>

      <form onSubmit={submit} className="bg-white rounded-xl border shadow-sm p-6 space-y-5">
        {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded p-2">{error}</p>}

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
              placeholder="Materiales, actividad..."
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600" />
          </div>
        </div>

        {/* Ítems del gasto */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">Desglose del gasto *</label>
            <button type="button" onClick={() => setItems(p => [...p, emptyItem()])}
              className="text-xs text-violet-700 hover:underline">+ Agregar línea</button>
          </div>

          <div className="space-y-2">
            {items.map((item, i) => {
              const needsScout = TIPOS.find(t => t.value === item.tipo)?.needsScout;
              return (
                <div key={i} className="flex gap-2 items-start">
                  <select value={item.tipo}
                    onChange={e => updateItem(i, { tipo: e.target.value as Item['tipo'], scout_id: '' })}
                    className="border rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600 flex-shrink-0">
                    {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>

                  {needsScout ? (
                    <select required value={item.scout_id}
                      onChange={e => updateItem(i, { scout_id: e.target.value })}
                      className="border rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600 flex-1 min-w-0">
                      <option value="">Scout...</option>
                      {scouts.map(s => (
                        <option key={s.id} value={s.id}>{s.apellido}, {s.nombre}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex-1 border rounded-lg px-2 py-2 text-sm bg-gray-50 text-gray-400 min-w-0">
                      Fondo general
                    </div>
                  )}

                  <input type="number" required min="1" placeholder="Monto" value={item.monto}
                    onChange={e => updateItem(i, { monto: e.target.value })}
                    className="border rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600 w-28 flex-shrink-0" />

                  {items.length > 1 && (
                    <button type="button" onClick={() => setItems(p => p.filter((_, idx) => idx !== i))}
                      className="text-red-400 hover:text-red-600 text-lg leading-none pt-1.5 flex-shrink-0">×</button>
                  )}
                </div>
              );
            })}
          </div>

          {total > 0 && (
            <p className="text-right text-sm font-semibold text-gray-700 mt-2">
              Total: {fmt(total)}
            </p>
          )}
        </div>

        {/* Comprobante */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Comprobante (imagen o PDF)</label>
          <input type="file" accept="image/*,.pdf"
            onChange={e => setFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100" />
          {file && <p className="text-xs text-gray-500 mt-1">Seleccionado: {file.name}</p>}
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="flex-1 bg-red-700 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-800 disabled:opacity-50">
            {loading ? 'Guardando...' : 'Registrar Gasto'}
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
