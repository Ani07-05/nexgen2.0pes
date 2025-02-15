"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useSession } from "@/providers/SessionProvider";
import LoadingSpinner from "@/components/LoadingSpinner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

import Groq from "groq-sdk";

export default function Dashboard() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const { username } = useSession();

  const [query, setQuery] = useState("");
  const [explanation, setExplanation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Function to speak the text
  const speakText = (text: string) => {
    if ("speechSynthesis" in window) {
      if (isSpeaking) {
        speechSynthesis.cancel(); // Stop speaking
        setIsSpeaking(false);
      } else {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "en-US";
        utterance.rate = 1;
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        speechSynthesis.speak(utterance);
      }
    } else {
      alert("Text-to-Speech is not supported in this browser.");
    }
  };

  // Stop speech when the component unmounts
  useEffect(() => {
    return () => {
      speechSynthesis.cancel();
    };
  }, []);

  // Sign out user
  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Error signing out:", error);
    else router.push("/");
  };

  // Fetch explanation from Groq API
  const fetchExplanation = async (concept: string) => {
    if (!concept.trim()) return;

    setLoading(true);
    setExplanation("");
    setError("");

    try {
      console.log("Fetching explanation for:", concept);

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
                content: concept,
              },
              {
                role: "user",
                content: concept,
              },
            ],
            model: "llama3-8b-8192",
            temperature: 1,
            top_p: 1,
            stream: false,
            stop: null,
          }),
        }
      );

      const data = await response.json();

      const content = data.choices[0].message?.content.toString();
      console.log(content);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      setExplanation(content);
    } catch (error) {
      console.error("Error fetching explanation:", error);
      setError("Something went wrong. Please try again.");
    }

    setLoading(false);
  };

  const handleExplain = () => fetchExplanation(query);
  const handleTopicClick = (topic: string) => {
    setQuery(topic);
    fetchExplanation(topic);
  };

  if (!username) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="w-full border-b border-gray-800 p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Welcome, {username}</h1>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 rounded-md text-sm text-gray-300 hover:text-white border border-gray-700 hover:border-gray-600 transition-all duration-200"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="max-w-2xl w-full space-y-8 text-center">
          <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            What do you want to learn today?
          </h2>

          {/* Chat input */}
          <div className="w-full mt-8">
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type your learning goals here..."
                className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white transition-all duration-200"
              />
              <button
                onClick={handleExplain}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-blue-400 transition-all duration-200 hover:scale-110"
                aria-label="Explain concept"
                disabled={loading}
              >
                {loading ? (
                  <svg
                    className="h-6 w-6 animate-spin text-blue-400"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeDasharray="31.4 31.4"
                    ></circle>
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Explanation Output */}
          {loading && (
            <p className="text-gray-400">Generating explanation...</p>
          )}
          {error && (
            <div className="p-4 bg-red-700 rounded-lg text-white text-left mt-4 border border-red-500">
              <strong>Error:</strong> {error}
            </div>
          )}
          {explanation && (
            <div className="p-4 bg-gray-800 rounded-lg text-white text-left mt-4 border border-gray-700 relative">
              <strong className="text-blue-400 text-xl font-extrabold">
                Explanation:
              </strong>
              <ReactMarkdown
                className="prose prose-invert mt-4 max-w-none leading-relaxed"
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                  h1({ children }) {
                    return (
                      <h1 className="text-2xl font-extrabold text-white mb-3">
                        {children}
                      </h1>
                    ); // Larger bold titles
                  },
                  h2({ children }) {
                    return (
                      <h2 className="text-xl font-extrabold text-white mb-3">
                        {children}
                      </h2>
                    ); // Subtitles
                  },
                  h3({ children }) {
                    return (
                      <h3 className="text-lg font-bold text-gray-300 mb-2">
                        {children}
                      </h3>
                    ); // Smaller titles
                  },
                  p({ children }) {
                    return <p className="mb-4">{children}</p>; // Ensures spacing between paragraphs
                  },
                  strong({ children }) {
                    return (
                      <strong className="font-extrabold text-yellow-400 bg-gray-900 px-1.5 py-0.5 rounded">
                        {children}
                      </strong>
                    ); // Highlights important keywords in yellow
                  },
                  code({
                    node,
                    inline,
                    className,
                    children,
                    ...props
                  }: {
                    node?: any;
                    inline?: boolean;
                    className?: string;
                    children?: React.ReactNode;
                  }) {
                    return inline ? (
                      <code className="bg-gray-900 text-yellow-300 px-1.5 py-0.5 rounded font-mono text-base">
                        {children}
                      </code>
                    ) : (
                      <pre className="bg-gray-900 text-yellow-300 p-4 rounded-lg overflow-x-auto font-mono text-base">
                        <code {...props} className={className}>
                          {children}
                        </code>
                      </pre>
                    );
                  },
                  ul({ children }) {
                    return <ul className="list-disc pl-5 mb-4">{children}</ul>; // Properly formats bullet points
                  },
                  ol({ children }) {
                    return (
                      <ol className="list-decimal pl-5 mb-4">{children}</ol>
                    ); // Properly formats ordered lists
                  },
                  li({ children }) {
                    return <li className="mb-1">{children}</li>; // Adds spacing between list items
                  },
                }}
              >
                {explanation}
              </ReactMarkdown>

              {/* Speaker Button */}
              <button
                onClick={() => {
                  if ("speechSynthesis" in window) {
                    const utterance = new SpeechSynthesisUtterance(explanation);
                    utterance.lang = "en-US";
                    utterance.rate = 1;
                    speechSynthesis.speak(utterance);
                  } else {
                    alert("Text-to-Speech is not supported in this browser.");
                  }
                }}
                className="fixed bottom-6 right-6 p-4 bg-blue-500 rounded-full shadow-lg hover:bg-blue-600 transition-all duration-200"
                aria-label="Read Explanation"
              >
                🔊
              </button>
              <button
                onClick={() => speakText(explanation)}
                className={`fixed bottom-6 right-6 p-4 rounded-full shadow-lg transition-all duration-200 ${
                  isSpeaking
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-blue-500 hover:bg-blue-600"
                }`}
                aria-label="Read Explanation"
              >
                {isSpeaking ? "🛑 Stop" : "🔊 Read"}
              </button>
            </div>
          )}

          {/* Topic pills */}
          <div className="flex gap-2 mt-8 justify-center items-center overflow-x-auto no-scrollbar py-2">
            {[
              "Arrays",
              "Strings",
              "Binary Search",
              "Linked Lists",
              "Recursion",
              "Trees",
            ].map((topic) => (
              <button
                key={topic}
                onClick={() => handleTopicClick(topic)}
                className="px-4 py-2 bg-gray-900 border border-gray-800 rounded-full hover:border-blue-500 hover:bg-gray-800 transition-all duration-200 hover:scale-105"
              >
                <span className="text-sm font-medium text-gray-300">
                  {topic}
                </span>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
