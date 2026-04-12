import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/sequelize.js';
import Usuario from './Usuario.js';
import PreguntaSeguridad from './PreguntaSeguridad.js';

class PreguntaSeguridadUsuario extends Model {}

PreguntaSeguridadUsuario.init(
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        pregunta_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: PreguntaSeguridad, key: 'id' },
        },
        usuario_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: Usuario, key: 'id' },
        },
        respuesta: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    },
    {
        sequelize,
        modelName: 'PreguntaSeguridadUsuario',
        tableName: 'pregunta_seguridad_usuario',
    },
);

// Relaciones
PreguntaSeguridadUsuario.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
Usuario.hasMany(PreguntaSeguridadUsuario, { foreignKey: 'usuario_id', as: 'preguntas_seguridad' });

PreguntaSeguridadUsuario.belongsTo(PreguntaSeguridad, { foreignKey: 'pregunta_id', as: 'pregunta' });
PreguntaSeguridad.hasMany(PreguntaSeguridadUsuario, { foreignKey: 'pregunta_id', as: 'usuarios' });

export default PreguntaSeguridadUsuario;
