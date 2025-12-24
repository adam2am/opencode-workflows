import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

import { parseCrewFrontmatter } from '../src/crew/parser';
import { crewToAgentConfig, crewsToAgentConfigs, filterCrewsByAgent } from '../src/crew/engine';
import { loadCrews } from '../src/crew/tools';
import { registerCrewsWithConfig } from '../src/crew/hooks';
import type { Crew } from '../src/crew/types';

describe('parseCrewFrontmatter', () => {
  test('parses minimal frontmatter', () => {
    const md = `---
description: "A test crew"
---
You are a helpful assistant.`;
    const result = parseCrewFrontmatter(md);
    expect(result.description).toBe('A test crew');
    expect(result.body.trim()).toBe('You are a helpful assistant.');
    expect(result.mode).toBeUndefined();
    expect(result.model).toBeUndefined();
    expect(result.temperature).toBeUndefined();
    expect(result.tools).toBeUndefined();
  });

  test('parses full frontmatter with model/temperature/tools/mode', () => {
    const md = `---
description: "Full crew"
model: claude-3-opus
temperature: 0.7
tools: [read, write, bash]
mode: agent
onlyFor: [frontend-ui-ux-engineer, oracle]
---
You are a code reviewer.`;
    const result = parseCrewFrontmatter(md);
    expect(result.description).toBe('Full crew');
    expect(result.model).toBe('claude-3-opus');
    expect(result.temperature).toBe(0.7);
    expect(result.tools).toEqual(['read', 'write', 'bash']);
    expect(result.mode).toBe('agent');
    expect(result.onlyFor).toEqual(['frontend-ui-ux-engineer', 'oracle']);
  });

  test('parses tools as comma-separated string', () => {
    const md = `---
tools: read, write, bash
---
Content`;
    const result = parseCrewFrontmatter(md);
    expect(result.tools).toEqual(['read', 'write', 'bash']);
  });

  test('defaults mode to undefined (engine will default to subagent)', () => {
    const md = `---
description: "No mode"
---
Content`;
    const result = parseCrewFrontmatter(md);
    expect(result.mode).toBeUndefined();
  });

  test('handles no frontmatter', () => {
    const md = `Just content without frontmatter.`;
    const result = parseCrewFrontmatter(md);
    expect(result.description).toBe('');
    expect(result.body.trim()).toBe('Just content without frontmatter.');
  });
});

describe('crewToAgentConfig', () => {
  test('converts minimal crew to AgentConfig', () => {
    const crew: Crew = {
      name: 'test-crew',
      path: '/path/to/crew.md',
      source: 'global',
      content: 'You are a test assistant.',
      description: 'Test crew',
      aliases: [],
      tags: [],
      onlyFor: [],
      promptType: 'crew',
      mode: 'subagent',
    };
    const config = crewToAgentConfig(crew);
    expect(config.description).toBe('Test crew');
    expect(config.mode).toBe('subagent');
    expect(config.prompt).toBe('You are a test assistant.');
    expect(config.model).toBeUndefined();
    expect(config.temperature).toBeUndefined();
    expect(config.tools).toBeUndefined();
  });

  test('converts full crew to AgentConfig', () => {
    const crew: Crew = {
      name: 'full-crew',
      path: '/path/to/crew.md',
      source: 'project',
      content: 'You are a full assistant.',
      description: 'Full crew',
      aliases: [],
      tags: [],
      onlyFor: [],
      promptType: 'crew',
      mode: 'agent',
      model: 'gpt-4',
      temperature: 0.5,
      tools: ['read', 'write'],
    };
    const config = crewToAgentConfig(crew);
    expect(config.description).toBe('Full crew');
    expect(config.mode).toBe('agent');
    expect(config.prompt).toBe('You are a full assistant.');
    expect(config.model).toBe('gpt-4');
    expect(config.temperature).toBe(0.5);
    expect(config.tools).toEqual({ read: true, write: true });
  });

  test('uses fallback description if none provided', () => {
    const crew: Crew = {
      name: 'no-desc',
      path: '/path/to/crew.md',
      source: 'global',
      content: 'Content',
      description: '',
      aliases: [],
      tags: [],
      onlyFor: [],
      promptType: 'crew',
      mode: 'subagent',
    };
    const config = crewToAgentConfig(crew);
    expect(config.description).toBe('(global) no-desc');
  });
});

