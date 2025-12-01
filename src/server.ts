#!/usr/bin/env node
import { config } from 'dotenv';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

// 加载.env文件
config();
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { MySQLClient } from './mysql-client.js';
import {
  QueryDatabaseSchema,
  ListDatabasesSchema,
  ListTablesSchema,
  DescribeTableSchema,
} from './types.js';

// 从环境变量获取MySQL配置
const MYSQL_HOST = process.env.MYSQL_HOST || 'localhost';
const MYSQL_PORT = parseInt(process.env.MYSQL_PORT || '3306', 10);
const MYSQL_USER = process.env.MYSQL_USER || 'root';
const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD || '1234';
const MYSQL_DATABASE = process.env.MYSQL_DATABASE || '';

class MySQLServer {
  private server: Server;
  private mysqlClient: MySQLClient;

  constructor() {
    this.server = new Server(
      {
        name: 'mysql-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    // 创建MySQL客户端
    this.mysqlClient = new MySQLClient({
      host: MYSQL_HOST,
      port: MYSQL_PORT,
      user: MYSQL_USER,
      password: MYSQL_PASSWORD,
      database: MYSQL_DATABASE,
    });
    
    // 错误处理
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.cleanup();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    // 列出可用工具
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'query_database',
            description: '执行SQL查询并返回结果',
            inputSchema: zodToJsonSchema(QueryDatabaseSchema),
          },
          {
            name: 'list_databases',
            description: '列出所有可用的数据库',
            inputSchema: zodToJsonSchema(ListDatabasesSchema),
          },
          {
            name: 'list_tables',
            description: '列出指定数据库中的所有表格',
            inputSchema: zodToJsonSchema(ListTablesSchema),
          },
          {
            name: 'describe_table',
            description: '描述表格结构',
            inputSchema: zodToJsonSchema(DescribeTableSchema),
          },
        ],
      };
    });

    // 处理工具调用
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        switch (request.params.name) {
          case 'query_database':
            return await this.handleQueryDatabase(request.params.arguments);
          case 'list_databases':
            return await this.handleListDatabases();
          case 'list_tables':
            return await this.handleListTables(request.params.arguments);
          case 'describe_table':
            return await this.handleDescribeTable(request.params.arguments);
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `未知工具: ${request.params.name}`
            );
        }
      } catch (error) {
        console.error('Tool execution error:', error);
        return {
          content: [
            {
              type: 'text',
              text: `执行错误: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private async handleQueryDatabase(args: any) {
    const { sql, params } = QueryDatabaseSchema.parse(args);
    try {
      const results = await this.mysqlClient.executeQuery(sql, params);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(results, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `SQL执行错误: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async handleListDatabases() {
    try {
      const databases = await this.mysqlClient.listDatabases();
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(databases, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `获取数据库列表错误: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async handleListTables(args: any) {
    const { database } = ListTablesSchema.parse(args);
    try {
      const tables = await this.mysqlClient.listTables(database);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(tables, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `获取表格列表错误: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async handleDescribeTable(args: any) {
    const { table, database } = DescribeTableSchema.parse(args);
    try {
      const tableInfo = await this.mysqlClient.describeTable(table, database);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(tableInfo, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `获取表格结构错误: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async cleanup() {
    try {
      await this.mysqlClient.close();
      await this.server.close();
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }

  async run() {
    // 设置工具处理程序（在连接之前）
    this.setupToolHandlers();
    
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('MySQL MCP server running on stdio');
  }
}

const server = new MySQLServer();
server.run().catch(console.error);
