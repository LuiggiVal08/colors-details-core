import { Worker } from 'bullmq';
import { Op } from 'sequelize';
import { connection } from '../config/queueConfig.js';
import { generarPDF } from '../services/pdfService.js';
import { models } from '../models/index.js';

const reportWorker = new Worker(
    'reportes-pdf',
    async (job) => {
        const { tipo, filtros } = job.data;
        console.log(`🤖 Procesando reporte: ${tipo} (ID: ${job.id})`);

        let dataParaPDF = {};

        if (tipo === 'VENTAS') {
            // Ejecutamos la consulta pesada de ventas aquí
            const ventas = await models.Venta.findAll({
                where: {
                    fecha: {
                        [Op.between]: [new Date(filtros.fecha_inicio), new Date(filtros.fecha_fin + ' 23:59:59')],
                    },
                },
                include: [
                    { model: models.Cliente, as: 'cliente' },
                    {
                        model: models.VentaDetalle,
                        as: 'detalles',
                        include: [{ model: models.Producto, as: 'producto' }],
                    },
                    // ... agrega aquí el resto de tus includes (pagos, usuario, etc.)
                ],
                order: [['fecha', 'DESC']],
            });

            dataParaPDF = {
                ventas,
                fecha_inicio: filtros.fecha_inicio,
                fecha_fin: filtros.fecha_fin,
            };
        } else if (tipo === 'PRODUCTOS') {
            const productos = await models.Producto.findAll({
                include: [{ model: models.CategoriaProducto, as: 'categoria' }],
                order: [['nombre', 'ASC']],
            });

            dataParaPDF = { productos };
        }

        // Llamamos al servicio para crear el archivo físico
        const pathFinal = await generarPDF(tipo, dataParaPDF);

        console.log(`✅ Reporte generado en: ${pathFinal}`);
        return { path: pathFinal };
    },
    { connection },
);

// Manejo de errores globales del worker
reportWorker.on('failed', (job, err) => {
    console.error(`❌ Error en trabajo ${job.id}: ${err.message}`);
});
