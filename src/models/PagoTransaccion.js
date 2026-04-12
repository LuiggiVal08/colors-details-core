import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/sequelize.js';
import ServicioPeriodo from './ServicioPeriodo.js';
import ServicioEmpresa from './ServicioEmpresa.js';
import Usuario from './Usuario.js';
import MetodoPago from './MetodoPago.js'; // tu modelo existente

class PagoTransaccion extends Model {}

PagoTransaccion.init(
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

        // referencia opcional al periodo al que se aplica (puede ser null si es crédito / sin asignar)
        periodo_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: ServicioPeriodo, key: 'id' },
        },

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

        fecha_pago: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },

        monto: { type: DataTypes.DECIMAL(12, 2), allowNull: false },

        metodo_pago_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: MetodoPago, key: 'id' } },

        referencia: { type: DataTypes.STRING, allowNull: true },

        // si la transacción se usó para generar crédito sobrante
        aplicado_a_credito: { type: DataTypes.BOOLEAN, defaultValue: false },

        // opcional: id del movimiento de caja si lo vinculaste
        movimiento_caja_id: { type: DataTypes.INTEGER, allowNull: true },
    },
    {
        sequelize,
        modelName: 'PagoTransaccion',
        tableName: 'pago_transaccion',
        timestamps: true,
        createdAt: 'creado_en',
        updatedAt: 'actualizado_en',
    },
);

PagoTransaccion.belongsTo(ServicioPeriodo, { foreignKey: 'periodo_id', as: 'periodo' });
ServicioPeriodo.hasMany(PagoTransaccion, { foreignKey: 'periodo_id', as: 'transacciones' });

PagoTransaccion.belongsTo(ServicioEmpresa, { foreignKey: 'servicio_id', as: 'servicio' });
ServicioEmpresa.hasMany(PagoTransaccion, { foreignKey: 'servicio_id', as: 'transacciones' });

PagoTransaccion.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
Usuario.hasMany(PagoTransaccion, { foreignKey: 'usuario_id', as: 'transacciones' });

export default PagoTransaccion;
