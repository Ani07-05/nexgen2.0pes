// leetcode-next/src/lib/types.ts
export interface TestCase {
  input: string;
  expectedOutput: string;
}

export interface TestResult {
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
}
