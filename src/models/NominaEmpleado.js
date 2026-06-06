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
        bono: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
        deduccion: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
        monto_usd: { type: DataTypes.DECIMAL(10, 2), defaultValue: null },
        descripcion: DataTypes.TEXT,
    },
    {
        sequelize,
        modelName: 'NominaEmpleado',
        tableName: 'nomina_empleado',
        hooks: {
            beforeCreate: (nomina, options) => {
                nomina.monto = formatearPrecio(nomina.monto);
                if (nomina.bono) nomina.bono = formatearPrecio(nomina.bono);
                if (nomina.deduccion) nomina.deduccion = formatearPrecio(nomina.deduccion);
                if (nomina.monto_usd) nomina.monto_usd = formatearPrecio(nomina.monto_usd);
            },
        },
    },
);

const formatearPrecio = (valor) => {
    if (typeof valor !== 'string') return valor;
    if (/^\d+\.\d{1,2}$/.test(valor)) return parseFloat(valor);
    return parseFloat(valor.replace(/\./g, '').replace(',', '.'));
};
NominaEmpleado.belongsTo(Empleado, { foreignKey: 'empleado_id', as: 'empleado' });
Empleado.hasMany(NominaEmpleado, { foreignKey: 'empleado_id', as: 'nominas' });

NominaEmpleado.belongsTo(TasaDolar, { foreignKey: 'tasa_id', as: 'tasa' });
TasaDolar.hasMany(NominaEmpleado, { foreignKey: 'tasa_id', as: 'nominas' });

export default NominaEmpleado;
