import { Directory, File } from './schemas';

Directory.hasMany(File, { foreignKey: 'directory_id' });
File.belongsTo(Directory, { foreignKey: 'directory_id' });