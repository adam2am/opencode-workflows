---
description: Manage workflows, rules, and crews using robust Captain Tools. Use this for complex edits or content creation.
shortcuts: [captain, cm]
tags: [create, workflow, edit, rule, crew, manage, delete, rename, list]
automention: true
---
# Captain Manager

This workflow provides **robust tools** for managing Captain resources (workflows, rules, crews). 
Use these tools instead of the CLI when dealing with complex content (multiline strings, markdown) to avoid shell quoting issues.

## Available Tools

- `captain_tool("captain-manager/list", { type?, tag?, folder? })`
  - List available items with optional filtering
  
- `captain_tool("captain-manager/read", { name, type? })`
  - Read the full content of an item (including frontmatter)
  
- `captain_tool("captain-manager/create", { type, name, content, force? })`
  - Create a new item. `content` must include full frontmatter + body.
  
- `captain_tool("captain-manager/update", { name, content, type? })`
  - Update an existing item's content.
  
- `captain_tool("captain-manager/delete", { name, type? })`
  - Delete an item.

## Examples

### 1. List Workflows
```javascript
captain_tool("captain-manager/list", { type: "workflow" })
```

### 2. Read a Workflow
```javascript
captain_tool("captain-manager/read", { name: "marketing/research" })
```

### 3. Create a Complex Workflow
```javascript
captain_tool("captain-manager/create", {
  type: "workflow",
  name: "code-review",
  content: `---
description: Review code standards
tags: [review, git]
---
# Code Review Workflow

1. Check formatting
2. Check logic
3. Run tests`
})
```

### 4. Update Content
```javascript
captain_tool("captain-manager/update", {
  name: "code-review",
  content: `---
description: Updated description
---
# New Content...`
})
```

## When to use CLI vs Tools

| Task | Preferred Method | Why? |
|------|------------------|------|
| **Listing** | CLI (`captain list`) | Faster output |
| **Simple Create** | CLI (`captain create ...`) | Quick for one-liners |
| **Complex Create** | **Tools** (`captain_tool`) | Handles newlines/quotes safely |
| **Editing** | **Tools** (`captain_tool`) | Safer content handling |
| **Deleting** | CLI (`captain delete`) | Simple |

## CLI Quick Reference
If you prefer CLI for simple tasks:
`captain <command> <type> <name> [options]`
