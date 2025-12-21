# Patchlog

## [1.0.0] - 2025-12-21

### Added
- Inline workflow mentions via `//workflow-name` syntax in prompts
- Auto-expansion of workflow templates with `<workflow>` XML tags
- Smart "Did you mean?" suggestions for partial or incorrect workflow names
- YAML frontmatter support for workflow shortcuts/aliases
- Project-scoped (`.opencode/workflows/`) and global (`~/.config/opencode/workflows/`) workflow directories
- CRUD tools: `create_workflow`, `edit_workflow`, `delete_workflow`, `rename_workflow`, `list_workflows`, `get_workflow`, `reload_workflows`, `expand_workflows`
