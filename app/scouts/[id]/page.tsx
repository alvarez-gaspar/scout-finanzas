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

interface ScoutData {
  nombre: string;
  apellido: string;
  fecha_nacimiento: string | null;
  etapa: string | null;
  comunidad: string | null;
  formalizado: number;
  cuotas_pagadas: number;
  cuotas_debidas: number;
}

function fmt(n: number) {
  return n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
}

function calcularEdad(fecha: string | null): string {
  if (!fecha) return '';
  const hoy = new Date();
  const nac = new Date(fecha);
  let años = hoy.getFullYear() - nac.getFullYear();
  let meses = hoy.getMonth() - nac.getMonth();
  if (meses < 0 || (meses === 0 && hoy.getDate() < nac.getDate())) { años--; meses += 12; }
  if (hoy.getDate() < nac.getDate()) { meses--; if (meses < 0) meses += 12; }
  if (años < 0) return '';
  return meses > 0 ? `${años} años y ${meses} meses` : `${años} años`;
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
  const [scout, setScout] = useState<ScoutData | null>(null);
  const [config, setConfig] = useState<Record<string, number>>({});
  const [confirmandoBaja, setConfirmandoBaja] = useState(false);
  const [bajando, setBajando] = useState(false);
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState({ nombre: '', apellido: '', fecha_nacimiento: '', etapa: '', comunidad: '' });

  function cargarDatos() {
    fetch('/api/dashboard').then(r => r.json()).then(d => {
      const s = d.scouts.find((x: { id: number }) => x.id === parseInt(id));
      if (s) {
        setScout(s);
        setForm({
          nombre: s.nombre ?? '',
          apellido: s.apellido ?? '',
          fecha_nacimiento: s.fecha_nacimiento ?? '',
          etapa: s.etapa ?? '',
          comunidad: s.comunidad ?? '',
        });
      }
      setConfig(d.config);
    });
    fetch(`/api/scouts/${id}/pagos`).then(r => r.json()).then(setPagos);
  }

  useEffect(() => { cargarDatos(); }, [id]);

  async function guardarEdicion(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    const res = await fetch(`/api/scouts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      await cargarDatos();
      setEditando(false);
    } else {
      alert('Error al guardar. Intenta de nuevo.');
    }
    setGuardando(false);
  }

  async function darDeBaja() {
    setBajando(true);
    const res = await fetch(`/api/scouts/${id}`, { method: 'DELETE' });
    if (res.ok) {
      router.push('/scouts');
    } else {
      alert('Error al dar de baja. Intenta de nuevo.');
      setBajando(false);
      setConfirmandoBaja(false);
    }
  }

  if (!scout) return <p className="text-gray-500">Cargando...</p>;

  const totalInscripcion = pagos.filter(p => p.tipo === 'inscripcion').reduce((a, p) => a + p.monto, 0);
  const totalCuotas = pagos.filter(p => p.tipo === 'cuota').reduce((a, p) => a + p.monto, 0);
  const montoAbono = config.cuota_monto_abono ?? 10000;
  const montoUnidad = config.cuota_monto_unidad ?? 5000;
  const ratioAbono = (montoAbono + montoUnidad) > 0 ? montoAbono / (montoAbono + montoUnidad) : 0;
  const saldoAbono = totalCuotas * ratioAbono;
  const pagaInscripcion = totalInscripcion >= (config.cuota_inscripcion ?? 5000);
  const formalizado = !!scout.formalizado;
  const cuotasAtrasadas = Math.max(0, (scout.cuotas_debidas ?? 0) - (scout.cuotas_pagadas ?? 0));
  const edad = calcularEdad(scout.fecha_nacimiento);

  return (
    <div className="space-y-6 max-w-2xl">
      <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-800">← Volver</button>

      {/* Encabezado */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{scout.apellido}, {scout.nombre}</h1>
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
            {edad && <p className="text-gray-500 text-sm">{edad}</p>}
            {scout.etapa && <p className="text-sm text-violet-700 font-medium">{scout.etapa}</p>}
            {scout.comunidad && <p className="text-sm text-gray-500">Comunidad {scout.comunidad}</p>}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <button onClick={() => setEditando(true)}
            className="border border-violet-300 text-violet-700 px-4 py-2 rounded-lg text-sm hover:bg-violet-50">
            Editar datos
          </button>
          <Link href={`/pagos?scout=${id}`}
            className="bg-violet-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-violet-800">
            + Registrar Pago
          </Link>
          <button onClick={() => setConfirmandoBaja(true)}
            className="border border-red-300 text-red-600 px-4 py-2 rounded-lg text-sm hover:bg-red-50">
            Dar de baja
          </button>
        </div>
      </div>

      {/* Tarjetas de estado */}
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

      {/* Modal edición */}
      {editando && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full mx-4">
            <h2 className="font-bold text-gray-800 text-lg mb-4">Editar datos del pionero</h2>
            <form onSubmit={guardarEdicion} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Nombre</label>
                  <input required value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Apellido</label>
                  <input required value={form.apellido} onChange={e => setForm(f => ({ ...f, apellido: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Fecha de nacimiento</label>
                <input type="date" value={form.fecha_nacimiento} onChange={e => setForm(f => ({ ...f, fecha_nacimiento: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Etapa</label>
                  <input value={form.etapa} onChange={e => setForm(f => ({ ...f, etapa: e.target.value }))}
                    placeholder="ej: Pionero I" className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Comunidad</label>
                  <input value={form.comunidad} onChange={e => setForm(f => ({ ...f, comunidad: e.target.value }))}
                    placeholder="ej: Los Cóndores" className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setEditando(false)} disabled={guardando}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={guardando}
                  className="flex-1 bg-violet-700 text-white py-2 rounded-lg text-sm font-semibold hover:bg-violet-800 disabled:opacity-50">
                  {guardando ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal baja */}
      {confirmandoBaja && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full mx-4 space-y-4">
            <h2 className="font-bold text-gray-800 text-lg">¿Dar de baja a {scout.nombre}?</h2>
            <p className="text-sm text-gray-600">
              Todo el dinero que tiene acumulado —abono
              {!scout.formalizado ? ' e inscripción' : ''}— pasará al fondo de uso libre de la unidad.
              Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmandoBaja(false)} disabled={bajando}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={darDeBaja} disabled={bajando}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50">
                {bajando ? 'Procesando...' : 'Confirmar baja'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Historial */}
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
