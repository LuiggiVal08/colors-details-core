import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/sequelize.js';

class PreguntaSeguridad extends Model {}

PreguntaSeguridad.init(
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        pregunta: { type: DataTypes.STRING, allowNull: false },
    },
    { sequelize, modelName: 'PreguntaSeguridad', tableName: 'pregunta_seguridad' },
);

export default PreguntaSeguridad;
