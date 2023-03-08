const Sequelize = require("sequelize");
import sequelize from "./initialize";

import { Model, InferAttributes, InferCreationAttributes, DataTypes } from 'sequelize';

class File extends Model<InferAttributes<File>, InferCreationAttributes<File>> {
  name: string;
  path: string;
  createdAt: Date;
  updatedAt: Date;
}

File.init({
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

export {
  File,
}