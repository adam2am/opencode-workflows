---
description: Manage workflows, rules, and crews via CLI
shortcuts: [captain, cm]
tags: [create, workflow, edit, rule, crew, manage, delete, rename, list]
automention: true
---
# Captain CLI - Manage Workflows, Rules, and Crews

Use the `captain` CLI via bash to manage captain resources.

## Quick Reference

```bash
captain <command> <type> <name> [options]
```

| Command | Description |
|---------|-------------|
| `create` | Create new item |
| `edit` | Edit existing item |
| `delete` | Delete item |
| `rename` | Rename item |
| `list` | List all items |

| Type | Description |
|------|-------------|
| `workflow` | Workflow/scroll templates |
| `rule` | Rules/constraints for agents |
| `crew` | Crew agent definitions |

## Examples

### Create Workflow
```bash
captain create workflow my-flow \
  --content "# My Workflow\n\nDo something useful" \
  --description "What this workflow does" \
  --shortcuts "mf, myflow" \
  --tags "tag1, tag2" \
  --scope global
```

### Create Rule
```bash
captain create rule no-any \
  --content "Never use 'any' type in TypeScript" \
  --description "Enforce type safety" \
  --onlyFor "build, code-reviewer"
```

### Create Crew
```bash
captain create crew reviewer \
  --content "You are a code reviewer. Be thorough but constructive." \
  --description "Reviews code for quality" \
  --mode subagent \
  --model "claude-sonnet-4-20250514" \
  --tools "read, grep, glob"
```

### Edit (Full Content Replace)
```bash
captain edit workflow my-flow \
  --content "---\ndescription: Updated\nshortcuts: [mf]\n---\n\n# Updated Content"
```

### Delete
```bash
captain delete workflow old-flow --scope project
```

### Rename
```bash
captain rename workflow old-name --newName new-name
```

### List
```bash
captain list workflow
captain list rule --scope global
captain list crew --scope project
```

## Options Reference

### Common Options
| Option | Description | Default |
|--------|-------------|---------|
| `--scope` | `global` or `project` | `global` |
| `--content` | Main content | `# {name}` |
| `--description` | Short description | - |
| `--onlyFor` | Agent visibility filter | - |

### Workflow-Only Options
| Option | Description |
|--------|-------------|
| `--shortcuts` | Comma-separated aliases |
| `--tags` | Comma-separated tags for auto-suggestion |
| `--automention` | `true`, `expanded`, or `false` |
| `--expand` | `true` or `false` |
| `--spawnAt` | Agent spawn triggers |
| `--include` | Files to include |

### Crew-Only Options
| Option | Description |
|--------|-------------|
| `--mode` | `agent` or `subagent` |
| `--model` | Model name |
| `--temperature` | Temperature value |
| `--tools` | Comma-separated tool names |

## Scope Locations

| Scope | Location |
|-------|----------|
| `global` | `~/.config/opencode/{type}s/` |
| `project` | `.opencode/{type}s/` |

## Array Parameter Formatting

The CLI normalizes array inputs automatically:

| Input | Result |
|-------|--------|
| `"a, b, c"` | `[a, b, c]` |
| `"[a, b]"` | `[a, b]` |
| `"a"` | `[a]` |
