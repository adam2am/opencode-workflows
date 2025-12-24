# opencode-captain

Captain your AI with **Orders**, **Rules**, and **Crews** - a unified prompt management system for OpenCode.

## What is this?

opencode-captain is a plugin that manages three types of prompt templates:

| Type | Trigger | Behavior | Use Case |
|------|---------|----------|----------|
| **Orders** | `//name` in messages | Expand on demand, toast notification | Dynamic workflows, review checklists |
| **Rules** | Automatic | Silent injection into system prompt | Coding standards, style guides |
| **Crews** | Agent spawn | Configure agent behavior | Agent-specific instructions (Phase 4) |

## Quick Start

```
Review this auth system like //linus-torvalds and think about it //5-approaches

@backend/auth/service.go
```

The plugin automatically:
1. Detects the `//linus-torvalds` and `//5-approaches` mentions
2. Expands them into full content wrapped in `<order>` tags
3. Injects any matching rules silently into the system prompt

---

## Orders (Dynamic Workflows)

Orders are triggered explicitly with `//name` syntax in your messages.

### Folder Locations

| Location | Scope | Priority |
|----------|-------|----------|
| `.opencode/orders/` | Project | Highest |
| `.opencode/workflows/` | Project | Highest |
| `.opencode/commands/` | Project | Highest |
| `~/.config/opencode/orders/` | Global | Lower |
| `~/.config/opencode/workflows/` | Global | Lower |
| `~/.config/opencode/commands/` | Global | Lower |

Project orders override global ones with the same name.

### Order File Format

**`~/.config/opencode/orders/my-order.md`** -> `//my-order`

```markdown
---
description: "Short description of what this order does"
shortcuts: [mo, my-o]
tags: [review, check, analyze]
automention: true
onlyFor: [oracle, frontend]
spawnAt: [frontend:expanded]
---
# My Custom Order

Instructions for the AI to follow when this order is mentioned.

## Step 1
Do this thing...
```

### Frontmatter Options

| Field | Type | Description |
|-------|------|-------------|
| `description` | string | Short description shown in catalog |
| `shortcuts` / `aliases` | array | Alternative names to trigger this order |
| `tags` | array | Keywords for auto-suggestion matching |
| `automention` | `true` / `expanded` / `false` | Auto-suggestion mode (default: `true`) |
| `orderInOrder` | `true` / `hints` / `false` | Nested order expansion mode (default: `false`) |
| `onlyFor` | array | Limit visibility to specific agents |
| `spawnAt` | array | Inject when agent spawns (e.g., `[frontend:expanded]`) |

### Order Tools

| Tool | Description |
|------|-------------|
| `list_workflows` | List all available orders |
| `get_workflow` | Get a specific order's content |
| `create_workflow` | Create a new order |
| `edit_workflow` | Edit an existing order |
| `rename_workflow` | Rename an order |
| `delete_workflow` | Delete an order |
| `reload_workflows` | Reload orders from disk |
| `expand_workflows` | Manually expand `//mentions` in text |

---

## Rules (Silent Constraints)

Rules are automatically injected into the system prompt based on the active agent. They run silently without toast notifications.

### Folder Locations

| Location | Scope |
|----------|-------|
| `.opencode/rules/` | Project |
| `.opencode/creeds/` | Project |
| `.opencode/code/` | Project |
| `~/.config/opencode/rules/` | Global |
| `~/.config/opencode/creeds/` | Global |
| `~/.config/opencode/code/` | Global |

### Rule File Format

**`~/.config/opencode/rules/typescript-style.md`**

```markdown
---
description: "TypeScript coding standards"
onlyFor: [frontend, oracle]
---
# TypeScript Style Guide

- Use `const` over `let` where possible
- Prefer explicit return types on functions
- Use strict null checks
```

### Frontmatter Options

| Field | Type | Description |
|-------|------|-------------|
| `description` | string | Short description |
| `onlyFor` | array | Only inject for these agents (empty = all agents) |

### Rule Tools

| Tool | Description |
|------|-------------|
| `list_rules` | List all available rules |
| `get_rule` | Get a specific rule's content |
| `create_rule` | Create a new rule |
| `edit_rule` | Edit an existing rule |
| `delete_rule` | Delete a rule |
| `reload_rules` | Reload rules from disk |

### How Rules Work

1. On every message, the plugin checks the active agent
2. Rules with matching `onlyFor` (or no `onlyFor`) are collected
3. Rule content is injected into the system prompt
4. No toast notification - completely silent

**Example**: A `typescript-style` rule with `onlyFor: [frontend]` only injects when the `frontend` agent is active.

---

## Crews (Agent Definitions) - Coming in Phase 4

Crews will define agent-specific configurations and behaviors. Stay tuned!

---

## Smart Features

### Auto-Suggestions (Automention)

Orders with `automention` enabled are suggested based on message content:

| Mode | Behavior |
|------|----------|
| `automention: true` | AI fetches and applies automatically if relevant |
| `automention: expanded` | Content injected directly (no fetch needed) |
| `automention: false` | No auto-suggestion |

### Tag Matching

Tags support groups, OR alternatives, and phrase matching:

```yaml
tags: [commit, [staged, changes], patchnote|patchlog]
```

| Tag Type | Example | Triggers When |
|----------|---------|---------------|
| **Single** | `commit` | Word present (needs >=2 singles) |
| **Group (AND)** | `[staged, changes]` | ALL words present (triggers immediately) |
| **OR** | `patchnote\|patchlog` | ANY word matches |

### Agent Spawn Injection

Orders can auto-inject when specific agents spawn:

```yaml
spawnAt: [frontend:expanded, oracle]
```

### Smart Deduplication

Repeated mentions become references:
- First `//linus-torvalds` -> full expansion
- Second `//linus-torvalds` -> `[use_order:linus-torvalds-abc1]`

### Nested Orders

Orders can reference other orders:

```yaml
orderInOrder: true
```

---

## Installation

Add to your `opencode.json`:

```json
{
  "plugin": ["opencode-captain"]
}
```

Or for local development:

```bash
cd ~/.config/opencode/plugin/opencode-captain
bun install
bun run build
```

## Configuration

Config file: `~/.config/opencode/captain.json`

```json
{
  "deduplicateSameMessage": true,
  "maxNestingDepth": 3
}
```

---

## Migration from opencode-workflows

opencode-captain is fully backward compatible:

1. All existing workflow files work as-is
2. `workflows/` and `commands/` folders are still recognized
3. All workflow tools (`list_workflows`, etc.) continue to work
4. Simply rename the plugin in your `opencode.json`

**New capabilities:**
- Rules for silent constraint injection
- Unified architecture for future features
- Better organized codebase

---

## License

MIT