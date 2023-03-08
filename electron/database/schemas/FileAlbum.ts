import sequelize from "../initialize";

import { Model, InferAttributes, InferCreationAttributes, DataTypes } from 'sequelize';

import File from "./File";
import Album from "./Album";

class FileAlbum extends Model<InferAttributes<FileAlbum>, InferCreationAttributes<FileAlbum>> { }

FileAlbum.init({}, { sequelize })

File.belongsToMany(Album, { through: FileAlbum });
Album.belongsToMany(File, { through: FileAlbum });

export default FileAlbum;