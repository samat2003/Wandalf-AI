import React, { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Download, Eye, EyeOff, Plus, Wand2, Trash2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { requestImage, requestGenerate, requestBuild } from "../utils/api.js";

const makeId = () => Math.random().toString(36).slice(2, 10);
const defaultMsg = { sender: "ai", text: "Welcome to Wandalf! What would you like to build?" };
const SESS_KEY = "wandalf.sessions.v1";

export default function Chat() {
  const [sessions, setSessions] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(SESS_KEY)) || [];
    } catch {
      return [];
    }
  });
  const [activeId, setActiveId] = useState(() => sessions[0]?.id || null);
  const active = useMemo(() => sessions.find(s => s.id === activeId) || null, [sessions, activeId]);

  const [prompt, setPrompt] = useState("");
  const [isCasting, setIsCasting] = useState(false);
  const [isBuilding, setIsBuilding] = useState(false);
  const [showCode, setShowCode] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active?.messages]);

  useEffect(() => {
    localStorage.setItem(SESS_KEY, JSON.stringify(sessions));
  }, [sessions]);

  const createNewSession = (platform = "web", title = "New Project") => {
    const id = makeId();
    const sess = {
      id, title, platform,
      messages: [defaultMsg],
      files: {}, previewUrl: null, downloadUrl: null,
      createdAt: Date.now(), updatedAt: Date.now()
    };
    setSessions(prev => [sess, ...prev]);
    setActiveId(id);
  };

  useEffect(() => {
    if (!activeId && sessions.length === 0) {
      createNewSession("web", "New Project");
    }
  }, [activeId, sessions.length]);

  const updateActive = (patch) => {
    if (!activeId) return;
    setSessions(prev =>
      prev.map(s =>
        s.id === activeId ? { ...s, ...patch, updatedAt: Date.now() } : s
      )
    );
  };

  const appendMessage = (msg) => {
    if (!active) return;
    updateActive({ messages: [...active.messages, msg] });
  };

  const setFiles = (files) => updateActive({ files });
  const setPreviewUrl = (url) => updateActive({ previewUrl: url });
  const setDownloadUrl = (url) => updateActive({ downloadUrl: url });

  const deriveTitle = (text) => {
    if (!text) return "Untitled";
    const clean = text.replace(/\s+/g, " ").trim();
    return clean.length > 48 ? clean.slice(0, 48) + "…" : clean || "Untitled";
  };

  const changePlatform = (newPlat) => {
    if (!active) return;
    updateActive({
      platform: newPlat,
      previewUrl: null,
      downloadUrl: null,
      files: {},
    });
  };

  const deleteSession = (sessionId) => {
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== sessionId);
      if (sessionId === activeId) {
        const newActive = filtered[0];
        setActiveId(newActive ? newActive.id : null);
      }
      return filtered;
    });
  };

  const makeWebPreview = (files) => {
  let html = files["index.html"] || "<!doctype html><body><h1>Missing index.html</h1>";
  const css = files["style.css"] || "";
  const js = files["script.js"] || "";

  // Inject CSS
  if (css && !html.includes("<style")) {
    const styleTag = `<style>${css}</style>`;
    if (html.includes("</head>")) {
      html = html.replace("</head>", `${styleTag}</head>`);
    } else {
      html = styleTag + html;
    }
  }

  // Inject JS
  if (js && !html.includes("<script")) {
    const scriptTag = `<script>${js}</script>`;
    if (html.includes("</body>")) {
      html = html.replace("</body>", `${scriptTag}</body>`);
    } else {
      html += scriptTag;
    }
  }

  return URL.createObjectURL(new Blob([html], { type: "text/html" }));
};


        const handleCastSpell = async () => {
    if (!prompt.trim() || !active || isCasting) return;

    // Set project title from first user message
    if (!active.messages.some(m => m.sender === "user")) {
      updateActive({ title: deriveTitle(prompt) });
    }

    appendMessage({ sender: "user", text: prompt });
    const currentPrompt = prompt;
    setPrompt("");
    setIsCasting(true);
    setDownloadUrl(null);

    try {
      // 🖼 If it's an image request
      if (/(image|picture|draw|logo|icon|generate an image|create.*image)/i.test(currentPrompt)) {
        try {
          const imageUrl = await requestImage(currentPrompt);
          appendMessage({ sender: "ai", type: "image", content: imageUrl });
        } catch (err) {
          console.error("Image generation error:", err);
          appendMessage({ sender: "ai", text: `❌ Image generation failed: ${err.message}` });
        }
        return; // stop here if it's an image
      }

      // 💻 Otherwise: generate code for selected platform
      const result = await requestGenerate(currentPrompt, active.platform);

      if (result.files && Object.keys(result.files).length > 0) {
        // 🧹 Clean up markdown fences
        const cleanedFiles = {};
        for (const [name, content] of Object.entries(result.files)) {
          cleanedFiles[name] = content
            .replace(/```[a-zA-Z]*\n?/g, "") // remove ```html, ```css etc
            .replace(/```/g, "")             // remove closing ```
            .trim();
        }

        setFiles(cleanedFiles);

        // 🌐 Build live preview for web platform
        if (active.platform === "web" && cleanedFiles["index.html"]) {
          const previewUrl = makeWebPreview(cleanedFiles);
          setPreviewUrl(previewUrl);
        } else {
          setPreviewUrl(null);
        }

        appendMessage({
          sender: "ai",
          text: result.summary || `✨ Generated ${active.platform} app.`
        });
      } else {
        appendMessage({ sender: "ai", text: "❌ No files generated." });
      }
    } catch (error) {
      console.error("Cast spell error:", error);
      appendMessage({ sender: "ai", text: "❌ Code generation failed." });
    } finally {
      setIsCasting(false);
    }
  };



  const handleBuild = async () => {
    if (!active?.files || Object.keys(active.files).length === 0) {
      appendMessage({ sender: "ai", text: "❌ No files to build." });
      return;
    }

    setIsBuilding(true);
    try {
      const result = await requestBuild(active.files, active.platform);
      if (result.success) {
        setDownloadUrl(result.downloadUrl);
        appendMessage({ sender: "ai", text: result.summary || "✅ Build complete." });
      } else {
        appendMessage({ sender: "ai", text: `❌ Build failed: ${result.error}` });
      }
    } catch (error) {
      appendMessage({ sender: "ai", text: `❌ Build failed: ${error.message}` });
    } finally {
      setIsBuilding(false);
    }
  };

  if (!active) return null;

  return (
    <div className="flex h-screen bg-slate-950 text-white">
      {/* LEFT: projects */}
      <aside className="w-72 bg-slate-900 border-r border-slate-800 p-4 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Projects</h2>
          <Button size="sm" onClick={() => createNewSession("web")}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="space-y-1 overflow-y-auto flex-1">
          {sessions.map(sess => (
            <div key={sess.id} className="group relative">
              <button
                onClick={() => setActiveId(sess.id)}
                className={`w-full text-left px-3 py-2 pr-8 rounded-lg transition ${
                  sess.id === activeId ? "bg-slate-800 text-white" : "hover:bg-slate-800/70 text-slate-300"
                }`}
              >
                <div className="font-medium truncate">{sess.title}</div>
                <div className="text-xs text-slate-400">{sess.platform}</div>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSession(sess.id);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-red-400"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* MIDDLE: chat */}
      <main className="flex-1 flex flex-col">
        <div className="p-3 border-b border-slate-800 flex items-center gap-2">
          <select value={active.platform} onChange={(e) => changePlatform(e.target.value)}
            className="bg-slate-800 px-2 py-1 rounded border border-slate-700">
            <option value="web">🌐 Web</option>
            <option value="windows">🪟 Windows</option>
            <option value="macos">🍏 macOS</option>
            <option value="ios">📱 iOS</option>
            <option value="android">🤖 Android</option>
          </select>
          <input
            value={active.title}
            onChange={(e) => updateActive({ title: e.target.value })}
            className="bg-slate-800 px-2 py-1 rounded flex-1 border border-slate-700"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {active.messages.map((m, i) => (
            <div key={i} className={`mb-4 ${m.sender === "user" ? "text-blue-400" : "text-purple-300"}`}>
              <div className="font-bold mb-1">{m.sender === "user" ? "You" : "🧙 Wandalf"}:</div>
              {m.type === "image" ? (
                <img src={m.content} alt="AI" className="max-w-md rounded border border-slate-700" />
              ) : (
                <div className="whitespace-pre-wrap">{m.text}</div>
              )}
            </div>
          ))}
          {isCasting && <div className="flex text-slate-400"><Loader2 className="animate-spin mr-2" />Casting...</div>}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-slate-800 flex gap-2">
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCastSpell()}
            placeholder="Describe your app..."
            className="flex-1 px-3 py-2 rounded bg-slate-800"
          />
          <Button onClick={handleCastSpell} disabled={isCasting}><Wand2 className="w-4 h-4 mr-1"/>Cast</Button>
        </div>
      </main>

      {/* RIGHT: code + preview */}
      <aside className="w-1/2 border-l border-slate-800 bg-slate-900 flex flex-col">
        <div className="p-3 border-b border-slate-700 flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowCode(!showCode)}>
            {showCode ? <><EyeOff className="w-4 h-4 mr-1" />Hide Code</> : <><Eye className="w-4 h-4 mr-1" />Show Code</>}
          </Button>
          <Button size="sm" onClick={handleBuild} disabled={isBuilding}>
            <Download className="w-4 h-4 mr-1" /> {isBuilding ? "Building..." : "Build App"}
          </Button>
          {active.downloadUrl && (
            <Button
              onClick={() => {
                const link = document.createElement("a");
                link.href = active.downloadUrl;
                link.download = ""; // forces download
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="ml-2 bg-green-600 px-3 py-1 rounded text-sm"
            >
              Download
            </Button>

          )}
        </div>

        <div className="flex-1 flex min-h-0">
          {showCode && (
            <div className="w-1/2 p-3 overflow-y-auto text-xs bg-slate-800">
              {Object.entries(active.files || {}).map(([name, content]) => (
                <details key={name} className="mb-2">
                  <summary className="font-bold text-slate-200">{name}</summary>
                  <pre className="whitespace-pre-wrap">{content}</pre>
                </details>
              ))}
            </div>
          )}
          <div className="flex-1 p-3">
            {active.previewUrl && (
              <iframe
                src={active.previewUrl}
                className="w-full h-full border-none"
                title="App Preview"
              />
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
