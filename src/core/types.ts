/**
 * Core shared types for opencode-captain
 * 
 * These types are shared between orders (workflows) and rules (constraints).
 */

// ============================================================================
// Tag System
// ============================================================================

export interface TagOrGroup {
  or: string[];
}

export interface SequenceStep {
  type: 'word' | 'or' | 'and';
  values: string[];
}

export interface SequenceTag {
  sequence: SequenceStep[];
}

export type TagEntry = string | (string | TagOrGroup)[] | TagOrGroup | SequenceTag;

// ============================================================================
// Prompt Types
// ============================================================================

export type PromptType = 'order' | 'rule' | 'crew';

/**
 * Base interface for all prompt types (orders, rules, crew).
 * Shared fields that appear in all prompt markdown files.
 */
export interface BasePrompt {
  name: string;
  description: string;
  aliases: string[];
  tags: TagEntry[];
  onlyFor: string[];           // Agent visibility filter
  content: string;
  source: 'project' | 'global';
  path: string;
  folder?: string;             // Subfolder for organization
  promptType: PromptType;      // Derived from folder location
}

/**
 * Base parsed frontmatter - shared fields from YAML header.
 */
export interface BaseParsedFrontmatter {
  aliases: string[];
  tags: TagEntry[];
  onlyFor: string[];
  description: string;
  body: string;
}

// ============================================================================
// Variable Resolution
// ============================================================================

export type VariableResolver = () => string;

// ============================================================================
// Plugin Events
// ============================================================================

export interface PluginEvent {
  type: string;
  properties?: {
    sessionID?: string;
    messageID?: string;
    [key: string]: unknown;
  };
}

// ============================================================================
// Configuration
// ============================================================================

export type Theme = 'pirate' | 'standard';

export interface CaptainConfig {
  deduplicateSameMessage: boolean;
  maxNestingDepth: number;
  expandOrders: boolean;
  theme?: Theme;
}
