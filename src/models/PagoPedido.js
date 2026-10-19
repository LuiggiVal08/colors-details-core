import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/sequelize.js';
import Pedido from './Pedido.js';
import MetodoPago from './MetodoPago.js';
import TasaDolar from './TasaDolar.js';
import Moneda from './Moneda.js';
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
        tasa_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: TasaDolar, key: 'id' } },
        fecha: DataTypes.DATE,
        monto: DataTypes.DECIMAL(10, 2),
        moneda_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: Moneda, key: 'id' } },
        monto_usd: DataTypes.DECIMAL(10, 2),
        monto_recibido: DataTypes.DECIMAL(10, 2),
        vuelto: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
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

PagoPedido.belongsTo(TasaDolar, { foreignKey: 'tasa_id', as: 'tasa' });
TasaDolar.hasMany(PagoPedido, { foreignKey: 'tasa_id', as: 'pagos_pedido' });

PagoPedido.belongsTo(Moneda, { foreignKey: 'moneda_id', as: 'moneda' });
Moneda.hasMany(PagoPedido, { foreignKey: 'moneda_id', as: 'pagos_pedido' });

export default PagoPedido;
