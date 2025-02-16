import { NextResponse } from "next/server";
import { Groq } from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export async function POST(request: Request) {
  const { concept } = await request.json();

  try {
    const response = await groq.chat.completions.create({
      messages: [{ role: "user", content: `Explain: ${concept}` }],
      model: "llama3-8b-8192",
    });

    return NextResponse.json({
      response: response.choices[0]?.message?.content || "No explanation found.",
    });
  } catch (error) {
    console.error("Error calling Groq API:", error);
    return NextResponse.json({
      response: "Failed to fetch explanation.",
    });
  }
}
