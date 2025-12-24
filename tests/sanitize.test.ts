import { describe, test, expect } from 'bun:test';
import { 
  stripExistingHints, 
  stripHighlightBrackets, 
  sanitizeUserMessage 
} from '../src/orders';

describe('stripExistingHints', () => {
  test('clean message without hints returns unchanged', () => {
    const text = 'think about 5 approaches';
    expect(stripExistingHints(text)).toBe(text);
  });

  test('strips complete Workflow hint at end', () => {
    const text = `think about 5 approaches

[⚡ Workflow matched]
ACTION_REQUIRED: IF matches user intent → get_workflow("name"), else SKIP
↳ //[5-approaches] (matched: "5", "approaches")
↳ Desc: "Analyze problems from 5 perspectives"`;
    expect(stripExistingHints(text)).toBe('think about 5 approaches');
  });

  test('strips complete Orders hint (pirate theme)', () => {
    const text = `think about 5 approaches

[⚡ Orders matched]
ACTION_REQUIRED: IF matches user intent → get_workflow("name"), else SKIP
↳ //[5-approaches]`;
    expect(stripExistingHints(text)).toBe('think about 5 approaches');
  });

  test('strips corrupted hint missing closing bracket', () => {
    const text = `think about 5 approaches

[⚡ Workflow matched]
ACTION_REQUIRED: IF matches user intent → get_workflow("name"), else SKIP
↳ //[5-approaches] (matched: "5", "approaches")
user accidentally typed here`;
    expect(stripExistingHints(text)).toBe('think about 5 approaches');
  });

  test('strips partial hint cut mid-line', () => {
    const text = `think about 5 approaches

[⚡ Workflow matched]
ACTION_RE`;
    expect(stripExistingHints(text)).toBe('think about 5 approaches');
  });

  test('strips minimal partial hint', () => {
    const text = `think about 5 approaches

[⚡ Workflow`;
    expect(stripExistingHints(text)).toBe('think about 5 approaches');
  });

  test('strips hint with only opening', () => {
    const text = `hello world

[⚡ Orders`;
    expect(stripExistingHints(text)).toBe('hello world');
  });

  test('case insensitive matching', () => {
    const text = `hello

[⚡ WORKFLOW MATCHED]
stuff`;
    expect(stripExistingHints(text)).toBe('hello');
  });

  test('preserves text before hint', () => {
    const text = `line 1
line 2
line 3

[⚡ Workflow matched]
hint content`;
    expect(stripExistingHints(text)).toBe('line 1\nline 2\nline 3');
  });
});

describe('stripHighlightBrackets', () => {
  test('removes single word brackets', () => {
    expect(stripHighlightBrackets('[5] approaches')).toBe('5 approaches');
  });

  test('removes adjacent word brackets', () => {
    expect(stripHighlightBrackets('[5 approaches] to solve')).toBe('5 approaches to solve');
  });

  test('removes multiple separate brackets', () => {
    expect(stripHighlightBrackets('I have [5] different [approaches]'))
      .toBe('I have 5 different approaches');
  });

  test('preserves use_workflow references', () => {
    expect(stripHighlightBrackets('[use_workflow:test-123]'))
      .toBe('[use_workflow:test-123]');
  });

  test('preserves brackets with special chars', () => {
    expect(stripHighlightBrackets('[foo:bar]')).toBe('[foo:bar]');
  });

  test('handles empty string', () => {
    expect(stripHighlightBrackets('')).toBe('');
  });

  test('handles text without brackets', () => {
    expect(stripHighlightBrackets('plain text')).toBe('plain text');
  });

  test('handles multiple words in brackets', () => {
    expect(stripHighlightBrackets('[staged changes] here'))
      .toBe('staged changes here');
  });
});

describe('sanitizeUserMessage', () => {
  test('clean message returns unchanged', () => {
    expect(sanitizeUserMessage('hello world')).toBe('hello world');
  });

  test('removes both highlights and hints', () => {
    const text = `[5 approaches] to try

[⚡ Workflow matched]
↳ //[5-approaches]`;
    expect(sanitizeUserMessage(text)).toBe('5 approaches to try');
  });

  test('handles corrupted hint with highlights', () => {
    const text = `[validate] my [changes]

[⚡ Workflow matched]
ACTION_REQUIRED: IF mat`;
    expect(sanitizeUserMessage(text)).toBe('validate my changes');
  });

  test('handles only highlights no hint', () => {
    expect(sanitizeUserMessage('[foo] bar [baz]')).toBe('foo bar baz');
  });

  test('handles only hint no highlights', () => {
    const text = `plain text

[⚡ Orders matched]
stuff`;
    expect(sanitizeUserMessage(text)).toBe('plain text');
  });

  test('trims whitespace', () => {
    expect(sanitizeUserMessage('  hello  ')).toBe('hello');
  });

  test('handles multiple newlines before hint', () => {
    const text = `message



[⚡ Workflow matched]`;
    expect(sanitizeUserMessage(text)).toBe('message');
  });
});
