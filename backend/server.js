const express = require("express");
const cors = require("cors");
const path = require("path"); // Added for file routing
require("dotenv").config();

const { Pinecone } = require("@pinecone-database/pinecone");
const OpenAI = require("openai");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

/* ---------------------------
   Pinecone & Groq Setup
--------------------------- */
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY
});
const index = pinecone.index(process.env.PINECONE_INDEX);

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1"
});

/* ---------------------------
   Load Embedding Model
--------------------------- */
let embedder;

async function loadModel() {
  const { pipeline } = await import("@xenova/transformers");
  console.log("Loading embedding model (mxbai-embed-large-v1)...");
  
  embedder = await pipeline(
    "feature-extraction", 
    "mixedbread-ai/mxbai-embed-large-v1"
  );
  console.log("Embedding model loaded.");
}

/* ---------------------------
   API Routes
--------------------------- */

// 1. Add Data to Pinecone
app.post("/add", async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "Text required" });

  try {
    const output = await embedder(text, { pooling: "mean", normalize: true });
    const vector = Array.from(output.data);

    await index.upsert([
      {
        id: `vec_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        values: vector,
        metadata: { text } 
      }
    ]);

    res.json({ message: "Vector stored successfully" });
  } catch (error) {
    console.error("Error in /add:", error);
    res.status(500).json({ error: "Failed to store vector" });
  }
});

// 2. Chat with RAG
app.post("/chat", async (req, res) => {
  const { question } = req.body;
  if (!question) return res.status(400).json({ error: "Question required" });

  try {
    // MANDATORY prefix for this specific model
    const queryPrefix = "Represent this sentence for searching relevant passages: ";
    const output = await embedder(queryPrefix + question, { pooling: "mean", normalize: true });
    const vector = Array.from(output.data);

    const search = await index.query({
      vector: vector,
      topK: 100, 
      includeMetadata: true
    });

    if (!search.matches || search.matches.length === 0) {
      return res.json({ answer: "I couldn't find that in my database." });
    }

    // Build context from metadata (checks multiple keys just in case)
    const context = search.matches
      .map(m => m.metadata.text || m.metadata.summary || m.metadata.title || "")
      .join("\n---\n");

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { 
          role: "system", 
          content: `You are a helpful AI. Answer ONLY using this context: ${context}` 
        },
        { role: "user", content: question }
      ]
    });

    res.json({ answer: response.choices[0].message.content });
  } catch (error) {
    console.error("Error in /chat:", error);
    res.status(500).json({ error: "AI processing failed" });
  }
});


/* ---------------------------
   Serve Frontend (The Express 5 Fix)
--------------------------- */

// Point Express to your React "dist" folder
app.use(express.static(path.join(__dirname, "../frontend/dist")));

// This is the correct "catch-all" syntax for Express 5.0
// The {0,} makes the path parameter optional
// app.get("/:path*", (req, res) => {
//   res.sendFile(path.join(__dirname, "../frontend/dist", "index.html"));
// });

// ALTERNATIVE: If the above still gives a PathError, use a Regular Expression:
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist", "index.html"));
});

/* ---------------------------
   Start Server
--------------------------- */
async function startServer() {
  try {
    await loadModel();
    app.listen(5000, "0.0.0.0", () => {
      console.log("--------------------------------------------------");
      console.log("Backend is LIVE at port 5000");
      console.log("Check ngrok link to see your UI!");
      console.log("--------------------------------------------------");
    });
  } catch (err) {
    console.error("Failed to start server:", err);
  }
}

startServer();