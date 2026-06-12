# Scout Finanzas

Aplicación web para gestionar las finanzas de una unidad scout. Permite registrar pagos de los jóvenes, subir comprobantes, dividir el dinero en fondos separados y visualizar en tiempo real cuánto hay en cada cuenta.

## Funcionalidades

### Gestión de scouts
- Registro de jóvenes con nombre, apellido y sección
- Perfil individual con historial de pagos y saldo de abono

### Ingresos
- **Cuota mensual** — se divide automáticamente entre el fondo de abono del joven y el fondo de la unidad (montos configurables)
- **Inscripción** — va 100% al fondo de inscripción del joven
- **Pago directo a la unidad** — va 100% al fondo de gastos libres

### Egresos
- Registro de gastos con comprobante adjunto (imagen o PDF)
- Un solo comprobante puede cubrir múltiples líneas: fondo unidad, abono de un scout, o inscripción
- **Formalización de inscripciones** — un solo comprobante para inscribir varios jóvenes a la vez

### Dashboard en vivo
- Saldo del fondo de gastos libres de la unidad
- Saldo acumulado de abonos (suma de todos los scouts)
- Saldo del fondo de inscripciones
- Estado por scout: sin pagar / pagó / formalizado ante la asociación

### Configuración
- Monto de abono por cuota (ej: $10.000)
- Monto para la unidad por cuota (ej: $5.000)
- Costo de inscripción requerido

## Requisitos

- Node.js 18+
- npm

## Instalación

```bash
# Clonar el repositorio
git clone <url-del-repo>
cd scout-finanzas

# Instalar dependencias
npm install
npm approve-scripts better-sqlite3
```

## Uso

```bash
# Modo desarrollo
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

La base de datos SQLite se crea automáticamente en `data/scout.db` al iniciar por primera vez. Los comprobantes subidos quedan en `public/uploads/`.

## Estructura

```
app/
  page.tsx               # Dashboard principal
  scouts/                # Lista y detalle de scouts
  pagos/                 # Formulario de ingresos
  gastos/                # Formulario e historial de egresos
  inscripciones/         # Formalización batch de inscripciones
  config/                # Configuración de montos
  api/                   # API routes (Next.js)
lib/
  db.ts                  # Conexión y esquema SQLite
components/
  Nav.tsx                # Navegación
data/
  scout.db               # Base de datos (generada automáticamente)
```

## Stack

- [Next.js 16](https://nextjs.org/) — framework fullstack
- [Tailwind CSS](https://tailwindcss.com/) — estilos
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) — base de datos local
