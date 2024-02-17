import sequelize from '../initialize'

import { Model, type InferAttributes, type InferCreationAttributes } from 'sequelize'

import File from './File'
import Album from './Album'

class FileAlbum extends Model<InferAttributes<FileAlbum>, InferCreationAttributes<FileAlbum>> { }

FileAlbum.init({}, { sequelize })

File.belongsToMany(Album, { through: FileAlbum, foreignKey: 'file_id' })
Album.belongsToMany(File, { through: FileAlbum, foreignKey: 'album_id' })

export default FileAlbum
