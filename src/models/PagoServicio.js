import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/sequelize.js';
import ServicioEmpresa from './ServicioEmpresa.js';
import Usuario from './Usuario.js';

class PagoServicio extends Model {}

PagoServicio.init(
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        servicio_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: ServicioEmpresa, key: 'id' },
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

PagoServicio.belongsTo(ServicioEmpresa, { foreignKey: 'servicio_id', as: 'servicio' });
ServicioEmpresa.hasMany(PagoServicio, { foreignKey: 'servicio_id', as: 'pagos' });

PagoServicio.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
Usuario.hasMany(PagoServicio, { foreignKey: 'usuario_id', as: 'pagos_servicio' });

export default PagoServicio;
