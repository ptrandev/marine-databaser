import sequelize from '../initialize'

import { Model, type InferAttributes, type InferCreationAttributes, DataTypes } from 'sequelize'

class Album extends Model<InferAttributes<Album>, InferCreationAttributes<Album>> {
  id: number
  name: string
  createdAt: Date
  updatedAt: Date
}

Album.init({
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

export default Album
