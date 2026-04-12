import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/sequelize.js';
import Venta from './Venta.js';
import Producto from './Producto.js';

class VentaDetalle extends Model {}

VentaDetalle.init(
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        venta_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: Venta, key: 'id' },
        },
        producto_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: Producto, key: 'id' },
        },
        cantidad: DataTypes.INTEGER,
        precio_unitario: DataTypes.DECIMAL(10, 2),
        subtotal: DataTypes.DECIMAL(10, 2),
    },
    {
        sequelize,
        modelName: 'VentaDetalle',
        tableName: 'venta_detalle',
    },
);

VentaDetalle.belongsTo(Venta, { foreignKey: 'venta_id', as: 'venta' });
Venta.hasMany(VentaDetalle, { foreignKey: 'venta_id', as: 'detalles' });

VentaDetalle.belongsTo(Producto, { foreignKey: 'producto_id', as: 'producto' });
Producto.hasMany(VentaDetalle, { foreignKey: 'producto_id', as: 'venta_detalles' });

export default VentaDetalle;
