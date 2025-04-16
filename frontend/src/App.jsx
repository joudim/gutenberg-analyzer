import { useState } from 'react';
import './index.css';
import CharacterGraph from './CharacterGraph';

export default function App() {
  const [bookId, setBookId] = useState('');
  const [bookText, setBookText] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [quotes, setQuotes] = useState([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);


  const fetchBook = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/book?id=${bookId}`);
      const data = await response.json();
      if (data && data.content) {
        setBookText(data.content);
      } else {
        alert("No book content found.");
      }
    } catch (error) {
      console.error("❌ Error fetching book:", error);
      alert("Failed to fetch book from backend.");
    } finally {
      setLoading(false);
    }
  };

  const analyzeBook = async () => {
    setAnalyzing(true);
    try {
      const response = await fetch("http://localhost:8000/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: bookText }),
      });

      const data = await response.json();

      if (data.result) {
        setAnalysis(data.result);
      } else {
        alert("No result from analysis.");
      }
    } catch (err) {
      console.error("Analysis error:", err);
      alert("Failed to analyze book.");
    } finally {
      setAnalyzing(false);
    }
  };

  const fetchQuoteSentiment = async () => {
    setLoadingQuotes(true);
    console
    try {
      const response = await fetch("http://localhost:8000/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: bookText }),
      });
      const data = await response.json();

      let cleaned = data.quotes;
      console.log(data)
       // If it's wrapped in a markdown block, extract only the JSON part
      const match = cleaned.match(/```json\n([\s\S]*?)```/);
      if (match) cleaned = match[1];

      // Only parse if it's valid JSON
      if (cleaned.trim().startsWith("[")) {
        const parsedQuotes = JSON.parse(cleaned);
        setQuotes(parsedQuotes);
      } else {
        console.warn("⚠️ No valid JSON returned:", cleaned);
        alert("No quote data to display.");
      }
    } catch (err) {
      console.error("Quote fetch error:", err);
      alert("Failed to fetch quote sentiment.");
    } finally {
      setLoadingQuotes(false);
    }
  };
  

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 ">
      <div className="max-w-3xl mx-auto px-4 pt-12 pb-12 space-y-6">
        <h1 className="text-3xl font-bold text-center text-purple-600">
          📖 Gutenberg Book Analyzer
        </h1>
  
        <input
          type="text"
          placeholder="Enter Book ID (e.g., 1342)"
          value={bookId}
          onChange={(e) => setBookId(e.target.value)}
          className="w-full p-2 border border-gray-700 rounded bg-gray-900 text-gray-100"
        />
  
        <button
          onClick={fetchBook}
          disabled={loading || !bookId}
          className="bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? 'Fetching...' : 'Fetch Book'}
        </button>
  
        {bookText && (
          <>
            <div>
              <h2 className="text-xl font-semibold mt-6">Book Preview:</h2>
              <textarea
                value={bookText}
                readOnly
                className="w-full h-64 mt-2 p-2 border border-gray-700 rounded font-mono text-sm bg-gray-900 text-gray-100"
              />
            </div>
  
            <div className="mt-4 space-y-4">
              <button
                onClick={analyzeBook}
                disabled={analyzing}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {analyzing ? "Analyzing..." : "Analyze Characters"}
              </button>
  
              {analysis && (
                <>
                  <h2 className="text-xl font-semibold mt-4">LLM Analysis Output:</h2>
                  <pre className="bg-gray-900 text-gray-100 p-4 text-sm overflow-auto whitespace-pre-wrap rounded border border-gray-700 shadow">
                    {analysis}
                  </pre>
  
                  {(() => {
                    try {
                      const parsed = JSON.parse(
                        analysis.match(/```json\n([\s\S]*?)```/)?.[1] || analysis
                      );
                      return <CharacterGraph data={parsed} />;
                    } catch (e) {
                      return (
                        <p className="text-red-600">
                          ❌ Failed to parse character graph data.
                        </p>
                      );
                    }
                  })()}
                  <div className="space-y-4">
                    <button
                      onClick={fetchQuoteSentiment}
                      disabled={loadingQuotes}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loadingQuotes ? "Analyzing Quotes..." : "Show Quote Sentiment"}
                    </button>

                    {quotes.length > 0 && (
                      <div className="mt-6 space-y-4 bg-gray-900 p-4 rounded border border-gray-700">
                        <h2 className="text-xl font-bold text-center text-white">🎭 Character Quotes + Sentiment</h2>
                        {quotes.map((q, i) => (
                          <div key={i} className="p-3 rounded bg-gray-800 shadow">
                            <p className="text-gray-200 italic">“{q.quote}”</p>
                            <p className="text-sm text-gray-400">
                              <strong>{q.speaker}</strong> → <strong>{q.target}</strong> |{" "}
                              <span
                                className={
                                  q.sentiment === "positive"
                                    ? "text-green-400"
                                    : q.sentiment === "negative"
                                    ? "text-red-400"
                                    : "text-yellow-300"
                                }
                              >
                                {q.sentiment}
                              </span>
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );  
}