// leetcode-next/src/lib/runCode.ts
import { TestCase, TestResult } from './types';

export const runJavaScript = (code: string, testCases: TestCase[]): TestResult[] => {
  const results = [];
  try {
    // Create function from code string
    const functionName = code.match(/function\s+(\w+)/)?.[1];
    if (!functionName) {
      throw new Error('Could not find function name in code');
    }
    
    // Create a safe execution environment
    const fn = new Function(`
      ${code}
      return ${functionName};
    `)();
    
    if (typeof fn !== 'function') {
      throw new Error(`${functionName} is not a function`);
    }

    // Run test cases
    for (const testCase of testCases) {
      try {
        // Parse input string to get arguments
        // Parse test case input string
        const args = [];
        const matches = testCase.input.match(/(\w+)\s*=\s*([^,]+)/g) || [];
        
        for (const match of matches) {
          const [name, rawValue] = match.split('=').map(s => s.trim());
          try {
            let value;
            if (rawValue.startsWith('[') && rawValue.endsWith(']')) {
              // Handle array input
              value = JSON.parse(rawValue);
            } else if (rawValue.startsWith('"') && rawValue.endsWith('"')) {
              // Handle string input
              value = rawValue.slice(1, -1);
            } else if (rawValue === 'true' || rawValue === 'false') {
              // Handle boolean input
              value = rawValue === 'true';
            } else if (!isNaN(Number(rawValue))) {
              // Handle numeric input
              value = Number(rawValue);
            } else {
              // Default case
              value = rawValue;
            }
            args.push(value);
          } catch (err) {
            console.warn(`Failed to parse argument: ${match}`, err);
            args.push(rawValue);
          }
        }

        const output = fn(...args);
        const passed = JSON.stringify(output) === testCase.expectedOutput;
        
        results.push({
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: JSON.stringify(output),
          passed,
        });
      } catch (err: any) {
        results.push({
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: `Error: ${err?.message || 'Unknown error'}`,
          passed: false,
        });
      }
    }
  } catch (err: any) {
    return [{
      input: "Code compilation",
      expectedOutput: "Valid function",
      actualOutput: `Error: ${err?.message || 'Unknown error'}`,
      passed: false,
    }];
  }
  return results;
};

import { executePythonCode } from './pythonRunner';

export const runPython = async (code: string, testCases: TestCase[]): Promise<TestResult[]> => {
  const results = [];
  try {
    for (const testCase of testCases) {
      try {
        // Parse test case input string
        const args = [];
        const matches = testCase.input.match(/(\w+)\s*=\s*([^,]+)/g);
        if (matches) {
          for (const match of matches) {
            const [_, value] = match.split('=').map(s => s.trim());
            try {
              if (value.startsWith('[')) {
                args.push(JSON.parse(value));
              } else if (value.startsWith('"')) {
                args.push(value.slice(1, -1));
              } else {
                args.push(Number(value));
              }
            } catch {
              args.push(value);
            }
          }
        }

        const output = executePythonCode(code, args);
        const passed = JSON.stringify(output) === testCase.expectedOutput;
        
        results.push({
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: JSON.stringify(output),
          passed,
        });
      } catch (err: any) {
        results.push({
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: `Error: ${err?.message || 'Unknown error'}`,
          passed: false,
        });
      }
    }
  } catch (err: any) {
    return [{
      input: "Code compilation",
      expectedOutput: "Valid function",
      actualOutput: `Error: ${err?.message || 'Unknown error'}`,
      passed: false,
    }];
  }
  return results;
};

export const runJava = async (code: string, testCases: TestCase[]) => {
  // For demo purposes, we'll just show that Java execution would work similarly
  return runJavaScript(code, testCases);
};
