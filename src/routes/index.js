import { Router } from 'express';

// Configuración general
import routerCompany from './api/company.routes.js';
import routerSetup from './api/setup.js';
import routerCustomer from './api/customer.routes.js';

// Usuarios
import routerUser from './api/user.routes.js';
import routerUserTypes from './api/userTypes.router.js';

// Empleados y nómina
import routerEmploye from './api/employe.routes.js';
import routeremployeePayroll from './api/employeePayroll.controller.routes.js';

// Productos y categorías
import routerCategory from './api/category.routes.js';
import routerProduct from './api/product.routes.js';
import routerMovement from './api/productMovement.routes.js';

// Métodos de pago
import routerPaymentMethod from './api/paymentMethod.routes.js';

// Pedidos y compras
import routerOrders from './api/orders.routes.js';
import routerOrderPayment from './api/paymentOrder.routes.js';
import routerShopping from './api/shopping.routes.js';

// Caja
import routerBox from './api/box.router.js';
import routerBoxController from './api/boxController.routes.js';
import routerCashMovement from './api/cashMovement.routes.js';

// API de servicios
import routerService from './api/service.router.js';
import routerServicePeriod from './api/servicePeriod.routes.js';
import routerServicePayment from './api/servicePayment.routes.js';

// Nómina
import routerNomina from './api/nomina.routes.js';

// Notificaciones
import routerNotificacion from './api/notificacion.routes.js';

// IVA y tipos de cambio
import routerIva from './api/iva.router.js';
import routerExchangeRate from './api/exchangeRate.router.js';
import routerRequest from './api/request.routes.js';
import routerQuestions from './api/question.routes.js';
import isAuthenticated from '../middlewares/isAuthenticate.js';
import path from 'path';
import fs from 'fs';
import { cwd } from 'process';
const routerApp = Router();

// ============================================

// Configuración general
routerApp.use('/company', routerCompany);
routerApp.use('/setup', routerSetup);
routerApp.use('/customer', routerCustomer);

// Usuarios
routerApp.use('/user', routerUser);
routerApp.use('/user-types', routerUserTypes);
routerApp.use('/request', routerRequest);
routerApp.use('/questions', routerQuestions);

// Empleados y nómina
routerApp.use('/employe', routerEmploye);
routerApp.use('/employee-payroll', routeremployeePayroll);

// Productos y categorías
routerApp.use('/category', routerCategory);
routerApp.use('/product', routerProduct);
routerApp.use('/product-movement', routerMovement);

// Métodos de pago
routerApp.use('/payment-method', routerPaymentMethod);

// Pedidos y compras
routerApp.use('/orders', routerOrders);
routerApp.use('/order-payment', routerOrderPayment);
routerApp.use('/shopping', routerShopping);

// Caja
routerApp.use('/box-register', routerBox);
routerApp.use('/box-register-control', routerBoxController);
routerApp.use('/cash-movements', routerCashMovement);

// Servicios
routerApp.use('/service', routerService);
routerApp.use('/service-period', routerServicePeriod);
routerApp.use('/service-payment', routerServicePayment);

// Nómina
routerApp.use('/nomina', routerNomina);

// Notificaciones
routerApp.use('/notifications', routerNotificacion);

// IVA y tipos de cambio
routerApp.use('/iva', routerIva);
routerApp.use('/exchange-rate', routerExchangeRate);

// Healthcheck, fallback y validación de sesión

routerApp.get('/validate', isAuthenticated, (req, res) => {
    res.status(200).json({
        message: 'Sesión activa',
        user: req.user, // Devuelves los datos limpios que sacaste del token
    });
});
// En tus rutas de Node.js
routerApp.get('/reports/download/:fileName', isAuthenticated, (req, res) => {
    const { fileName } = req.params;
    const safeName = path.basename(fileName);
    const filePath = path.join(cwd(), 'tmp', safeName);

    // Evitar salir del directorio tmp
    if (safeName !== fileName || !filePath.startsWith(path.join(cwd(), 'tmp'))) {
        return res.status(400).send('Nombre de archivo no válido.');
    }

    // Verificar si el archivo existe
    if (fs.existsSync(filePath)) {
        res.download(filePath, (err) => {
            if (err) console.error('Error al descargar:', err);

            // Opcional: Borrar el archivo después de enviarlo para no llenar el disco
            fs.unlinkSync(filePath);
        });
    } else {
        res.status(404).send('El archivo ya no está disponible o no existe.');
    }
});
routerApp.use('/health', (req, res) => res.status(200).json({ message: 'ok' }));
routerApp.all('/*splat', (req, res) => res.status(404).json({ message: 'Resource not found' }));

export default routerApp;
