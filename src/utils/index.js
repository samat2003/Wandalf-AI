import { requestImage, requestGenerate, requestBuild } from "../utils";

export function createPageUrl(pageName) {
  switch (pageName) {
    case "Home": return "/";
    case "Chat": return "/chat";
    case "Demo": return "/demo";
    default: return "/";
  }
}
export { requestImage, requestGenerate, requestBuild } from "./api.js";
