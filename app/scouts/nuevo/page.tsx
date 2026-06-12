'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

function calcularEdad(fecha: string): string {
  if (!fecha) return '';
  const hoy = new Date();
  const nac = new Date(fecha);
  let años = hoy.getFullYear() - nac.getFullYear();
  let meses = hoy.getMonth() - nac.getMonth();
  if (meses < 0 || (meses === 0 && hoy.getDate() < nac.getDate())) {
    años--;
    meses += 12;
  }
  if (hoy.getDate() < nac.getDate()) {
    meses--;
    if (meses < 0) meses += 12;
  }
  if (años < 0) return '';
  return meses > 0 ? `${años} años y ${meses} meses` : `${años} años`;
}

export default function NuevoPionero() {
  const router = useRouter();
  const [form, setForm] = useState({ nombre: '', apellido: '', fecha_nacimiento: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const edad = calcularEdad(form.fecha_nacimiento);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/scouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      router.push('/scouts');
    } else {
      const d = await res.json();
      setError(d.error ?? 'Error al guardar');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Agregar Pionero</h1>
      <form onSubmit={submit} className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input
              type="text" required value={form.nombre}
              onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Apellido *</label>
            <input
              type="text" required value={form.apellido}
              onChange={e => setForm(f => ({ ...f, apellido: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de nacimiento</label>
          <input
            type="date" value={form.fecha_nacimiento}
            onChange={e => setForm(f => ({ ...f, fecha_nacimiento: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
          />
          {edad && (
            <p className="text-xs text-violet-700 font-medium mt-1">{edad}</p>
          )}
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="flex-1 bg-violet-700 text-white py-2 rounded-lg text-sm font-medium hover:bg-violet-800 disabled:opacity-50">
            {loading ? 'Guardando...' : 'Guardar Pionero'}
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
