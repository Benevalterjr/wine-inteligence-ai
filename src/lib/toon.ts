
/**
 * Simple implementation of Token-Oriented Object Notation (TOON)
 * for token-efficient data representation in LLM prompts.
 * Reference: https://github.com/toon-format/toon
 */

export function stringifyToon(data: any): string {
  if (data === null) return 'null';
  if (typeof data !== 'object') return String(data);

  if (Array.isArray(data)) {
    if (data.length === 0) return '[]';
    
    // Check if it's a uniform array of objects (tabular)
    const firstItem = data[0];
    if (typeof firstItem === 'object' && firstItem !== null && !Array.isArray(firstItem)) {
      const keys = Object.keys(firstItem);
      const header = `{${keys.join(', ')}} [\${data.length}]`;
      const rows = data.map(item => {
        return '  ' + keys.map(key => {
          const val = item[key];
          if (val === null || val === undefined) return '';
          const str = String(val);
          // Simple quoting logic: if it contains comma or newline, quote it
          if (str.includes(',') || str.includes('\n') || str.includes('"')) {
            return `"\${str.replace(/"/g, '""')}"`;
          }
          return str;
        }).join(', ');
      }).join('\n');
      return `\${header}\n\${rows}`;
    }

    // Fallback for non-uniform arrays
    return `[\${data.length}]\n` + data.map(item => '  ' + stringifyToon(item)).join('\n');
  }

  // Object representation
  const keys = Object.keys(data);
  if (keys.length === 0) return '{}';
  
  return keys.map(key => {
    const val = data[key];
    const valStr = stringifyToon(val);
    if (valStr.includes('\n')) {
      return `\${key}:\n\${valStr.split('\n').map(line => '  ' + line).join('\n')}`;
    }
    return `\${key}: \${valStr}`;
  }).join('\n');
}
