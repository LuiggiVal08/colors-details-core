import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/sequelize.js';

class TipoUsuario extends Model {}

TipoUsuario.init(
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        nombre: DataTypes.STRING,
    },
    {
        sequelize,
        modelName: 'TipoUsuario',
        tableName: 'tipo_usuario',
    },
);

export default TipoUsuario;
