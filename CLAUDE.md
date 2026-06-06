# CodeViz Research Context

> **Note**: Research context from CodeViz. Most recent at bottom.

---

## Research Query

Analyze "SQL Database" component: architecture, responsibilities, implementation.

*Session: b2dd579842e9079cacff6be1d222e302 | Generated: 12/7/2025, 2:44:08*

### Analysis Summary

# SQL Database Component Analysis

Persistent data store for users, products, sales, other entities. **MySQL** (`ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci` in dump) + **Sequelize** ORM in Node.js backend.

## Architecture and Responsibilities

Store/retrieve/update/delete app data reliably. Integrity via schemas, foreign keys, constraints.

### Database Connection and Configuration

Sequelize connection in [src/config/sequelize.js](src/config/sequelize.js).

*   **ORM:** Sequelize
*   **Connection String:** `DB_URL` env var [src/config/sequelize.js](src/config/sequelize.js:5).
*   **Timestamps:** Sequelize auto-manages `creado_en`/`actualizado_en` for all models [src/config/sequelize.js](src/config/sequelize.js:8-11).

### Database Schema

Full schema in [public/db/dump.sql](public/db/dump.sql).

Key tables:

*   **`caja`**: Cash registers, linked to `empresa` [public/db/dump.sql](public/db/dump.sql:10).
*   **`categoria_producto`**: Product categories [public/db/dump.sql](public/db/dump.sql:24).
*   **`cliente`**: Customers [public/db/dump.sql](public/db/dump.sql:35).
*   **`control_caja`**: Cash register open/close, linked to `caja`/`usuario` [public/db/dump.sql](public/db/dump.sql:50).
*   **`empleado`**: Employees, linked to `empresa` [public/db/dump.sql](public/db/dump.sql:67).
*   **`empresa`**: Companies [public/db/dump.sql](public/db/dump.sql:84).
*   **`iva`**: VAT rates, linked to `usuario` [public/db/dump.sql](public/db/dump.sql:103).
*   **`metodo_pago`**: Payment methods [public/db/dump.sql](public/db/dump.sql:117).
*   **`nomina_empleado`**: Payroll records, linked to `empleado`/`tasa_dolar` [public/db/dump.sql](public/db/dump.sql:130).
*   **`pago`**: Payments, linked to `pedido`/`metodo_pago` [public/db/dump.sql](public/db/dump.sql:147).
*   **`pago_servicio`**: Service payments, linked to `servicio_empresa` [public/db/dump.sql](public/db/dump.sql:161).
*   **`pedido`**: Orders, linked to `cliente`/`usuario` [public/db/dump.sql](public/db/dump.sql:174).
*   **`pedido_detalle`**: Order line items, linked to `pedido`/`producto` [public/db/dump.sql](public/db/dump.sql:190).
*   **`producto`**: Products, linked to `categoria_producto` [public/db/dump.sql](public/db/dump.sql:206).
*   **`servicio_empresa`**: Company services [public/db/dump.sql](public/db/dump.sql:220).
*   **`tasa_dolar`**: Exchange rates, linked to `usuario` [public/db/dump.sql](public/db/dump.sql:234).
*   **`tipo_usuario`**: User roles [public/db/dump.sql](public/db/dump.sql:250).
*   **`usuario`**: User accounts, linked to `empleado`/`tipo_usuario` [public/db/dump.sql](public/db/dump.sql:261).

### ORM Models

`src/models/` maps DB tables to JS objects via Sequelize. Each file = one table.

Examples:

*   [Caja.js](src/models/Caja.js)
*   [CategoriaProducto.js](src/models/CategoriaProducto.js)
*   [Cliente.js](src/models/Cliente.js)
*   [ControlCaja.js](src/models/ControlCaja.js)
*   [Empleado.js](src/models/Empleado.js)
*   [Empresa.js](src/models/Empresa.js)
*   [Iva.js](src/models/Iva.js)
*   [MetodoPago.js](src/models/MetodoPago.js)
*   [MovimientoCaja.js](src/models/MovimientoCaja.js)
*   [MovimientoProducto.js](src/models/MovimientoProducto.js)
*   [NominaEmpleado.js](src/models/NominaEmpleado.js)
*   [Pago.js](src/models/Pago.js)
*   [PagoServicio.js](src/models/PagoServicio.js)
*   [Pedido.js](src/models/Pedido.js)
*   [PedidoDetalle.js](src/models/PedidoDetalle.js)
*   [PreguntaSeguridad.js](src/models/PreguntaSeguridad.js)
*   [PreguntaSeguridadUsuario.js](src/models/PreguntaSeguridadUsuario.js)
*   [Producto.js](src/models/Producto.js)
*   [ServicioEmpresa.js](src/models/ServicioEmpresa.js)
*   [TasaDolar.js](src/models/TasaDolar.js)
*   [TipoUsuario.js](src/models/TipoUsuario.js)
*   [Usuario.js](src/models/Usuario.js)
*   [Venta.js](src/models/Venta.js)
*   [VentaDetalle.js](src/models/VentaDetalle.js)

[src/models/index.js](src/models/index.js) initializes models + associations.

## Implementation Details

Controllers use Sequelize models for CRUD. ORM abstracts raw SQL → JS objects/methods. FK constraints at DB level ([public/db/dump.sql](public/db/dump.sql)) + managed via Sequelize associations.
