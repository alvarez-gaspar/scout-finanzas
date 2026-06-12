'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

interface Scout {
  id: number;
  nombre: string;
  apellido: string;
}

function RegistrarPagoForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselect = searchParams.get('scout');

  const [scouts, setScouts] = useState<Scout[]>([]);
  const [form, setForm] = useState({
    scout_id: preselect ?? '',
    tipo: 'cuota',
    monto: '',
    fecha: new Date().toISOString().slice(0, 10),
    descripcion: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetch('/api/scouts').then(r => r.json()).then(d => setScouts(d.scouts));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const fd = new FormData();
    fd.append('scout_id', form.scout_id);
    fd.append('tipo', form.tipo);
    fd.append('monto', form.monto);
    fd.append('fecha', form.fecha);
    fd.append('descripcion', form.descripcion);
    if (file) fd.append('comprobante', file);

    const res = await fetch('/api/pagos', { method: 'POST', body: fd });
    if (res.ok) {
      setSuccess('Pago registrado correctamente ✓');
      setForm(f => ({ ...f, monto: '', descripcion: '' }));
      setFile(null);
      setTimeout(() => router.push('/'), 1500);
    } else {
      const d = await res.json();
      setError(d.error ?? 'Error al guardar');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Registrar Pago</h1>

      <form onSubmit={submit} className="bg-white rounded-xl border shadow-sm p-6 space-y-5">
        {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded p-2">{error}</p>}
        {success && <p className="text-violet-700 text-sm bg-violet-50 border border-green-200 rounded p-2">{success}</p>}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Scout *</label>
          <select required value={form.scout_id}
            onChange={e => setForm(f => ({ ...f, scout_id: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600">
            <option value="">Seleccionar scout...</option>
            {scouts.map(s => (
              <option key={s.id} value={s.id}>{s.apellido}, {s.nombre}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de pago *</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'inscripcion', label: '🪪 Inscripción', desc: '100% al fondo inscripción' },
              { value: 'cuota', label: '📅 Cuota mensual', desc: 'Se divide abono / unidad' },
              { value: 'unidad', label: '🏕 Unidad', desc: '100% gastos unidad' },
            ].map(opt => (
              <button key={opt.value} type="button"
                onClick={() => setForm(f => ({ ...f, tipo: opt.value }))}
                className={`border rounded-lg p-3 text-left text-xs transition-colors ${
                  form.tipo === opt.value
                    ? 'border-violet-600 bg-violet-50 text-violet-800'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}>
                <span className="font-semibold block mb-0.5">{opt.label}</span>
                <span className="text-gray-400">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monto (CLP) *</label>
            <input type="number" required min="1" value={form.monto}
              onChange={e => setForm(f => ({ ...f, monto: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
              placeholder="0" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
            <input type="date" required value={form.fecha}
              onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
          <input type="text" value={form.descripcion}
            onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
            placeholder="Cuota junio, etc." />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Comprobante (imagen o PDF)</label>
          <input type="file" accept="image/*,.pdf"
            onChange={e => setFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100" />
          {file && <p className="text-xs text-gray-500 mt-1">Seleccionado: {file.name}</p>}
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="flex-1 bg-violet-700 text-white py-2 rounded-lg text-sm font-medium hover:bg-violet-800 disabled:opacity-50">
            {loading ? 'Guardando...' : 'Registrar Pago'}
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

export default function PagosPage() {
  return (
    <Suspense>
      <RegistrarPagoForm />
    </Suspense>
  );
}
