import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/sequelize.js';
import Empresa from './Empresa.js';
import Usuario from './Usuario.js';
import TasaDolar from './TasaDolar.js';

class Nomina extends Model {}

Nomina.init(
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        empresa_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: Empresa, key: 'id' },
        },
        usuario_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: Usuario, key: 'id' },
        },
        tasa_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: TasaDolar, key: 'id' },
        },
        periodo_inicio: DataTypes.DATEONLY,
        periodo_fin: DataTypes.DATEONLY,
        estado: {
            type: DataTypes.ENUM('processing', 'completed', 'failed'),
            defaultValue: 'processing',
        },
        total_empleados: { type: DataTypes.INTEGER, defaultValue: 0 },
        total_monto: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    },
    {
        sequelize,
        modelName: 'Nomina',
        tableName: 'nomina',
    },
);

Nomina.belongsTo(Empresa, { foreignKey: 'empresa_id', as: 'empresa' });
Empresa.hasMany(Nomina, { foreignKey: 'empresa_id', as: 'nominas_lote' });

Nomina.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
Usuario.hasMany(Nomina, { foreignKey: 'usuario_id', as: 'nominas_lote' });

Nomina.belongsTo(TasaDolar, { foreignKey: 'tasa_id', as: 'tasa' });
TasaDolar.hasMany(Nomina, { foreignKey: 'tasa_id', as: 'nominas_lote' });

export default Nomina;
