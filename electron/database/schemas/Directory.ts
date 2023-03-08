const Sequelize = require("sequelize");
import sequelize from "../initialize";

import { Model, InferAttributes, InferCreationAttributes, DataTypes } from 'sequelize';

class Directory extends Model<InferAttributes<Directory>, InferCreationAttributes<Directory>> {
  name: string;
  path: string;
  createdAt: Date;
  updatedAt: Date;
}

Directory.init({
  name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  path: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize,
});

export default Directory;