const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const { Pinecone } = require("@pinecone-database/pinecone");
const OpenAI = require("openai");

const app = express();

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Pinecone & Groq Setup ---
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pinecone.index(process.env.PINECONE_INDEX);

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1"
});

/**
 * Helper function to get embeddings via Mixedbread API
 */
async function getEmbedding(text) {
  const response = await fetch('https://api.mixedbread.ai/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.MXBAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "mixedbread-ai/mxbai-embed-large-v1",
      input: text,
      normalized: true,
      encoding_format: "float"
    })
  });

  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Failed to fetch embedding");
  return result.data[0].embedding;
}

/* ---------------------------
    API Routes (MUST BE ABOVE STATIC FILES)
--------------------------- */

app.post("/api/add", async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "Text required" });
  try {
    const embedding = await getEmbedding(text);
    await index.upsert([{
      id: `vec_${Date.now()}`,
      values: embedding,
      metadata: { text }
    }]);
    res.json({ success: true, message: "Vector stored!" });
  } catch (e) { 
    console.error("Add Error:", e);
    res.status(500).json({ error: e.message }); 
  }
});

app.post("/api/chat", async (req, res) => {
  const { question } = req.body;
  try {
    // FIX: Using Mixedbread embedding instead of non-existent 'embedder'
    const embedding = await getEmbedding(question);
    
    const search = await index.query({
      vector: embedding,
      topK: 5,
      includeMetadata: true
    });

    const context = search.matches.map(m =>{
      // FIX: Using m.metadata.text since that's what we saved in /api/add
      return m.metadata.text || "No summary available";
    }).join("\n---\n");

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", 
          content: `You are a movie expert. Answer the user's question using ONLY the following context:\n${context}`},
        { role: "user", content: question }
      ]
    });
    res.json({ answer: response.choices[0].message.content });
  } catch (e) { 
    console.error("Chat Error:", e);
    res.status(500).json({ error: e.message }); 
  }
});

/* ---------------------------
    Static Files & Routing (ALWAYS LAST)
--------------------------- */
app.use(express.static(path.join(__dirname, "../frontend/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist", "index.html"));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});