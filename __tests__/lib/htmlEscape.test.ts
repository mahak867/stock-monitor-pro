/**
 * Unit tests for the htmlEscape helper used in /api/notify.
 * We extract the logic here so it can be tested independently.
 */

/** Mirror of the htmlEscape function in app/api/notify/route.ts */
function htmlEscape(str: unknown): string {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

describe('htmlEscape', () => {
  it('passes through safe strings unchanged', () => {
    expect(htmlEscape('AAPL')).toBe('AAPL');
    expect(htmlEscape('NSE:RELIANCE')).toBe('NSE:RELIANCE');
    expect(htmlEscape(42)).toBe('42');
  });

  it('escapes ampersands', () => {
    expect(htmlEscape('A&B')).toBe('A&amp;B');
  });

  it('escapes angle brackets', () => {
    expect(htmlEscape('<script>')).toBe('&lt;script&gt;');
    expect(htmlEscape('</div>')).toBe('&lt;/div&gt;');
  });

  it('escapes double quotes', () => {
    expect(htmlEscape('"hello"')).toBe('&quot;hello&quot;');
  });

  it('escapes single quotes', () => {
    expect(htmlEscape("it's")).toBe('it&#39;s');
  });

  it('neutralises a script injection attempt', () => {
    const malicious = '<img src=x onerror="alert(1)">';
    expect(htmlEscape(malicious)).not.toContain('<');
    expect(htmlEscape(malicious)).not.toContain('>');
  });

  it('handles null and undefined gracefully', () => {
    expect(htmlEscape(null)).toBe('');
    expect(htmlEscape(undefined)).toBe('');
  });
});
