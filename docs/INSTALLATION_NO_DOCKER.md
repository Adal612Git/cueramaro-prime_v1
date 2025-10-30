# Instalación sin Docker (Windows 11)

Esta guía permite correr el proyecto completo (API + Frontend) sin depender de Docker, usando datos simulados en el backend. Ideal para equipos/cliente que no tengan Docker instalado.

## Requisitos

- Node.js 20 LTS
- pnpm (activa con `corepack enable` en PowerShell)

## Pasos

1) Variables de entorno

```powershell
Copy-Item .env.example .env
```

2) Instalar dependencias

```powershell
pnpm install
pnpm --dir frontend install
```

3) Compilar backend y arrancar todo

```powershell
pnpm build      # compila el backend NestJS
pnpm dev:all    # arranca API (http://localhost:3000/api) + Web (http://localhost:5173)
```

También puedes arrancarlos por separado:

- API: `pnpm dev`
- Frontend: `pnpm frontend`

## ¿Qué incluye este modo?

- Backend NestJS mínimo con el endpoint `GET /api/reports/dashboard` que regresa datos simulados.
- Frontend React funcionando contra esa API local.

## ¿Y si necesito base de datos real sin Docker?

1. Instala PostgreSQL localmente (Windows Installer) y crea la base `cueramaro`.
2. Ajusta `DATABASE_URL` en `.env` a `postgresql://user:pass@localhost:5432/cueramaro`.
3. Ejecuta migraciones de Prisma (cuando el esquema esté disponible en el repo):

```powershell
pnpm prisma migrate deploy
pnpm prisma db push
```

4. ElectricSQL (servicio de sincronización) requiere instalar y ejecutar su servicio fuera de Docker. Este repositorio actualmente incluye un modo con datos simulados para que el sistema sea usable sin esa infraestructura.

