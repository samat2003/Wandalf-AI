import React, { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Download, Eye, EyeOff, Plus, Wand2, Trash2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { requestImage, requestGenerate, requestBuild } from "../utils/api.js";
import CodeBlock from "../components/ui/CodeBlock.jsx";

const makeId = () => Math.random().toString(36).slice(2, 10);
const defaultMsg = { sender: "ai", text: "Welcome to Wandalf! What would you like to build?" };
const SESS_KEY = "wandalf.sessions.v1";

/* -------------------------------------------
   NEW HELPERS: image upload + web inject
-------------------------------------------- */
async function uploadImageFile(file) {
  try {
    console.log("Uploading file:", file.name, file.type, file.size);
    const formData = new FormData();
    formData.append("image", file);
    const response = await fetch("https://api.wandalf.com/api/upload-image", {
      method: "POST",
      body: formData,
      // Don't set Content-Type header - let browser set it with boundary
    });
    console.log("Upload response status:", response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Upload failed:", errorText);
      throw new Error(`Upload failed: ${response.status} ${errorText}`);
    }
    const data = await response.json();
    console.log("Upload successful:", data);
    if (!data.success) {
      throw new Error(data.error || "Upload failed");
    }
    return data.url;
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
}

function injectImageIntoWebFiles(files, imageUrl) {
  const next = { ...files };
  const hasIndex = typeof next["index.html"] === "string";

  // If no index.html, make one that shows the image
  if (!hasIndex) {
    next["index.html"] =
      `<!doctype html><html><head><meta charset="utf-8"><title>Wandalf</title></head>` +
      `<body style="display:grid;place-items:center;min-height:100dvh;background:#0b1220;color:#e5e7eb">` +
      `<img src="${imageUrl}" alt="Uploaded" style="max-width:min(100%, 960px);height:auto;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.4)"/>` +
      `</body></html>`;
    return next;
  }

  // Place the image right after <body> (or append if not found)
  next["index.html"] = next["index.html"].replace(
    /<body([^>]*)>/i,
    (m) =>
      `${m}
      <img src="${imageUrl}" alt="Uploaded"
        style="max-width:min(100%, 960px);height:auto;display:block;margin:2rem auto;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.4)"/>`
  );
  return next;
}

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

  /* NEW: file input ref for manual image uploads */
  const fileInputRef = useRef(null);

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

  /* -------------------------------------------------
     UPDATED: makeWebPreview with base + reset + inline
  -------------------------------------------------- */
  const makeWebPreview = (files) => {
    let html = files["index.html"] || "<!doctype html><body><h1>Missing index.html</h1>";
    const css = files["style.css"] || "";
    const js = files["script.js"] || "";

    // Remove external references (we inline below)
    html = html.replace(/<link[^>]+style\.css[^>]*>/i, "");
    html = html.replace(/<script[^>]+script\.js[^>]*><\/script>/i, "");

    // Ensure <html><head> exist
    if (!/<html[^>]*>/i.test(html)) html = `<!doctype html><html><head></head><body>${html}</body></html>`;
    if (!/<head[^>]*>/i.test(html)) html = html.replace(/<html[^>]*>/i, (m) => `${m}<head></head>`);

    // Add <base> so relative URLs (like /uploads/...) resolve in blob iframe
    const baseTag = `<base href="https://api.wandalf.com/">`;
    html = html.replace(/<\/head>/i, `${baseTag}</head>`);

    // Minimal CSS reset + injected CSS
    const reset = `
      html,body{margin:0;padding:0}
      *,*::before,*::after{box-sizing:border-box}
      img,video,canvas{max-width:100%;height:auto}
      body{background:#0b1220;color:#e5e7eb}
    `;
    const styleTag = `<style>${reset}${css}</style>`;
    html = html.replace(/<\/head>/i, `${styleTag}</head>`);

    // Inject JS at end of body
    if (js) {
      const scriptTag = `<script>${js}</script>`;
      if (html.includes("</body>")) {
        html = html.replace(/<\/body>/i, `${scriptTag}</body>`);
      } else {
        html += scriptTag;
      }
    }

    return URL.createObjectURL(new Blob([html], { type: "text/html" }));
  };

  /* -------------------------------------------
     NEW: image paste / drop / picker handling
  -------------------------------------------- */
  async function handleImageFile(file) {
    try {
      console.log("Handling image file:", file);
      // Ensure we have a proper File object
      if (!(file instanceof File)) {
        console.error("Not a proper File object:", file);
        throw new Error("Invalid file object");
      }
      const url = await uploadImageFile(file);
      console.log("Image uploaded, URL:", url);
      appendMessage({ sender: "ai", type: "image", content: url });
      // If platform is web, inject image into current files + refresh preview
      if (active?.platform === "web") {
        const updatedFiles = injectImageIntoWebFiles(active.files || {}, url);
        setFiles(updatedFiles);
        const previewUrl = makeWebPreview(updatedFiles);
        setPreviewUrl(previewUrl);
      }
    } catch (e) {
      console.error("Image handling failed:", e);
      appendMessage({ sender: "ai", text: `❌ Image upload failed: ${e.message}` });
    }
  }

  function onPaste(e) {
    console.log("Paste event:", e);
    const items = e.clipboardData?.items || [];
    console.log("Clipboard items:", items);
    for (const item of items) {
      console.log("Item:", item.kind, item.type);
      if (item.kind === "file" && item.type.startsWith("image/")) {
        const file = item.getAsFile();
        console.log("Pasted file:", file);
        if (file) {
          e.preventDefault();
          handleImageFile(file);
          break;
        }
      }
    }
  }

  function onDrop(e) {
    e.preventDefault();
    const f = e.dataTransfer?.files?.[0];
    if (f && /^image\//i.test(f.type)) handleImageFile(f);
  }

  function onDragOver(e) {
    if (e.dataTransfer?.types?.includes("Files")) {
      e.preventDefault();
    }
  }

  const handleCastSpell = async () => {
    if (!prompt.trim() || !active || isCasting) return;

    if (!active.messages.some(m => m.sender === "user")) {
      updateActive({ title: deriveTitle(prompt) });
    }

    appendMessage({ sender: "user", text: prompt });
    const currentPrompt = prompt;
    setPrompt("");
    setIsCasting(true);
    setDownloadUrl(null);

    try {
      // 🖼 If it's an explicit image request
      if (/\b(generate|create)\s+(an?\s+)?image\b/i.test(currentPrompt)) {
        try {
          const imageUrl = await requestImage(currentPrompt);
          appendMessage({ sender: "ai", type: "image", content: imageUrl });
        } catch (err) {
          console.error("Image generation error:", err);
          appendMessage({ sender: "ai", text: `❌ Image generation failed: ${err.message}` });
        }
        return; // stop here if it's an image
      }

      const contextString = Object.entries(active.files || {})
        .map(([name, content]) => `--- ${name} ---\n${content}`)
        .join("\n\n");

      const result = await requestGenerate(
        `Current project files:\n${contextString}\n\nUser wants to improve it by: ${currentPrompt}`,
        active.platform
      );

      if (result.files && Object.keys(result.files).length > 0) {
        const cleanedFiles = {};
        for (const [name, content] of Object.entries(result.files)) {
          cleanedFiles[name] = content
            .replace(/```[a-zA-Z]*\n?/g, "")
            .replace(/```/g, "")
            .trim();
        }

        setFiles(cleanedFiles);

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
        appendMessage({
          sender: "ai",
          text: `❌ Build failed: ${result.error}${result.details ? "\n" + result.details : ""}`
        });
      }
    } catch (error) {
      appendMessage({ sender: "ai", text: `❌ Build failed: ${error.message}${error.details ? `\n${error.details}` : ""}` });
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

        <div
          className="flex-1 overflow-y-auto p-6"
          onPaste={onPaste}
          onDrop={onDrop}
          onDragOver={onDragOver}
        >
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
            onPaste={onPaste}
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            title="Upload image"
          >
            Upload Image
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleImageFile(e.target.files[0])}
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
                link.download = "";
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
            <div className="w-1/2 p-3 overflow-y-auto bg-slate-800">
              {Object.entries(active.files || {}).map(([name, content]) => (
                <CodeBlock key={name} filename={name} content={content} />
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

