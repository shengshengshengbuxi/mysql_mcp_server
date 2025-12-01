import { z } from 'zod';

// 查询数据库工具的输入模式
export const QueryDatabaseSchema = z.object({
  sql: z.string().min(1).describe('SQL查询语句'),
  params: z.array(z.any()).optional().describe('查询参数（可选）'),
});

export type QueryDatabaseInput = z.infer<typeof QueryDatabaseSchema>;

// 列出数据库工具的输入模式
export const ListDatabasesSchema = z.object({});

export type ListDatabasesInput = z.infer<typeof ListDatabasesSchema>;

// 列出表格工具的输入模式
export const ListTablesSchema = z.object({
  database: z.string().optional().describe('数据库名称（可选，如果未提供则使用当前数据库）'),
});

export type ListTablesInput = z.infer<typeof ListTablesSchema>;

// 描述表格工具的输入模式
export const DescribeTableSchema = z.object({
  table: z.string().min(1).describe('表格名称'),
  database: z.string().optional().describe('数据库名称（可选，如果未提供则使用当前数据库）'),
});

export type DescribeTableInput = z.infer<typeof DescribeTableSchema>;
