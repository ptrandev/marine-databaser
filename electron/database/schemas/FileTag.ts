import sequelize from '../initialize'
import { Model, type InferAttributes, type InferCreationAttributes, DataTypes } from 'sequelize'

import File from './File'
import Tag from './Tag'

class FileTag extends Model<InferAttributes<FileTag>, InferCreationAttributes<FileTag>> {
  public fileId!: number
  public tagId!: number
}

FileTag.init({
  fileId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false
  },
  tagId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false
  }
}, { sequelize })

File.belongsToMany(Tag, { through: FileTag, foreignKey: 'fileId', constraints: true })
Tag.belongsToMany(File, { through: FileTag, foreignKey: 'tagId', constraints: true })

export default FileTag
