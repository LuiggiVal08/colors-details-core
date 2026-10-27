import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/sequelize.js';
import Nomina from './Nomina.js';
import MovimientoCaja from './MovimientoCaja.js';
import Usuario from './Usuario.js';

class NominaPago extends Model {}

NominaPago.init(
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        nomina_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: Nomina, key: 'id' },
        },
        movimiento_caja_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: MovimientoCaja, key: 'id' },
        },
        usuario_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: Usuario, key: 'id' },
        },
        monto: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
        medio_pago: {
            type: DataTypes.ENUM('efectivo', 'digital'),
            allowNull: false,
            defaultValue: 'efectivo',
        },
        referencia: { type: DataTypes.STRING(120), allowNull: true },
        cuenta_receptora: { type: DataTypes.STRING(160), allowNull: true },
    },
    {
        sequelize,
        modelName: 'NominaPago',
        tableName: 'nomina_pago',
        indexes: [{ unique: true, name: 'nomina_pago_movimiento_uq', fields: ['movimiento_caja_id'] }],
    },
);

NominaPago.belongsTo(Nomina, { foreignKey: 'nomina_id', as: 'nomina' });
Nomina.hasMany(NominaPago, { foreignKey: 'nomina_id', as: 'pagos' });

NominaPago.belongsTo(MovimientoCaja, { foreignKey: 'movimiento_caja_id', as: 'movimiento' });
MovimientoCaja.hasOne(NominaPago, { foreignKey: 'movimiento_caja_id', as: 'pago_nomina' });

NominaPago.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
Usuario.hasMany(NominaPago, { foreignKey: 'usuario_id', as: 'pagos_nomina' });

export default NominaPago;
