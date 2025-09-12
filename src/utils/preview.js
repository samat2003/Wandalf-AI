// src/utils/preview.js
export function createHtmlPreview(files = {}) {
  const html =
    files["index.html"] ||
    "<!doctype html><html><body><h1>No HTML</h1></body></html>";
  const css = files["style.css"] || "";
  const js = files["script.js"] || "";

  const injection = `
    <style>${css}</style>
    <script>${js}</script>
  `;

  let combined;
  if (html.includes("</head>")) {
    combined = html.replace("</head>", `${injection}</head>`);
  } else if (html.includes("</body>")) {
    combined = html.replace("</body>", `${injection}</body>`);
  } else {
    combined = html + injection;
  }

  const blob = new Blob([combined], { type: "text/html" });
  return URL.createObjectURL(blob);
}
