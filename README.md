# opencode-workflows

Inline workflow mentions for OpenCode - use `//workflow-name` anywhere in your prompts!

## What is this?

This plugin enables you to reference workflow templates inline in your messages using `//workflow-name` syntax. Instead of repeating long instructions, just mention a workflow and the AI will expand it automatically.

## Usage

Simply use `//workflow-name` anywhere in your message:

```
Review this auth system like //linus-torvalds and think about it //5-approaches

@backend/auth/service.go
```

The plugin automatically:
1. Detects the `//linus-torvalds` and `//5-approaches` mentions
2. Expands them into full workflow content wrapped in `<workflow>` tags
3. Injects instructions for the AI to apply all workflows

## Naming Rules

| Format | Example | Valid? |
|--------|---------|--------|
| Hyphens | `//my-workflow` | Yes |
| Numbers | `//5-approaches` | Yes |
| Underscores | `//my_workflow` | Yes |
| CamelCase | `//MyWorkflow` | Yes |
| **Spaces** | `//my workflow` | **No** - stops at space |

**Important**: Spaces break the tag. `//5 approaches` captures only `//5`.

## Smart Suggestions ("Did you mean?")

If you type a partial or incorrect workflow name, the plugin suggests the correct one:

```
You: analyze this //5 approaches
AI: I noticed you typed "//5". Did you mean "//5-approaches"?
```

The plugin matches:
- **Prefix**: `//5` → `//5-approaches`
- **Partial**: `//torvalds` → `//linus-torvalds`

## Available Workflows

| Workflow | Description |
|----------|-------------|
| `//5-approaches` | Analyze from 5 perspectives: first principles, inversion, analogies, blue sky, MVP |
| `//code-review` | Standard code review checklist |
| `//commit_review` | Review staged changes and draft a commit message |
| `//linus-torvalds` | Kernel maintainer code review style - direct, focused on data structures, KISS |
| `//patchlog` | Generate structured patchlog entry for documentation |
| `//security-audit` | OWASP Top 10 security review checklist |

## Creating Custom Workflows

Create `.md` files in one of these locations:

| Location | Scope | Priority |
|----------|-------|----------|
| `.opencode/workflows/` | Project-specific | Highest |
| `~/.config/opencode/workflows/` | Global | Lower |

Project workflows override global ones with the same name.

### Workflow File Format

Just plain markdown - the filename becomes the workflow name:

**`~/.config/opencode/workflows/my-workflow.md`** → `//my-workflow`

```markdown
# My Custom Workflow

Instructions for the AI to follow when this workflow is mentioned.

## Step 1
Do this thing...

## Step 2
Then do this...
```

### Shortcuts / Aliases (Optional)

You can define multiple names for the same workflow using YAML frontmatter.
Both `shortcuts:` and `aliases:` work - pick whichever feels natural:

```markdown
---
shortcuts: [cr, review_commit, commit-review]
---
# Commit Review Workflow

Review staged changes and draft a commit message.
```

Or:

```markdown
---
aliases: [cr, review_commit, commit-review]
---
# Commit Review Workflow
```

Now `//cr`, `//review_commit`, and `//commit-review` all trigger the same workflow.
```

## Tools Provided

| Tool | Description |
|------|-------------|
| `list_workflows` | List all available workflows |
| `get_workflow` | Get a specific workflow's content |
| `create_workflow` | Create a new workflow template |
| `edit_workflow` | Edit an existing workflow |
| `rename_workflow` | Rename a workflow |
| `delete_workflow` | Delete a workflow |
| `reload_workflows` | Reload workflows from disk |
| `expand_workflows` | Manually expand `//mentions` in text |

## How It Works

1. **Startup**: Plugin loads all `.md` files from workflow directories and logs count
2. **Detection**: When you send a message, the plugin scans for `//pattern` mentions
3. **Expansion**: Valid mentions are replaced with full workflow content in `<workflow>` tags
4. **Suggestions**: Invalid mentions trigger "Did you mean?" suggestions
5. **Injection**: Context is appended instructing the AI to apply all workflows

### Pattern Matching

The regex `(?<![:\w/])//([a-zA-Z0-9][a-zA-Z0-9_-]*)` ensures:
- URLs like `https://example.com` are ignored
- File paths like `/usr/local//bin` are ignored  
- Comments like `// This is a comment` are ignored (space breaks token)
- Only valid workflow tokens are captured

## Installation

Add to your `opencode.json`:

```json
{
  "plugin": ["opencode-workflows"]
}
```

Or for local development:

```bash
cd ~/.config/opencode/plugin/opencode-workflows
bun install
```

## License

MIT
