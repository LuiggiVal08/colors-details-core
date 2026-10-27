import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/sequelize.js';
import NominaPago from './NominaPago.js';
import NominaDetalle from './NominaDetalle.js';

class NominaPagoDetalle extends Model {}

NominaPagoDetalle.init(
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        nomina_pago_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: NominaPago, key: 'id' },
        },
        nomina_detalle_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: NominaDetalle, key: 'id' },
        },
        monto: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    },
    {
        sequelize,
        modelName: 'NominaPagoDetalle',
        tableName: 'nomina_pago_detalle',
        indexes: [
            {
                unique: true,
                name: 'nomina_pago_detalle_pago_empleado_uq',
                fields: ['nomina_pago_id', 'nomina_detalle_id'],
            },
        ],
    },
);

NominaPagoDetalle.belongsTo(NominaPago, { foreignKey: 'nomina_pago_id', as: 'pago' });
NominaPago.hasMany(NominaPagoDetalle, { foreignKey: 'nomina_pago_id', as: 'detalles' });

NominaPagoDetalle.belongsTo(NominaDetalle, { foreignKey: 'nomina_detalle_id', as: 'detalle_nomina' });
NominaDetalle.hasMany(NominaPagoDetalle, { foreignKey: 'nomina_detalle_id', as: 'pagos' });

export default NominaPagoDetalle;
