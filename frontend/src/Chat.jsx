import { useState, useEffect, useRef } from "react";


const Chat = () => {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600);
  const messagesEndRef = useRef(null);


  // Loading component
  const loadingPhrases = [
    "Scanning the film archives...",
    "Retrieving movie data...",
    "Consulting the critics...",
    "Finding your perfect match...",
    "Roll camera! Searching...",
    "Checking the box office records..."
  ];

  const [currentPhrase, setCurrentPhrase] = useState(loadingPhrases[0])

  // --- NEW: Suggested Prompts based on your Pinecone data ---
  const suggestions = [
    "Tell me about the movie Avatar",
    "What is the box office of Avatar 2?",
    "Show me Action/Adventure movies",
    "Who is Jake Sully?"
  ];

  

  // UseEffect
  useEffect(() => {
    if (loading) {
      const randomIdx = Math.floor(Math.random() * loadingPhrases.length)
      setCurrentPhrase(loadingPhrases[randomIdx])
    }
  }, [loading])
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 600);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const askAI = async (inputOverride) => {
    const query = inputOverride || question;
    if (!query.trim()) return;

    setMessages((prev) => [...prev, { type: "user", text: query }]);
    setLoading(true);
    setQuestion("");

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || "";
      const res = await fetch(`${backendUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: query }),
      });

      const data = await res.json();
      setMessages((prev) => [...prev, { type: "ai", text: data.answer }]);
    } catch (error) {
      setMessages((prev) => [...prev, { type: "ai", text: "Server error. Try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={isMobile ? styles.mobileContainer : styles.container}>
      <div style={isMobile ? styles.mobileChatBox : styles.chatBox}>
        <div style={styles.header}>
          <h2 style={styles.title}>HanjangWeb Assistant!</h2>
          
        </div>

        <div style={styles.messages}>
          {/* --- NEW: Suggestions appear when chat is empty --- */}
          {messages.length === 0 && (
            <div style={styles.suggestionContainer}>
              <p style={styles.suggestionTitle}>Try asking about your movies:</p>
              <div style={styles.chipWrapper}>
                {suggestions.map((text, i) => (
                  <button key={i} style={styles.chip} onClick={() => askAI(text)}>
                    {text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, index) => (
            <div key={index} style={msg.type === "user" ? styles.userBubble : styles.aiBubble}>
              {msg.text}
            </div>
          ))}
          {loading && <div style={styles.aiBubble}><span className="loading-animation">{currentPhrase}</span></div>}
          <div ref={messagesEndRef} />
        </div>

        <div style={styles.inputArea}>
          <input
            style={styles.input}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && askAI()}
            placeholder="Ask about movies..."  //Dynamic placeholder
          />
          <button style={styles.button} onClick={() => askAI()}>Send</button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  // Add to your styles.aiBubble or create a new one
  loadingText: {
    fontStyle: "italic",
    color: "#4f46e5", 
    opacity: 0.8,
    animation: "pulse 1.5s infinite" 
  },
  container: { display: "flex", justifyContent: "center", padding: "20px" },
  mobileContainer: { display: "flex", width: "100%" },
  chatBox: { width: "450px", height: "600px", background: "white", boxShadow: "0 10px 30px rgba(0,0,0,0.1)", borderRadius: "16px", display: "flex", flexDirection: "column", overflow: "hidden" },
  mobileChatBox: { width: "100%", height: "100vh", display: "flex", flexDirection: "column" },
  header: { padding: "15px 20px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between" },
  title: { margin: 0, fontSize: "1.1rem" },
  statusBadge: { color: "#10b981", fontSize: "0.8rem", fontWeight: "bold" },
  messages: { flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "10px" },

  // --- Suggestion Styles ---
  suggestionContainer: { marginTop: "40px", textAlign: "center" },
  suggestionTitle: { fontSize: "0.9rem", color: "#666", marginBottom: "12px" },
  chipWrapper: { display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center" },
  chip: { background: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: "20px", padding: "8px 14px", fontSize: "0.85rem", cursor: "pointer", transition: "all 0.2s" },

  userBubble: { alignSelf: "flex-end", background: "#4f46e5", color: "white", padding: "10px 15px", borderRadius: "15px 15px 0 15px", maxWidth: "80%" },
  aiBubble: { alignSelf: "flex-start", background: "#f1f1f1", padding: "10px 15px", borderRadius: "15px 15px 15px 0", maxWidth: "80%" },
  inputArea: { padding: "15px", display: "flex", gap: "10px", background: "#f9fafb" },
  input: { flex: 1, padding: "10px 15px", borderRadius: "20px", border: "1px solid #ccc", outline: "none" },
  button: { background: "#4f46e5", color: "white", border: "none", borderRadius: "20px", padding: "0 20px", cursor: "pointer" }
};

export default Chat;