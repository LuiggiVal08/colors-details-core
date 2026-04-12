import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/sequelize.js';
import Pedido from './Pedido.js';
import Producto from './Producto.js';
import { formatearPrecio } from '../helpers/format.js';

class PedidoDetalle extends Model {}

PedidoDetalle.init(
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        pedido_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: Pedido, key: 'id' },
        },
        producto_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: Producto, key: 'id' },
        },
        detalle_pedido_producto: DataTypes.STRING,
        cantidad: DataTypes.INTEGER,
        precio_unitario: DataTypes.DECIMAL(10, 2),
        precio_pedido_producto: DataTypes.DECIMAL(10, 2),
        subtotal: DataTypes.DECIMAL(10, 2),
    },
    {
        sequelize,
        modelName: 'PedidoDetalle',
        tableName: 'pedido_detalle',
        hooks: {
            beforeCreate: async (pedidoDetalle) => {
                pedidoDetalle.precio_unitario = formatearPrecio(pedidoDetalle.precio_unitario);
                pedidoDetalle.subtotal = formatearPrecio(pedidoDetalle.subtotal);
            },
        },
    },
);

PedidoDetalle.belongsTo(Pedido, { foreignKey: 'pedido_id', as: 'pedido' });
Pedido.hasMany(PedidoDetalle, { foreignKey: 'pedido_id', as: 'detalles' });

PedidoDetalle.belongsTo(Producto, { foreignKey: 'producto_id', as: 'producto' });
Producto.hasMany(PedidoDetalle, { foreignKey: 'producto_id', as: 'detalles' });

export default PedidoDetalle;
