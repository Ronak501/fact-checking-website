import { NextResponse } from "next/server";

// 1. API KEYS
const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY!;
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY!;

const FACT_API = process.env.NEXT_PUBLIC_FACT_API!;
const GEMINI_API = process.env.NEXT_PUBLIC_GEMINI_API!;

export async function POST(request: Request) {
  try {
    // 1. Read user input
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // -------------------------------
    // 2. NLP PROCESS USING GEMINI AI
    // -------------------------------
    const geminiUrl = `${GEMINI_API}?key=${GEMINI_API_KEY}`;

    const geminiBody = {
      contents: [
        {
          parts: [
            {
              text: `Rewrite the user's message into ONE short, clear, fact-checkable claim.
              RULES:
              - Output ONLY the claim.
              - No explanation.
              - No extra text.
              - No list.
              - No markdown.
              - Maximum 15 words.
              - If vague, make a reasonable guess to form a checkable statement.

              User query: "${query}"

              Return only the final claim:`,
            },
          ],
        },
      ],
    };

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiBody),
    });

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error("Gemini API Error:", errText);
      throw new Error("Gemini AI NLP failed: " + errText);
    }

    const geminiData = await geminiResponse.json();

    console.log("Gemini AI Response:", geminiData);

    const nlpQuery = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!nlpQuery) {
      throw new Error("Failed to extract NLP query");
    }

    console.log("NLP Processed Query:", nlpQuery);

    // ---------------------------------------------------
    // 3. PASS NLP QUERY TO GOOGLE FACT CHECK API
    // ---------------------------------------------------
    const factUrl = new URL(FACT_API);
    factUrl.searchParams.append("query", nlpQuery);
    factUrl.searchParams.append("key", GOOGLE_API_KEY);

    const factResponse = await fetch(factUrl.toString());

    if (!factResponse.ok) {
      throw new Error("Fact Check API error");
    }

    const factData = await factResponse.json();
    console.log("Fact Check API Response:", factData);

    // -----------------------------------
    // 4. RETURN FINAL FACT CHECK RESULTS
    // -----------------------------------
    return NextResponse.json({
      user_query: query,
      // nlp_query: nlpQuery,
      fact_check_results: factData,
    });
  } catch (error: any) {
    console.error("Full API Error:", error);
    return NextResponse.json(
      { error: "Failed to process fact-check request", details: error.message },
      { status: 500 }
    );
  }
}
