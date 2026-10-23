import { markdownToBlocks } from "../utils/blockConverter.js";

// Google Gemini Candidate Models (ordered by availability and reliability)
const GEMINI_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.5-flash",
  "gemini-flash-lite-latest",
  "gemini-flash-latest",
];

/**
 * Intelligent Speech Structurer (Zero External Dependency)
 * Converts raw speech into an organized note with Title, Headings, Checklists, and Bullets.
 * Guarantees that body blocks and title are NEVER empty.
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

  // 1. Generate Title (first 4-7 words, capitalized)
  const words = clean.split(/\s+/);
  const titleCandidate = words.slice(0, 6).join(" ").replace(/[.,;!?]+$/, "");
  const title = titleCandidate.charAt(0).toUpperCase() + titleCandidate.slice(1);

  // 2. Parse sentences into logical block types
  const sentences = clean
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const blocks = [];
  const actionPattern = /^(todo|need to|have to|must|please|remember to|set up|create|build|implement|fix|deploy|check|buy|call|schedule|review)/i;

  // Header block
  blocks.push({
    type: "heading",
    props: { level: 2 },
    content: [{ type: "text", text: title }],
  });

  const mdLines = [`## ${title}`];

  for (const sentence of sentences) {
    if (actionPattern.test(sentence)) {
      blocks.push({
        type: "checkListItem",
        props: { checked: false },
        content: [{ type: "text", text: sentence }],
      });
      mdLines.push(`- [ ] ${sentence}`);
    } else {
      blocks.push({
        type: "bulletListItem",
        content: [{ type: "text", text: sentence }],
      });
      mdLines.push(`- ${sentence}`);
    }
  }

  // Fallback: If blocks only has heading, add paragraph with full speech
  if (blocks.length <= 1) {
    blocks.push({
      type: "paragraph",
      content: [{ type: "text", text: clean }],
    });
    mdLines.push(clean);
  }

  return {
    title,
    rawTranscript: clean,
    cleanedMarkdown: mdLines.join("\n"),
    blocks,
  };
}

// Call Google Gemini API
async function callGemini(modelName, apiKey, parts) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

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
          content: "You are Echo AI note-taking assistant. Return strictly JSON with: { title: string, cleanedMarkdown: string, blocks: array }",
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
          content: "You are Echo AI note-taking assistant. Return strictly JSON with: { title: string, cleanedMarkdown: string, blocks: array }",
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
// @access  Private
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
You are "Echo", an intelligent AI note-taking assistant.
Your task is to take the user's speech and convert it into a well-structured document note with BOTH a Title AND a complete Body.

CRITICAL RULES:
1. NEVER RETURN AN EMPTY BODY. All facts, instructions, tasks, and ideas in the speech must appear in the body blocks.
2. TITLE: Extract a concise, meaningful title (3 to 6 words).
3. BODY BLOCKS:
   - Use 'heading' (level 2) for main sections.
   - Use 'checkListItem' (props: { checked: false }) for tasks, to-dos, or action items.
   - Use 'bulletListItem' for facts, details, and ideas.
   - Use 'paragraph' for descriptions.
4. Clean verbal filler words ("um", "uh", "like", "you know"), but keep all technical terms, numbers, and instructions.

OUTPUT FORMAT (Valid JSON):
{
  "title": "Descriptive Note Title",
  "rawTranscript": "Exact spoken text",
  "cleanedMarkdown": "Markdown with heading and bullet/checklist items",
  "blocks": [
    { "type": "heading", "props": { "level": 2 }, "content": [{ "type": "text", "text": "Heading" }] },
    { "type": "checkListItem", "props": { "checked": false }, "content": [{ "type": "text", "text": "Task item" }] },
    { "type": "bulletListItem", "content": [{ "type": "text", "text": "Detail point" }] }
  ]
}
`;

    let responseText = null;
    let modelUsed = null;

    // --- Provider 1: Direct Transcript with Google Gemini (Fastest & Most Accurate) ---
    const geminiKey = process.env.GEMINI_API_KEY;

    if (geminiKey && directTranscript) {
      const textParts = [
        { text: systemInstruction },
        { text: `User speech transcript: "${directTranscript}"` },
      ];

      for (const modelName of GEMINI_MODELS) {
        try {
          responseText = await callGemini(modelName, geminiKey, textParts);
          modelUsed = `Gemini (${modelName})`;
          break;
        } catch (err) {
          console.warn(`[Echo AI] Gemini text attempt with ${modelName} failed (${err.status || err.message})`);
        }
      }
    }

    // --- Provider 1B: Multimodal Audio with Google Gemini (if text not provided or failed) ---
    if (!responseText && geminiKey && audioFile && audioFile.buffer && audioFile.buffer.length > 1000) {
      let cleanMime = (audioFile.mimetype || "audio/webm").split(";")[0].trim().toLowerCase();
      if (!["audio/webm", "audio/mp3", "audio/wav", "audio/ogg", "audio/mp4", "audio/aac"].includes(cleanMime)) {
        cleanMime = "audio/webm";
      }

      const audioParts = [
        { text: systemInstruction },
        {
          inlineData: {
            mimeType: cleanMime,
            data: audioFile.buffer.toString("base64"),
          },
        },
      ];

      if (directTranscript) {
        audioParts.push({ text: `Transcript hint: "${directTranscript}"` });
      }

      for (const modelName of GEMINI_MODELS) {
        try {
          responseText = await callGemini(modelName, geminiKey, audioParts);
          modelUsed = `Gemini (${modelName})`;
          break;
        } catch (err) {
          console.warn(`[Echo AI] Gemini audio attempt with ${modelName} failed (${err.status || err.message})`);
        }
      }
    }

    // --- Provider 2: Groq (Llama 3.3 70B - High Speed Alternative) ---
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

    // Ensure Blocks are NEVER empty
    let finalBlocks = [];
    if (Array.isArray(parsedResponse.blocks) && parsedResponse.blocks.length > 0) {
      finalBlocks = parsedResponse.blocks;
    } else if (parsedResponse.cleanedMarkdown) {
      finalBlocks = markdownToBlocks(parsedResponse.cleanedMarkdown);
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
      modelUsed: modelUsed || "AI Model",
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
