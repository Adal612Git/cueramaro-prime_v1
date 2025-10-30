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
