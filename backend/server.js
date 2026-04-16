// Newww================================

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
 * This replaces the memory-heavy local Transformers.js model.
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
    API Routes
--------------------------- */

// Route to manually add knowledge
// app.post("/api/add", async (req, res) => {
//   const { text } = req.body;
//   if (!text) return res.status(400).json({ error: "Text required" });
//   try {
//     const embedding = await getEmbedding(text);
//     await index.upsert([{
//       id: `vec_${Date.now()}`,
//       values: embedding,
//       metadata: { text }
//     }]);
//     res.json({ success: true, message: "Vector stored!" });
//   } catch (e) { 
//     console.error("Add Error:", e);
//     res.status(500).json({ error: e.message }); 
//   }
// });

// // Main Chat Route
// app.post("/api/chat", async (req, res) => {
//   const { question } = req.body;
//   try {
//     const queryPrefix = "Represent this sentence for searching relevant passages: ";
//     const output = await embedder(queryPrefix + question, { pooling: "mean", normalize: true });
    
//     const search = await index.query({
//       vector: Array.from(output.data),
//       topK: 100,
//       includeMetadata: true
//     });

//     const context = search.matches.map(m =>{
//       return `Title: ${m.metadata.title}\nSummary: ${m.metadata.summary}`
//     }).join("\n---\n");

//     console.log("Retrieved Context:", context);

//     const response = await groq.chat.completions.create({
//       model: "llama-3.3-70b-versatile",
//       messages: [
//         { role: "system", 
//           content: `You are a movie expert. Answer the user's question using ONLY the following context:\n${context}`},
//         { role: "user", content: question }
//       ]
//     });
//     res.json({ answer: response.choices[0].message.content });
//   } catch (e) { res.status(500).json({ error: e.message }); }
// });

// /* ---------------------------
//     Static Files & Routing
// --------------------------- */
// app.use(express.static(path.join(__dirname, "../frontend/dist")));

// app.get(/.*/, (req, res) => {
//   res.sendFile(path.join(__dirname, "../frontend/dist", "index.html"));
// });


/* ---------------------------
    API Routes
--------------------------- */

app.post("/api/add", async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "Text required" });
  try {
    const embedding = await getEmbedding(text);
    await index.upsert([{
      id: `vec_${Date.now()}`,
      values: embedding,
      metadata: { text } // <--- Saving as 'text'
    }]);
    res.json({ success: true, message: "Vector stored!" });
  } catch (e) { 
    res.status(500).json({ error: e.message }); 
  }
});

app.post("/api/chat", async (req, res) => {
  const { question } = req.body;
  try {
    // FIX 1: Use getEmbedding instead of 'embedder'
    const embedding = await getEmbedding(question);
    
    const search = await index.query({
      vector: embedding,
      topK: 5,
      includeMetadata: true
    });

    // FIX 2: Map the correct metadata field ('text')
    const context = search.matches.map(m => m.metadata.text).join("\n---\n");

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", 
          content: `You are a movie expert. Answer using ONLY this context:\n${context}`},
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
//     Static Files & Routing
// --------------------------- */
app.use(express.static(path.join(__dirname, "../frontend/dist")));

app.get("*path", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist", "index.html"));
});


/* ---------------------------
    Server Start Logic
--------------------------- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`💡 Memory-optimized: Using Mixedbread API for embeddings.`);
});

// In your server.js, just call this once at the bottom temporaril
// const values = Array.from({ length: 1024 }, () => 
//   parseFloat((Math.random() * 2 - 1).toFixed(4))
// ).join(", ");

// console.log(values);
// Copy the output!

module.exports = app;