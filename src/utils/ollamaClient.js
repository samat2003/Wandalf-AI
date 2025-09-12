// client/src/utils/ollamaClient.js

export async function generateCode(prompt, platform = "web", model = "gpt-4o-mini") {
  try {
    const res = await fetch("http://localhost:4000/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, platform, model }),
    });

    if (!res.ok) throw new Error(`Server error: ${res.status} ${res.statusText}`);

    return await res.json();
  } catch (err) {
    console.error("❌ generateCode failed:", err);
    return { files: {}, summary: "Error: Could not connect to Wandalf server." };
  }
}

export async function buildExecutable(files) {
  try {
    const res = await fetch("http://localhost:4000/api/build", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ files }),
    });

    if (!res.ok) throw new Error(`Build error: ${res.status} ${res.statusText}`);

    return await res.json();
  } catch (err) {
    console.error("❌ buildExecutable failed:", err);
    return { error: "Build failed" };
  }
}