describe('crewsToAgentConfigs', () => {
  test('converts multiple crews to config map', () => {
    const crews = new Map<string, Crew>([
      ['crew-a', {
        name: 'crew-a',
        path: '/path/a.md',
        source: 'global',
        content: 'Content A',
        description: 'Crew A',
        aliases: [],
        tags: [],
        onlyFor: [],
        promptType: 'crew',
        mode: 'subagent',
      }],
      ['crew-b', {
        name: 'crew-b',
        path: '/path/b.md',
        source: 'project',
        content: 'Content B',
        description: 'Crew B',
        aliases: [],
        tags: [],
        onlyFor: [],
        promptType: 'crew',
        mode: 'agent',
        model: 'claude-3-opus',
      }],
    ]);
    const configs = crewsToAgentConfigs(crews);
    expect(Object.keys(configs)).toHaveLength(2);
    expect(configs['crew-a'].mode).toBe('subagent');
    expect(configs['crew-b'].mode).toBe('agent');
    expect(configs['crew-b'].model).toBe('claude-3-opus');
  });

  test('deduplicates by name', () => {
    const crews = new Map<string, Crew>([
      ['crew-a', {
        name: 'crew-a',
        path: '/path/a1.md',
        source: 'global',
        content: 'First',
        description: 'First',
        aliases: [],
        tags: [],
        onlyFor: [],
        promptType: 'crew',
        mode: 'subagent',
      }],
      ['crew-a-alias', {
        name: 'crew-a',
        path: '/path/a2.md',
        source: 'project',
        content: 'Second',
        description: 'Second',
        aliases: ['crew-a-alias'],
        tags: [],
        onlyFor: [],
        promptType: 'crew',
        mode: 'agent',
      }],
    ]);
    const configs = crewsToAgentConfigs(crews);
    expect(Object.keys(configs)).toHaveLength(1);
    expect(configs['crew-a'].description).toBe('First');
  });
});

describe('filterCrewsByAgent', () => {
  const crews = new Map<string, Crew>([
    ['all-agents', {
      name: 'all-agents',
      path: '/path/all.md',
      source: 'global',
      content: 'Available to all',
      description: 'All agents',
      aliases: [],
      tags: [],
      onlyFor: [],
      promptType: 'crew',
      mode: 'subagent',
    }],
    ['frontend-only', {
      name: 'frontend-only',
      path: '/path/frontend.md',
      source: 'global',
      content: 'Frontend only',
      description: 'Frontend',
      aliases: [],
      tags: [],
      onlyFor: ['frontend-ui-ux-engineer'],
      promptType: 'crew',
      mode: 'subagent',
    }],
    ['oracle-only', {
      name: 'oracle-only',
      path: '/path/oracle.md',
      source: 'global',
      content: 'Oracle only',
      description: 'Oracle',
      aliases: [],
      tags: [],
      onlyFor: ['oracle'],
      promptType: 'crew',
      mode: 'subagent',
    }],
  ]);

  test('returns all when no activeAgent', () => {
    const filtered = filterCrewsByAgent(crews);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('all-agents');
  });

  test('returns matching crews for specific agent', () => {
    const filtered = filterCrewsByAgent(crews, 'frontend-ui-ux-engineer');
    expect(filtered).toHaveLength(2);
    const names = filtered.map(c => c.name);
    expect(names).toContain('all-agents');
    expect(names).toContain('frontend-only');
    expect(names).not.toContain('oracle-only');
  });

  test('returns only global crews for unknown agent', () => {
    const filtered = filterCrewsByAgent(crews, 'unknown-agent');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('all-agents');
  });
});

