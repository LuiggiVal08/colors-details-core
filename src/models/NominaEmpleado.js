import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/sequelize.js';
import Empleado from './Empleado.js';
import TasaDolar from './TasaDolar.js';
class NominaEmpleado extends Model {}

NominaEmpleado.init(
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        empleado_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: Empleado, key: 'id' },
        },
        tasa_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: TasaDolar, key: 'id' },
        },
        fecha_inicio: DataTypes.DATEONLY,
        fecha_fin: DataTypes.DATEONLY,
        monto: DataTypes.DECIMAL(10, 2),
        descripcion: DataTypes.TEXT,
    },
    {
        sequelize,
        modelName: 'NominaEmpleado',
        tableName: 'nomina_empleado',
        hooks: {
            beforeCreate: (nomina, options) => {
                nomina.monto = formatearPrecio(nomina.monto);
            },
        },
    },
);

const formatearPrecio = (valor) => parseFloat(valor.replace(/\./g, '').replace(',', '.'));
NominaEmpleado.belongsTo(Empleado, { foreignKey: 'empleado_id', as: 'empleado' });
Empleado.hasMany(NominaEmpleado, { foreignKey: 'empleado_id', as: 'nominas' });

NominaEmpleado.belongsTo(TasaDolar, { foreignKey: 'tasa_id', as: 'tasa' });
TasaDolar.hasMany(NominaEmpleado, { foreignKey: 'tasa_id', as: 'nominas' });

export default NominaEmpleado;
