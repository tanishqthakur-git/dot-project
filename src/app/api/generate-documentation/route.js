import { NextResponse } from "next/server";
const { GoogleGenerativeAI } = require("@google/generative-ai");

export async function POST(request) {
    try {
        const { code } = await request.json();
        if (!code) {
            return NextResponse.json({ error: "Code is required" }, { status: 400 });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Modify prompt to generate comments
        const prompt = `
        Generate a detailed documentation for the code to be added at the end of the code in the form of comments.
        Dont give the whole code back.

        Ensure the comment format matches the language of the given code.
        Use "//" for JavaScript, C++, and similar languages.
        Use "#" for Python.

        Code:
        ${code}

        Output:
        `;

        const result = await model.generateContent(prompt);
        const documentation = result.response.text() || "No documentation generated.";

        return NextResponse.json({ documentation }, { status: 200 });
    } catch (error) {
        console.error("Gemini API Error:", error.response?.data || error.message);
        return NextResponse.json({ error: "Failed to generate documentation" }, { status: 500 });
    }
}
