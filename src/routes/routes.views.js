import { Router } from 'express';
import path from 'path';
import { models } from '../models/index.js';
import isAuthenticatedView from '../middlewares/isAuthenticatedView.js';
import validRole from '../middlewares/validRole.js';
import logger from '../config/logger.js';

const router = Router();
const basePath = (page) => path.join('pages', page);

router.get('/', (req, res) => {
    res.render(basePath('home'), {
        title: 'Inicio',
    });
});
router.get('/login', isAuthenticatedView, (req, res) => {
    res.render(basePath('login'), {
        title: 'Iniciar sesión',
    });
});
router.get('/inventory', isAuthenticatedView, async (req, res) => {
    const categorias = await models.CategoriaProducto.findAll();
    const productos = await models.Producto.findAll();
    const data = {
        categorias: categorias.map((categoria) => categoria.toJSON()),
        productos: productos.map((producto) => producto.toJSON()),
        countCategorias: categorias.length || 0,
        countProducts: (await models.Producto.count()) || 0,
        stockTotal: (await models.Producto.sum('stock')) || 0,
    };
    res.render(basePath('inventory'), {
        title: 'Inventario',
        ...data,
    });
});
router.get('/customers', isAuthenticatedView, (req, res) => {
    res.render(basePath('customers'), {
        title: 'Clientes',
    });
});
router.get('/shopping', isAuthenticatedView, async (req, res) => {
    const Empresa = await models.Empresa.findOne();
    const clients = await models.Cliente.findAll({
        where: { activo: true },
        order: [['nombre', 'ASC']],
    });
    const iva = await models.Iva.findOne({ where: { activa: true } });
    const tasaDolar = await models.TasaDolar.findOne({ where: { activa: true } });
    const productos = await models.Producto.findAll();
    const methodsPayment = await models.MetodoPago.findAll();
    res.render(basePath('shopping'), {
        title: 'Ventas',

        company: Empresa ? Empresa.toJSON() : null,
        iva: iva ? iva.toJSON() : null,
        tasaDolar: tasaDolar ? tasaDolar.toJSON() : null,
        clients: clients.map((cliente) => cliente.toJSON()),
        productos: productos.map((producto) => producto.toJSON()),
        methodsPayment: methodsPayment.map((metodo) => metodo.toJSON()),
    });
});
router.get('/payments-methods', isAuthenticatedView, async (req, res) => {
    res.render(basePath('payment-method'), {
        title: 'Métodos de Pago',
    });
});
router.get('/orders', isAuthenticatedView, async (req, res) => {
    try {
        const ordersPending = await models.Pedido.findAll({
            where: { estado: 'pendiente' },
            include: [{ model: models.Usuario, as: 'usuario' }],
            order: [['fecha', 'DESC']],
        });

        const ordersProcessed = await models.Pedido.findAll({
            where: { estado: 'procesado' },
            include: [{ model: models.Usuario, as: 'usuario' }],
            order: [['fecha', 'DESC']],
        });

        const ordersComplit = await models.Pedido.findAll({
            where: { estado: 'completado' },
            include: [{ model: models.Usuario, as: 'usuario' }],
            order: [['fecha', 'DESC']],
        });
        const orders = ordersPending.concat(ordersProcessed).concat(ordersComplit);

        const countOrdersPending = ordersPending.length || 0;
        const countOrdersProcessed = ordersProcessed.length || 0;
        const countOrdersComplit = ordersComplit.length || 0;
        const coutOrdersTotal = orders.length || 0;

        const clients = await models.Cliente.findAll({
            where: { activo: true },
            order: [['nombre', 'ASC']],
        });
        const iva = await models.Iva.findOne({ where: { activa: true } });
        const tasaDolar = await models.TasaDolar.findOne({ where: { activa: true } });
        const productos = await models.Producto.findAll();
        const methodsPayment = await models.MetodoPago.findAll();
        res.render(basePath('orders'), {
            title: 'Pedidos',
            session: req.cookies?.sid ? true : false,
            isAdmin: req.cookies?.role === 'superadmin',

            countOrders: {
                countOrdersPending,
                countOrdersProcessed,
                countOrdersComplit,
                coutOrdersTotal,
            },
            orders,
            iva: iva.toJSON(),
            tasaDolar: tasaDolar.toJSON(),
            clients: clients.map((cliente) => cliente.toJSON()),
            productos: productos.map((producto) => producto.toJSON()),
            methodsPayment: methodsPayment.map((metodo) => metodo.toJSON()),
        });
    } catch (error) {
        logger.error(error);
        res.render(basePath('orders'), {
            title: 'Pedidos',
            session: req.cookies?.sid ? true : false,
            isAdmin: req.cookies?.role === 'superadmin',

            countOrders: {
                countOrdersPending: 0,
                countOrdersProcessed: 0,
                countOrdersComplit: 0,
                coutOrdersTotal: 0,
            },
            orders: [],
            // clients: [],
        });
    }
});
router.get('/help', (req, res) => {
    res.render(basePath('help'), {
        title: 'Recuperación de Contraseña',
    });
});
router.get('/rescue', (req, res) => {
    res.render(basePath('rescue'), {
        title: 'Recuperación de Contraseña',
    });
});
router.get('/management', isAuthenticatedView, validRole(['superadmin']), async (req, res) => {
    res.render(basePath('management'), {
        title: 'Administración',
    });
});
router.get('/box-register/:id', isAuthenticatedView, validRole([]), async (req, res) => {
    const { id } = req.params;
    const caja = await models.Caja.findByPk(id, {
        include: [{ model: models.Empresa, as: 'empresa' }],
    });
    const cajaUltimoControl = await models.ControlCaja.findOne({
        where: { caja_id: id },
        order: [['fecha_apertura', 'DESC']],
    });

    res.render(basePath('box-register'), {
        title: 'Registro de Caja',
        caja: {
            ...(caja ? caja.toJSON() : null),

            ultimo_control: cajaUltimoControl
                ? {
                      ...(cajaUltimoControl ? cajaUltimoControl.toJSON() : null),
                      fecha_apertura: cajaUltimoControl?.fecha_apertura
                          ? new Date(cajaUltimoControl.fecha_apertura).toLocaleString()
                          : null,
                      fecha_cierre: cajaUltimoControl?.fecha_cierre
                          ? new Date(cajaUltimoControl.fecha_cierre).toLocaleString()
                          : null,
                  }
                : null,
        },
    });
});
router.get('/management/*splat', (req, res) => {
    return res.redirect('/management');
});
router.get('/profile', isAuthenticatedView, async (req, res) => {
    const { id, username, rol } = res.locals.user || {};
    const questions = await models.PreguntaSeguridad.findAll();
    const user = await models.Usuario.findByPk(id, {
        include: [
            { model: models.Empleado, as: 'empleado' },
            { model: models.TipoUsuario, as: 'tipo' },
        ],
    });
    console.log(req.cookies?.role === 'superadmin');
    console.log(req.cookies);

    const empresa = await models.Empresa.findOne();
    const sueldoBase = new Intl.NumberFormat('es-VE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(user?.empleado?.salario_base);

    res.render(basePath('profile'), {
        title: 'Perfil',
        usuario: user ? user.toJSON() : null,
        empresa: empresa ? empresa.toJSON() : null,
        id_usuario: id,
        sueldoBase,
        questions: questions.map((question) => question.toJSON()),
    });
});
router.get('/settings', isAuthenticatedView, validRole(['admin', 'superadmin']), async (req, res) => {
    const Empresa = await models.Empresa.findOne();
    const ivaActual = await models.Iva.findOne({ where: { activa: true }, include: ['usuario'] });
    const ivaActualData = ivaActual ? ivaActual.toJSON() : null;
    const tasaDolarActual = await models.TasaDolar.findOne({ where: { activa: true }, include: ['usuario'] });
    const tasaDolarActualData = tasaDolarActual ? tasaDolarActual.toJSON() : null;
    res.render(basePath('settings'), {
        title: 'Mantenimiento',

        company: Empresa ? Empresa.toJSON() : null,
        ivaActual: {
            ...ivaActualData,
            fecha: ivaActualData?.fecha ? new Date(ivaActualData.fecha).toLocaleDateString() : null,
        },
        tasaDolarActual: {
            ...tasaDolarActualData,
            fecha: tasaDolarActualData?.fecha ? new Date(tasaDolarActualData.fecha).toLocaleDateString() : null,
            cambio: () => {
                const cambio = tasaDolarActualData?.cambio
                    ? (((tasaDolarActual.tasa - tasaDolarActual.cambio) / tasaDolarActual.cambio) * 100).toFixed(2)
                    : '';

                const signo = cambio > 0 ? '+' : '-';
                return `${signo}${Math.abs(cambio)}%`;
            },
            upToDown: () => {
                const cambio = tasaDolarActualData?.cambio
                    ? (((tasaDolarActual.tasa - tasaDolarActual.cambio) / tasaDolarActual.cambio) * 100).toFixed(2)
                    : '';
                return cambio > 0;
            },
        },
    });
});
router.get('/settings/service/:id', isAuthenticatedView, async (req, res) => {
    const { id } = req.params;
    const service = await models.ServicioEmpresa.findByPk(id, {
        include: [{ model: models.ServicioPeriodo, as: 'periodos' }],
    });
    const serviceJson = service ? service.toJSON() : null;

    // Tomamos el último periodo (si existe) para obtener la fecha de corte
    const pago_actual = serviceJson?.periodos?.[0] ?? null;
    const fecha_corte = pago_actual ? new Date(pago_actual.fecha_corte).toLocaleDateString() : null;

    // Obtener historial de precios y periodos para la vista
    const preciosRaw = await models.ServicioPrecio.findAll({
        where: { servicio_id: id },
        order: [['fecha_inicio', 'DESC']],
    });
    const periodosRaw = await models.ServicioPeriodo.findAll({
        where: { servicio_id: id },
        order: [['fecha_corte', 'DESC']],
    });

    const precios = preciosRaw.map((p) => {
        const pj = p.toJSON ? p.toJSON() : p;
        return {
            ...pj,
            fecha_inicio: pj.fecha_inicio ? new Date(pj.fecha_inicio).toLocaleDateString() : null,
            fecha_fin: pj.fecha_fin ? new Date(pj.fecha_fin).toLocaleDateString() : null,
            precio: typeof pj.precio === 'number' ? pj.precio.toFixed(2) : pj.precio,
        };
    });

    const periodos = periodosRaw.map((r) => {
        const pj = r.toJSON ? r.toJSON() : r;
        return {
            ...pj,
            fecha_generada: pj.fecha_generada ? new Date(pj.fecha_generada).toLocaleDateString() : null,
            fecha_corte: pj.fecha_corte ? new Date(pj.fecha_corte).toLocaleDateString() : null,
            amount_due: pj.amount_due ?? null,
            amount_balance: pj.amount_balance ?? null,
        };
    });

    res.render(basePath('service'), {
        title: 'Servicio' + ' ' + (serviceJson?.nombre ?? ''),

        service: {
            ...serviceJson,
            creado_en: serviceJson?.creado_en ? new Date(serviceJson.creado_en).toLocaleDateString() : null,
            fecha_corte,
            coste: serviceJson?.coste
                ? `$${serviceJson.coste.toLocaleString('es-VE', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                  })}`
                : 'Sin Coste',
        },
        precios,
        periodos,
    });
});
router.get('/settings/employe/:id', isAuthenticatedView, async (req, res) => {
    const { id } = req.params;
    const employe = await models.Empleado.findByPk(id, {
        include: [{ model: models.Usuario, as: 'usuario' }],
    });
    res.render(basePath('employe'), {
        title: 'Empleado' + ' ' + employe.nombre,

        employe: employe ? employe.toJSON() : null,
    });
});
router.get('/settings/*splat', (req, res) => {
    return res.redirect('/settings');
});
router.get('/*splat', (req, res) => {
    res.render(basePath('404'), {
        title: 'Error 404',
    });
});

export default router;
