# Cuerámaro Prime POS

Sistema local-first para carnicerías construido con NestJS, React y ElectricSQL. Consulta `docs/README.md` para instrucciones completas.

Ahora incluye integración Prisma + PostgreSQL con datos de ejemplo y endpoints reales para productos, clientes, proveedores, gastos y reportes.

## Inicio rápido

1. Generar cliente Prisma y aplicar esquema

```
pnpm prisma:generate
pnpm prisma:push  # o pnpm prisma:migrate
pnpm prisma:seed
```

2. Ejecutar API y Frontend

```
pnpm dev
pnpm --dir frontend dev
```

3. Acceso (login)

- Admin: `admin@pos.local` / `admin123`
- Mostrador: `caja@pos.local` / `caja123`

El rol Mostrador solo ve: Ventas, Productos (ingreso de inventario) y Gastos.

## Salud, Seguridad y Respaldos

- Salud: endpoint `GET /api/health` devuelve estado y latencia de DB.
- Seguridad: se aplican cabeceras `helmet` y rate limiting si están instalados (`express-rate-limit`). Configura `CORS_ORIGIN` en `.env`.
- Respaldos: script local `pnpm backup` genera un archivo comprimido en `./backups` usando `pg_dump` del contenedor `cueramaro-db`.
  - Variables (opcional): `DB_CONTAINER`, `PGUSER`, `PGDATABASE`, `RETENTION_DAYS`.
  - Restaurar:
    ```bash
    gunzip -c backups/db-YYYY-MM-DD-HHMMSS.dump.gz | \
      docker exec -i cueramaro-db pg_restore -U user -d cueramaro --clean --if-exists
    ```
