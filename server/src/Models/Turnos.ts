import { DataTypes, Model } from "sequelize";
import { sequelize } from "../db";
import { Usuario } from "./Usuario";

class Turno extends Model {
  public id!: number;
  public fecha!: Date;
  public usuarioId!: number | null;
  public estado!: "disponible" | "reservado" | "confirmado" | "cancelado" | "deshabilitado";

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public cliente?: Usuario;
}

Turno.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    fecha: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    usuarioId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "usuario_id",
    },
    estado: {
      type: DataTypes.ENUM("disponible", "reservado", "confirmado", "cancelado", "deshabilitado"),
      allowNull: false,
      defaultValue: "disponible",
    },
  },
  {
    sequelize,
    modelName: "Turno",
    tableName: "turnos",
    timestamps: false,
  }
);

// Relaciones
Turno.belongsTo(Usuario, { foreignKey: "usuarioId", as: "cliente" });
Usuario.hasMany(Turno, { foreignKey: "usuarioId", as: "turnos" });

export default Turno;
