import { useState, useEffect, useRef } from "react";

const Chat = () => {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const loadingPhrases = [
    "Retrieving movie data...",
    "Finding your perfect match...",
  ];

  const [currentPhrase, setCurrentPhrase] = useState(loadingPhrases[0]);

  const suggestions = [
    "Tell me about the movie Avatar",
    "What is the box office of Avatar 2?",
    "Show me Action/Adventure movies",
    "Who is Jake Sully?"
  ];

  useEffect(() => {
    if (loading) {
      const randomIdx = Math.floor(Math.random() * loadingPhrases.length);
      setCurrentPhrase(loadingPhrases[randomIdx]);
    }
  }, [loading]);

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
    /* Main Container: Mobile = full screen, Desktop = centered with padding */
    <div className="flex justify-center bg-gray-100 sm:py-8 h-dvh sm:h-screen">
      
      {/* Chat Box: Mobile = full height/width, Desktop = fixed size with shadow */}
      <div className="flex flex-col w-full bg-white overflow-hidden sm:w-[450px] sm:h-[600px] sm:rounded-2xl sm:shadow-2xl">
        
        {/* Header: Fixed at top */}
        <header className="flex-none px-5 py-4 border-b border-gray-100 bg-purple-500">
          <h2 className="text-lg font-bold text-gray-800 uppercase ">HanjangWeb Assistant!</h2>
        </header>

        {/* Messages Area: Scrollable middle section */}
        <main className="flex-1 overflow-y-auto p-5 flex flex-col gap-3 scroll-smooth touch-pan-y">
          {messages.length === 0 && (
            <div className="mt-10 text-center animate-fade-in">
              <p className="text-sm text-gray-500 mb-4">Try asking about your movies:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {suggestions.map((text, i) => (
                  <button
                    key={i}
                    onClick={() => askAI(text)}
                    className="bg-gray-100 border border-gray-200 rounded-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    {text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, index) => (
            <div
              key={index}
              className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm ${
                msg.type === "user"
                  ? "self-end bg-indigo-600 text-white rounded-tr-none"
                  : "self-start bg-gray-100 text-gray-800 rounded-tl-none"
              }`}
            >
              {msg.text}
            </div>
          ))}

          {loading && (
            <div className="self-start bg-gray-100 px-4 py-2.5 rounded-2xl rounded-tl-none italic text-indigo-600 animate-pulse text-sm">
              {currentPhrase}
            </div>
          )}
          <div ref={messagesEndRef} />
        </main>

        {/* Input Area: Fixed at bottom */}
        <footer className="flex-none p-4 bottom-5 bg-gray-50 border-t border-gray-100 pb-[env(safe-area-inset-bottom)]">
          <div className="flex gap-2">
            <input
              className="flex-1 px-4 py-2 rounded-full border border-gray-300 bg-white outline-none focus:border-indigo-500 text-sm"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && askAI()}
              placeholder="Ask about movies..."
            />
            <button
              onClick={() => askAI()}
              className="bg-indigo-600 text-white px-6 py-2 rounded-full font-medium hover:bg-indigo-700 active:scale-95 transition-all text-sm"
            >
              Send
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Chat;