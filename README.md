# MySQL MCP Server

一个基于Model Context Protocol (MCP)的MySQL服务器，允许通过MCP协议执行SQL查询。

## 功能

- 通过MCP协议执行SQL查询
- 检查数据库连接状态
- 内置SQL查询示例提示

## 安装

```bash
# 克隆仓库
git clone https://github.com/shengshengshengbuxi/mysql_mcp_server.git
cd mysql_mcp_server

# 安装依赖
npm install

# 编译TypeScript代码
npm run build
```

## 配置

服务器使用以下环境变量进行配置：

- `MYSQL_HOST`: MySQL主机地址（默认: localhost）
- `MYSQL_PORT`: MySQL端口（默认: 3306）
- `MYSQL_USER`: MySQL用户名（默认: root）
- `MYSQL_PASSWORD`: MySQL密码（默认: 空）
- `MYSQL_DATABASE`: MySQL数据库名（默认: 空）

## 运行

```bash
# 设置MySQL连接参数
$env:MYSQL_HOST = "localhost"
$env:MYSQL_PORT = "3306"
$env:MYSQL_USER = "root"
$env:MYSQL_PASSWORD = "your_password"
$env:MYSQL_DATABASE = "your_database"

# 运行服务器
npm start
```

## 与Claude集成

要在Claude Desktop中使用此服务器，请编辑Claude Desktop配置文件：

Windows: 
```
%USERPROFILE%\AppData\Roaming\Claude\claude_desktop_config.json
```

添加以下配置：

```json
{
  "mcpServers": {
    "mysql": {
      "command": "node",
      "args": [
        "/path/to/mysql_mcp_server/dist/server.js"
      ]
    }
  }
}
```

## 工具

- `execute_sql`: 执行SQL查询
- `check_connection`: 检查数据库连接状态

## 提示

- `sql_example`: 提供SQL查询示例

## 许可证

MIT 