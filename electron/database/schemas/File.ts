const Sequelize = require("sequelize");
import sequelize from "../initialize";

import { Model, InferAttributes, InferCreationAttributes, DataTypes } from 'sequelize';

class File extends Model<InferAttributes<File>, InferCreationAttributes<File>> {
  id: number;
  directory_id: number;
  name: string;
  path: string;
  mimeType: string;
  lastModified: Date;
  createdAt: Date;
  updatedAt: Date;
  fileSize: number;
}

File.init({
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  directory_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
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
  lastModified: DataTypes.DATE,
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
  fileSize: DataTypes.INTEGER,
}, {
  sequelize,
});

export default File;