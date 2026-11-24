# Manual de Usuario
Aplicación Web para la Gestión de Procesos Administrativos

Caso: Colores y Detalles de Mayeli González F.P.

Elaborado por:

- Pavid Bracamonte — C.I. V-30.927.883
- Leonela González — C.I. V-20.152.416
- Pedro González — C.I. V-29.841.428

Boconó, noviembre de 2026

---

## Propósito

Este manual describe el uso de los módulos del front de la aplicación, las vistas que los componen y las acciones principales que puede realizar cada perfil. Está organizado siguiendo el menú de navegación y las rutas definidas en `src/routes/routes.views.js`.

La interfaz está construida con plantillas Handlebars ubicadas en `src/views/pages/` y componentes reutilizables en `src/views/partials/`. Algunas acciones muestran formularios emergentes (modales) y otras organizan la información en pestañas.

Las capturas incluidas proceden del manual anterior. Los módulos incorporados en esta versión —recuperación, detalle de caja, nómina y detalle de producto— se documentan textualmente.

## Convenciones de la interfaz

- **Menú lateral:** se abre desde el encabezado y agrupa los módulos disponibles según el perfil del usuario.
- **Pestañas:** varias secciones muestran botones horizontales para cambiar entre vistas dentro de la misma página.
- **Formularios emergentes:** se abren al presionar botones como “Agregar”, “Nuevo”, “Registrar” o “Actualizar”.
- **Paginación:** los listados incluyen controles “Anterior” y “Siguiente” cuando hay más registros.
- **Notificaciones:** el sistema muestra mensajes de confirmación o error mediante avisos temporales.
- **Permisos:** las opciones visibles dependen del rol asignado: usuario autenticado, `admin` o `superadmin`.

## Contenido

- 1. Acceso y navegación
- 2. Clientes
- 3. Inventario
- 4. Métodos de pago
- 5. Pedidos
- 6. Ventas y cajas registradoras
- 7. Nómina
- 8. Perfil
- 9. Administración / Mantenimiento
- 10. Configuración
- 11. Errores y soporte
- Apéndice A. Rutas y archivos de vista
- Apéndice B. Glosario

---

## 1. Acceso y navegación

### 1.1 Iniciar sesión

**Ruta web:** `/login`  
**Vista:** `src/views/pages/login.hbs`  
**Acceso:** público; si la sesión ya está activa, la aplicación redirige al inicio.

Para entrar al sistema:

1. Abra la URL de la aplicación en el navegador.
2. En la pantalla “Iniciar sesión”, escriba el **Usuario** y la **Contraseña**.
3. Presione el botón **Iniciar sesión**.
4. Si olvidó su contraseña, seleccione **¿Olvidaste tu contraseña?** para ir a la recuperación.

![Formulario de inicio de sesión](public/docs/manual-images/01-login.png)

> Las credenciales deben estar previamente registradas por un administrador desde Configuración → Usuarios.

### 1.2 Recuperación de contraseña

**Ruta web:** `/rescue`  
**Vista:** `src/views/pages/rescue.hbs`  
**Acceso:** público.

El flujo tiene cuatro pasos:

1. **Identificación de Usuario:** ingrese su nombre de usuario.
2. **Preguntas de Seguridad:** responda las preguntas configuradas en su perfil.
3. **Nueva Contraseña:** escriba y confirme la nueva contraseña.
4. **Recuperación Exitosa:** confirme el resultado y vuelva al inicio de sesión.

Si no ha configurado preguntas de seguridad, el inicio mostrará una alerta con un enlace directo a Perfil → Preguntas de Seguridad.

### 1.3 Pantalla principal

**Ruta web:** `/`  
**Vista:** `src/views/pages/home.hbs`  
**Acceso:** público, con contenido distinto según la sesión.

- Sin sesión: muestra la bienvenida “Bienvenido a Colores y Detalles”.
- Con sesión: muestra el **Dashboard** con cuatro gráficas:
  - Ventas por Fecha.
  - Pedidos por Mes.
  - Stock por Categoría.
  - Productos con Stock Bajo.

