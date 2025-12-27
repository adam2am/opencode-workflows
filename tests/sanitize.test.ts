import { describe, test, expect } from 'bun:test';
import { 
  stripExistingHints, 
  stripHighlightBrackets, 
  sanitizeUserMessage,
  formatAutoApplyHint
} from '../src/orders';
import type { Order } from '../src/orders/types';

function mockOrder(name: string, desc: string): Order {
  return { name, description: desc, content: '', source: 'global', aliases: [], tags: [], onlyFor: [], automention: 'true', spawnAt: [], orderInOrder: 'false', expand: true, path: '', promptType: 'order' };
}

describe('stripExistingHints', () => {
  test('clean message without hints returns unchanged', () => {
    const text = 'think about 5 approaches';
    expect(stripExistingHints(text)).toBe(text);
  });

  test('strips complete Workflow hint at end', () => {
    const text = `think about 5 approaches

[⚡ Workflow matched]
ACTION_REQUIRED: IF matches user intent → get_workflow("name"), else SKIP
↳ [// 5-approaches] (matched: "5", "approaches")
↳ Desc: "Analyze problems from 5 perspectives"`;
    expect(stripExistingHints(text)).toBe('think about 5 approaches');
  });

  test('strips complete Orders hint (pirate theme)', () => {
    const text = `think about 5 approaches

[⚡ Orders matched]
ACTION_REQUIRED: IF matches user intent → get_workflow("name"), else SKIP
↳ [// 5-approaches]`;
    expect(stripExistingHints(text)).toBe('think about 5 approaches');
  });

  test('strips corrupted hint - user content after preserved', () => {
    const text = `think about 5 approaches

[⚡ Workflow matched]
ACTION_REQUIRED: IF matches user intent → get_workflow("name"), else SKIP
↳ [// 5-approaches] (matched: "5", "approaches")
user accidentally typed here`;
    expect(stripExistingHints(text)).toBe(`think about 5 approaches

user accidentally typed here`);
  });

  test('strips partial hint cut mid-line - orphan fragment stays', () => {
    const text = `think about 5 approaches

[⚡ Workflow matched]
ACTION_RE`;
    expect(stripExistingHints(text)).toBe(`think about 5 approaches

ACTION_RE`);
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

  test('case insensitive matching - non-fingerprint content preserved', () => {
    const text = `hello

[⚡ WORKFLOW MATCHED]
stuff`;
    expect(stripExistingHints(text)).toBe(`hello

stuff`);
  });

  test('REGRESSION: preserves content AFTER corrupted hint block', () => {
    // User sends message, hint gets appended, then user adds more content after
    // When hint is corrupted and stripped, the content AFTER should NOT be removed
    const text = `my question here

[⚡ Workflow matched]
ACTION_REQUIRED: IF matches user intent → get_workflow("name"), else SKIP
↳ [// 5-approaches] (matched: "5", "approaches")
↳ Desc: "Analyze from 5 pers

IMPORTANT CONTENT AFTER THE HINT`;
    
    // The corrupted hint should be stripped, but "IMPORTANT CONTENT AFTER THE HINT" 
    // should be PRESERVED (currently being deleted - BUG)
    expect(stripExistingHints(text)).toBe(`my question here

IMPORTANT CONTENT AFTER THE HINT`);
  });

  test('preserves text before hint - non-fingerprint after preserved', () => {
    const text = `line 1
line 2
line 3

[⚡ Workflow matched]
hint content`;
    expect(stripExistingHints(text)).toBe(`line 1
line 2
line 3

hint content`);
  });

  test('partial header corruption + content AFTER preserved', () => {
    const text = `my question

[⚡ Work

IMPORTANT CONTENT AFTER`;
    expect(stripExistingHints(text)).toBe(`my question

IMPORTANT CONTENT AFTER`);
  });

  test('orphan lines with fingerprints ARE stripped (no header)', () => {
    const text = `my question

aches (matched: "[5]", "[approaches]")
↳ Desc: "Analyze problems from [5] perspectives"`;
    expect(stripExistingHints(text)).toBe('my question');
  });

  test('orphan ACTION_REQUIRED line stripped', () => {
    const text = `my question

ACTION_REQUIRED: IF matches user intent → get_workflow("name"), else SKIP
↳ [// 5-approaches]`;
    expect(stripExistingHints(text)).toBe('my question');
  });

  test('orphan old format ↳ //[name] stripped', () => {
    const text = `my question

↳ //[5-approaches] (matched: "5")`;
    expect(stripExistingHints(text)).toBe('my question');
  });

  // BUG: formatAutoApplyHint outputs ↳ Desc: ["..."] but regex expects ↳ Desc: "..."
  test('BUG: strips Desc with BACKTICKS - actual formatAutoApplyHint output', () => {
    // This is the ACTUAL format produced by formatAutoApplyHint()
    const text = `my question

[⚡ Workflow matched]
ACTION_REQUIRED: IF matches user intent → get_workflow("name"), else SKIP
↳ [// 5-approaches] (matched: "5", "approaches")
↳ Desc: \`Analyze problems from 5 perspectives\``;
    
    // The Desc line with backticks should be stripped!
    expect(stripExistingHints(text)).toBe('my question');
  });

  test('BUG: Desc accumulates on revert - backticks not matched', () => {
    // Simulate: user reverts message, old Desc survives, new hint appended
    const text = `my question

↳ Desc: \`Old description that survived\`

[⚡ Workflow matched]
ACTION_REQUIRED: IF matches user intent → get_workflow("name"), else SKIP
↳ [// 5-approaches] (matched: "5", "approaches")
↳ Desc: \`New description appended\``;
    
    // BOTH Desc lines should be stripped
    expect(stripExistingHints(text)).toBe('my question');
  });

  test('unrecognizable fragment stays - allows clean re-append', () => {
    const corruptedMessage = `my question

lyze problems from 5 perspectives before solving"`;
    
    const afterStrip = stripExistingHints(corruptedMessage);
    expect(afterStrip).toBe(corruptedMessage.trim());
    
    const reAppended = `${afterStrip}

[⚡ Workflow matched]
ACTION_REQUIRED: IF matches user intent → get_workflow("name"), else SKIP
↳ [// 5-approaches] (matched: "5", "approaches")
↳ Desc: "Analyze problems from 5 perspectives before solving"`;

    expect(stripExistingHints(reAppended)).toBe(corruptedMessage.trim());
  });

  test('fragment + fresh re-append - both stripped correctly', () => {
    const text = `my question

lyze problems from [5] perspectives..."

[⚡ Workflow matched]
ACTION_REQUIRED: IF matches user intent → get_workflow("name"), else SKIP
↳ [// 5-approaches] (matched: "5", "approaches")
↳ Desc: "Analyze problems from 5 perspectives before solving"`;

    expect(stripExistingHints(text)).toBe(`my question

lyze problems from [5] perspectives..."`);
  });

  test('ROUND-TRIP: stripExistingHints cleans formatAutoApplyHint output completely', () => {
    const orders = new Map<string, Order>([
      ['test-order', mockOrder('test-order', 'Test description here')]
    ]);
    const keywords = new Map<string, string[]>([['test-order', ['test', 'keyword']]]);
    
    const userMessage = 'my question here';
    const hint = formatAutoApplyHint(['test-order'], orders, keywords);
    const combined = `${userMessage}\n\n${hint}`;
    
    expect(stripExistingHints(combined)).toBe(userMessage);
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
↳ [// 5-approaches]`;
    expect(sanitizeUserMessage(text)).toBe('5 approaches to try');
  });

  test('handles corrupted hint with highlights - partial ACTION_REQUIRED stripped', () => {
    const text = `[validate] my [changes]

[⚡ Workflow matched]
ACTION_REQUIRED: IF mat`;
    expect(sanitizeUserMessage(text)).toBe('validate my changes');
  });

  test('handles only highlights no hint', () => {
    expect(sanitizeUserMessage('[foo] bar [baz]')).toBe('foo bar baz');
  });

  test('handles only hint no highlights - non-fingerprint preserved', () => {
    const text = `plain text

[⚡ Orders matched]
stuff`;
    expect(sanitizeUserMessage(text)).toBe(`plain text

stuff`);
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
