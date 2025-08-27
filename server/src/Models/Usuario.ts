// Usuario.ts
import { DataTypes, Model } from "sequelize";
import { sequelize } from "../db";

export class Usuario extends Model {
  public id!: number;
  public nombre!: string;
  public apellido!: string;
  public telefono!: string;
  public password!: string;
  public admin!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Usuario.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    nombre: { type: DataTypes.STRING, allowNull: false },
    apellido: { type: DataTypes.STRING, allowNull: false },
    telefono: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    admin: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    sequelize,
    modelName: "Usuario",
    tableName: "usuarios",
    timestamps: false
  }
);
