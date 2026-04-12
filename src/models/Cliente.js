import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/sequelize.js';

class Cliente extends Model {}

Cliente.init(
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        nombre: DataTypes.STRING,
        apellido: DataTypes.STRING,
        cedula: DataTypes.STRING,
        telefono: DataTypes.STRING,
        email: DataTypes.STRING,
        direccion: DataTypes.TEXT,
        fecha_registro: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        activo: DataTypes.BOOLEAN,
    },
    {
        sequelize,
        modelName: 'Cliente',
        tableName: 'cliente',
    },
);

export default Cliente;
