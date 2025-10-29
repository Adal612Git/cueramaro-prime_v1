# API Reference

Todas las rutas están prefijadas con `/api`.

## Autenticación

> Pendiente de implementación. Se reservaron endpoints JWT con roles `admin` y `mostrador`.

## Usuarios

| Método | Ruta           | Descripción              |
| ------ | -------------- | ------------------------ |
| POST   | `/users`       | Crea un usuario          |
| GET    | `/users`       | Lista usuarios           |
| GET    | `/users/:id`   | Obtiene usuario por ID   |
| PATCH  | `/users/:id`   | Actualiza usuario        |
| DELETE | `/users/:id`   | Elimina usuario          |

## Proveedores

| Método | Ruta               | Descripción                      |
| ------ | ------------------ | -------------------------------- |
| POST   | `/suppliers`       | Crea proveedor                   |
| GET    | `/suppliers`       | Lista proveedores                |
| GET    | `/suppliers/:id`   | Consulta proveedor               |
| PATCH  | `/suppliers/:id`   | Actualiza proveedor              |
| DELETE | `/suppliers/:id`   | Elimina proveedor                |

## Clientes

| Método | Ruta              | Descripción |
| ------ | ----------------- | ----------- |
| POST   | `/customers`      | Crea cliente|
| GET    | `/customers`      | Lista clientes|
| GET    | `/customers/:id`  | Consulta cliente|
| PATCH  | `/customers/:id`  | Actualiza cliente|
| DELETE | `/customers/:id`  | Elimina cliente|

## Productos

| Método | Ruta            | Descripción |
| ------ | --------------- | ----------- |
| POST   | `/products`     | Crea producto|
| GET    | `/products`     | Lista productos|
| GET    | `/products/:id` | Consulta producto|
| PATCH  | `/products/:id` | Actualiza producto|
| DELETE | `/products/:id` | Elimina producto|

## Inventario (Lotes)

| Método | Ruta                | Descripción |
| ------ | ------------------- | ----------- |
| POST   | `/inventory`        | Registra lote|
| GET    | `/inventory`        | Lista lotes|
| PATCH  | `/inventory/:id`    | Actualiza lote|
| DELETE | `/inventory/:id`    | Elimina lote|

## Ventas POS

| Método | Ruta                     | Descripción            |
| ------ | ------------------------ | ---------------------- |
| POST   | `/sales`                 | Registra venta         |
| PATCH  | `/sales/:id/payments`    | Registra pago parcial  |
| GET    | `/sales`                 | Lista ventas           |

## Cuentas por Cobrar

| Método | Ruta                     | Descripción |
| ------ | ------------------------ | ----------- |
| POST   | `/cxc`                   | Crea cuenta |
| PATCH  | `/cxc/:id/payments`      | Registra abono|
| GET    | `/cxc`                   | Lista cuentas|

## Gastos

| Método | Ruta              | Descripción |
| ------ | ----------------- | ----------- |
| POST   | `/expenses`       | Crea gasto |
| GET    | `/expenses`       | Lista gastos|
| PATCH  | `/expenses/:id`   | Actualiza gasto|
| DELETE | `/expenses/:id`   | Elimina gasto|

## Reportes

| Método | Ruta                 | Descripción                   |
| ------ | -------------------- | ----------------------------- |
| GET    | `/reports/dashboard` | Resumen de KPIs y ventas      |

## Sincronización

| Método | Ruta            | Descripción                     |
| ------ | --------------- | ------------------------------- |
| GET    | `/sync/status`  | Estado de sincronización local |

