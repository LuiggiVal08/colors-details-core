import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/sequelize.js';
import ControlCaja from './ControlCaja.js';
import Usuario from './Usuario.js';
import Moneda from './Moneda.js';
import { formatearPrecio } from '../helpers/format.js';

class MovimientoCaja extends Model {}

MovimientoCaja.init(
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        control_caja_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: ControlCaja, key: 'id' } },
        usuario_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: Usuario, key: 'id' } },
        fecha: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        tipo: { type: DataTypes.STRING, allowNull: false, defaultValue: 'ingreso' },
        monto: DataTypes.DECIMAL(10, 2),
        moneda_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: Moneda, key: 'id' } },
        tasa: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
        descripcion: DataTypes.STRING,
    },
    {
        sequelize,
        modelName: 'MovimientoCaja',
        tableName: 'movimiento_caja',
        hooks: {
            beforeCreate: async (movimiento) => {
                movimiento.monto = formatearPrecio(movimiento.monto);
            },
            beforeUpdate: async (movimiento) => {
                movimiento.monto = formatearPrecio(movimiento.monto);
            },
        },
    },
);

MovimientoCaja.belongsTo(ControlCaja, { foreignKey: 'control_caja_id', as: 'control' });
ControlCaja.hasMany(MovimientoCaja, { foreignKey: 'control_caja_id', as: 'movimientos' });

MovimientoCaja.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
Usuario.hasMany(MovimientoCaja, { foreignKey: 'usuario_id', as: 'movimientos_caja' });

MovimientoCaja.belongsTo(Moneda, { foreignKey: 'moneda_id', as: 'moneda' });
Moneda.hasMany(MovimientoCaja, { foreignKey: 'moneda_id', as: 'movimientos_caja' });

export default MovimientoCaja;
