import { app } from 'electron'
import path from 'path'

export const DATABASE_PATH = path.join(app.getPath('userData'), 'database.sqlite')
export const TEMP_PATH = path.join(app.getPath('temp'), 'marine-databaser')
