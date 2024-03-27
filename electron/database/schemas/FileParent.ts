import sequelize from '../initialize'
import { Model, type InferAttributes, type InferCreationAttributes, DataTypes } from 'sequelize'

import File from './File'

class FileParent extends Model<InferAttributes<FileParent>, InferCreationAttributes<FileParent>> {
  public fileParentId!: number
  public fileChildId!: number
}

FileParent.init({
  fileParentId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false
  },
  fileChildId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false
  }
}, { sequelize })

File.hasMany(FileParent, { foreignKey: 'fileParentId' })
File.hasMany(FileParent, { foreignKey: 'fileChildId' })

export default FileParent
