import { Directory, File } from './schemas';

Directory.hasMany(File, { foreignKey: 'directoryId' });
File.belongsTo(Directory, { foreignKey: 'directoryId' });