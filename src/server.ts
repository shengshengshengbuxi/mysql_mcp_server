import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import mysql from 'mysql2/promise';
import { z } from 'zod';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 从环境变量读取 MySQL 配置
const MYSQL_HOST = process.env.MYSQL_HOST || 'localhost';
const MYSQL_PORT = parseInt(process.env.MYSQL_PORT || '3306');
const MYSQL_USER = process.env.MYSQL_USER || 'root';
const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD || '';
const MYSQL_DATABASE = process.env.MYSQL_DATABASE || '';

// 创建服务器实例
const server = new McpServer({
  name: "mysql-mcp-server",
  version: "1.0.0",
  description: "MySQL MCP Server",
  vendor: {
    name: "Custom MySQL MCP",
    url: "https://example.com"
  }
});

// 创建 MySQL 连接池
const pool = mysql.createPool({
  host: MYSQL_HOST,
  port: MYSQL_PORT,
  user: MYSQL_USER,
  password: MYSQL_PASSWORD,
  database: MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 测试数据库连接
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.error('MySQL 连接成功');
    connection.release();
    return true;
  } catch (err) {
    console.error(`MySQL 连接错误: ${(err as Error).message}`);
    if ((err as any).code === 'ECONNREFUSED') {
      console.error(`无法连接到 MySQL 服务器: ${MYSQL_HOST}:${MYSQL_PORT}`);
    } else if ((err as any).code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('MySQL 用户名或密码错误');
    } else if ((err as any).code === 'ER_BAD_DB_ERROR') {
      console.error(`数据库 '${MYSQL_DATABASE}' 不存在`);
    }
    return false;
  }
}

// 定义执行SQL查询的工具
server.tool(
  "execute_sql",
  { query: z.string().describe("The SQL query to execute") },
  async ({ query }) => {
    try {
      // 执行 SQL 查询
      const [results] = await pool.query(query);

      // 根据查询类型返回结果
      if (query.trim().toUpperCase().startsWith('SELECT') || query.trim().toUpperCase().startsWith('SHOW')) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify(results, null, 2)
          }]
        };
      } else {
        const affectedRows = (results as any).affectedRows || 0;
        return {
          content: [{
            type: "text",
            text: `${affectedRows} rows affected`
          }]
        };
      }
    } catch (err) {
      return {
        content: [{
          type: "text",
          text: `MySQL error: ${(err as Error).message}`
        }],
        isError: true
      };
    }
  }
);

// 定义数据库健康检查工具
server.tool(
  "check_connection",
  {},
  async () => {
    try {
      const connection = await pool.getConnection();
      connection.release();
      return {
        content: [{
          type: "text",
          text: "Database connection successful"
        }]
      };
    } catch (err) {
      return {
        content: [{
          type: "text",
          text: `Database connection failed: ${(err as Error).message}`
        }],
        isError: true
      };
    }
  }
);

// 添加一个提示示例，帮助用户了解如何使用SQL查询
server.prompt(
  "sql_example",
  {},
  () => ({
    messages: [{
      role: "user",
      content: {
        type: "text",
        text: `您可以通过execute_sql工具执行SQL查询。例如：
        
- 查询表: SELECT * FROM users LIMIT 10;
- 创建表: CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(100));
- 插入数据: INSERT INTO users (id, name) VALUES (1, 'John Doe');
- 更新数据: UPDATE users SET name = 'Jane Doe' WHERE id = 1;
- 删除数据: DELETE FROM users WHERE id = 1;

请问您想执行什么SQL查询？`
      }
    }]
  })
);

// 启动服务器
async function start() {
  // 测试数据库连接
  await testConnection();

  // 打印启动消息
  console.error('MySQL MCP 服务器已启动，等待请求...');
  console.error(`连接到：${MYSQL_HOST}:${MYSQL_PORT}，数据库：${MYSQL_DATABASE || '(默认)'}`);

  // 连接到stdio传输层
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

start().catch(err => {
  console.error('启动失败:', err);
  process.exit(1);
}); 