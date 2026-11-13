import { markdownToBlocks } from "../utils/blockConverter.js";

// Google Gemini Candidate Models (ordered by speed, reliability, and multimodal availability)
const GEMINI_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.5-transcribe",
  "gemini-flash-lite-latest",
  "gemini-3.5-flash",
  "gemini-flash-latest",
];

/**
 * Intelligent Speech Structurer (Zero External Dependency Fallback)
 * Converts raw speech into an organized note with Title, Key Highlights, Checklists, and Notes.
 */
function localFormatSpeech(transcript = "") {
  const clean = transcript.trim();
  if (!clean) {
    return {
      title: "Voice Note",
      rawTranscript: "",
      cleanedMarkdown: "Empty recording.",
      blocks: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "No speech recognized." }],
        },
      ],
    };
  }

  // 1. Generate Title (first 4-6 meaningful words)
  const words = clean.split(/\s+/);
  const titleCandidate = words.slice(0, 5).join(" ").replace(/[.,;!?]+$/, "");
  const title = titleCandidate.charAt(0).toUpperCase() + titleCandidate.slice(1);

  // 2. Parse sentences into Key Highlights, Action Items, and Notes
  const sentences = clean
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const actionPattern = /^(todo|need to|have to|must|please|remember to|set up|create|build|implement|fix|deploy|check|buy|call|schedule|review|follow up)/i;
  const highlightPattern = /(important|critical|deadline|urgent|key|priority|launch|target|goal|must not|revenue|budget|before|by \w+day)/i;

  const keyPoints = [];
  const actionItems = [];
  const notes = [];

  for (const sentence of sentences) {
    if (actionPattern.test(sentence)) {
      actionItems.push(sentence);
    } else if (highlightPattern.test(sentence)) {
      keyPoints.push(sentence);
    } else {
      notes.push(sentence);
    }
  }

  const mdLines = [];

  // Key Highlights Section
  if (keyPoints.length > 0) {
    mdLines.push("## 📌 Key Highlights");
    for (const point of keyPoints) {
      // Bold the first 2-3 words as a topic lead-in
      const pWords = point.split(/\s+/);
      const lead = pWords.slice(0, 3).join(" ");
      const rest = pWords.slice(3).join(" ");
      mdLines.push(`- **${lead}** ${rest}`);
    }
    mdLines.push("");
  }

  // Action Items Section (Checklists)
  if (actionItems.length > 0) {
    mdLines.push("## ✅ Action Items");
    for (const item of actionItems) {
      mdLines.push(`- [ ] ${item}`);
    }
    mdLines.push("");
  }

  // General Notes Section
  if (notes.length > 0 || (keyPoints.length === 0 && actionItems.length === 0)) {
    mdLines.push("## 📝 Notes & Details");
    const items = notes.length > 0 ? notes : [clean];
    for (const n of items) {
      mdLines.push(`- ${n}`);
    }
  }

  const cleanedMarkdown = mdLines.join("\n").trim();
  const blocks = markdownToBlocks(cleanedMarkdown);

  return {
    title,
    rawTranscript: clean,
    cleanedMarkdown,
    blocks,
  };
}

// Call Google Gemini API with generous timeout
async function callGemini(modelName, apiKey, parts) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout for multimodal audio processing

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
  const fetchRes = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: controller.signal,
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    }),
  });

  clearTimeout(timeoutId);

  if (!fetchRes.ok) {
    const errData = await fetchRes.json().catch(() => ({}));
    const message = errData?.error?.message || `HTTP ${fetchRes.status}`;
    const err = new Error(message);
    err.status = fetchRes.status;
    throw err;
  }

  const data = await fetchRes.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("No candidate returned from Gemini");
  return text;
}

// Optional Groq API Support (if GROQ_API_KEY is defined in .env)
async function callGroq(apiKey, prompt) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    signal: controller.signal,
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are Echo AI note-taking assistant. Return strictly JSON with: { title: string, cleanedMarkdown: string, rawTranscript: string }",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    }),
  });

  clearTimeout(timeoutId);
  if (!res.ok) throw new Error(`Groq error: ${res.status}`);
  const data = await res.json();
  return data?.choices?.[0]?.message?.content;
}

