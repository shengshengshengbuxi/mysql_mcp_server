import mysql from 'mysql2/promise';

export class MySQLClient {
  private pool: mysql.Pool;

  constructor(config: {
    host: string;
    port: number;
    user: string;
    password: string;
    database?: string;
  }) {
    this.pool = mysql.createPool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }

  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    try {
      const [rows] = await this.pool.query(sql, params);
      return rows as T[];
    } catch (error) {
      console.error('MySQL query error:', error);
      throw error;
    }
  }

  async listDatabases(): Promise<string[]> {
    const results = await this.query<{ Database: string }>('SHOW DATABASES');
    return results.map((row) => row.Database);
  }

  async listTables(database?: string): Promise<string[]> {
    let sql = 'SHOW TABLES';
    if (database) {
      sql = `SHOW TABLES FROM \`${database}\``;
    }
    
    const results = await this.query<{ [key: string]: string }>(sql);
    return results.map((row) => Object.values(row)[0]);
  }

  async describeTable(table: string, database?: string): Promise<any[]> {
    let sql = `DESCRIBE \`${table}\``;
    if (database) {
      sql = `DESCRIBE \`${database}\`.\`${table}\``;
    }
    
    return await this.query(sql);
  }

  async executeQuery(sql: string, params?: any[]): Promise<any[]> {
    return await this.query(sql, params);
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