describe('registerCrewsWithConfig', () => {
  test('merges crews into existing config.agent', () => {
    const crews = new Map<string, Crew>([
      ['test-crew', {
        name: 'test-crew',
        path: '/path/test.md',
        source: 'global',
        content: 'Test content',
        description: 'Test crew',
        aliases: [],
        tags: [],
        onlyFor: [],
        promptType: 'crew',
        mode: 'subagent',
      }],
    ]);
    const existingAgent = { 'existing-agent': { description: 'Existing' } };
    const result = registerCrewsWithConfig(crews, existingAgent);
    
    expect(result['existing-agent']).toBeDefined();
    expect(result['test-crew']).toBeDefined();
    expect((result['test-crew'] as any).description).toBe('Test crew');
  });

  test('works with undefined config.agent', () => {
    const crews = new Map<string, Crew>([
      ['new-crew', {
        name: 'new-crew',
        path: '/path/new.md',
        source: 'global',
        content: 'New content',
        description: 'New crew',
        aliases: [],
        tags: [],
        onlyFor: [],
        promptType: 'crew',
        mode: 'agent',
      }],
    ]);
    const result = registerCrewsWithConfig(crews, undefined);
    
    expect(result['new-crew']).toBeDefined();
    expect((result['new-crew'] as any).mode).toBe('agent');
  });
});

describe('loadCrews integration', () => {
  const testProjectDir = join(tmpdir(), 'test-crews-' + Date.now());
  const crewDir = join(testProjectDir, '.opencode', 'crew');

  beforeAll(() => {
    mkdirSync(crewDir, { recursive: true });
    
    writeFileSync(join(crewDir, 'code-reviewer.md'), `---
description: "Reviews code for quality"
model: claude-3-opus
temperature: 0.3
tools: [read, glob, grep]
mode: subagent
---
You are a code reviewer. Analyze code for:
- Code quality
- Best practices
- Potential bugs`);
    
    writeFileSync(join(crewDir, 'frontend-expert.md'), `---
description: "Frontend development expert"
mode: agent
onlyFor: [frontend-ui-ux-engineer]
---
You are a frontend development expert.`);
  });

  afterAll(() => {
    if (existsSync(testProjectDir)) {
      rmSync(testProjectDir, { recursive: true, force: true });
    }
  });

  test('loads crews from project directory', () => {
    const crews = loadCrews(testProjectDir);
    expect(crews.size).toBeGreaterThanOrEqual(2);
    
    const reviewer = crews.get('code-reviewer');
    expect(reviewer).toBeDefined();
    expect(reviewer?.model).toBe('claude-3-opus');
    expect(reviewer?.temperature).toBe(0.3);
    expect(reviewer?.tools).toEqual(['read', 'glob', 'grep']);
    expect(reviewer?.mode).toBe('subagent');
    
    const frontend = crews.get('frontend-expert');
    expect(frontend).toBeDefined();
    expect(frontend?.mode).toBe('agent');
    expect(frontend?.onlyFor).toContain('frontend-ui-ux-engineer');
  });

  test('crew content excludes frontmatter', () => {
    const crews = loadCrews(testProjectDir);
    const reviewer = crews.get('code-reviewer');
    expect(reviewer?.content).not.toContain('---');
    expect(reviewer?.content).toContain('code reviewer');
  });
});

describe('crews mode defaults', () => {
  test('crew without mode defaults to subagent in engine', () => {
    const crew: Crew = {
      name: 'no-mode',
      path: '/path/no-mode.md',
      source: 'global',
      content: 'Content',
      description: 'No mode specified',
      aliases: [],
      tags: [],
      onlyFor: [],
      promptType: 'crew',
      mode: 'subagent',
    };
    const config = crewToAgentConfig(crew);
    expect(config.mode).toBe('subagent');
  });

  test('crew with mode=agent uses agent mode', () => {
    const crew: Crew = {
      name: 'agent-mode',
      path: '/path/agent.md',
      source: 'global',
      content: 'Content',
      description: 'Agent mode',
      aliases: [],
      tags: [],
      onlyFor: [],
      promptType: 'crew',
      mode: 'agent',
    };
    const config = crewToAgentConfig(crew);
    expect(config.mode).toBe('agent');
  });
});
