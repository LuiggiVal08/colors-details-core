import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/sequelize.js';
import ServicioEmpresa from './ServicioEmpresa.js';
import Usuario from './Usuario.js';
import PagoTransaccion from './PagoTransaccion.js';

class CreditoServicio extends Model {}

CreditoServicio.init(
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
        origen_transaccion_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: PagoTransaccion, key: 'id' },
        },
        monto: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
        monto_usado: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
        disponible: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0,
            // recomendable actualizar en hooks o lógica de negocio: disponible = monto - monto_usado
        },
        descripcion: { type: DataTypes.TEXT, allowNull: true },
    },
    {
        sequelize,
        modelName: 'CreditoServicio',
        tableName: 'credito_servicio',
        timestamps: true,
        createdAt: 'creado_en',
        updatedAt: 'actualizado_en',
    },
);

CreditoServicio.belongsTo(ServicioEmpresa, { foreignKey: 'servicio_id', as: 'servicio' });
ServicioEmpresa.hasMany(CreditoServicio, { foreignKey: 'servicio_id', as: 'creditos' });

CreditoServicio.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
Usuario.hasMany(CreditoServicio, { foreignKey: 'usuario_id', as: 'creditos' });

CreditoServicio.belongsTo(PagoTransaccion, { foreignKey: 'origen_transaccion_id', as: 'origen_transaccion' });

export default CreditoServicio;
