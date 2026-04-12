import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/sequelize.js';
import Caja from './Caja.js';
import Usuario from './Usuario.js';

class ControlCaja extends Model {}

ControlCaja.init(
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        caja_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: Caja, key: 'id' },
        },
        usuario_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: Usuario, key: 'id' },
        },
        fecha_apertura: DataTypes.DATE,
        fecha_cierre: DataTypes.DATE,
        monto_apertura: DataTypes.DECIMAL(10, 2),
        monto_cierre: DataTypes.DECIMAL(10, 2),
        estado: DataTypes.STRING,
    },
    {
        sequelize,
        modelName: 'ControlCaja',
        tableName: 'control_caja',
    },
);

ControlCaja.belongsTo(Caja, { foreignKey: 'caja_id', as: 'caja' });
Caja.hasMany(ControlCaja, { foreignKey: 'caja_id', as: 'controles' });

ControlCaja.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
Usuario.hasMany(ControlCaja, { foreignKey: 'usuario_id', as: 'controles' });

export default ControlCaja;
