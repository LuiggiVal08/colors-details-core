import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/sequelize.js';
import Pedido from './Pedido.js';
import MetodoPago from './MetodoPago.js';
import { formatearPrecio } from '../helpers/format.js';

class PagoPedido extends Model {}

PagoPedido.init(
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        pedido_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: Pedido, key: 'id' },
        },
        metodo_pago_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: MetodoPago, key: 'id' },
        },
        fecha: DataTypes.DATE,
        monto: DataTypes.DECIMAL(10, 2),
        referencia_pago: DataTypes.STRING,
    },
    {
        sequelize,
        modelName: 'PagoPedido',
        tableName: 'pago_pedido',
        hooks: {
            beforeCreate: async (pago) => {
                pago.monto = formatearPrecio(pago.monto);
            },
        },
    },
);

PagoPedido.belongsTo(Pedido, { foreignKey: 'pedido_id', as: 'pedido' });
Pedido.hasMany(PagoPedido, { foreignKey: 'pedido_id', as: 'pagos' });

PagoPedido.belongsTo(MetodoPago, { foreignKey: 'metodo_pago_id', as: 'metodo' });
MetodoPago.hasMany(PagoPedido, { foreignKey: 'metodo_pago_id', as: 'pagos' });

export default PagoPedido;
