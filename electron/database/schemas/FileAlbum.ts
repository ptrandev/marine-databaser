import sequelize from '../initialize'

import { Model, type InferAttributes, type InferCreationAttributes } from 'sequelize'

import File from './File'
import Album from './Album'

class FileAlbum extends Model<InferAttributes<FileAlbum>, InferCreationAttributes<FileAlbum>> { }

FileAlbum.init({}, { sequelize })

File.belongsToMany(Album, { through: FileAlbum, foreignKey: 'fileId' })
Album.belongsToMany(File, { through: FileAlbum, foreignKey: 'albumId' })

export default FileAlbum
