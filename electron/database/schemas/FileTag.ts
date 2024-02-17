import sequelize from '../initialize'
import { Model, type InferAttributes, type InferCreationAttributes, DataTypes } from 'sequelize'

import File from './File'
import Tag from './Tag'

class FileTag extends Model<InferAttributes<FileTag>, InferCreationAttributes<FileTag>> { }

FileTag.init({
  file_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false
  },
  tag_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false
  }
}, { sequelize })

File.belongsToMany(Tag, { through: FileTag, foreignKey: 'file_id', constraints: false })
Tag.belongsToMany(File, { through: FileTag, foreignKey: 'tag_id', constraints: false })

export default FileTag
