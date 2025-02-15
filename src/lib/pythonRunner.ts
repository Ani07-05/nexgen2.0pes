// leetcode-next/src/lib/pythonRunner.ts
export const executePythonCode = (code: string, args: unknown[]) => {
  try {
    // Add Python runtime helpers
    const runtimeHelpers = `
      const enumerate = arr => Array.from(arr.entries());
      const range = (...args) => {
        if (args.length === 1) return [...Array(args[0])].map((_, i) => i);
        const [start, stop, step = 1] = args;
        const length = Math.ceil((stop - start) / step);
        return Array.from({ length }, (_, i) => start + i * step);
      };
      const len = obj => obj?.length ?? 0;
      const min = (...args) => Math.min(...(args.length === 1 ? args[0] : args));
      const max = (...args) => Math.max(...(args.length === 1 ? args[0] : args));
      const sum = arr => arr.reduce((a, b) => a + b, 0);
      const sorted = arr => [...arr].sort((a, b) => a - b);
      const print = console.log;
    `;

    // Convert Python code to JavaScript
    const jsCode = code
      .split('\n')
      .map(line => {
        const indentMatch = line.match(/^(\s*)/);
        const indent = indentMatch ? indentMatch[1].length : 0;
        const trimmedLine = line.trim();

        if (!trimmedLine || trimmedLine.startsWith('#')) {
          return '';
        }

        // Handle function definition
        if (trimmedLine.startsWith('def ')) {
          return trimmedLine.replace(/def\s+(\w+)\s*\((.*?)\):/, 'function $1($2) {');
        }

        // Handle Python specific syntax
        const jsLine = trimmedLine
          // Handle dictionary access and assignments
          .replace(/(\w+)\[(\w+)\]\s*=\s*(.+)/, '$1[$2] = $3;')
          .replace(/(\w+)\s+in\s+(\w+)/, '($2.hasOwnProperty($1))')
          // Handle Python's list/dict operations
          .replace(/(\w+)\.append\((.*)\)/, '$1.push($2)')
          .replace(/(\w+)\s*=\s*\{\}/, 'const $1 = {}')
          .replace(/(\w+)\s*=\s*\[\]/, 'const $1 = []')
          // Handle Python's string methods
          .replace(/(\w+)\.join\((.*)\)/, '$2.join($1)')
          .replace(/(\w+)\.lower\(\)/, '$1.toLowerCase()')
          // Add semicolons to statements
          .replace(/(.+?)$/, '$1;');

        // Handle indentation with braces
        return '  '.repeat(indent / 2) + jsLine;
      })
      .filter(Boolean)
      .join('\n');

    // Extract function name and create executable code
    const functionMatch = code.match(/def\s+(\w+)/);
    if (!functionMatch) {
      throw new Error('Could not find Python function');
    }

    const functionName = functionMatch[1];
    const executable = `
      ${runtimeHelpers}
      ${jsCode}
      return ${functionName};
    `;

    // Create and execute function with provided arguments
    const fn = new Function(executable)();
    if (typeof fn !== 'function') {
      throw new Error(`${functionName} is not a function`);
    }

    return fn(...args);
  } catch (error) {
    throw new Error(`Python execution error: ${error instanceof Error ? error.message : String(error)}`);
  }
};