![Pantalla pública de bienvenida](public/docs/manual-images/02-home-public.png)

![Dashboard con gráficas del sistema](public/docs/manual-images/03-dashboard.png)

### 1.4 Menú lateral y opciones de perfil

**Archivos:** `src/views/partials/aside.hbs` y `src/views/partials/dropdown-profile.hbs`.

El menú lateral se organiza así:

- **Principal:** Inicio, Ayuda, Clientes.
- **Productos:** Inventario, Métodos de Pago.
- **Gestión:** Pedidos, Ventas, Nómina.

Sin sesión solo aparecen **Iniciar Sesión** y **Ayuda**.

El menú del perfil incluye:

- **Perfil:** disponible para el usuario autenticado.
- **Mantenimiento:** solo para `superadmin`.
- **Configuración:** disponible para `admin` y `superadmin`.
- **Cerrar Sesión:** finaliza la sesión activa.

### 1.5 Ayuda

**Ruta web:** `/help`  
**Vista:** `src/views/pages/help.hbs`  
**Acceso:** público.

Muestra el manual técnico, el enlace de descarga `Descargar Manual en PDF` y los datos del equipo de desarrollo.

---

## 2. Clientes

**Ruta web:** `/customers`  
**Vista:** `src/views/pages/customers.hbs`  
**Acceso:** autenticado.

### 2.1 Listado de clientes

Muestra cédula, nombre y apellido, teléfono, correo, dirección y estado. Permite:

- Buscar por nombre o cédula.
- Agregar un cliente.
- Editar un cliente existente.
- Navegar con “Anterior” y “Siguiente”.

![Listado de clientes](public/docs/manual-images/04-customers-list.png)

### 2.2 Agregar cliente

**Vista parcial:** `src/views/partials/customers/create-form.hbs`.

Complete los datos solicitados —cédula, nombre, apellido, teléfono, correo y dirección—, indique si está activo y presione **Crear Cliente**.

![Formulario para crear cliente](public/docs/manual-images/05-customer-create.png)

### 2.3 Editar cliente

**Vista parcial:** `src/views/partials/customers/edit.hbs`.

Modifique los campos necesarios y confirme con **Editar Cliente**. El cambio de estado permite activar o desactivar al cliente.

---

## 3. Inventario

**Ruta web:** `/inventory`  
**Vista:** `src/views/pages/inventory.hbs`  
**Acceso:** autenticado.

La pantalla muestra tres indicadores: **Total productos**, **Categorías** y **Stock total**, además de tres pestañas: Inventario, Productos y Categorías.

![Vista general del inventario](public/docs/manual-images/06-inventory-overview.png)

### 3.1 Movimientos de inventario

**Pestaña:** `Inventario`  
**Vista parcial:** `src/views/partials/inventory/movement-create.hbs`.

Permite consultar entradas y salidas registradas. Para registrar un movimiento indique:

- Producto.
- Tipo de movimiento (entrada o salida).
- Cantidad.
- Observaciones.

Confirme con **Registrar Movimiento**.

![Lista de movimientos de inventario](public/docs/manual-images/07-inventory-movements.png)

![Formulario de movimiento de inventario](public/docs/manual-images/08-inventory-movement-create.png)

### 3.2 Productos

**Pestaña:** `Productos`  
**Vistas parciales:** `product-create.hbs` y `product-edit.hbs`.

El listado permite buscar, filtrar por categoría, ver stock bajo y generar el **Reporte de Inventario**. Para crear un producto indique código, nombre, precio unitario, categoría, descripción e imagen; finalice con **Registrar Producto**. Para modificarlo use **Editar Producto**.

![Listado de productos](public/docs/manual-images/09-products-list.png)

![Formulario de nuevo producto](public/docs/manual-images/10-product-create.png)

### 3.3 Categorías

**Pestaña:** `Categorías`  
**Vistas parciales:** `category-create.hbs` y `category-edit.hbs`.

Permite buscar, crear y editar categorías. El formulario solicita **Nombre** y **Descripción**; se guarda con **Registrar Categoría**.

