# Instalación Paso a Paso (Windows 11)

## 1. Preparar entorno

1. Habilitar WSL2 y Ubuntu desde Microsoft Store.
2. Instalar Docker Desktop y activar integración con WSL2.
3. Instalar Node.js 20 LTS y pnpm `corepack enable`.
4. Clonar este repositorio en una carpeta compartida con WSL (por ejemplo `\\wsl$`).

## 2. Configurar variables de entorno

```powershell
Copy-Item .env.example .env
```

Actualizar credenciales en `.env` si es necesario.

## 3. Instalar dependencias

```powershell
pnpm install
pnpm --dir frontend install
```

## 4. Inicializar base de datos

```powershell
pnpm docker:up
pnpm prisma migrate deploy
pnpm prisma db push
psql postgresql://user:pass@localhost:5432/cueramaro -f prisma/extensions.sql
```

## 5. Ejecutar aplicaciones

- API NestJS: `pnpm dev`
- Frontend React: `pnpm frontend`

## 6. Pruebas unitarias

```powershell
pnpm test
```

## 7. Apagar servicios

```powershell
pnpm docker:down
```

> **Nota:** ElectricSQL requiere configurar replication adapters adicionales. Consulte la documentación oficial para integrar con el backend NestJS.
