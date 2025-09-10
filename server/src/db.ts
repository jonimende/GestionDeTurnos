import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

export const sequelize = new Sequelize(process.env.DATABASE_URL as string, {
  dialect: 'postgres',
  logging: false, // opcional
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false, // necesario para Railway
    },
  },
});
