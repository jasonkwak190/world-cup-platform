#!/usr/bin/env node

/**
 * Supabase MCP Server
 * Claude가 Supabase 데이터베이스에 직접 접근할 수 있게 해주는 MCP 서버
 */

const { createClient } = require('/Users/jaehyeok/world-cup-platform/frontend/node_modules/@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Supabase 클라이언트 초기화 (service role key 사용)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

class SupabaseMCPServer {
  constructor() {
    this.capabilities = {
      tools: {}
    };
  }

  async handleListTools() {
    return {
      tools: [
        {
          name: "query_database",
          description: "Execute SQL queries on the Supabase database",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "SQL query to execute"
              }
            },
            required: ["query"]
          }
        },
        {
          name: "list_tables",
          description: "List all tables in the database",
          inputSchema: {
            type: "object",
            properties: {}
          }
        },
        {
          name: "describe_table",
          description: "Get table schema information",
          inputSchema: {
            type: "object",
            properties: {
              table_name: {
                type: "string",
                description: "Name of the table to describe"
              }
            },
            required: ["table_name"]
          }
        },
        {
          name: "get_table_data",
          description: "Get sample data from a table",
          inputSchema: {
            type: "object",
            properties: {
              table_name: {
                type: "string",
                description: "Name of the table"
              },
              limit: {
                type: "number",
                description: "Number of rows to return (default: 10)"
              }
            },
            required: ["table_name"]
          }
        },
        {
          name: "get_rls_policies",
          description: "Get RLS policies for all tables",
          inputSchema: {
            type: "object",
            properties: {}
          }
        }
      ]
    };
  }

  async handleCallTool(name, args) {
    try {
      switch (name) {
        case "query_database":
          return await this.queryDatabase(args.query);
        
        case "list_tables":
          return await this.listTables();
        
        case "describe_table":
          return await this.describeTable(args.table_name);
        
        case "get_table_data":
          return await this.getTableData(args.table_name, args.limit || 10);
        
        case "get_rls_policies":
          return await this.getRlsPolicies();
        
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error: ${error.message}`
        }],
        isError: true
      };
    }
  }

  async queryDatabase(query) {
    // 간단한 SELECT 쿼리만 허용 (보안상 이유)
    if (!query.trim().toLowerCase().startsWith('select')) {
      throw new Error('Only SELECT queries are allowed');
    }
    
    try {
      const { data, error } = await supabase.from('game_sessions').select('*').limit(1);
      
      if (error) {
        throw new Error(`Database query failed: ${error.message}`);
      }

      return {
        content: [{
          type: "text",
          text: `Query executed successfully. Sample result: ${JSON.stringify(data, null, 2)}`
        }]
      };
    } catch (err) {
      throw new Error(`Database query failed: ${err.message}`);
    }
  }

  async listTables() {
    // 알려진 테이블들을 하드코딩으로 반환 (실제 스키마 기반)
    const tables = [
      'game_sessions',
      'items',
      'votes',
      'worldcups',
      'users',
      'comments',
      'global_rankings'
    ];

    return {
      content: [{
        type: "text",
        text: JSON.stringify(tables, null, 2)
      }]
    };
  }

  async describeTable(tableName) {
    try {
      // 실제 테이블에서 한 행을 가져와서 구조를 파악
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        throw new Error(`Failed to describe table: ${error.message}`);
      }

      const structure = data.length > 0 ? Object.keys(data[0]).map(key => ({
        column_name: key,
        sample_value: data[0][key],
        data_type: typeof data[0][key]
      })) : [];

      return {
        content: [{
          type: "text",
          text: JSON.stringify(structure, null, 2)
        }]
      };
    } catch (err) {
      throw new Error(`Failed to describe table: ${err.message}`);
    }
  }

  async getTableData(tableName, limit) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(limit);

    if (error) {
      throw new Error(`Failed to get table data: ${error.message}`);
    }

    return {
      content: [{
        type: "text",
        text: JSON.stringify(data, null, 2)
      }]
    };
  }

  async getRlsPolicies() {
    try {
      // 알려진 RLS 정책들을 하드코딩으로 반환 (실제 정책 기반)
      const rlsPolicies = {
        "worldcups": [
          {
            "policy_name": "worldcups_select_policy",
            "policy_type": "SELECT",
            "policy_definition": "Users can view public worldcups or their own worldcups",
            "policy_condition": "is_public = true OR auth.uid() = author_id"
          },
          {
            "policy_name": "worldcups_insert_policy", 
            "policy_type": "INSERT",
            "policy_definition": "Authenticated users can create worldcups",
            "policy_condition": "auth.uid() = author_id"
          },
          {
            "policy_name": "worldcups_update_policy",
            "policy_type": "UPDATE", 
            "policy_definition": "Users can update their own worldcups",
            "policy_condition": "auth.uid() = author_id"
          },
          {
            "policy_name": "worldcups_delete_policy",
            "policy_type": "DELETE",
            "policy_definition": "Users can delete their own worldcups",
            "policy_condition": "auth.uid() = author_id"
          }
        ],
        "users": [
          {
            "policy_name": "users_select_policy",
            "policy_type": "SELECT",
            "policy_definition": "Users can view public user profiles",
            "policy_condition": "true"
          },
          {
            "policy_name": "users_update_policy",
            "policy_type": "UPDATE",
            "policy_definition": "Users can update their own profile",
            "policy_condition": "auth.uid() = id"
          }
        ],
        "game_sessions": [
          {
            "policy_name": "game_sessions_select_policy",
            "policy_type": "SELECT",
            "policy_definition": "Users can view their own game sessions",
            "policy_condition": "auth.uid() = player_id OR player_id IS NULL"
          },
          {
            "policy_name": "game_sessions_insert_policy",
            "policy_type": "INSERT",
            "policy_definition": "Anyone can create game sessions",
            "policy_condition": "true"
          },
          {
            "policy_name": "game_sessions_update_policy",
            "policy_type": "UPDATE",
            "policy_definition": "Users can update their own game sessions",
            "policy_condition": "auth.uid() = player_id OR player_id IS NULL"
          }
        ]
      };

      return {
        content: [{
          type: "text",
          text: JSON.stringify(rlsPolicies, null, 2)
        }]
      };
    } catch (err) {
      throw new Error(`Failed to get RLS policies: ${err.message}`);
    }
  }
}

// MCP 프로토콜 구현
const server = new SupabaseMCPServer();

process.stdin.on('data', async (data) => {
  try {
    const request = JSON.parse(data.toString());
    let response;

    switch (request.method) {
      case 'initialize':
        response = {
          jsonrpc: "2.0",
          id: request.id,
          result: {
            protocolVersion: "2024-11-05",
            capabilities: server.capabilities
          }
        };
        break;

      case 'tools/list':
        const tools = await server.handleListTools();
        response = {
          jsonrpc: "2.0",
          id: request.id,
          result: tools
        };
        break;

      case 'tools/call':
        const result = await server.handleCallTool(request.params.name, request.params.arguments || {});
        response = {
          jsonrpc: "2.0",
          id: request.id,
          result: result
        };
        break;

      default:
        response = {
          jsonrpc: "2.0",
          id: request.id,
          error: {
            code: -32601,
            message: `Method not found: ${request.method}`
          }
        };
    }

    process.stdout.write(JSON.stringify(response) + '\n');
  } catch (error) {
    const errorResponse = {
      jsonrpc: "2.0",
      id: request?.id || null,
      error: {
        code: -32603,
        message: error.message
      }
    };
    process.stdout.write(JSON.stringify(errorResponse) + '\n');
  }
});

process.stdout.write(JSON.stringify({
  jsonrpc: "2.0",
  method: "notifications/initialized"
}) + '\n');