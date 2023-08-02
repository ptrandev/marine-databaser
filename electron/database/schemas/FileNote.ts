const Sequelize = require("sequelize");
import sequelize from "../initialize";

import { Model, InferAttributes, InferCreationAttributes, DataTypes } from 'sequelize';

import File from "./File";

class FileNote extends Model<InferAttributes<FileNote>, InferCreationAttributes<FileNote>> {
  id: number;
  file_id: number;
  note: string;
  createdAt: Date;
  updatedAt: Date;
}

FileNote.init({
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  file_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  note: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize,
});

File.hasMany(FileNote, {
  foreignKey: "file_id"
});

export default FileNote;