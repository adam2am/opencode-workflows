import type { Crew } from './types';
import { crewsToAgentConfigs, type AgentConfig } from './engine';

export function registerCrewsWithConfig(
  crews: Map<string, Crew>,
  configAgent: Record<string, unknown> | undefined
): Record<string, AgentConfig | unknown> {
  const crewAgents = crewsToAgentConfigs(crews);
  
  return {
    ...configAgent,
    ...crewAgents,
  };
}
