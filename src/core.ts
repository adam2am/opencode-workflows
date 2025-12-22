export function normalize(s: string): string {
  return s.toLowerCase().replace(/[-_]/g, '');
}

export function findWorkflowByName(input: string, candidates: string[]): string | null {
  const exactMatch = candidates.find(c => c === input);
  if (exactMatch) return exactMatch;

  const nInput = normalize(input);
  const normalizedMatch = candidates.find(c => normalize(c) === nInput);
  return normalizedMatch || null;
}

export function findBestMatch(typo: string, candidates: string[]): string | null {
  const matches = findAllMatches(typo, candidates);
  return matches.length > 0 ? matches[0] : null;
}

export function findAllMatches(typo: string, candidates: string[], limit = 3): string[] {
  const nTypo = normalize(typo);
  if (nTypo.length < 1) return [];

  const exact = candidates.filter(c => normalize(c) === nTypo);
  if (exact.length > 0) return exact.slice(0, limit);

  const prefixMatches = candidates
    .filter(c => normalize(c).startsWith(nTypo))
    .sort((a, b) => normalize(a).length - normalize(b).length);
  
  return prefixMatches.slice(0, limit);
}

export interface WorkflowMention {
  name: string;
  force: boolean;
}

const WORKFLOW_MENTION_PATTERN = /(?<![:\w/])\/\/([a-zA-Z0-9][a-zA-Z0-9_-]*)(!)?/g;

export function detectWorkflowMentions(text: string): WorkflowMention[] {
  const matches: WorkflowMention[] = [];
  const seen = new Set<string>();
  let match: RegExpExecArray | null;
  
  WORKFLOW_MENTION_PATTERN.lastIndex = 0;

  while ((match = WORKFLOW_MENTION_PATTERN.exec(text)) !== null) {
    const name = match[1];
    if (!seen.has(name)) {
      seen.add(name);
      matches.push({ name, force: match[2] === '!' });
    }
  }
  
  return matches;
}

export function parseArrayField(yaml: string, fieldName: string): string[] {
  const regex = new RegExp(`^${fieldName}:\\s*(?:\\[(.*)\\]|(.*))`, 'm');
  const match = yaml.match(regex);
  if (!match) return [];
  const raw = match[1] || match[2];
  if (!raw) return [];
  return raw.split(',').map(a => a.trim().replace(/['"]/g, '')).filter(a => a);
}

export interface ParsedFrontmatter {
  aliases: string[];
  tags: string[];
  agents: string[];
  description: string;
  autoworkflow: boolean;
  body: string;
}

export function parseFrontmatter(fileContent: string): ParsedFrontmatter {
  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/;
  const match = fileContent.match(frontmatterRegex);

  if (!match) {
    return { aliases: [], tags: [], agents: [], description: '', autoworkflow: false, body: fileContent };
  }

  const yaml = match[1];
  const body = fileContent.slice(match[0].length);

  const aliases = [
    ...parseArrayField(yaml, 'aliases'),
    ...parseArrayField(yaml, 'shortcuts')
  ];
  const tags = parseArrayField(yaml, 'tags');
  const agents = parseArrayField(yaml, 'agents');

  const descMatch = yaml.match(/^description:\s*(.*)$/m);
  const description = descMatch ? descMatch[1].trim().replace(/^['"]|['"]$/g, '') : '';

  const autoMatch = yaml.match(/^autoworkflow:\s*(.*)$/m);
  let autoworkflow = false;
  if (autoMatch) {
    const val = autoMatch[1].trim().toLowerCase();
    autoworkflow = val === 'true' || val === 'yes';
  }

  return { aliases, tags, agents, description, autoworkflow, body };
}

export function formatSuggestion(name: string, aliases: string[], maxAliases = 3): string {
  if (aliases.length === 0) return name;
  const topAliases = aliases.slice(0, maxAliases).join(' | ');
  return `${name} (${topAliases})`;
}