![Listado de categorías](public/docs/manual-images/11-categories.png)

![Formulario de nueva categoría](public/docs/manual-images/12-category-create.png)

### 3.4 Detalle del producto

**Ruta web:** `/product/:id`  
**Vista:** `src/views/pages/product-detail.hbs`  
**Acceso:** autenticado.

Muestra el nombre, la categoría, el precio en dólares y bolívares, el precio con IVA y el estado de stock: **En Stock**, **Poco Stock** o **No Disponible**. Incluye accesos para volver al inventario y editar el producto.

---

## 4. Métodos de pago

**Ruta web:** `/payments-methods`  
**Vista:** `src/views/pages/payment-method.hbs`  
**Acceso:** autenticado.

### 4.1 Listado

Muestra los métodos registrados y permite buscar entre ellos, agregar uno nuevo, editar los existentes y paginar el listado.

![Listado de métodos de pago](public/docs/manual-images/13-payment-methods-list.png)

### 4.2 Crear o editar método de pago

**Vistas parciales:** `src/views/partials/payments/payment-method-create.hbs` y `payment-method-edit.hbs`.

Los campos principales son nombre, tipo de pago, comisión y descripción. También se define si el método estará activo. Guarde con **Crear Método de Pago** o **Editar Método de Pago**.

![Formulario de nuevo método de pago](public/docs/manual-images/14-payment-method-create.png)

![Formulario de edición de método de pago](public/docs/manual-images/15-payment-method-edit.png)

---

## 5. Pedidos

**Ruta web:** `/orders`  
**Vista:** `src/views/pages/orders.hbs`  
**Acceso:** autenticado.

La pantalla muestra tarjetas con total de pedidos, pendientes, procesados y completados, además de la lista de pedidos con búsqueda, paginación y botón **Nuevo Pedido**.

![Listado de pedidos](public/docs/manual-images/16-orders-list.png)

### 5.1 Crear pedido

**Vista parcial:** `src/views/partials/orders/create-order.hbs`.

1. Identifique al cliente por nombre o cédula. Si no existe, use el acceso directo para registrarlo.
2. Agregue productos indicando código o nombre y cantidad.
3. Detalle las especificaciones de sublimación o personalización y el coste variable.
4. Adjunte una imagen o diseño si aplica.
5. Revise el total y presione **Crear Pedido**.

![Identificación del cliente en un pedido](public/docs/manual-images/17-order-create-customer.png)

![Agregar producto a un pedido](public/docs/manual-images/18-order-create-product.png)

![Total del pedido](public/docs/manual-images/19-order-total.png)

### 5.2 Registrar pago

**Vista parcial:** `src/views/partials/orders/create-payment.hbs`.

Desde la vista del pedido puede registrar pagos indicando monto, método de pago y referencia. El sistema calcula vuelto en dólares y bolívares cuando corresponde.

### 5.3 Cambiar estado

**Vista parcial:** `src/views/partials/orders/edit-order-status.hbs`.

Permite actualizar el estado del pedido y confirmar con **Actualizar Estado**. Los estados gestionados son pendiente, procesado y completado.

---

## 6. Ventas y cajas registradoras

**Ruta web:** `/shopping`  
**Vista:** `src/views/pages/shopping.hbs`  
**Acceso:** autenticado.

La pantalla muestra la tasa del dólar, el estado de la caja y dos pestañas: **Ventas** y **Cajas Registradoras**.

![Listado de ventas](public/docs/manual-images/20-sales-list.png)

### 6.1 Nueva venta

**Vista parcial:** `src/views/partials/shopping/shopping-create.hbs`.

1. Identifique al cliente por nombre, apellido o cédula; si no existe, regístrelo desde el enlace disponible.
2. Busque productos por nombre o código y agregue las cantidades.
3. Revise subtotal, total y montos de pago.
4. Registre los pagos y las referencias correspondientes.
5. Confirme con **Crear Venta**.

![Identificación del cliente en una venta](public/docs/manual-images/21-sale-create-customer.png)

![Registro de pago de una venta](public/docs/manual-images/22-sale-create-payment.png)

