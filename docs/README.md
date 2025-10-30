# Cuerámaro Prime POS

Bienvenido a la guía principal del sistema Cuerámaro Prime POS. Esta documentación resume la arquitectura local-first, instrucciones de instalación y flujo de trabajo recomendado para entornos Windows 11.

## Requisitos previos

- [pnpm](https://pnpm.io/) 8+
- Node.js 20 LTS
- Git
- Visual Studio Code con extensiones de NestJS, Prisma y TailwindCSS recomendadas
- (Opcional) Docker Desktop con WSL2 si usarás Postgres + ElectricSQL reales

## Configuración inicial en Windows 11

1. **Clonar el repositorio**
   ```powershell
   git clone <repo-url>
   cd cueramaro-prime_v1
   ```

2. **Copiar variables de entorno**
   ```powershell
   Copy-Item .env.example .env
   ```

3. **Instalar dependencias**
   ```powershell
   pnpm install
   pnpm --dir frontend install
   ```

4. **Sin Docker (rápido y recomendado para cliente)**
   
   Sigue la guía: `docs/INSTALLATION_NO_DOCKER.md`.

   Esto levanta API + Frontend sin requerir Postgres/Electric, usando datos simulados.

   ---

   **Con Docker (opcional, infraestructura real)**
   ```powershell
   pnpm docker:up
   ```

5. **Ejecutar API y Frontend**
   - Terminal 1: `pnpm dev`
   - Terminal 2: `pnpm frontend`

6. **Abrir la aplicación**
   - URL API: http://localhost:3000/api
   - URL Frontend: http://localhost:5173

## Arquitectura

- **Backend**: NestJS + Prisma sobre PostgreSQL con sincronización ElectricSQL
- **Frontend**: React + Vite + Tailwind + Zustand, preparado para ElectricSQL client
- **Bridge**: Carpeta `bridge/` reservada para integración Tauri + WebSocket/SerialPort

## Estructura de carpetas

```
src/                  # API NestJS
frontend/src/         # React SPA
prisma/               # Esquema y extensiones SQL
bridge/               # Stub de servicio hardware
```

## Comandos clave

| Comando           | Descripción                                |
| ----------------- | ------------------------------------------ |
| `pnpm dev`        | Inicia NestJS en modo watch                |
| `pnpm frontend`   | Inicia Vite con el frontend React          |
| `pnpm test`       | Ejecuta pruebas unitarias (Jest)           |
| `pnpm docker:up`  | Levanta Postgres y ElectricSQL             |
| `pnpm docker:down`| Detiene y limpia contenedores              |

## Flujo Local-First

1. El frontend opera sobre SQLite/IndexedDB administrado por ElectricSQL.
2. ElectricSQL sincroniza con PostgreSQL mediante CRDT LWW.
3. La API expone `/sync` para salud del proceso de reconciliación.
4. En UI se muestra un indicador `Sin conexión / Sincronizando`.

## Próximos pasos

- Completar integración con ElectricSQL client en frontend.
- Implementar autenticación JWT y guardas RBAC.
- Desarrollar bridge Tauri para báscula y lector de códigos.

