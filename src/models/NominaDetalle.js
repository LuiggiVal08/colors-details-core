import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/sequelize.js';
import Nomina from './Nomina.js';
import Empleado from './Empleado.js';

class NominaDetalle extends Model {}

NominaDetalle.init(
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        nomina_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: Nomina, key: 'id' },
        },
        empleado_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: Empleado, key: 'id' },
        },
        salario_base: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
        bono: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
        deduccion: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
        monto_total: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
        monto_usd: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    },
    {
        sequelize,
        modelName: 'NominaDetalle',
        tableName: 'nomina_detalle',
    },
);

NominaDetalle.belongsTo(Nomina, { foreignKey: 'nomina_id', as: 'nomina' });
Nomina.hasMany(NominaDetalle, { foreignKey: 'nomina_id', as: 'detalles' });

NominaDetalle.belongsTo(Empleado, { foreignKey: 'empleado_id', as: 'empleado' });
Empleado.hasMany(NominaDetalle, { foreignKey: 'empleado_id', as: 'detalles_nomina' });

export default NominaDetalle;
