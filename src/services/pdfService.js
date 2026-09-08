import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { cwd } from 'process';

export const generarPDF = async (tipo, data) => {
    return new Promise((resolve, reject) => {
        try {
            const uniqueId = Math.random().toString(36).substr(2, 9);
            const fileName = `reporte_${tipo.toLowerCase()}_${uniqueId}.pdf`;
            const folderPath = path.join(cwd(), 'tmp');

            // Asegurar que la carpeta tmp existe
            if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath);

            const filePath = path.join(folderPath, fileName);
            const doc = new PDFDocument({ margin: 50 });
            const stream = fs.createWriteStream(filePath);

            doc.pipe(stream);

            // ============================
            // Encabezado Reutilizable
            // ============================
            const drawHeader = (titulo, subtitulo = '') => {
                const logoPath = path.join(cwd(), 'public', 'img', 'logo.png');
                try {
                    doc.image(logoPath, doc.page.width - 130, 20, { width: 70 });
                } catch (e) {
                    console.error('Logo no encontrado');
                }

                doc.fontSize(18).text(titulo, 50, 40, { underline: true });
                if (subtitulo) doc.fontSize(12).text(subtitulo, 50, 65);

                doc.fontSize(10).text(`Generado: ${new Date().toLocaleString('es-VE')}`, 50, 95);
                doc.moveTo(50, 115)
                    .lineTo(doc.page.width - 50, 115)
                    .strokeColor('#cccccc')
                    .stroke();
                doc.y = 135;
            };

            // ============================
            // Lógica por Tipo de Reporte
            // ============================
            if (tipo === 'VENTAS') {
                drawHeader('Reporte de Ventas', `Rango: ${data.fecha_inicio} al ${data.fecha_fin}`);
                doc.on('pageAdded', () => drawHeader('Reporte de Ventas'));

                data.ventas.forEach((venta) => {
                    const subtotal = Number(venta.total) || 0;
                    const ivaPorcentaje = Number(venta.iva?.porcentaje) || 0;
                    const ivaMonto = (subtotal * ivaPorcentaje) / 100;
                    const totalConIVA = subtotal + ivaMonto;

                    doc.fontSize(14).fillColor('#007bff').text(`Venta #${venta.id}`, { underline: true });
                    doc.fillColor('black')
                        .fontSize(12)
                        .moveDown(0.5)
                        .text(`Fecha: ${new Date(venta.fecha).toLocaleString('es-VE')}`)
                        .text(`Cliente: ${venta.cliente?.nombre || ''} ${venta.cliente?.apellido || ''}`)
                        .text(`Subtotal: $${subtotal.toFixed(2)}`)
                        .text(`IVA (${ivaPorcentaje}%): $${ivaMonto.toFixed(2)}`)
                        .text(`Total con IVA: $${totalConIVA.toFixed(2)}`)
                        .moveDown(1);

                    // Detalles
                    doc.fontSize(13).text('Productos:', { underline: true });
                    venta.detalles.forEach((d) => {
                        doc.fontSize(12).text(
                            `- ${d.producto?.nombre} | Cant: ${d.cantidad} | Subtotal: $${Number(d.subtotal || 0).toFixed(2)}`,
                        );
                    });
                    doc.moveDown(1).strokeColor('#cccccc').moveTo(50, doc.y).lineTo(550, doc.y).stroke().moveDown(1);
                });
            } else if (tipo === 'PRODUCTOS') {
                drawHeader('Reporte General de Productos');
                doc.on('pageAdded', () => drawHeader('Reporte General de Productos'));

                data.productos.forEach((producto, index) => {
                    const categoria = producto.categoria || {};

                    doc.fontSize(14)
                        .fillColor('#007bff')
                        .text(`Producto #${index + 1}: ${producto.nombre || 'N/A'}`, { underline: true });

                    doc.fillColor('black')
                        .fontSize(12)
                        .moveDown(0.5)
                        .text(`Código: ${producto.codigo || 'N/A'}`)
                        .text(`Categoría: ${categoria.nombre || 'Sin categoría'}`)
                        .text(`Descripción: ${producto.descripcion || 'N/A'}`)
                        .text(`Precio: $${producto.precio || '0.00'}`)
                        .text(`Stock actual: ${producto.stock || 0}`)
                        .text(`Fecha de creación: ${new Date(producto.creado_en).toLocaleDateString('es-VE')}`)
                        .text(`Última actualización: ${new Date(producto.actualizado_en).toLocaleDateString('es-VE')}`);

                    doc.moveDown(0.8);
                    doc.strokeColor('#cccccc').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
                    doc.moveDown(1);
                });
            }

            doc.end();
            stream.on('finish', () => resolve(filePath));
            stream.on('error', reject);
        } catch (error) {
            reject(error);
        }
    });
};
