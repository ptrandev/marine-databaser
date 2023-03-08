const Sequelize = require("sequelize");
import sequelize from "../initialize";

import { Model, InferAttributes, InferCreationAttributes, DataTypes } from 'sequelize';

class Album extends Model<InferAttributes<Album>, InferCreationAttributes<Album>> {
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

Album.init({
  name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize,
});

export default Album;