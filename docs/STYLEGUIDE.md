# Cuerámaro Prime POS Style Guide

## Identidad Visual

- **Tipografía base:** Inter / Poppins
- **Colores**
  - Primario: `#006AD4`
  - Secundario: `#FF6F00`
  - Blanco: `#FFFFFF`
  - Gris claro: `#F8F8F8`
  - Texto primario: `#1E1E1E`

## Componentes UI

- **Header:** Logo símbolo, mensaje de bienvenida y badge de sincronización.
- **Sidebar:** Navegación con iconografía Lucide, botones redondeados y estados activos en blanco.
- **Dashboard:** Tarjetas KPI 3D, sección de módulos en cuadrícula responsive, fondo degradado azul-naranja con imagen `fondo-carnes-cueramaro.png`.

## Assets

Colocar los siguientes archivos en `docs/ASSETS/` y `frontend/src/assets/`:

- `CUERAMARO-CARNES-LOGO-COMPLETO-sin-fondo.png`
- `CUERAMARO-CARNES-LOGO-SIMBOLO-sin-fondo.png`
- `fondo-carnes-cueramaro.png`

> **Nota:** Debido a restricciones del repositorio, los binarios no se incluyen. Copiarlos manualmente antes del despliegue. El frontend incluye placeholders (`logo-placeholder.svg`, `dashboard-bg.svg`) que deben sustituirse por los assets oficiales para producción.

## Uso de Tipografía

- Títulos: peso 700 (bold)
- Subtítulos: peso 600
- Texto cuerpo: peso 400

## Layout Responsive

- Escritorio: sidebar fija y contenido principal con tarjetas.
- Tablets: sidebar colapsable, grid de módulos 2x3.
- Móvil: navegación superior tipo icon-bar (pendiente de implementar) y tarjetas adaptadas.