### 6.2 Cajas registradoras

**Vista parcial:** `src/views/partials/shopping/box-register.hbs`.

Permite buscar cajas, crear una nueva y editar las existentes. Los formularios solicitan nombre, ubicación y, para cajas digitales, datos como banco, teléfono de Pago Móvil o Zelle. Se guardan con **Crear Caja Registradora** o **Editar Caja Registradora**.

### 6.3 Detalle de caja

**Ruta web:** `/box-register/:id`  
**Vista:** `src/views/pages/box-register.hbs`  
**Acceso:** autenticado.

Muestra la identidad de la caja —nombre, tipo “Digital / Banco” o “Efectivo físico”, monto en USD y empresa— y el último control de caja con fechas de apertura y cierre formateadas.

Incluye:

- **Control de Caja:** abre o cierra el turno, muestra saldo inicial en Bs. y USD, monto en caja y resumen de ingresos, egresos y vueltos. Al cerrar se puede escribir una **Nota de cierre**.
- **Movimientos de Caja:** registra ingresos o egresos con método de pago, monto y, si es digital, referencia y cuenta receptora.

---

## 7. Nómina

### 7.1 Gestión de nómina

**Ruta web:** `/payroll`  
**Vista:** `src/views/pages/payroll.hbs`  
**Acceso:** autenticado; generar nómina es una acción disponible para `admin`.

Muestra resumen de total de nóminas, total pagado, total de empleados y última nómina, además del historial.

Para generar una nómina indique el **periodo inicio** y el **periodo fin** y presione **Generar Nómina**.

Para pagar, abra **Pagar Nómina**, revise el periodo, total, pagado y pendiente, indique el monto en bolívares, el tipo de pago —efectivo o transferencia/pago móvil— y la referencia si corresponde.

### 7.2 Detalle de empleado y nómina individual

**Ruta web:** `/settings/employe/:id`  
**Vista:** `src/views/pages/employe.hbs`  
**Acceso:** autenticado.

Muestra los datos del empleado, su estado activo/inactivo y el historial de nóminas del empleado. Desde aquí se puede registrar una nómina individual con fechas de inicio y fin, montos y descripción; se guarda con **Registrar Nómina**.

---

## 8. Perfil

**Ruta web:** `/profile`  
**Vista:** `src/views/pages/profile.hbs`  
**Acceso:** autenticado.

Muestra los datos del usuario activo: nombre del empleado, usuario, empresa, slogan y rol. Tiene tres pestañas.

![Vista general del perfil](public/docs/manual-images/23-profile.png)

### 8.1 Datos de Empleado

**Vista parcial:** `src/views/partials/profile/empleado.hbs`.

Consulta y edita información personal: nombre, apellido, cédula, teléfono, correo, dirección y salario base. Guarde con **Editar Empleado**.

### 8.2 Seguridad

**Vista parcial:** `src/views/partials/profile/seguridad.hbs`.

Permite cambiar la contraseña. Solicita contraseña actual, nueva contraseña y confirmación. Confirme con **Cambiar Contraseña**.

![Cambio de contraseña](public/docs/manual-images/24-profile-security.png)

### 8.3 Preguntas de seguridad

**Vista parcial:** `src/views/partials/profile/question.hbs`.

Configure preguntas y respuestas para la recuperación de acceso. Use **Validar Identidad** cuando el sistema lo solicite.

![Preguntas de seguridad](public/docs/manual-images/25-profile-questions.png)

### 8.4 Cerrar sesión

Se ejecuta desde el menú del perfil con **Cerrar Sesión**. Finaliza la sesión activa y devuelve al usuario a la pantalla pública.

![Cierre de sesión](public/docs/manual-images/46-logout.png)

---

## 9. Administración / Mantenimiento

**Ruta web:** `/management`  
**Vista:** `src/views/pages/management.hbs`  
**Acceso:** solo `superadmin`.

Tiene tres pestañas.

![Vista de mantenimiento](public/docs/manual-images/26-maintenance.png)

### 9.1 Reportes de venta

