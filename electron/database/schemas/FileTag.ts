import sequelize from "../initialize";
import { Model, InferAttributes, InferCreationAttributes } from 'sequelize';

import File from "./File";
import Tag from "./Tag";

class FileTag extends Model<InferAttributes<FileTag>, InferCreationAttributes<FileTag>> { }

FileTag.init({}, { sequelize })

File.belongsToMany(Tag, { through: FileTag });
Tag.belongsToMany(File, { through: FileTag });

export default FileTag;