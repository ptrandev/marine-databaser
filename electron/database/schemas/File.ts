const Sequelize = require("sequelize");
import sequelize from "../initialize";

import { Model, InferAttributes, InferCreationAttributes, DataTypes } from 'sequelize';

class File extends Model<InferAttributes<File>, InferCreationAttributes<File>> {
  id: number;
  directoryId: number;
  name: string;
  path: string;
  mimeType: string;
  lastModified: Date;
  birthTime: Date;
  updatedAt: Date;
  fileSize: number;
}

File.init({
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  directoryId: {
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
  lastModified: DataTypes.DATE, // last time the FILE was modified
  birthTime: DataTypes.DATE, // the time the file was CREATED
  updatedAt: DataTypes.DATE, // the time at which our PROGRAM updated the file
  fileSize: DataTypes.INTEGER, // the size of the file in bytes
}, {
  sequelize,
});

export default File;