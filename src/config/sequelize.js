import { Sequelize } from 'sequelize';
import { DB_URL } from '../constants.js';
import cls from 'cls-hooked';

const namespace = cls.createNamespace('sequelize');
Sequelize.useCLS(namespace);
const sequelize = new Sequelize(DB_URL, {
    logging: false,
    define: {
        timestamps: true,
        createdAt: 'creado_en',
        updatedAt: 'actualizado_en',
    },
});

export default sequelize;
