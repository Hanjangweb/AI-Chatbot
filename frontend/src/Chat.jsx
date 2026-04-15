import { useState, useEffect, useRef } from "react";

const Chat = () => {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600);
  const messagesEndRef = useRef(null);

  // Update layout when window is resized
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 600);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const askAI = async () => {
    if (!question) return;
    const userMessage = { type: "user", text: question };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const res = await fetch("https://roxann-cruciate-hypodermically.ngrok-free.dev/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { type: "ai", text: data.answer }]);
    } catch (error) {
      setMessages((prev) => [...prev, { type: "ai", text: "Server error. Try again." }]);
    }
    setLoading(false);
    setQuestion("");
  };

  // Dynamic Styles based on Media Query state
  const dynamicStyles = {
    chatBox: {
      ...styles.chatBox,
      width: isMobile ? "100%" : "420px",
      height: isMobile ? "auto" : "auto",
      borderRadius: isMobile ? "0px" : "12px",
    },
    container: {
      ...styles.container,
      padding: isMobile ? "0px" : "20px",
    }
  };

  return (
    <div style={dynamicStyles.container}>
      <div style={dynamicStyles.chatBox}>
        <h2 style={styles.title}>AI Assistant</h2>
        <div style={styles.messages}>
          {messages.map((msg, index) => (
            <div key={index} style={msg.type === "user" ? styles.userBubble : styles.aiBubble}>
              {msg.text}
            </div>
          ))}
          {loading && <div style={styles.aiBubble}>Thinking...</div>}
          <div ref={messagesEndRef} />
        </div>
        <div style={styles.inputArea}>
          <input
            style={styles.input}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && askAI()}
            placeholder="Ask something..."
          />
          <button style={styles.button} onClick={askAI}>Ask</button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "auto",
    fontFamily: "Arial, sans-serif",
  },
  chatBox: {
    background: "white",
    padding: "20px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
    display: "flex",
    flexDirection: "column",
    transition: "all 0.3s ease", // Smooth transition when resizing
  },
  messages: {
    flex: 1,
    overflowY: "auto",
    marginBottom: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  userBubble: {
    alignSelf: "flex-end",
    background: "#4f46e5",
    color: "white",
    padding: "10px 15px",
    borderRadius: "15px 15px 0 15px",
    maxWidth: "80%",
    fontSize: "14px",
  },
  aiBubble: {
    alignSelf: "flex-start",
    background: "#f1f1f1",
    padding: "10px 15px",
    borderRadius: "15px 15px 15px 0",
    maxWidth: "80%",
    fontSize: "14px",
  },
  inputArea: { display: "flex", gap: "10px" },
  input: {
    flex: 1,
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "16px", // Prevents iOS zoom
  },
  button: {
    padding: "10px 20px",
    background: "#4f46e5",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
};

export default Chat;