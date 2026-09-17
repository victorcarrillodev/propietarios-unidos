import MarkdownIt from "markdown-it";

// html: false → cualquier HTML escrito en el texto se muestra escapado (evita XSS).
const md = new MarkdownIt({ html: false, linkify: true, typographer: true, breaks: true });

const defaultLinkOpen =
  md.renderer.rules.link_open ??
  ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options));

md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const token = tokens[idx]!;
  const href = String(token.attrGet("href") ?? "");
  if (/^https?:\/\//i.test(href)) {
    token.attrSet("target", "_blank");
    token.attrSet("rel", "noopener noreferrer");
  }
  return defaultLinkOpen(tokens, idx, options, env, self);
};

/** Convierte Markdown en HTML seguro. Se ejecuta solo en el servidor. */
export function renderMarkdown(source: string | null | undefined) {
  return source ? md.render(source) : "";
}
