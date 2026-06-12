# Pioneros Finanzas

Aplicación web para gestionar las finanzas de una unidad scout. Registra pagos y gastos, divide el dinero en fondos separados, sube comprobantes y visualiza en tiempo real el estado de cada pionero y de la unidad.

## Funcionalidades

### Gestión de pioneros
- Registro de jóvenes con nombre, apellido y sección
- Perfil individual con historial de pagos, saldo de abono y estado de inscripción
- Seguimiento de cuotas al día / atrasadas por pionero

### Ingresos
- **Cuota mensual** — se divide automáticamente entre el fondo de abono del joven y el fondo de la unidad (montos configurables en pesos)
- **Inscripción** — va 100% al fondo de inscripción del joven
- **Pago directo a la unidad** — va 100% al fondo de gastos libres
- Cada pago admite un comprobante adjunto (imagen o PDF)

### Egresos
- Registro de gastos con comprobante adjunto
- Un solo comprobante puede cubrir múltiples líneas: fondo unidad, abono de un pionero, o inscripción
- **Formalización de inscripciones en lote** — un solo comprobante para inscribir varios jóvenes a la vez ante la asociación

### Dashboard en vivo
- Saldo del fondo de gastos libres de la unidad
- Saldo acumulado de abonos (suma de todos los pioneros, descontados egresos)
- Saldo del fondo de inscripciones (descontadas formalizaciones)
- Gráfico de evolución temporal de los tres fondos mes a mes
- Estado de cuotas por temporada (abril–noviembre): quién está al día y quién tiene cuotas vencidas
- Estado de inscripciones: sin pagar / pagaron / formalizados

### Exportación
- Descarga en CSV de la lista de pioneros con saldos
- Descarga en CSV del historial de pagos
- Descarga en CSV del historial de gastos

### Configuración
- Monto que va al abono del pionero por cada cuota (ej: $10.000)
- Monto que va al fondo de la unidad por cada cuota (ej: $5.000)
- Costo de inscripción requerido por pionero

## Arranque rápido

Doble clic sobre `iniciar.command` en Finder. Abre el servidor y lanza el navegador automáticamente.

## Instalación manual

**Requisitos:** Node.js 18+ y npm.

```bash
git clone https://github.com/alvarez-gaspar/scout-finanzas
cd scout-finanzas

npm install
npm approve-scripts better-sqlite3

npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

La base de datos SQLite se crea sola en `data/scout.db` la primera vez. Los comprobantes subidos se guardan en `public/uploads/`. Ambas carpetas están en `.gitignore` — los datos nunca se suben al repositorio.

## Estructura

```
app/
  page.tsx               # Dashboard principal
  scouts/                # Lista y detalle de pioneros
  pagos/                 # Formulario de ingresos
  gastos/                # Formulario e historial de egresos
  inscripciones/         # Formalización en lote de inscripciones
  config/                # Configuración de montos
  api/                   # API routes (Next.js App Router)
    dashboard/           # Datos del dashboard + cálculo de cuotas vencidas
    scouts/              # CRUD pioneros
    pagos/               # Registro de ingresos + subida de comprobantes
    gastos/              # Registro de egresos
    grafico/             # Datos históricos para el gráfico
    export/              # Exportación CSV
    config/              # Configuración de montos
lib/
  db.ts                  # Conexión SQLite y esquema de tablas
  csv.ts                 # Generador de archivos CSV
components/
  Nav.tsx                # Navegación principal
  GraficoFondos.tsx      # Gráfico de evolución (Recharts)
  ExportButton.tsx       # Botón de descarga CSV
iniciar.command          # Script de arranque con doble clic (macOS)
```

## Stack

- [Next.js 16](https://nextjs.org/) — framework fullstack (App Router)
- [Tailwind CSS](https://tailwindcss.com/) — estilos
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) — base de datos local
- [Recharts](https://recharts.org/) — gráfico de evolución temporal
