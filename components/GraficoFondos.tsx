'use client';
import { useEffect, useState } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from 'recharts';

interface Punto {
  mes: string;
  label: string;
  unidad: number;
  abonos: number;
  inscripcion: number;
}

function fmtCLP(n: number) {
  return n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--color-background-primary, #fff)',
      border: '0.5px solid #d1d5db',
      borderRadius: 8,
      padding: '10px 14px',
      fontSize: 13,
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    }}>
      <p style={{ fontWeight: 500, marginBottom: 6, color: 'var(--color-text-primary, #111)' }}>{label}</p>
      {payload.map((p: { name: string; value: number; color: string }) => (
        <p key={p.name} style={{ color: p.color, margin: '2px 0' }}>
          {p.name}: <strong>{fmtCLP(p.value)}</strong>
        </p>
      ))}
    </div>
  );
}

export default function GraficoFondos() {
  const [puntos, setPuntos] = useState<Punto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/grafico')
      .then(r => r.json())
      .then(d => { setPuntos(d.puntos); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border shadow-sm p-5 h-64 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Cargando gráfico...</p>
      </div>
    );
  }

  if (puntos.length === 0) {
    return (
      <div className="bg-white rounded-xl border shadow-sm p-5 h-48 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Sin datos aún — registra pagos para ver la evolución de los fondos.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border shadow-sm p-5">
      <h2 className="font-semibold text-gray-700 mb-4">Evolución de fondos</h2>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={puntos} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="gradUnidad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#16a34a" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradAbonos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradInscripcion" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#9333ea" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#9333ea" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={v => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
          />
          <Area
            type="monotone"
            dataKey="unidad"
            name="Fondo Unidad"
            stroke="#16a34a"
            strokeWidth={2}
            fill="url(#gradUnidad)"
            dot={puntos.length <= 6 ? { r: 3, fill: '#16a34a' } : false}
            activeDot={{ r: 5 }}
          />
          <Area
            type="monotone"
            dataKey="abonos"
            name="Fondo Abonos"
            stroke="#2563eb"
            strokeWidth={2}
            fill="url(#gradAbonos)"
            dot={puntos.length <= 6 ? { r: 3, fill: '#2563eb' } : false}
            activeDot={{ r: 5 }}
          />
          <Area
            type="monotone"
            dataKey="inscripcion"
            name="Fondo Inscripciones"
            stroke="#9333ea"
            strokeWidth={2}
            fill="url(#gradInscripcion)"
            dot={puntos.length <= 6 ? { r: 3, fill: '#9333ea' } : false}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
