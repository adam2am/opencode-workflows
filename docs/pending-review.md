# Commit Review - Pending Real-World Testing

## Changes Made

### 1. "Did You Mean" Fix
- Added `normalize()` function: strips `-_` and lowercases
- Fixed `findBestMatch()` to use normalized comparison
- Now `//5approaches` → "Did you mean: 5-approaches?" ✅

### 2. Canonicalization
- Case-insensitive: `//5Approaches` matches `5-approaches`
- Delimiter-agnostic: `//commitreview` matches `commit_review`
- Safe: No fuzzy matching, only exact + prefix after normalization

### 3. Reused Workflow Cleanup
- 2nd reference now shows: `[workflow:name-id]`
- Instead of verbose XML with description

### 4. Multiple Match Suggestions with Aliases
- Shows top 3 matches when ambiguous
- Shortest match first (aliases prioritized)
- Includes workflow aliases in suggestions
- Example: `//r → rc (code-review) | review-calls | run-tests`

## Test Cases to Verify

| Input | Expected Behavior |
|-------|-------------------|
| `//5approaches` | Toast: "Did you mean: 5-approaches?" |
| `//5Approaches` | Toast: "Did you mean: 5-approaches?" |
| `//cr` | Expands commit_review (if cr is alias) |
| `//c` | Toast: "Did you mean: cr \| commit_review \| ...?" |
| `//r` | Toast shows top 3 matches starting with `r`, shortest first |
| `//commitreview` | Toast: "Did you mean: commit_review (cr)?" |
| `//5-approaches` (2nd time) | Shows `[workflow:5-approaches-xxxx]` |
| `//xyz` | Toast: "Not found: xyz" |

## Unit Tests Added
- 52 tests in `tests/core.test.ts`
- Covers: normalize, findBestMatch, findAllMatches, formatSuggestion, detectWorkflowMentions, parseArrayField, parseFrontmatter

## Files Changed
- `src/core.ts` - Pure functions (normalize, findBestMatch, findAllMatches, formatSuggestion)
- `src/index.ts` - Imports from core.ts, updated suggestion logic
- `tests/core.test.ts` - Comprehensive tests
- `package.json` - Added test script

## Feedback Notes
_Space for real-world testing feedback:_

---

