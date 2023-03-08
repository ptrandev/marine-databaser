const Sequelize = require("sequelize");
import sequelize from "./initialize";

export const File = sequelize.define("file", {
  name: {
    type: Sequelize.STRING,
  },
  path: {
    type: Sequelize.STRING,
  },
});

