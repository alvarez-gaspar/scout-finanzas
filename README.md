# Pioneros Finanzas

Aplicación web para gestionar las finanzas de una avanzada scout. Registra pagos y gastos, divide el dinero en tres fondos separados, sube comprobantes y visualiza en tiempo real el estado financiero de cada pionero y de la unidad.

## Funcionalidades

### Gestión de pioneros
- Registro de jóvenes con nombre, apellido y fecha de nacimiento
- Edad calculada automáticamente en años y meses
- Perfil individual con historial de pagos, saldo de abono y estado de inscripción

### Ingresos
- **Cuota mensual** — se divide automáticamente entre el fondo de abono del joven y el fondo de la unidad (montos en pesos, configurables)
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
- **Seguimiento de cuotas por temporada (abril–noviembre):** quién está al día y cuántos meses debe cada uno
- Estado de inscripciones: sin pagar / pagaron / formalizados

### Exportación
- Descarga en CSV de la lista de pioneros con saldos y edades
- Descarga en CSV del historial de pagos
- Descarga en CSV del historial de gastos

### Configuración
- Monto que va al abono del pionero por cada cuota (ej: $10.000)
- Monto que va al fondo de la unidad por cada cuota (ej: $5.000)
- Costo de inscripción requerido por pionero

## Arranque rápido

Doble clic sobre `iniciar.command` en Finder. Abre el servidor y lanza el navegador automáticamente.

La primera vez que se abre, macOS puede pedir permiso: clic derecho → Abrir → Abrir.

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

## Notas de uso

- **Los datos persisten** entre sesiones. Cerrar la terminal detiene el servidor pero no borra nada.
- **Cuotas:** se cobran de abril a noviembre, vencen el último día de cada mes. El dashboard muestra automáticamente quién está atrasado según la fecha actual.
- **Inscripciones:** el flujo es primero registrar el pago del joven (ingreso), y luego formalizar la inscripción ante la asociación (egreso) desde la sección Inscripciones, donde un solo comprobante puede cubrir varios pioneros.

## Estructura

```
app/
  page.tsx               # Dashboard principal
  scouts/                # Lista y detalle de pioneros
  pagos/                 # Formulario de ingresos
  gastos/                # Formulario e historial de egresos
  inscripciones/         # Formalización en lote de inscripciones
  config/                # Configuración de montos
  api/
    dashboard/           # Saldos en tiempo real + cuotas vencidas por temporada
    scouts/              # CRUD pioneros
    pagos/               # Registro de ingresos + comprobantes
    gastos/              # Registro de egresos
    grafico/             # Datos históricos para el gráfico
    export/              # Exportación CSV (scouts, pagos, gastos)
    config/              # Lectura y escritura de configuración
lib/
  db.ts                  # Conexión SQLite, esquema de tablas y migraciones
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
