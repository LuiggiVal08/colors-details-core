import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/sequelize.js';
import ServicioPeriodo from './ServicioPeriodo.js';
import Usuario from './Usuario.js';

class PagoServicio extends Model {}

PagoServicio.init(
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        periodo_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: ServicioPeriodo, key: 'id' },
        },
        usuario_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: Usuario, key: 'id' },
        },
        monto: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
        descripcion: { type: DataTypes.TEXT, allowNull: true },
    },
    {
        sequelize,
        modelName: 'PagoServicio',
        tableName: 'pago_servicio',
        timestamps: true,
        createdAt: 'creado_en',
        updatedAt: 'actualizado_en',
    },
);

PagoServicio.belongsTo(ServicioPeriodo, { foreignKey: 'periodo_id', as: 'periodo' });
ServicioPeriodo.hasMany(PagoServicio, { foreignKey: 'periodo_id', as: 'pagos' });

PagoServicio.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
Usuario.hasMany(PagoServicio, { foreignKey: 'usuario_id', as: 'pagos_servicio' });

export default PagoServicio;
