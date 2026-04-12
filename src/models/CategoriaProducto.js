import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/sequelize.js';

class CategoriaProducto extends Model {}

CategoriaProducto.init(
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        nombre: DataTypes.STRING,
        descripcion: DataTypes.TEXT,
    },
    {
        sequelize,
        modelName: 'CategoriaProducto',
        tableName: 'categoria_producto',
    },
);

export default CategoriaProducto;
