import sequelize from '../initialize'

import { Model, type InferAttributes, type InferCreationAttributes, DataTypes } from 'sequelize'

class Tag extends Model<InferAttributes<Tag>, InferCreationAttributes<Tag>> {
  id: number
  name: string
  createdAt: Date
  updatedAt: Date
}

Tag.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE
}, {
  sequelize
})

export default Tag
