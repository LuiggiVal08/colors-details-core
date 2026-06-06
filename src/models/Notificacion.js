import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/sequelize.js';
import Usuario from './Usuario.js';

class Notificacion extends Model {}

Notificacion.init(
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        usuario_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: Usuario, key: 'id' },
        },
        tipo: {
            type: DataTypes.ENUM('warning', 'danger'),
            allowNull: false,
        },
        mensaje: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        entidad_tipo: {
            type: DataTypes.ENUM('SERVICE', 'ORDER'),
            allowNull: false,
        },
        entidad_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        leido: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        url: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    },
    {
        sequelize,
        modelName: 'Notificacion',
        tableName: 'notificacion',
        timestamps: true,
        createdAt: 'creado_en',
        updatedAt: 'actualizado_en',
    },
);

Notificacion.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
Usuario.hasMany(Notificacion, { foreignKey: 'usuario_id', as: 'notificaciones' });

export default Notificacion;
