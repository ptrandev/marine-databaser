import sequelize from '../initialize'
import { Model, type InferAttributes, type InferCreationAttributes } from 'sequelize'

import File from './File'
import Tag from './Tag'

class FileTag extends Model<InferAttributes<FileTag>, InferCreationAttributes<FileTag>> { }

FileTag.init({
  file_id: {
    type: sequelize.Sequelize.INTEGER,
    primaryKey: true,
    allowNull: false
  },
  tag_id: {
    type: sequelize.Sequelize.INTEGER,
    primaryKey: true,
    allowNull: false
  }
}, { sequelize })

File.belongsToMany(Tag, { through: FileTag, foreignKey: 'file_id', constraints: false })
Tag.belongsToMany(File, { through: FileTag, foreignKey: 'tag_id', constraints: false })

export default FileTag