**Vista parcial:** `src/views/partials/management/report-sales.hbs`.

Permite generar un reporte detallado de ventas con **Generar Reporte**.

![Generación de reporte de ventas](public/docs/manual-images/27-maintenance-report.png)

### 9.2 Exportar base de datos

**Vista parcial:** `src/views/partials/management/db-export.hbs`.

Permite descargar la base de datos en formato **JSON** o **SQL**.

### 9.3 Importar base de datos

**Vista parcial:** `src/views/partials/management/db-import.hbs`.

Permite cargar un archivo de respaldo para restaurar la información.

![Exportación e importación de la base de datos](public/docs/manual-images/28-maintenance-db.png)

> Cualquier ruta bajo `/management/*` que no exista redirige automáticamente a `/management`.

---

## 10. Configuración

**Ruta web:** `/settings`  
**Vista:** `src/views/pages/settings.hbs`  
**Acceso:** `admin` y `superadmin`.

Tiene cinco pestañas: Empresa, Empleados, Usuarios, Tasa del Dólar e IVA.

![Vista de configuración](public/docs/manual-images/29-settings.png)

### 10.1 Empresa

**Vista parcial:** `src/views/partials/settings/company-info.hbs`.

Administra la ficha corporativa: nombre, RIF, descripción, dirección, ciudad, teléfono, correo, sitio web y slogan. Guarde con **Editar Información**.

![Configuración de la empresa](public/docs/manual-images/30-company.png)

![Servicios desde la configuración de empresa](public/docs/manual-images/31-company-services.png)

![Información de la empresa](public/docs/manual-images/32-company-info.png)

### 10.2 Servicios de la empresa

**Vista parcial:** `src/views/partials/settings/services.hbs`.

Dentro de la pestaña Empresa se lista y busca los servicios contratados. Para registrar uno indique nombre, proveedor, costo, día de corte y descripción; finalice con **Registrar Servicio**. Para modificarlo use **Guardar Cambios**.

![Listado de servicios](public/docs/manual-images/33-services-list.png)

![Registro de servicio](public/docs/manual-images/34-service-create.png)

### 10.3 Detalle del servicio

**Ruta web:** `/settings/service/:id`  
**Vista:** `src/views/pages/service.hbs`  
**Acceso:** autenticado.

Muestra el nombre del servicio, proveedor, día de corte, próximo corte, costo mensual y fecha de creación. Tiene tres pestañas:

- **Detalles:** información general del servicio.
- **Facturación:** periodos con estado pagado, parcial, vencido o pendiente y días restantes/vencidos.
- **Pagos:** historial de pagos y botón **Registrar Pago**, donde se selecciona el periodo a pagar y se ingresa la referencia.

![Detalle del servicio](public/docs/manual-images/35-service-details.png)

![Facturación del servicio](public/docs/manual-images/36-service-billing.png)

![Pagos del servicio](public/docs/manual-images/37-service-payments.png)

### 10.4 Empleados

**Vista parcial:** `src/views/partials/settings/employes.hbs`.

Muestra la plantilla laboral con estado activo/inactivo, búsqueda por cédula o nombre, edición y botón para agregar empleado. El formulario solicita cédula, nombre, apellido, teléfono, correo, dirección y salario base; se guarda con **Registrar Empleado**.

![Listado de empleados](public/docs/manual-images/38-employees-list.png)

![Registro de empleado](public/docs/manual-images/39-employee-create.png)

### 10.5 Usuarios

**Vista parcial:** `src/views/partials/settings/user.hbs`.

Gestiona las cuentas de acceso: estado activo/inactivo, búsqueda por nombre de usuario, edición de permisos y creación de usuarios. Para crear indique nombre de usuario, tipo de usuario, contraseña y empleado vinculado; confirme con **Registrar**.

![Listado de usuarios](public/docs/manual-images/40-users-list.png)

![Registro de usuario](public/docs/manual-images/41-user-create.png)

### 10.6 Tasa del dólar

**Vista parcial:** `src/views/partials/settings/exchange-rate.hbs`.

