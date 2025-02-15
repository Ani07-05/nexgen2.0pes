// leetcode-next/src/app/page.tsx
"use client";

import { useState } from "react";
import CodeEditor from "@/components/code-editor";
import { Loader2, RefreshCw } from "lucide-react";
import { TestCase, TestResult } from "@/lib/types";
import Groq from "groq-sdk";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

// Define your problems array
const problems = [
  {
    id: 1,
    title: "Two Sum",
    difficulty: "Easy",
    description:
      "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
    examples: [
      {
        input: "nums = [2,7,11,15], target = 9",
        output: "[0,1]",
        explanation: "Because nums[0] + nums[1] == 9, we return [0, 1].",
      },
    ],
    starterCode: {
      javascript: `function twoSum(nums, target) {
    const map = {};
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (complement in map) {
            return [map[complement], i];
        }
        map[nums[i]] = i;
    }
    return [];
};`,
      python: `def twoSum(nums, target):
    # Create a dictionary to store seen numbers
    seen = {}
    
    # Enumerate through the list for index and value
    for i, num in enumerate(nums):
        complement = target - num
        
        # Check if complement exists in dictionary
        if complement in seen:
            result = [seen[complement], i]
            return sorted(result)  # Return sorted list of indices
        
        # Store current number and index
        seen[num] = i
    
    # If no solution is found
    return []`,
      java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Your code here
    }
}`,
    },
  },
  {
    id: 2,
    title: "Valid Palindrome",
    difficulty: "Easy",
    description:
      "A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.",
    examples: [
      {
        input: 's = "A man, a plan, a canal: Panama"',
        output: "true",
        explanation: '"amanaplanacanalpanama" is a palindrome.',
      },
    ],
    starterCode: {
      javascript: `function isPalindrome(s) {
    s = s.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    let left = 0;
    let right = s.length - 1;
    while (left < right) {
        if (s[left] !== s[right]) {
            return false;
        }
        left++;
        right--;
    }
    return true;
};`,
      python: `def isPalindrome(s):
    # Remove non-alphanumeric and convert to lowercase
    s = ''.join(c.lower() for c in s if c.isalnum())
    # Check if string equals its reverse
    return s == s[::-1]`,
      java: `class Solution {
    public boolean isPalindrome(String s) {
        // Your code here
    }
}`,
    },
  },
  {
    id: 3,
    title: "Container With Most Water",
    difficulty: "Medium",
    description:
      "Given n non-negative integers a1, a2, ..., an, where each represents a point at coordinate (i, ai). n vertical lines are drawn such that the two endpoints of the line i is at (i, ai) and (i, 0). Find two lines, which, together with the x-axis forms a container, such that the container contains the most water.",
    examples: [
      {
        input: "height = [1,8,6,2,5,4,8,3,7]",
        output: "49",
        explanation:
          "The above vertical lines are represented by array [1,8,6,2,5,4,8,3,7]. In this case, the max area of water the container can contain is 49.",
      },
    ],
    starterCode: {
      javascript: `function maxArea(height) {
    let maxWater = 0;
    let left = 0;
    let right = height.length - 1;
    
    while (left < right) {
        const width = right - left;
        const h = Math.min(height[left], height[right]);
        maxWater = Math.max(maxWater, width * h);
        
        if (height[left] < height[right]) {
            left++;
        } else {
            right--;
        }
    }
    return maxWater;
};`,
      python: `def maxArea(height):
    # Initialize maximum water and pointers
    max_water = 0
    left = 0
    right = len(height) - 1
    
    # Use two pointers to find maximum area
    while left < right:
        # Calculate current area
        width = right - left
        h = min(height[left], height[right])
        area = width * h
        max_water = max(max_water, area)
        
        # Move the pointer with smaller height
        if height[left] < height[right]:
            left += 1
        else:
            right -= 1
    
    return max_water`,
      java: `class Solution {
    public int maxArea(int[] height) {
        // Your code here
    }
}`,
    },
  },
];

interface Message {
  sender: string;
  content: string;
}

export default function Home() {
  const [currentProblem, setCurrentProblem] = useState(problems[0]);
  const [code, setCode] = useState(currentProblem.starterCode.javascript);
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState("js");
  const [results, setResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);

  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [output, setOutput] = useState("");

  const [currentResponses, setCurrentResponses] = useState<Message[]>([]);

  const runCode = async () => {
    setRunning(true);
    setResults([]);

    const convertNewlinesToUnicode = (text: string): string => {
      let here = text;
      here = text.replace(/\n/g, "↵").replace(/"/g, "`");
      return here;
    };

    const testCases: TestCase[] = currentProblem.examples.map((ex) => ({
      input: ex.input,
      expectedOutput: ex.output,
    }));

    const codeWithUnicodeNewlines = convertNewlinesToUnicode(code);
    console.log(codeWithUnicodeNewlines);

    const headers = { "Content-Type": "application/json" };
    const payload = {
      language: language,
      version: "3.10.0", // Or your preferred Python version
      files: [
        {
          name: `hello.${language}`, // Good practice to give it a name
          // content:
          //   'print("Hello, Piston!does it work bro")\nprint("Hello, Piston!does it work bro2")',
          content: codeWithUnicodeNewlines,
        },
      ],
      stdin: "", // Optional: for providing input to your program
      args: [], // Optional: command-line arguments
      compile_timeout: 10000,
      run_timeout: 3000,
      compile_memory_limit: -1,
      run_memory_limit: -1,
    };

    try {
      const response = await fetch("https://emkc.org/api/v2/piston/execute", {
        method: "POST",
        headers: headers,
        body: JSON.stringify(payload),
      });

      switch (language) {
        case "python":
          const pythonData = await response.json();
          console.log(pythonData.run.output);

          setOutput(pythonData.run.output as string);
          break;
        case "javascript":
          const jsData = await response.json();
          console.log(jsData);
          break;

        // setOutput(jsData.run.output as string);
      }

      setRunning(false);
    } catch (error) {
      console.error("goddammit ", error);
      setRunning(false);
    }
  };

  const getRandomProblem = () => {
    setLoading(true);
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * problems.length);
      const newProblem = problems[randomIndex];
      setCurrentProblem(newProblem);
      setCode(
        newProblem.starterCode[language as keyof typeof newProblem.starterCode]
      );
      setLoading(false);
    }, 500);
  };

  const handleLanguageChange = (newLanguage: string) => {
    switch (newLanguage) {
      case "javascript":
        setLanguage("js");
        break;
      case "python":
        setLanguage("py");
        break;
    }

    setCode(
      currentProblem.starterCode[
        newLanguage as keyof typeof currentProblem.starterCode
      ]
    );
  };

  const updateChatsDB = () => {};

  const getGroqChatCompletion = async () => {
    const coderManPrompt = code + prompt;

    setCurrentResponses((prevResponses) => [
      ...prevResponses,
      { sender: "user", content: prompt },
    ]);

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: coderManPrompt,
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          model: "llama3-8b-8192",
          temperature: 1,
          // max_tokens: 1024,
          top_p: 1,
          stream: false,
          stop: null,
        }),
      }
    );

    if (response.ok) {
      console.log("Resp is ok");
      try {
        const data = await response.json();
        console.log(data.choices[0].message?.content, "<---- groq.com api"); // this worked

        const content = data.choices[0].message?.content.toString();
        ``;
        setCurrentResponses((prevResponses) => [
          ...prevResponses,
          {
            sender: "LLM",
            content: content,
          },
        ]);

        console.log(currentResponses);
        if (content) {
          return JSON.parse(content);
        } else {
          throw new Error("Content is undefined or null");
        }
      } catch (error) {
        console.error("Failed to parse content:", error);
      }
    } else {
      console.error(await response.json());
    }
  };

  return (
    <main className="min-h-screen p-8 bg-background">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">
            LeetCode Random Problem Generator
          </h1>
          <button
            onClick={getRandomProblem}
            disabled={loading}
            className="btn inline-flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Get Random Problem
          </button>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div>
            <ScrollArea className="h-[700px] w-[550px] rounded-md border p-4 ">
              <div className="p-6 bg-card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">
                    {currentProblem.title}
                  </h2>
                  <span
                    className={`px-3 py-1 text-sm ${
                      currentProblem.difficulty === "Easy"
                        ? "text-green-500"
                        : "text-yellow-500"
                    }`}
                  >
                    {currentProblem.difficulty}
                  </span>
                </div>
                <p className="text-muted-foreground">
                  {currentProblem.description}
                </p>

                <div className="mt-6 ">
                  <h3 className="font-semibold mb-2">Example:</h3>
                  {currentProblem.examples.map((example, index) => (
                    <div key={index} className="space-y-2 text-sm">
                      <p>Input: {example.input}</p>
                      <p>Output: {example.output}</p>
                      {example.explanation && (
                        <p className="text-muted-foreground">
                          Explanation: {example.explanation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <div>
                  {currentResponses.map((response, index) => (
                    <div key={index} className="response">
                      {response.sender === "user" ? (
                        <div className="user-response bg-blue-500">
                          <p>{response.content}</p>
                        </div>
                      ) : (
                        <div className="llm-response bg-red-500">
                          <p>{response.content}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
            <div className="flex space-x-2">
              <Input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Talk to Coderman"
                className="input"
              />
              <Button onClick={getGroqChatCompletion}>Enter</Button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex gap-2">
              {["javascript", "python", "java"].map((lang) => (
                <Button
                  key={lang}
                  onClick={() => handleLanguageChange(lang)}
                  data-active={language === lang}
                >
                  {lang.charAt(0).toUpperCase() + lang.slice(1)}
                </Button>
              ))}
            </div>
            <CodeEditor
              language={language}
              value={code}
              onChange={(value) => setCode(value || "")}
            />

            <div>
              <p className="font-bold">Output</p>
              <p>{output}</p>
            </div>

            <Button
              onClick={runCode}
              disabled={running}
              className="btn w-full bg-[#2ea043] hover:bg-[#2ea043]/90 text-black"
            >
              {running ? "Running..." : "Run Code"}
            </Button>
            {results.length > 0 && (
              <div className="mt-4 space-y-4">
                <h3 className="font-semibold text-lg">Test Results:</h3>
                {results.map((result, index) => (
                  <div
                    key={index}
                    className={`test-result ${
                      result.passed
                        ? "test-result-success"
                        : "test-result-error"
                    }`}
                  >
                    <div className="space-y-1">
                      <p>Input: {result.input}</p>
                      <p>Expected: {result.expectedOutput}</p>
                      <p>Actual: {result.actualOutput}</p>
                      <p
                        className={
                          result.passed ? "text-green-500" : "text-red-500"
                        }
                      >
                        {result.passed ? "Passed ✓" : "Failed ✗"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
