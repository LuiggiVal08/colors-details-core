import sequelize from '../config/sequelize.js';

import Caja from './Caja.js';
import CategoriaProducto from './CategoriaProducto.js';
import Cliente from './Cliente.js';
import ControlCaja from './ControlCaja.js';
import Empleado from './Empleado.js';
import Empresa from './Empresa.js';
import Iva from './Iva.js';
import MetodoPago from './MetodoPago.js';
import NominaEmpleado from './NominaEmpleado.js';
import PagoPedido from './PagoPedido.js';
import Pedido from './Pedido.js';
import PedidoDetalle from './PedidoDetalle.js';
import PreguntaSeguridad from './PreguntaSeguridad.js';
import PreguntaSeguridadUsuario from './PreguntaSeguridadUsuario.js';
import Producto from './Producto.js';
import ServicioEmpresa from './ServicioEmpresa.js';
import PagoServicio from './PagoServicio.js';
import TasaDolar from './TasaDolar.js';
import TipoUsuario from './TipoUsuario.js';
import Usuario from './Usuario.js';
import MovimientoProducto from './MovimientoProducto.js';
import Venta from './Venta.js';
import VentaDetalle from './VentaDetalle.js';
import PagoVenta from './PagoVenta.js';
import MovimientoCaja from './MovimientoCaja.js';
import ServicioPrecio from './ServicioPrecio.js';
import PagoTransaccion from './PagoTransaccion.js';
import ServicioPeriodo from './ServicioPeriodo.js';
import CreditoServicio from './CreditoServicio.js';
const models = {
    Empresa,
    Caja,
    Empleado,
    TipoUsuario,
    Usuario,
    Cliente,
    CategoriaProducto,
    Producto,
    MovimientoProducto,
    Pedido,
    PedidoDetalle,
    MetodoPago,
    Pago: PagoPedido,
    NominaEmpleado,
    ServicioEmpresa,
    Servicio: ServicioEmpresa,
    PagoServicio,
    ServicioPrecio,
    ServicioPeriodo,
    PagoTransaccion,
    CreditoServicio,
    ControlCaja,
    TasaDolar,
    Iva,
    PreguntaSeguridad,
    PreguntaSeguridadUsuario,
    Venta,
    VentaDetalle,
    PagoVenta,
    MovimientoCaja,

    sequelize,
};
export { sequelize, models };