Muestra la tasa actual y el historial de cambios. Para actualizar ingrese la tasa vigente y presione **Actualizar Tasa**. La tasa activa se usa en ventas, pedidos, productos y cajas.

![Historial de tasa del dólar](public/docs/manual-images/42-exchange-rate-list.png)

![Actualización de tasa del dólar](public/docs/manual-images/43-exchange-rate-update.png)

### 10.7 IVA

**Vista parcial:** `src/views/partials/settings/iva.hbs`.

Muestra el IVA actual y su historial. Para actualizar indique el nuevo porcentaje y una observación de soporte; confirme con **Actualizar Tasa**. El IVA activo se aplica en el cálculo de precios y ventas.

![Historial de IVA](public/docs/manual-images/44-iva-list.png)

![Actualización de IVA](public/docs/manual-images/45-iva-update.png)

> Cualquier ruta bajo `/settings/*` que no exista redirige automáticamente a `/settings`.

---

## 11. Errores y soporte

### 11.1 Acceso denegado (403)

**Vista:** `src/views/pages/403.hbs`.

Aparece cuando el usuario no tiene sesión o su rol no permite acceder a la página. Muestra “Acceso Denegado” y un enlace **Volver al inicio**.

### 11.2 Página no encontrada (404)

**Vista:** `src/views/pages/404.hbs`.

Aparece para rutas de vista no registradas. Muestra “Página No Encontrada”.

### 11.3 Situaciones frecuentes

- **No puedo iniciar sesión:** verifique usuario y contraseña; si olvidó la contraseña, use `/rescue`.
- **No veo Administración:** esa opción solo está disponible para `superadmin`.
- **No veo Configuración:** esa opción solo está disponible para `admin` y `superadmin`.
- **Los precios no muestran tasa o IVA:** verifique que exista una Tasa del Dólar y un IVA activos en Configuración.
- **Una caja no permite operar:** revise el control de caja desde el detalle de la caja registradora.
- **El inventario marca poco stock:** registre una entrada de producto desde Inventario → Movimientos.
- **El manual no abre:** descárguelo desde Ayuda o desde `public/docs/manual.pdf`.

---

## Apéndice A. Rutas y archivos de vista

- `/` → `pages/home.hbs`
- `/login` → `pages/login.hbs`
- `/rescue` → `pages/rescue.hbs`
- `/help` → `pages/help.hbs`
- `/customers` → `pages/customers.hbs`
- `/inventory` → `pages/inventory.hbs`
- `/product/:id` → `pages/product-detail.hbs`
- `/payments-methods` → `pages/payment-method.hbs`
- `/orders` → `pages/orders.hbs`
- `/shopping` → `pages/shopping.hbs`
- `/box-register/:id` → `pages/box-register.hbs`
- `/payroll` → `pages/payroll.hbs`
- `/profile` → `pages/profile.hbs`
- `/management` → `pages/management.hbs`
- `/settings` → `pages/settings.hbs`
- `/settings/service/:id` → `pages/service.hbs`
- `/settings/employe/:id` → `pages/employe.hbs`
- Sin ruta coincidente → `pages/404.hbs`
- Sin permisos → `pages/403.hbs`

Todas las rutas anteriores se definen en `src/routes/routes.views.js`, excepto `403.hbs`, que es renderizada por `src/middlewares/validRole.js`.

## Apéndice B. Glosario

- **Caja registradora:** punto de cobro físico o digital configurado para la empresa.
- **Control de caja:** apertura, cierre y resumen de movimientos de un turno.
- **Iva:** porcentaje tributario activo aplicado a precios y ventas.
- **Movimiento:** entrada o salida de productos que modifica el stock.
- **Pedido:** solicitud de productos pendiente de procesar o completar.
- **Periodo:** ciclo mensual de facturación de un servicio de la empresa.
- **Rol:** nivel de permiso del usuario: usuario autenticado, `admin` o `superadmin`.
- **Tasa del dólar:** tipo de cambio activo usado para conversiones entre USD y Bs.
- **Venta:** transacción confirmada con uno o más pagos registrados.
