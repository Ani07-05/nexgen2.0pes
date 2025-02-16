import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { concept } = await req.json();

    if (!concept) {
      return NextResponse.json({ error: "Concept is required" }, { status: 400 });
    }

    const chatCompletion = await groq.chat.completions.create({
      model: "llama-3.2-90b-vision-preview",
      messages: [{ role: "user", content: `Explain: ${concept}` }],
      temperature: 1,
      max_tokens: 1024,
      top_p: 1,
    });

    return NextResponse.json({ explanation: chatCompletion.choices[0].message.content });
  } catch (error) {
    console.error("Error in /api/explain:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
