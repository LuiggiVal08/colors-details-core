import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/sequelize.js';

class Empresa extends Model {}

Empresa.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        nombre: DataTypes.STRING,
        rif: DataTypes.STRING,
        direccion: DataTypes.TEXT,
        ciudad: DataTypes.STRING,
        telefono: DataTypes.STRING,
        email: DataTypes.STRING,
        sitio_web: DataTypes.STRING,
        descripcion: DataTypes.TEXT,
        slogan: DataTypes.STRING,
        logo: DataTypes.STRING,
    },
    {
        sequelize,
        modelName: 'Empresa',
        tableName: 'empresa',
    },
);

export default Empresa;
