import sequelize from '../initialize'

import { Model, type InferAttributes, type InferCreationAttributes, DataTypes } from 'sequelize'

import File from './File'

class FileNote extends Model<InferAttributes<FileNote>, InferCreationAttributes<FileNote>> {
  id: number
  file_id: number
  note: string
  createdAt: Date
  updatedAt: Date
}

FileNote.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  file_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  note: {
    type: DataTypes.STRING,
    allowNull: false
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE
}, {
  sequelize
})

File.hasMany(FileNote, {
  foreignKey: 'file_id'
})

export default FileNote
