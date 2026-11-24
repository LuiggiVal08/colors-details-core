export const manualContent = {
    "intro": [
        {
            "type": "title",
            "text": "Manual de Usuario"
        },
        {
            "type": "paragraph",
            "text": "Aplicación Web para la Gestión de Procesos Administrativos"
        },
        {
            "type": "paragraph",
            "text": "Caso: Colores y Detalles de Mayeli González F.P."
        },
        {
            "type": "paragraph",
            "text": "Elaborado por:"
        },
        {
            "type": "bullet",
            "text": "Pavid Bracamonte — C.I. V-30.927.883"
        },
        {
            "type": "bullet",
            "text": "Leonela González — C.I. V-20.152.416"
        },
        {
            "type": "bullet",
            "text": "Pedro González — C.I. V-29.841.428"
        },
        {
            "type": "paragraph",
            "text": "Boconó, noviembre de 2026"
        }
    ],
    "sections": [
        {
            "id": "proposito",
            "title": "Propósito",
            "blocks": [
                {
                    "type": "paragraph",
                    "text": "Este manual describe el uso de los módulos del front de la aplicación, las vistas que los componen y las acciones principales que puede realizar cada perfil. Está organizado siguiendo el menú de navegación y las rutas definidas en src/routes/routes.views.js."
                },
                {
                    "type": "paragraph",
                    "text": "La interfaz está construida con plantillas Handlebars ubicadas en src/views/pages/ y componentes reutilizables en src/views/partials/. Algunas acciones muestran formularios emergentes (modales) y otras organizan la información en pestañas."
                },
                {
                    "type": "paragraph",
                    "text": "Las capturas incluidas proceden del manual anterior. Los módulos incorporados en esta versión —recuperación, detalle de caja, nómina y detalle de producto— se documentan textualmente."
                }
            ]
        },
        {
            "id": "convenciones-de-la-interfaz",
            "title": "Convenciones de la interfaz",
            "blocks": [
                {
                    "type": "bullet",
                    "text": "Menú lateral: se abre desde el encabezado y agrupa los módulos disponibles según el perfil del usuario."
                },
                {
                    "type": "bullet",
                    "text": "Pestañas: varias secciones muestran botones horizontales para cambiar entre vistas dentro de la misma página."
                },
                {
                    "type": "bullet",
                    "text": "Formularios emergentes: se abren al presionar botones como “Agregar”, “Nuevo”, “Registrar” o “Actualizar”."
                },
                {
                    "type": "bullet",
                    "text": "Paginación: los listados incluyen controles “Anterior” y “Siguiente” cuando hay más registros."
                },
                {
                    "type": "bullet",
                    "text": "Notificaciones: el sistema muestra mensajes de confirmación o error mediante avisos temporales."
                },
                {
                    "type": "bullet",
                    "text": "Permisos: las opciones visibles dependen del rol asignado: usuario autenticado, admin o superadmin."
                }
            ]
        },
        {
            "id": "contenido",
            "title": "Contenido",
            "blocks": [
                {
                    "type": "bullet",
                    "text": "1. Acceso y navegación"
                },
                {
                    "type": "bullet",
                    "text": "2. Clientes"
                },
                {
                    "type": "bullet",
                    "text": "3. Inventario"
                },
                {
                    "type": "bullet",
                    "text": "4. Métodos de pago"
                },
                {
                    "type": "bullet",
                    "text": "5. Pedidos"
                },
                {
                    "type": "bullet",
                    "text": "6. Ventas y cajas registradoras"
                },
                {
                    "type": "bullet",
                    "text": "7. Nómina"
                },
                {
                    "type": "bullet",
                    "text": "8. Perfil"
                },
                {
                    "type": "bullet",
                    "text": "9. Administración / Mantenimiento"
                },
                {
                    "type": "bullet",
                    "text": "10. Configuración"
                },
                {
                    "type": "bullet",
                    "text": "11. Errores y soporte"
                },
                {
                    "type": "bullet",
                    "text": "Apéndice A. Rutas y archivos de vista"
                },
                {
                    "type": "bullet",
                    "text": "Apéndice B. Glosario"
                }
            ]
        },
        {
            "id": "1-acceso-y-navegacion",
            "title": "1. Acceso y navegación",
            "blocks": [
                {
                    "type": "subsection",
                    "id": "1-1-iniciar-sesion",
                    "title": "1.1 Iniciar sesión",
                    "blocks": [
                        {
                            "type": "paragraph",
                            "text": "Ruta web: /login"
                        },
                        {
                            "type": "paragraph",
                            "text": "Vista: src/views/pages/login.hbs"
                        },
                        {
                            "type": "paragraph",
                            "text": "Acceso: público; si la sesión ya está activa, la aplicación redirige al inicio."
                        },
                        {
                            "type": "paragraph",
                            "text": "Para entrar al sistema:"
                        },
                        {
                            "type": "number",
                            "text": "1. Abra la URL de la aplicación en el navegador."
                        },
                        {
                            "type": "number",
                            "text": "2. En la pantalla “Iniciar sesión”, escriba el Usuario y la Contraseña."
                        },
                        {
                            "type": "number",
                            "text": "3. Presione el botón Iniciar sesión."
                        },
                        {
                            "type": "number",
                            "text": "4. Si olvidó su contraseña, seleccione ¿Olvidaste tu contraseña? para ir a la recuperación."
                        },
                        {
                            "type": "image",
                            "caption": "Formulario de inicio de sesión",
                            "file": "public/docs/manual-images/01-login.png"
                        },
                        {
                            "type": "note",
                            "text": "Las credenciales deben estar previamente registradas por un administrador desde Configuración → Usuarios."
                        }
                    ]
                },
                {
                    "type": "subsection",
                    "id": "1-2-recuperacion-de-contrasena",
                    "title": "1.2 Recuperación de contraseña",
                    "blocks": [
                        {
                            "type": "paragraph",
                            "text": "Ruta web: /rescue"
                        },
                        {
                            "type": "paragraph",
                            "text": "Vista: src/views/pages/rescue.hbs"
                        },
                        {
                            "type": "paragraph",
                            "text": "Acceso: público."
                        },
                        {
                            "type": "paragraph",
                            "text": "El flujo tiene cuatro pasos:"
                        },
                        {
                            "type": "number",
                            "text": "1. Identificación de Usuario: ingrese su nombre de usuario."
                        },
                        {
                            "type": "number",
                            "text": "2. Preguntas de Seguridad: responda las preguntas configuradas en su perfil."
                        },
                        {
                            "type": "number",
                            "text": "3. Nueva Contraseña: escriba y confirme la nueva contraseña."
                        },
                        {
                            "type": "number",
                            "text": "4. Recuperación Exitosa: confirme el resultado y vuelva al inicio de sesión."
                        },
                        {
                            "type": "paragraph",
                            "text": "Si no ha configurado preguntas de seguridad, el inicio mostrará una alerta con un enlace directo a Perfil → Preguntas de Seguridad."
                        }
                    ]
                },
                {
                    "type": "subsection",
                    "id": "1-3-pantalla-principal",
                    "title": "1.3 Pantalla principal",
                    "blocks": [
                        {
                            "type": "paragraph",
                            "text": "Ruta web: /"
                        },
                        {
                            "type": "paragraph",
                            "text": "Vista: src/views/pages/home.hbs"
                        },
                        {
                            "type": "paragraph",
                            "text": "Acceso: público, con contenido distinto según la sesión."
                        },
                        {
                            "type": "bullet",
                            "text": "Sin sesión: muestra la bienvenida “Bienvenido a Colores y Detalles”."
                        },
                        {
                            "type": "bullet",
                            "text": "Con sesión: muestra el Dashboard con cuatro gráficas:"
                        },
                        {
                            "type": "paragraph",
                            "text": "- Ventas por Fecha."
                        },
                        {
                            "type": "paragraph",
                            "text": "- Pedidos por Mes."
                        },
                        {
                            "type": "paragraph",
                            "text": "- Stock por Categoría."
                        },
                        {
                            "type": "paragraph",
                            "text": "- Productos con Stock Bajo."
                        },
                        {
                            "type": "image",
                            "caption": "Pantalla pública de bienvenida",
                            "file": "public/docs/manual-images/02-home-public.png"
                        },
                        {
                            "type": "image",
                            "caption": "Dashboard con gráficas del sistema",
                            "file": "public/docs/manual-images/03-dashboard.png"
                        }
                    ]
                },
                {
                    "type": "subsection",
                    "id": "1-4-menu-lateral-y-opciones-de-perfil",
                    "title": "1.4 Menú lateral y opciones de perfil",
                    "blocks": [
                        {
                            "type": "paragraph",
                            "text": "Archivos: src/views/partials/aside.hbs y src/views/partials/dropdown-profile.hbs."
                        },
                        {
                            "type": "paragraph",
                            "text": "El menú lateral se organiza así:"
                        },
                        {
                            "type": "bullet",
                            "text": "Principal: Inicio, Ayuda, Clientes."
                        },
                        {
                            "type": "bullet",
                            "text": "Productos: Inventario, Métodos de Pago."
                        },
                        {
                            "type": "bullet",
                            "text": "Gestión: Pedidos, Ventas, Nómina."
                        },
                        {
                            "type": "paragraph",
                            "text": "Sin sesión solo aparecen Iniciar Sesión y Ayuda."
                        },
                        {
                            "type": "paragraph",
                            "text": "El menú del perfil incluye:"
                        },
                        {
                            "type": "bullet",
                            "text": "Perfil: disponible para el usuario autenticado."
                        },
                        {
                            "type": "bullet",
                            "text": "Mantenimiento: solo para superadmin."
                        },
                        {
                            "type": "bullet",
                            "text": "Configuración: disponible para admin y superadmin."
                        },
                        {
                            "type": "bullet",
                            "text": "Cerrar Sesión: finaliza la sesión activa."
                        }
                    ]
                },
                {
                    "type": "subsection",
                    "id": "1-5-ayuda",
                    "title": "1.5 Ayuda",
                    "blocks": [
                        {
                            "type": "paragraph",
                            "text": "Ruta web: /help"
                        },
                        {
                            "type": "paragraph",
                            "text": "Vista: src/views/pages/help.hbs"
                        },
                        {
                            "type": "paragraph",
                            "text": "Acceso: público."
                        },
                        {
                            "type": "paragraph",
                            "text": "Muestra el manual técnico, el enlace de descarga Descargar Manual en PDF y los datos del equipo de desarrollo."
                        }
                    ]
                }
            ]
        },
        {
            "id": "2-clientes",
            "title": "2. Clientes",
            "blocks": [
                {
                    "type": "paragraph",
                    "text": "Ruta web: /customers"
                },
                {
                    "type": "paragraph",
                    "text": "Vista: src/views/pages/customers.hbs"
                },
                {
                    "type": "paragraph",
                    "text": "Acceso: autenticado."
                },
                {
                    "type": "subsection",
                    "id": "2-1-listado-de-clientes",
                    "title": "2.1 Listado de clientes",
                    "blocks": [
                        {
                            "type": "paragraph",
                            "text": "Muestra cédula, nombre y apellido, teléfono, correo, dirección y estado. Permite:"
                        },
                        {
                            "type": "bullet",
                            "text": "Buscar por nombre o cédula."
                        },
                        {
                            "type": "bullet",
                            "text": "Agregar un cliente."
                        },
                        {
                            "type": "bullet",
                            "text": "Editar un cliente existente."
                        },
                        {
                            "type": "bullet",
                            "text": "Navegar con “Anterior” y “Siguiente”."
                        },
                        {
                            "type": "image",
                            "caption": "Listado de clientes",
                            "file": "public/docs/manual-images/04-customers-list.png"
                        }
                    ]
                },
                {
                    "type": "subsection",
                    "id": "2-2-agregar-cliente",
                    "title": "2.2 Agregar cliente",
                    "blocks": [
                        {
                            "type": "paragraph",
                            "text": "Vista parcial: src/views/partials/customers/create-form.hbs."
                        },
                        {
                            "type": "paragraph",
                            "text": "Complete los datos solicitados —cédula, nombre, apellido, teléfono, correo y dirección—, indique si está activo y presione Crear Cliente."
                        },
                        {
                            "type": "image",
                            "caption": "Formulario para crear cliente",
                            "file": "public/docs/manual-images/05-customer-create.png"
                        }
                    ]
                },
                {
                    "type": "subsection",
                    "id": "2-3-editar-cliente",
                    "title": "2.3 Editar cliente",
                    "blocks": [
                        {
                            "type": "paragraph",
                            "text": "Vista parcial: src/views/partials/customers/edit.hbs."
                        },
                        {
                            "type": "paragraph",
                            "text": "Modifique los campos necesarios y confirme con Editar Cliente. El cambio de estado permite activar o desactivar al cliente."
                        }
                    ]
                }
            ]
        },
        {
            "id": "3-inventario",
            "title": "3. Inventario",
            "blocks": [
                {
                    "type": "paragraph",
                    "text": "Ruta web: /inventory"
                },
                {
                    "type": "paragraph",
                    "text": "Vista: src/views/pages/inventory.hbs"
                },
                {
                    "type": "paragraph",
                    "text": "Acceso: autenticado."
                },
                {
                    "type": "paragraph",
                    "text": "La pantalla muestra tres indicadores: Total productos, Categorías y Stock total, además de tres pestañas: Inventario, Productos y Categorías."
                },
                {
                    "type": "image",
                    "caption": "Vista general del inventario",
                    "file": "public/docs/manual-images/06-inventory-overview.png"
                },
                {
                    "type": "subsection",
                    "id": "3-1-movimientos-de-inventario",
                    "title": "3.1 Movimientos de inventario",
                    "blocks": [
                        {
                            "type": "paragraph",
                            "text": "Pestaña: Inventario"
                        },
                        {
                            "type": "paragraph",
                            "text": "Vista parcial: src/views/partials/inventory/movement-create.hbs."
                        },
                        {
                            "type": "paragraph",
                            "text": "Permite consultar entradas y salidas registradas. Para registrar un movimiento indique:"
                        },
                        {
                            "type": "bullet",
                            "text": "Producto."
                        },
                        {
                            "type": "bullet",
                            "text": "Tipo de movimiento (entrada o salida)."
                        },
                        {
                            "type": "bullet",
                            "text": "Cantidad."
                        },
                        {
                            "type": "bullet",
                            "text": "Observaciones."
                        },
                        {
                            "type": "paragraph",
                            "text": "Confirme con Registrar Movimiento."
                        },
                        {
                            "type": "image",
                            "caption": "Lista de movimientos de inventario",
                            "file": "public/docs/manual-images/07-inventory-movements.png"
                        },
                        {
                            "type": "image",
                            "caption": "Formulario de movimiento de inventario",
                            "file": "public/docs/manual-images/08-inventory-movement-create.png"
                        }
                    ]
                },
                {
                    "type": "subsection",
                    "id": "3-2-productos",
                    "title": "3.2 Productos",
                    "blocks": [
                        {
                            "type": "paragraph",
                            "text": "Pestaña: Productos"
                        },
                        {
                            "type": "paragraph",
                            "text": "Vistas parciales: product-create.hbs y product-edit.hbs."
                        },
                        {
                            "type": "paragraph",
                            "text": "El listado permite buscar, filtrar por categoría, ver stock bajo y generar el Reporte de Inventario. Para crear un producto indique código, nombre, precio unitario, categoría, descripción e imagen; finalice con Registrar Producto. Para modificarlo use Editar Producto."
                        },
                        {
                            "type": "image",
                            "caption": "Listado de productos",
                            "file": "public/docs/manual-images/09-products-list.png"
                        },
                        {
                            "type": "image",
                            "caption": "Formulario de nuevo producto",
                            "file": "public/docs/manual-images/10-product-create.png"
                        }
                    ]
                },
                {
                    "type": "subsection",
                    "id": "3-3-categorias",
                    "title": "3.3 Categorías",
                    "blocks": [
                        {
                            "type": "paragraph",
                            "text": "Pestaña: Categorías"
                        },
                        {
                            "type": "paragraph",
                            "text": "Vistas parciales: category-create.hbs y category-edit.hbs."
                        },
                        {
                            "type": "paragraph",
                            "text": "Permite buscar, crear y editar categorías. El formulario solicita Nombre y Descripción; se guarda con Registrar Categoría."
                        },
                        {
                            "type": "image",
                            "caption": "Listado de categorías",
                            "file": "public/docs/manual-images/11-categories.png"
                        },
                        {
                            "type": "image",
                            "caption": "Formulario de nueva categoría",
                            "file": "public/docs/manual-images/12-category-create.png"
                        }
                    ]
                },
                {
                    "type": "subsection",
                    "id": "3-4-detalle-del-producto",
                    "title": "3.4 Detalle del producto",
                    "blocks": [
                        {
                            "type": "paragraph",
                            "text": "Ruta web: /product/:id"
                        },
                        {
                            "type": "paragraph",
                            "text": "Vista: src/views/pages/product-detail.hbs"
                        },
                        {
                            "type": "paragraph",
                            "text": "Acceso: autenticado."
                        },
                        {
                            "type": "paragraph",
                            "text": "Muestra el nombre, la categoría, el precio en dólares y bolívares, el precio con IVA y el estado de stock: En Stock, Poco Stock o No Disponible. Incluye accesos para volver al inventario y editar el producto."
                        }
                    ]
                }
            ]
        },
        {
            "id": "4-metodos-de-pago",
            "title": "4. Métodos de pago",
            "blocks": [
                {
                    "type": "paragraph",
                    "text": "Ruta web: /payments-methods"
                },
                {
                    "type": "paragraph",
                    "text": "Vista: src/views/pages/payment-method.hbs"
                },
                {
                    "type": "paragraph",
                    "text": "Acceso: autenticado."
                },
                {
                    "type": "subsection",
                    "id": "4-1-listado",
                    "title": "4.1 Listado",
                    "blocks": [
                        {
                            "type": "paragraph",
                            "text": "Muestra los métodos registrados y permite buscar entre ellos, agregar uno nuevo, editar los existentes y paginar el listado."
                        },
                        {
                            "type": "image",
                            "caption": "Listado de métodos de pago",
                            "file": "public/docs/manual-images/13-payment-methods-list.png"
                        }
                    ]
                },
                {
                    "type": "subsection",
                    "id": "4-2-crear-o-editar-metodo-de-pago",
                    "title": "4.2 Crear o editar método de pago",
                    "blocks": [
                        {
                            "type": "paragraph",
                            "text": "Vistas parciales: src/views/partials/payments/payment-method-create.hbs y payment-method-edit.hbs."
                        },
                        {
                            "type": "paragraph",
                            "text": "Los campos principales son nombre, tipo de pago, comisión y descripción. También se define si el método estará activo. Guarde con Crear Método de Pago o Editar Método de Pago."
                        },
                        {
                            "type": "image",
                            "caption": "Formulario de nuevo método de pago",
                            "file": "public/docs/manual-images/14-payment-method-create.png"
                        },
                        {
                            "type": "image",
                            "caption": "Formulario de edición de método de pago",
                            "file": "public/docs/manual-images/15-payment-method-edit.png"
                        }
                    ]
                }
            ]
        },
        {
            "id": "5-pedidos",
            "title": "5. Pedidos",
            "blocks": [
                {
                    "type": "paragraph",
                    "text": "Ruta web: /orders"
                },
                {
                    "type": "paragraph",
                    "text": "Vista: src/views/pages/orders.hbs"
                },
                {
                    "type": "paragraph",
                    "text": "Acceso: autenticado."
                },
                {
                    "type": "paragraph",
                    "text": "La pantalla muestra tarjetas con total de pedidos, pendientes, procesados y completados, además de la lista de pedidos con búsqueda, paginación y botón Nuevo Pedido."
                },
                {
                    "type": "image",
                    "caption": "Listado de pedidos",
                    "file": "public/docs/manual-images/16-orders-list.png"
                },
                {
                    "type": "subsection",
                    "id": "5-1-crear-pedido",
                    "title": "5.1 Crear pedido",
                    "blocks": [
                        {
                            "type": "paragraph",
                            "text": "Vista parcial: src/views/partials/orders/create-order.hbs."
                        },
                        {
                            "type": "number",
                            "text": "1. Identifique al cliente por nombre o cédula. Si no existe, use el acceso directo para registrarlo."
                        },
                        {
                            "type": "number",
                            "text": "2. Agregue productos indicando código o nombre y cantidad."
                        },
                        {
                            "type": "number",
                            "text": "3. Detalle las especificaciones de sublimación o personalización y el coste variable."
                        },
                        {
                            "type": "number",
                            "text": "4. Adjunte una imagen o diseño si aplica."
                        },
                        {
                            "type": "number",
                            "text": "5. Revise el total y presione Crear Pedido."
                        },
                        {
                            "type": "image",
                            "caption": "Identificación del cliente en un pedido",
                            "file": "public/docs/manual-images/17-order-create-customer.png"
                        },
                        {
                            "type": "image",
                            "caption": "Agregar producto a un pedido",
                            "file": "public/docs/manual-images/18-order-create-product.png"
                        },
                        {
                            "type": "image",
                            "caption": "Total del pedido",
                            "file": "public/docs/manual-images/19-order-total.png"
                        }
                    ]
                },
                {
                    "type": "subsection",
                    "id": "5-2-registrar-pago",
                    "title": "5.2 Registrar pago",
                    "blocks": [
                        {
                            "type": "paragraph",
                            "text": "Vista parcial: src/views/partials/orders/create-payment.hbs."
                        },
                        {
                            "type": "paragraph",
                            "text": "Desde la vista del pedido puede registrar pagos indicando monto, método de pago y referencia. El sistema calcula vuelto en dólares y bolívares cuando corresponde."
                        }
                    ]
                },
                {
                    "type": "subsection",
                    "id": "5-3-cambiar-estado",
                    "title": "5.3 Cambiar estado",
                    "blocks": [
                        {
                            "type": "paragraph",
                            "text": "Vista parcial: src/views/partials/orders/edit-order-status.hbs."
                        },
                        {
                            "type": "paragraph",
                            "text": "Permite actualizar el estado del pedido y confirmar con Actualizar Estado. Los estados gestionados son pendiente, procesado y completado."
                        }
                    ]
                }
            ]
        },
        {
            "id": "6-ventas-y-cajas-registradoras",
            "title": "6. Ventas y cajas registradoras",
            "blocks": [
                {
                    "type": "paragraph",
                    "text": "Ruta web: /shopping"
                },
                {
                    "type": "paragraph",
                    "text": "Vista: src/views/pages/shopping.hbs"
                },
                {
                    "type": "paragraph",
                    "text": "Acceso: autenticado."
                },
                {
                    "type": "paragraph",
                    "text": "La pantalla muestra la tasa del dólar, el estado de la caja y dos pestañas: Ventas y Cajas Registradoras."
                },
                {
                    "type": "image",
                    "caption": "Listado de ventas",
                    "file": "public/docs/manual-images/20-sales-list.png"
                },
                {
                    "type": "subsection",
                    "id": "6-1-nueva-venta",
                    "title": "6.1 Nueva venta",
                    "blocks": [
                        {
                            "type": "paragraph",
                            "text": "Vista parcial: src/views/partials/shopping/shopping-create.hbs."
                        },
                        {
                            "type": "number",
                            "text": "1. Identifique al cliente por nombre, apellido o cédula; si no existe, regístrelo desde el enlace disponible."
                        },
                        {
                            "type": "number",
                            "text": "2. Busque productos por nombre o código y agregue las cantidades."
                        },
                        {
                            "type": "number",
                            "text": "3. Revise subtotal, total y montos de pago."
                        },
                        {
                            "type": "number",
                            "text": "4. Registre los pagos y las referencias correspondientes."
                        },
                        {
                            "type": "number",
                            "text": "5. Confirme con Crear Venta."
                        },
                        {
                            "type": "image",
                            "caption": "Identificación del cliente en una venta",
                            "file": "public/docs/manual-images/21-sale-create-customer.png"
                        },
                        {
                            "type": "image",
                            "caption": "Registro de pago de una venta",
                            "file": "public/docs/manual-images/22-sale-create-payment.png"
                        }
                    ]
                },
                {
                    "type": "subsection",
                    "id": "6-2-cajas-registradoras",
                    "title": "6.2 Cajas registradoras",
                    "blocks": [
                        {
                            "type": "paragraph",
                            "text": "Vista parcial: src/views/partials/shopping/box-register.hbs."
                        },
                        {
                            "type": "paragraph",
                            "text": "Permite buscar cajas, crear una nueva y editar las existentes. Los formularios solicitan nombre, ubicación y, para cajas digitales, datos como banco, teléfono de Pago Móvil o Zelle. Se guardan con Crear Caja Registradora o Editar Caja Registradora."
                        }
                    ]
                },
                {
                    "type": "subsection",
                    "id": "6-3-detalle-de-caja",
                    "title": "6.3 Detalle de caja",
                    "blocks": [
                        {
                            "type": "paragraph",
                            "text": "Ruta web: /box-register/:id"
                        },
                        {
                            "type": "paragraph",
                            "text": "Vista: src/views/pages/box-register.hbs"
                        },
                        {
                            "type": "paragraph",
                            "text": "Acceso: autenticado."
                        },
                        {
                            "type": "paragraph",
                            "text": "Muestra la identidad de la caja —nombre, tipo “Digital / Banco” o “Efectivo físico”, monto en USD y empresa— y el último control de caja con fechas de apertura y cierre formateadas."
                        },
                        {
                            "type": "paragraph",
                            "text": "Incluye:"
                        },
                        {
                            "type": "bullet",
                            "text": "Control de Caja: abre o cierra el turno, muestra saldo inicial en Bs. y USD, monto en caja y resumen de ingresos, egresos y vueltos. Al cerrar se puede escribir una Nota de cierre."
                        },
                        {
                            "type": "bullet",
                            "text": "Movimientos de Caja: registra ingresos o egresos con método de pago, monto y, si es digital, referencia y cuenta receptora."
                        }
                    ]
                }
            ]
        },
        {
            "id": "7-nomina",
            "title": "7. Nómina",
            "blocks": [
                {
                    "type": "subsection",
                    "id": "7-1-gestion-de-nomina",
                    "title": "7.1 Gestión de nómina",
                    "blocks": [
                        {
                            "type": "paragraph",
                            "text": "Ruta web: /payroll"
                        },
                        {
                            "type": "paragraph",
                            "text": "Vista: src/views/pages/payroll.hbs"
                        },
                        {
                            "type": "paragraph",
                            "text": "Acceso: autenticado; generar nómina es una acción disponible para admin."
                        },
                        {
                            "type": "paragraph",
                            "text": "Muestra resumen de total de nóminas, total pagado, total de empleados y última nómina, además del historial."
                        },
                        {
                            "type": "paragraph",
                            "text": "Para generar una nómina indique el periodo inicio y el periodo fin y presione Generar Nómina."
                        },
                        {
                            "type": "paragraph",
                            "text": "Para pagar, abra Pagar Nómina, revise el periodo, total, pagado y pendiente, indique el monto en bolívares, el tipo de pago —efectivo o transferencia/pago móvil— y la referencia si corresponde."
                        }
                    ]
                },
                {
                    "type": "subsection",
                    "id": "7-2-detalle-de-empleado-y-nomina-individual",
                    "title": "7.2 Detalle de empleado y nómina individual",
                    "blocks": [
                        {
                            "type": "paragraph",
                            "text": "Ruta web: /settings/employe/:id"
                        },
                        {
                            "type": "paragraph",
                            "text": "Vista: src/views/pages/employe.hbs"
                        },
                        {
                            "type": "paragraph",
                            "text": "Acceso: autenticado."
                        },
                        {
                            "type": "paragraph",
                            "text": "Muestra los datos del empleado, su estado activo/inactivo y el historial de nóminas del empleado. Desde aquí se puede registrar una nómina individual con fechas de inicio y fin, montos y descripción; se guarda con Registrar Nómina."
                        }
                    ]
                }
            ]
        },
        {
            "id": "8-perfil",
            "title": "8. Perfil",
            "blocks": [
                {
                    "type": "paragraph",
                    "text": "Ruta web: /profile"
                },
                {
                    "type": "paragraph",
                    "text": "Vista: src/views/pages/profile.hbs"
                },
                {
                    "type": "paragraph",
                    "text": "Acceso: autenticado."
                },
                {
                    "type": "paragraph",
                    "text": "Muestra los datos del usuario activo: nombre del empleado, usuario, empresa, slogan y rol. Tiene tres pestañas."
                },
                {
                    "type": "image",
                    "caption": "Vista general del perfil",
                    "file": "public/docs/manual-images/23-profile.png"
                },
                {
                    "type": "subsection",
                    "id": "8-1-datos-de-empleado",
                    "title": "8.1 Datos de Empleado",
                    "blocks": [
                        {
                            "type": "paragraph",
                            "text": "Vista parcial: src/views/partials/profile/empleado.hbs."
                        },
                        {
                            "type": "paragraph",
                            "text": "Consulta y edita información personal: nombre, apellido, cédula, teléfono, correo, dirección y salario base. Guarde con Editar Empleado."
                        }
                    ]
                },
                {
                    "type": "subsection",
                    "id": "8-2-seguridad",
                    "title": "8.2 Seguridad",
                    "blocks": [
                        {
                            "type": "paragraph",
                            "text": "Vista parcial: src/views/partials/profile/seguridad.hbs."
                        },
                        {
                            "type": "paragraph",
                            "text": "Permite cambiar la contraseña. Solicita contraseña actual, nueva contraseña y confirmación. Confirme con Cambiar Contraseña."
                        },
                        {
                            "type": "image",
                            "caption": "Cambio de contraseña",
                            "file": "public/docs/manual-images/24-profile-security.png"
                        }
                    ]
                },
                {
                    "type": "subsection",
                    "id": "8-3-preguntas-de-seguridad",
                    "title": "8.3 Preguntas de seguridad",
                    "blocks": [
                        {
                            "type": "paragraph",
                            "text": "Vista parcial: src/views/partials/profile/question.hbs."
                        },
                        {
                            "type": "paragraph",
                            "text": "Configure preguntas y respuestas para la recuperación de acceso. Use Validar Identidad cuando el sistema lo solicite."
                        },
                        {
                            "type": "image",
                            "caption": "Preguntas de seguridad",
                            "file": "public/docs/manual-images/25-profile-questions.png"
                        }
                    ]
                },
                {
                    "type": "subsection",
                    "id": "8-4-cerrar-sesion",
                    "title": "8.4 Cerrar sesión",
                    "blocks": [
                        {
                            "type": "paragraph",
                            "text": "Se ejecuta desde el menú del perfil con Cerrar Sesión. Finaliza la sesión activa y devuelve al usuario a la pantalla pública."
                        },
                        {
                            "type": "image",
                            "caption": "Cierre de sesión",
                            "file": "public/docs/manual-images/46-logout.png"
                        }
                    ]
                }
            ]
        },
        {
            "id": "9-administracion-mantenimiento",
            "title": "9. Administración / Mantenimiento",
            "blocks": [
                {
                    "type": "paragraph",
                    "text": "Ruta web: /management"
                },
                {
                    "type": "paragraph",
                    "text": "Vista: src/views/pages/management.hbs"
                },
                {
                    "type": "paragraph",
                    "text": "Acceso: solo superadmin."
                },
                {
                    "type": "paragraph",
                    "text": "Tiene tres pestañas."
                },
                {
                    "type": "image",
                    "caption": "Vista de mantenimiento",
                    "file": "public/docs/manual-images/26-maintenance.png"
                },
                {
                    "type": "subsection",
                    "id": "9-1-reportes-de-venta",
                    "title": "9.1 Reportes de venta",
                    "blocks": [
                        {
                            "type": "paragraph",
                            "text": "Vista parcial: src/views/partials/management/report-sales.hbs."
                        },
                        {
                            "type": "paragraph",
                            "text": "Permite generar un reporte detallado de ventas con Generar Reporte."
                        },
                        {
                            "type": "image",
                            "caption": "Generación de reporte de ventas",
                            "file": "public/docs/manual-images/27-maintenance-report.png"
                        }
                    ]
                },
                {
                    "type": "subsection",
                    "id": "9-2-exportar-base-de-datos",
                    "title": "9.2 Exportar base de datos",
                    "blocks": [
                        {
                            "type": "paragraph",
                            "text": "Vista parcial: src/views/partials/management/db-export.hbs."
                        },
                        {
                            "type": "paragraph",
                            "text": "Permite descargar la base de datos en formato JSON o SQL."
                        }
                    ]
                },
                {
                    "type": "subsection",
                    "id": "9-3-importar-base-de-datos",
                    "title": "9.3 Importar base de datos",
                    "blocks": [
                        {
                            "type": "paragraph",
                            "text": "Vista parcial: src/views/partials/management/db-import.hbs."
                        },
                        {
                            "type": "paragraph",
                            "text": "Permite cargar un archivo de respaldo para restaurar la información."
                        },
                        {
                            "type": "image",
                            "caption": "Exportación e importación de la base de datos",
                            "file": "public/docs/manual-images/28-maintenance-db.png"
                        },
                        {
                            "type": "note",
                            "text": "Cualquier ruta bajo /management/* que no exista redirige automáticamente a /management."
                        }
                    ]
                }
            ]
        },
        {
            "id": "10-configuracion",
            "title": "10. Configuración",
            "blocks": [
                {
                    "type": "paragraph",
                    "text": "Ruta web: /settings"
                },
                {
                    "type": "paragraph",
                    "text": "Vista: src/views/pages/settings.hbs"
                },
                {
                    "type": "paragraph",
                    "text": "Acceso: admin y superadmin."
                },
                {
                    "type": "paragraph",
                    "text": "Tiene cinco pestañas: Empresa, Empleados, Usuarios, Tasa del Dólar e IVA."
                },
                {
                    "type": "image",
                    "caption": "Vista de configuración",
                    "file": "public/docs/manual-images/29-settings.png"
                },
                {
                    "type": "subsection",
                    "id": "10-1-empresa",
                    "title": "10.1 Empresa",
                    "blocks": [
                        {
                            "type": "paragraph",
                            "text": "Vista parcial: src/views/partials/settings/company-info.hbs."
                        },
                        {
                            "type": "paragraph",
                            "text": "Administra la ficha corporativa: nombre, RIF, descripción, dirección, ciudad, teléfono, correo, sitio web y slogan. Guarde con Editar Información."
                        },
                        {
                            "type": "image",
                            "caption": "Configuración de la empresa",
                            "file": "public/docs/manual-images/30-company.png"
                        },
                        {
                            "type": "image",
                            "caption": "Servicios desde la configuración de empresa",
                            "file": "public/docs/manual-images/31-company-services.png"
                        },
                        {
                            "type": "image",
                            "caption": "Información de la empresa",
                            "file": "public/docs/manual-images/32-company-info.png"
                        }
                    ]
                },
                {
                    "type": "subsection",
                    "id": "10-2-servicios-de-la-empresa",
                    "title": "10.2 Servicios de la empresa",
                    "blocks": [
                        {
                            "type": "paragraph",
                            "text": "Vista parcial: src/views/partials/settings/services.hbs."
                        },
                        {
                            "type": "paragraph",
                            "text": "Dentro de la pestaña Empresa se lista y busca los servicios contratados. Para registrar uno indique nombre, proveedor, costo, día de corte y descripción; finalice con Registrar Servicio. Para modificarlo use Guardar Cambios."
                        },
                        {
                            "type": "image",
                            "caption": "Listado de servicios",
                            "file": "public/docs/manual-images/33-services-list.png"
                        },
                        {
                            "type": "image",
                            "caption": "Registro de servicio",
                            "file": "public/docs/manual-images/34-service-create.png"
                        }
                    ]
                },
                {
                    "type": "subsection",
                    "id": "10-3-detalle-del-servicio",
                    "title": "10.3 Detalle del servicio",
                    "blocks": [
                        {
                            "type": "paragraph",
                            "text": "Ruta web: /settings/service/:id"
                        },
                        {
                            "type": "paragraph",
                            "text": "Vista: src/views/pages/service.hbs"
                        },
                        {
                            "type": "paragraph",
                            "text": "Acceso: autenticado."
                        },
                        {
                            "type": "paragraph",
                            "text": "Muestra el nombre del servicio, proveedor, día de corte, próximo corte, costo mensual y fecha de creación. Tiene tres pestañas:"
                        },
                        {
                            "type": "bullet",
                            "text": "Detalles: información general del servicio."
                        },
                        {
                            "type": "bullet",
                            "text": "Facturación: periodos con estado pagado, parcial, vencido o pendiente y días restantes/vencidos."
                        },
                        {
                            "type": "bullet",
                            "text": "Pagos: historial de pagos y botón Registrar Pago, donde se selecciona el periodo a pagar y se ingresa la referencia."
                        },
                        {
                            "type": "image",
                            "caption": "Detalle del servicio",
                            "file": "public/docs/manual-images/35-service-details.png"
                        },
                        {
                            "type": "image",
                            "caption": "Facturación del servicio",
                            "file": "public/docs/manual-images/36-service-billing.png"
                        },
                        {
                            "type": "image",
                            "caption": "Pagos del servicio",
                            "file": "public/docs/manual-images/37-service-payments.png"
                        }
                    ]
                },
                {
                    "type": "subsection",
                    "id": "10-4-empleados",
                    "title": "10.4 Empleados",
                    "blocks": [
                        {
                            "type": "paragraph",
                            "text": "Vista parcial: src/views/partials/settings/employes.hbs."
                        },
                        {
                            "type": "paragraph",
                            "text": "Muestra la plantilla laboral con estado activo/inactivo, búsqueda por cédula o nombre, edición y botón para agregar empleado. El formulario solicita cédula, nombre, apellido, teléfono, correo, dirección y salario base; se guarda con Registrar Empleado."
                        },
                        {
                            "type": "image",
                            "caption": "Listado de empleados",
                            "file": "public/docs/manual-images/38-employees-list.png"
                        },
                        {
                            "type": "image",
                            "caption": "Registro de empleado",
                            "file": "public/docs/manual-images/39-employee-create.png"
                        }
                    ]
                },
                {
                    "type": "subsection",
                    "id": "10-5-usuarios",
                    "title": "10.5 Usuarios",
                    "blocks": [
                        {
                            "type": "paragraph",
                            "text": "Vista parcial: src/views/partials/settings/user.hbs."
                        },
                        {
                            "type": "paragraph",
                            "text": "Gestiona las cuentas de acceso: estado activo/inactivo, búsqueda por nombre de usuario, edición de permisos y creación de usuarios. Para crear indique nombre de usuario, tipo de usuario, contraseña y empleado vinculado; confirme con Registrar."
                        },
                        {
                            "type": "image",
                            "caption": "Listado de usuarios",
                            "file": "public/docs/manual-images/40-users-list.png"
                        },
                        {
                            "type": "image",
                            "caption": "Registro de usuario",
                            "file": "public/docs/manual-images/41-user-create.png"
                        }
                    ]
                },
                {
                    "type": "subsection",
                    "id": "10-6-tasa-del-dolar",
                    "title": "10.6 Tasa del dólar",
                    "blocks": [
                        {
                            "type": "paragraph",
                            "text": "Vista parcial: src/views/partials/settings/exchange-rate.hbs."
                        },
                        {
                            "type": "paragraph",
                            "text": "Muestra la tasa actual y el historial de cambios. Para actualizar ingrese la tasa vigente y presione Actualizar Tasa. La tasa activa se usa en ventas, pedidos, productos y cajas."
                        },
                        {
                            "type": "image",
                            "caption": "Historial de tasa del dólar",
                            "file": "public/docs/manual-images/42-exchange-rate-list.png"
                        },
                        {
                            "type": "image",
                            "caption": "Actualización de tasa del dólar",
                            "file": "public/docs/manual-images/43-exchange-rate-update.png"
                        }
                    ]
                },
                {
                    "type": "subsection",
                    "id": "10-7-iva",
                    "title": "10.7 IVA",
                    "blocks": [
                        {
                            "type": "paragraph",
                            "text": "Vista parcial: src/views/partials/settings/iva.hbs."
                        },
                        {
                            "type": "paragraph",
                            "text": "Muestra el IVA actual y su historial. Para actualizar indique el nuevo porcentaje y una observación de soporte; confirme con Actualizar Tasa. El IVA activo se aplica en el cálculo de precios y ventas."
                        },
                        {
                            "type": "image",
                            "caption": "Historial de IVA",
                            "file": "public/docs/manual-images/44-iva-list.png"
                        },
                        {
                            "type": "image",
                            "caption": "Actualización de IVA",
                            "file": "public/docs/manual-images/45-iva-update.png"
                        },
                        {
                            "type": "note",
                            "text": "Cualquier ruta bajo /settings/* que no exista redirige automáticamente a /settings."
                        }
                    ]
                }
            ]
        },
        {
            "id": "11-errores-y-soporte",
            "title": "11. Errores y soporte",
            "blocks": [
                {
                    "type": "subsection",
                    "id": "11-1-acceso-denegado-403",
                    "title": "11.1 Acceso denegado (403)",
                    "blocks": [
                        {
                            "type": "paragraph",
                            "text": "Vista: src/views/pages/403.hbs."
                        },
                        {
                            "type": "paragraph",
                            "text": "Aparece cuando el usuario no tiene sesión o su rol no permite acceder a la página. Muestra “Acceso Denegado” y un enlace Volver al inicio."
                        }
                    ]
                },
                {
                    "type": "subsection",
                    "id": "11-2-pagina-no-encontrada-404",
                    "title": "11.2 Página no encontrada (404)",
                    "blocks": [
                        {
                            "type": "paragraph",
                            "text": "Vista: src/views/pages/404.hbs."
                        },
                        {
                            "type": "paragraph",
                            "text": "Aparece para rutas de vista no registradas. Muestra “Página No Encontrada”."
                        }
                    ]
                },
                {
                    "type": "subsection",
                    "id": "11-3-situaciones-frecuentes",
                    "title": "11.3 Situaciones frecuentes",
                    "blocks": [
                        {
                            "type": "bullet",
                            "text": "No puedo iniciar sesión: verifique usuario y contraseña; si olvidó la contraseña, use /rescue."
                        },
                        {
                            "type": "bullet",
                            "text": "No veo Administración: esa opción solo está disponible para superadmin."
                        },
                        {
                            "type": "bullet",
                            "text": "No veo Configuración: esa opción solo está disponible para admin y superadmin."
                        },
                        {
                            "type": "bullet",
                            "text": "Los precios no muestran tasa o IVA: verifique que exista una Tasa del Dólar y un IVA activos en Configuración."
                        },
                        {
                            "type": "bullet",
                            "text": "Una caja no permite operar: revise el control de caja desde el detalle de la caja registradora."
                        },
                        {
                            "type": "bullet",
                            "text": "El inventario marca poco stock: registre una entrada de producto desde Inventario → Movimientos."
                        },
                        {
                            "type": "bullet",
                            "text": "El manual no abre: descárguelo desde Ayuda o desde public/docs/manual.pdf."
                        }
                    ]
                }
            ]
        },
        {
            "id": "apendice-a-rutas-y-archivos-de-vista",
            "title": "Apéndice A. Rutas y archivos de vista",
            "blocks": [
                {
                    "type": "bullet",
                    "text": "/ → pages/home.hbs"
                },
                {
                    "type": "bullet",
                    "text": "/login → pages/login.hbs"
                },
                {
                    "type": "bullet",
                    "text": "/rescue → pages/rescue.hbs"
                },
                {
                    "type": "bullet",
                    "text": "/help → pages/help.hbs"
                },
                {
                    "type": "bullet",
                    "text": "/customers → pages/customers.hbs"
                },
                {
                    "type": "bullet",
                    "text": "/inventory → pages/inventory.hbs"
                },
                {
                    "type": "bullet",
                    "text": "/product/:id → pages/product-detail.hbs"
                },
                {
                    "type": "bullet",
                    "text": "/payments-methods → pages/payment-method.hbs"
                },
                {
                    "type": "bullet",
                    "text": "/orders → pages/orders.hbs"
                },
                {
                    "type": "bullet",
                    "text": "/shopping → pages/shopping.hbs"
                },
                {
                    "type": "bullet",
                    "text": "/box-register/:id → pages/box-register.hbs"
                },
                {
                    "type": "bullet",
                    "text": "/payroll → pages/payroll.hbs"
                },
                {
                    "type": "bullet",
                    "text": "/profile → pages/profile.hbs"
                },
                {
                    "type": "bullet",
                    "text": "/management → pages/management.hbs"
                },
                {
                    "type": "bullet",
                    "text": "/settings → pages/settings.hbs"
                },
                {
                    "type": "bullet",
                    "text": "/settings/service/:id → pages/service.hbs"
                },
                {
                    "type": "bullet",
                    "text": "/settings/employe/:id → pages/employe.hbs"
                },
                {
                    "type": "bullet",
                    "text": "Sin ruta coincidente → pages/404.hbs"
                },
                {
                    "type": "bullet",
                    "text": "Sin permisos → pages/403.hbs"
                },
                {
                    "type": "paragraph",
                    "text": "Todas las rutas anteriores se definen en src/routes/routes.views.js, excepto 403.hbs, que es renderizada por src/middlewares/validRole.js."
                }
            ]
        },
        {
            "id": "apendice-b-glosario",
            "title": "Apéndice B. Glosario",
            "blocks": [
                {
                    "type": "bullet",
                    "text": "Caja registradora: punto de cobro físico o digital configurado para la empresa."
                },
                {
                    "type": "bullet",
                    "text": "Control de caja: apertura, cierre y resumen de movimientos de un turno."
                },
                {
                    "type": "bullet",
                    "text": "Iva: porcentaje tributario activo aplicado a precios y ventas."
                },
                {
                    "type": "bullet",
                    "text": "Movimiento: entrada o salida de productos que modifica el stock."
                },
                {
                    "type": "bullet",
                    "text": "Pedido: solicitud de productos pendiente de procesar o completar."
                },
                {
                    "type": "bullet",
                    "text": "Periodo: ciclo mensual de facturación de un servicio de la empresa."
                },
                {
                    "type": "bullet",
                    "text": "Rol: nivel de permiso del usuario: usuario autenticado, admin o superadmin."
                },
                {
                    "type": "bullet",
                    "text": "Tasa del dólar: tipo de cambio activo usado para conversiones entre USD y Bs."
                },
                {
                    "type": "bullet",
                    "text": "Venta: transacción confirmada con uno o más pagos registrados."
                }
            ]
        }
    ]
};
