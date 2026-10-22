import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/sequelize.js';
import Venta from './Venta.js';
import MetodoPago from './MetodoPago.js';
import TasaDolar from './TasaDolar.js';
import Moneda from './Moneda.js';
import { formatearPrecio } from '../helpers/format.js';

class PagoVenta extends Model {}

PagoVenta.init(
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        venta_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: Venta, key: 'id' },
        },
        tasa_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: TasaDolar, key: 'id' },
        },
        metodo_pago_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: MetodoPago, key: 'id' },
        },
        fecha: DataTypes.DATE,
        monto: DataTypes.DECIMAL(10, 2),
        moneda_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: Moneda, key: 'id' } },
        monto_usd: DataTypes.DECIMAL(10, 2),
        monto_recibido: DataTypes.DECIMAL(10, 2),
        vuelto: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
        vuelto_usd: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
        vuelto_bs: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
        referencia_pago: DataTypes.STRING,
    },
    {
        sequelize,
        modelName: 'PagoVenta',
        tableName: 'pago_venta',
        hooks: {
            beforeCreate: (pago) => {
                pago.monto = formatearPrecio(pago.monto);
            },
            beforeUpdate: (pago) => {
                if (pago.changed('monto')) {
                    pago.monto = formatearPrecio(pago.monto);
                }
            },
        },
    },
);

PagoVenta.belongsTo(Venta, { foreignKey: 'venta_id', as: 'venta' });
Venta.hasMany(PagoVenta, { foreignKey: 'venta_id', as: 'pagos' });

PagoVenta.belongsTo(TasaDolar, { foreignKey: 'tasa_id', as: 'tasa' });
TasaDolar.hasMany(PagoVenta, { foreignKey: 'tasa_id', as: 'pagos_venta' });

PagoVenta.belongsTo(MetodoPago, { foreignKey: 'metodo_pago_id', as: 'metodo_pago' });
MetodoPago.hasMany(PagoVenta, { foreignKey: 'metodo_pago_id', as: 'pagos_venta' });

PagoVenta.belongsTo(Moneda, { foreignKey: 'moneda_id', as: 'moneda' });
Moneda.hasMany(PagoVenta, { foreignKey: 'moneda_id', as: 'pagos_venta' });

export default PagoVenta;
