'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NuevoPionero() {
  const router = useRouter();
  const [form, setForm] = useState({ nombre: '', apellido: '', seccion: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sección</label>
          <input
            type="text" placeholder="Ej: Lobatos, Pioneros, Rovers..."
            value={form.seccion}
            onChange={e => setForm(f => ({ ...f, seccion: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
          />
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
