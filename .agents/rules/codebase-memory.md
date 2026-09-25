# Codebase Memory MCP Integration

The project has **codebase-memory-mcp** configured as an active MCP server (both in global `~/.gemini/config/mcp_config.json` and workspace `.agents/mcp_config.json`).

## When to Use

1. **Architecture & Component Discovery:**
   - Use `get_architecture` or `search_graph` to understand component boundaries, import graphs, and schema definitions.
2. **Symbol & Dependency Tracing:**
   - Use `trace_path` to inspect call hierarchies or dependencies between modules before refactoring.
3. **Targeted Code Retrieval:**
   - Use `get_code_snippet` and `get_file_outline` to inspect symbol definitions and structural outlines without reading massive files.
4. **Graph Refresh:**
   - When large structural changes occur, update the index using `index_repository` with `--persistence true`.