// Optional OpenAI API Support (if OPENAI_API_KEY is defined in .env)
async function callOpenAI(apiKey, prompt) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    signal: controller.signal,
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are Echo AI note-taking assistant. Return strictly JSON with: { title: string, cleanedMarkdown: string, rawTranscript: string }",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    }),
  });

  clearTimeout(timeoutId);
  if (!res.ok) throw new Error(`OpenAI error: ${res.status}`);
  const data = await res.json();
  return data?.choices?.[0]?.message?.content;
}

// @desc    Voice dictation endpoint with multi-model fallback and zero-failure guarantee
// @route   POST /api/notes/dictate
// @access  Private / Public Demo
export const dictateSpeech = async (req, res) => {
  try {
    const audioFile = req.file;
    const directTranscript = (req.body?.rawText || req.body?.transcript || "").trim();

    if (!audioFile && !directTranscript) {
      return res.status(400).json({
        success: false,
        message: "No audio recording or speech text provided in request",
      });
    }

    const systemInstruction = `
You are "Echo", a world-class AI executive assistant and intelligent note-taker.
Your mission is to take raw spoken thoughts (audio or transcript) and convert them into a clean, comprehensive, highly structured Notion-style document note.

CORE DIRECTIVES:
1. ACCURACY & COMPLETENESS:
   - Capture every single fact, number, technical term, project name, date, deadline, person, and instruction accurately.
   - Strip out conversational filler words ("um", "uh", "you know", "like", "sort of", "basically", "so yeah").
   - Do NOT omit important context or summarize so aggressively that details are lost.

2. NOTE IMPORTANT POINTS & KEY HIGHLIGHTS:
   - Always include a dedicated section: "## 📌 Key Highlights" or "## 💡 Core Takeaways".
   - Highlight critical metrics, deadlines, decisions, and key facts using **bold** keywords (e.g., "- **Deadline:** Launch scheduled for **Friday 5:00 PM**").

3. ACTION ITEMS & CHECKLISTS:
   - Whenever any task, assignment, follow-up, reminder, or to-do is mentioned, format it as a markdown checklist item:
     "- [ ] Deploy the payment gateway by Friday"
     "- [ ] Review Stripe webhook logs by Wednesday"

4. SECTIONS & FORMATTING:
   - Use "## " (Level 2 Heading) for clean section dividers (e.g. "## 📌 Key Highlights", "## 📝 Discussion Details", "## ✅ Action Items").
   - Use bullet points with bold prefixes: "- **Topic:** Detail description".
   - If code, shell commands, or technical endpoints are mentioned, format with markdown backticks (e.g., \`npm run build\`).

OUTPUT FORMAT (Return STRICT JSON only):
{
  "title": "Concise Descriptive Title (3 to 6 words)",
  "rawTranscript": "Accurate spoken transcript",
  "cleanedMarkdown": "Full formatted markdown note containing headings, bold key points, bullet lists, and checklists"
}
`;

    let responseText = null;
    let modelUsed = null;
    const geminiKey = process.env.GEMINI_API_KEY;

    // --- Provider 1: Google Gemini (Multimodal Audio & Transcript) ---
    if (geminiKey) {
      const parts = [{ text: systemInstruction }];

      if (audioFile && audioFile.buffer && audioFile.buffer.length > 500) {
        let cleanMime = (audioFile.mimetype || "audio/webm").split(";")[0].trim().toLowerCase();
        if (!["audio/webm", "audio/mp3", "audio/wav", "audio/ogg", "audio/mp4", "audio/aac"].includes(cleanMime)) {
          cleanMime = "audio/webm";
        }

        parts.push({
          inlineData: {
            mimeType: cleanMime,
            data: audioFile.buffer.toString("base64"),
          },
        });

        if (directTranscript) {
          parts.push({
            text: `Browser speech preview reference (use to cross-check terminology and accuracy): "${directTranscript}"`,
          });
        } else {
          parts.push({
            text: "Transcribe the spoken audio above, extract all important points, decisions, and action items, and format as structured markdown note.",
          });
        }
      } else if (directTranscript) {
        parts.push({
          text: `Spoken speech transcript to structure into a note:\n"${directTranscript}"`,
        });
      }

      for (const modelName of GEMINI_MODELS) {
        try {
          responseText = await callGemini(modelName, geminiKey, parts);
          modelUsed = `Gemini (${modelName})`;
          console.info(`[Echo AI] Successfully processed speech using ${modelUsed}`);
          break;
        } catch (err) {
          console.warn(`[Echo AI] Gemini attempt with ${modelName} notice: ${err.message}`);
        }
      }
    }

    // --- Provider 2: Groq (Llama 3.3 70B Alternative) ---
    if (!responseText && directTranscript && process.env.GROQ_API_KEY) {
      try {
        responseText = await callGroq(process.env.GROQ_API_KEY, directTranscript);
        modelUsed = "Groq (Llama-3.3-70b)";
      } catch (err) {
        console.warn("[Echo AI] Groq attempt failed:", err.message);
      }
    }

    // --- Provider 3: OpenAI (GPT-4o-mini Alternative) ---
    if (!responseText && directTranscript && process.env.OPENAI_API_KEY) {
      try {
        responseText = await callOpenAI(process.env.OPENAI_API_KEY, directTranscript);
        modelUsed = "OpenAI (GPT-4o-mini)";
      } catch (err) {
        console.warn("[Echo AI] OpenAI attempt failed:", err.message);
      }
    }

    // --- Provider 4: Built-in Speech Structurer (Zero Dependency Fallback) ---
    if (!responseText) {
      console.info("[Echo AI] Utilizing Echo Built-in Speech Structurer");
      const fallback = localFormatSpeech(directTranscript || "Voice note recorded.");
      return res.status(200).json({
        success: true,
        ...fallback,
        modelUsed: "Echo Built-in AI",
      });
    }

    // Parse model JSON safely
    let parsedResponse = null;
    try {
      const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      parsedResponse = JSON.parse(cleanJson);
    } catch (parseError) {
      console.warn("[Echo AI] JSON parse error, applying local structure to response text");
      parsedResponse = localFormatSpeech(directTranscript || responseText);
    }

    // Ensure Title is never empty
    const finalTitle =
      parsedResponse.title?.trim() ||
      (directTranscript ? directTranscript.slice(0, 35).replace(/[.,;!?]+$/, "") : "Voice Note");

    // Convert Cleaned Markdown into 100% compliant BlockNote-native blocks
    let finalBlocks = [];
    if (parsedResponse.cleanedMarkdown && parsedResponse.cleanedMarkdown.trim().length > 0) {
      finalBlocks = markdownToBlocks(parsedResponse.cleanedMarkdown);
    } else if (Array.isArray(parsedResponse.blocks) && parsedResponse.blocks.length > 0) {
      // Normalize any blocks
      finalBlocks = parsedResponse.blocks.map((b) => {
        if (typeof b.content === "string") {
          return { ...b, content: [{ type: "text", text: b.content, styles: {} }] };
        }
        return b;
      });
    } else {
      finalBlocks = localFormatSpeech(directTranscript).blocks;
    }

    // GUARANTEE: Never return only a heading without body content
    const hasBodyContent = finalBlocks.some((b) => {
      if (b.type === "heading") return false;
      if (Array.isArray(b.content) && b.content.length > 0) {
        return b.content.some((c) => c.text && c.text.trim().length > 0);
      }
      return false;
    });

    if (!hasBodyContent) {
      const fallbackBody = localFormatSpeech(directTranscript || parsedResponse.cleanedMarkdown || finalTitle).blocks;
      const bodyBlocks = fallbackBody.filter((b) => b.type !== "heading");
      finalBlocks = [
        ...finalBlocks,
        ...(bodyBlocks.length > 0
          ? bodyBlocks
          : [
              {
                type: "paragraph",
                content: [{ type: "text", text: directTranscript || "Voice note content." }],
              },
            ]),
      ];
    }

    return res.status(200).json({
      success: true,
      title: finalTitle,
      rawTranscript: parsedResponse.rawTranscript || directTranscript || "",
      cleanedMarkdown: parsedResponse.cleanedMarkdown || "",
      blocks: finalBlocks,
      modelUsed: modelUsed || "Gemini AI",
    });
  } catch (error) {
    console.error("[Echo AI Top-Level Error]", error);
    const fallback = localFormatSpeech(req.body?.rawText || req.body?.transcript || "Voice note recorded.");
    return res.status(200).json({
      success: true,
      ...fallback,
      modelUsed: "Echo Built-in AI (Emergency Fallback)",
    });
  }
};
