const API_BASE =
  import.meta.env.VITE_API_BASE || "https://api.wandalf.com";

export async function requestImage(prompt) {
  const res = await fetch(`${API_BASE}/api/image`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || "Image generation failed");
  return data.image;
}

export async function requestGenerate(prompt, platform) {
  const res = await fetch(`${API_BASE}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, platform }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Code generation failed");
  return data;
}

export async function requestBuild(files, platform) {
  const res = await fetch(`${API_BASE}/api/build`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ files, platform }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Build failed");
  return data;
}


