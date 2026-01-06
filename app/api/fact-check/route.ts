import { NextResponse } from "next/server";

// 1. API KEYS
const GOOGLE_API_KEY = "AIzaSyATm3waKotHFsyylcZ7mypGLKrBRTsw6vs";
// const GEMINI_API_KEY = "AIzaSyAr9eW0BD71PdHaXKsm24BlI3DkC-x6fWA";

// 2. API URLs
const FACT_API = "https://factchecktools.googleapis.com/v1alpha1/claims:search";
const GEMINI_API =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

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
    // const geminiUrl = `${GEMINI_API}?key=${GEMINI_API_KEY}`;

    // const geminiBody = {
    //   contents: [
    //     {
    //       parts: [
    //         {
    //           text: `Rewrite the user's message into ONE short, clear, fact-checkable claim.
    //           RULES:
    //           - Output ONLY the claim.
    //           - No explanation.
    //           - No extra text.
    //           - No list.
    //           - No markdown.
    //           - Maximum 15 words.
    //           - If vague, make a reasonable guess to form a checkable statement.

    //           User query: "${query}"

    //           Return only the final claim:`,
    //         },
    //       ],
    //     },
    //   ],
    // };


    // const geminiResponse = await fetch(geminiUrl, {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify(geminiBody),
    // });

    // if (!geminiResponse.ok) {
    //   const errText = await geminiResponse.text();
    //   console.error("Gemini API Error:", errText);
    //   throw new Error("Gemini AI NLP failed: " + errText);
    // }

    // const geminiData = await geminiResponse.json();

    // console.log("Gemini AI Response:", geminiData);

    // const nlpQuery = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    // if (!nlpQuery) {
    //   throw new Error("Failed to extract NLP query");
    // }

    // console.log("NLP Processed Query:", nlpQuery);

    // ---------------------------------------------------
    // 3. PASS NLP QUERY TO GOOGLE FACT CHECK API
    // ---------------------------------------------------
    const factUrl = new URL(FACT_API);
    factUrl.searchParams.append("query", query);
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
