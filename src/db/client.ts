/**
 * Database handle.
 *
 * One SQLite file on the device, never synced, never uploaded. Opened once and
 * shared; expo-sqlite handles the connection lifecycle.
 */
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import * as schema from './schema';

export const DATABASE_NAME = 'klammer.db';

const sqlite = openDatabaseSync(DATABASE_NAME, { enableChangeListener: true });

export const db = drizzle(sqlite, { schema });

export { schema };
