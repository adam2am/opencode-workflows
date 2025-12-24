import type { Crew } from './types';

export interface AgentConfig {
  description: string;
  mode: 'agent' | 'subagent';
  prompt: string;
  model?: string;
  temperature?: number;
  tools?: Record<string, boolean>;
}

export function crewToAgentConfig(crew: Crew): AgentConfig {
  const config: AgentConfig = {
    description: crew.description || `(${crew.source}) ${crew.name}`,
    mode: crew.mode || 'subagent',
    prompt: crew.content,
  };
  
  if (crew.model) {
    config.model = crew.model;
  }
  
  if (crew.temperature !== undefined) {
    config.temperature = crew.temperature;
  }
  
  if (crew.tools && crew.tools.length > 0) {
    config.tools = Object.fromEntries(crew.tools.map(t => [t, true]));
  }
  
  return config;
}

export function crewsToAgentConfigs(crews: Map<string, Crew>): Record<string, AgentConfig> {
  const result: Record<string, AgentConfig> = {};
  const seen = new Set<string>();
  
  for (const crew of crews.values()) {
    if (seen.has(crew.name)) continue;
    seen.add(crew.name);
    result[crew.name] = crewToAgentConfig(crew);
  }
  
  return result;
}

export function filterCrewsByAgent(crews: Map<string, Crew>, activeAgent?: string): Crew[] {
  const result: Crew[] = [];
  const seen = new Set<string>();
  
  for (const crew of crews.values()) {
    if (seen.has(crew.name)) continue;
    seen.add(crew.name);
    
    if (crew.onlyFor.length === 0) {
      result.push(crew);
    } else if (activeAgent && crew.onlyFor.includes(activeAgent)) {
      result.push(crew);
    }
  }
  
  return result;
}
