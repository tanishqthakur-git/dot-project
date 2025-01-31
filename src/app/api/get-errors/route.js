import { NextResponse } from "next/server";
import { Linter } from "eslint";
import pyodide from "pyodide";
const { GoogleGenerativeAI } = require("@google/generative-ai");

export async function POST(request) {
    try {
        const { code, language } = await request.json();
        if (!code || !language) {
            return NextResponse.json({ error: "Code and language are required" }, { status: 400 });
        }

        let errors = await checkSyntax(language.toLowerCase(), code);

        // If no errors, return success message
        if (errors.length === 0) {
            return NextResponse.json({ message: "No syntax errors found." }, { status: 200 });
        }

        // If errors exist, try AI fix
        let fixedCode = await fixCodeWithAI(language, code);
        if (fixedCode) {
            return NextResponse.json({ fixedCode, aiFixed: true }, { status: 200 });
        }

        // Return only errors if AI fails
        return NextResponse.json({ errors, aiFixed: false }, { status: 422 });


    } catch (error) {
        console.error("Error:", error);
        return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
    }
}

// 🔹 Syntax checkers
async function checkSyntax(language, code) {
    switch (language) {
        case "javascript":
        case "typescript":
            return checkJavaScriptSyntax(code);
        case "python":
            return await checkPythonSyntax(code);
        default:
            return [{ message: "Unsupported language, using AI instead." }];
    }
}

// ✅ JavaScript & TypeScript ESLint
function checkJavaScriptSyntax(code) {
    const linter = new Linter();
    const messages = linter.verify(code, {
        languageOptions: { ecmaVersion: "latest", sourceType: "module" },
        rules: { "no-undef": "error", "no-unused-vars": "warn" }
    });
    return messages.map(msg => ({ message: msg.message }));
}

// ✅ Python Pyodide Syntax Check
async function checkPythonSyntax(code) {
    try {
        await pyodide.load();
        pyodide.runPython(code);
        return [];
    } catch (err) {
        return [{ message: err.message }];
    }
}

// 🔹 AI-Based Auto-Fix for Unsupported Languages or Errors
async function fixCodeWithAI(language, code) {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Fix the syntax errors in the following ${language} code:\n\n${code}\n\nReturn only the corrected code without any comments or formatting like markdown.`;

        const result = await model.generateContent(prompt);
        const fixedCode = result.response.text().replace(/```[a-z]*\n?/gi, "").trim(); // Remove markdown formatting

        return fixedCode;
    } catch (error) {
        console.error("AI Fix Error:", error);
        return null;
    }
}
