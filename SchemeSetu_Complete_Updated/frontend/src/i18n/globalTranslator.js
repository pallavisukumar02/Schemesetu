import i18n from "./i18n.js";
import { GLOBAL_TRANSLATIONS } from "./globalTranslations.js";

let observer;
let translating = false;
const originals = new WeakMap();
const attributeOriginals = new WeakMap();
const cache = new Map();

function sourceText(node) {
  if (!originals.has(node)) originals.set(node, node.nodeValue);
  return originals.get(node);
}
function flatten(obj, out = {}) {
  Object.values(obj || {}).forEach(value => {
    if (value && typeof value === "object") flatten(value, out);
    else if (typeof value === "string") out[value] = value;
  });
  return out;
}
function buildDictionary(lang) {
  const key = lang || "en";
  if (cache.has(key)) return cache.get(key);
  const dict = { ...(GLOBAL_TRANSLATIONS[key] || {}) };
  const en = flatten(i18n.getResourceBundle("en", "translation") || {});
  const target = flatten(i18n.getResourceBundle(key, "translation") || {});
  Object.entries(en).forEach(([english, value]) => {
    if (target[value]) dict[english] = target[value];
  });
  cache.set(key, dict);
  return dict;
}
function translateEnglish(text, lang) {
  if (!text || lang === "en") return text;
  const dict = buildDictionary(lang);
  if (dict[text]) return dict[text];
  // Dynamic UI templates: translate the fixed parts while preserving user data.
  const welcome = text.match(/^Welcome, (.+) 👋$/);
  if (welcome) return `${dict["Welcome back"] || "Welcome back"}, ${welcome[1]} 👋`;
  const forMatch = text.match(/^For (.+)\. This is a preparation indicator, not government approval\.$/);
  if (forMatch) return `${dict["For"] || "For"} ${forMatch[1]}. ${dict["Your match is a preliminary fit indicator, not an approval."] || "This is a preparation indicator, not government approval."}`;
  return text;
}
function translateNode(node, lang) {
  const raw = sourceText(node); const trimmed = raw.trim();
  if (!trimmed) return;
  const translated = translateEnglish(trimmed, lang);
  const lead = raw.match(/^\s*/)?.[0] || ""; const trail = raw.match(/\s*$/)?.[0] || "";
  node.nodeValue = `${lead}${translated}${trail}`;
}
function translateAttributes(root, lang) {
  const dict = buildDictionary(lang);
  root.querySelectorAll("input,textarea,button,select,[aria-label],[title],[alt]").forEach(el => {
    ["placeholder", "aria-label", "title", "alt"].forEach(attr => {
      if (!el.hasAttribute(attr)) return;
      let originalsForEl = attributeOriginals.get(el);
      if (!originalsForEl) { originalsForEl = {}; attributeOriginals.set(el, originalsForEl); }
      if (!(attr in originalsForEl)) originalsForEl[attr] = el.getAttribute(attr) || "";
      const raw = originalsForEl[attr];
      el.setAttribute(attr, lang === "en" ? raw : (dict[raw] || translateEnglish(raw, lang)));
    });
  });
}
function walk(root, lang) {
  if (!root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
  translating = true;
  nodes.forEach(node => { const p=node.parentElement; if (p && !["SCRIPT","STYLE"].includes(p.tagName)) translateNode(node, lang); });
  translateAttributes(root, lang);
  translating = false;
}
export function installGlobalTranslator() {
  if (observer) return;
  const run = () => walk(document.body, i18n.resolvedLanguage || i18n.language || "en");
  i18n.on("languageChanged", () => { cache.clear(); setTimeout(run, 0); });
  observer = new MutationObserver(() => { if (!translating) requestAnimationFrame(run); });
  observer.observe(document.body, { childList: true, subtree: true });
  setTimeout(run, 250);
}
