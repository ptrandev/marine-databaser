const Sequelize = require("sequelize");
import sequelize from "../initialize";

import { Model, InferAttributes, InferCreationAttributes, DataTypes } from 'sequelize';

class Tag extends Model<InferAttributes<Tag>, InferCreationAttributes<Tag>> {
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

Tag.init({
  name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize,
});

export default Tag;