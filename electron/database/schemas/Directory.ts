const Sequelize = require("sequelize");
import sequelize from "../initialize";

import { Model, InferAttributes, InferCreationAttributes, DataTypes } from 'sequelize';


class Directory extends Model<InferAttributes<Directory>, InferCreationAttributes<Directory>> {
  id: number;
  name: string;
  path: string;
  mimeType: string;
  createdAt: Date;
  updatedAt: Date;
}

Directory.init({
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  path: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  mimeType: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize,
});

export default Directory;