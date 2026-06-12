'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: '📊 Dashboard' },
  { href: '/scouts', label: '👥 Pioneros' },
  { href: '/pagos', label: '💳 Registrar Pago' },
  { href: '/gastos', label: '💸 Registrar Gasto' },
  { href: '/gastos/historial', label: '📋 Gastos' },
  { href: '/inscripciones', label: '🪪 Inscripciones' },
  { href: '/config', label: '⚙️ Config' },
];

export default function Nav() {
  const path = usePathname();
  return (
    <nav className="bg-violet-800 text-white px-6 py-3 flex items-center gap-6 shadow-md">
      <span className="font-bold text-lg mr-4">⚜️ Pioneros Finanzas</span>
      {links.map(l => (
        <Link
          key={l.href}
          href={l.href}
          className={`text-sm font-medium hover:text-violet-200 transition-colors ${path === l.href ? 'underline underline-offset-4' : ''}`}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
