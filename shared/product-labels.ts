import type { Product } from "./pos-types";

const code39: Record<string, string> = {
  "0": "nnnwwnwnn", "1": "wnnwnnnnw", "2": "nnwwnnnnw", "3": "wnwwnnnnn", "4": "nnnwwnnnw", "5": "wnnwwnnnn", "6": "nnwwwnnnn", "7": "nnnwnnwnw", "8": "wnnwnnwnn", "9": "nnwwnnwnn", A: "wnnnnwnnw", B: "nnwnnwnnw", C: "wnwnnwnnn", D: "nnnnwwnnw", E: "wnnnwwnnn", F: "nnwnwwnnn", G: "nnnnnwwnw", H: "wnnnnwwnn", I: "nnwnnwwnn", J: "nnnnwwwnn", K: "wnnnnnnww", L: "nnwnnnnww", M: "wnwnnnnwn", N: "nnnnwnnww", O: "wnnnwnnwn", P: "nnwnwnnwn", Q: "nnnnnnwww", R: "wnnnnnwwn", S: "nnwnnnwwn", T: "nnnnwnwwn", U: "wwnnnnnnw", V: "nwwnnnnnw", W: "wwwnnnnnn", X: "nwnnwnnnw", Y: "wwnnwnnnn", Z: "nwwnwnnnn", "-": "nwnnnnwnw", ".": "wwnnnnwnn", " ": "nwwnnnwnn", "*": "nwnnwnwnn",
};

function escapeHtml(value: string) { return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]!); }

export function createCode39Svg(value: string) {
  const content = `*${value.toUpperCase().replace(/[^0-9A-Z .-]/g, "-")}*`;
  let x = 10;
  const bars: string[] = [];
  content.split("").forEach((character) => {
    const pattern = code39[character] ?? code39["-"];
    pattern.split("").forEach((width, index) => {
      const unit = width === "w" ? 3 : 1;
      if (index % 2 === 0) bars.push(`<rect x="${x}" y="4" width="${unit}" height="52" fill="#101916"/>`);
      x += unit + 1;
    });
    x += 3;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${x + 10} 60" preserveAspectRatio="none">${bars.join("")}</svg>`;
}

export function createProductLabelsHtml(products: Product[], businessName: string) {
  const labels = products.map((product) => `<article class="label"><div class="business">${escapeHtml(businessName)}</div><div class="name">${escapeHtml(product.name)}</div><div class="barcode">${createCode39Svg(product.code)}</div><div class="code">${escapeHtml(product.code)}</div><div class="price">$${product.price.toLocaleString("es-CO")}</div></article>`).join("");
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>@page{size:A4;margin:8mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;margin:0}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:4mm}.label{border:1px solid #17211F;border-radius:3mm;min-height:38mm;padding:3mm;position:relative;page-break-inside:avoid}.business{color:#197B63;font-size:8pt;font-weight:700;text-transform:uppercase}.name{font-size:10pt;font-weight:700;line-height:1.15;margin:1mm 0;min-height:11mm}.barcode{height:13mm;width:100%}.barcode svg{height:100%;width:100%}.code{font-size:8pt;letter-spacing:1px;text-align:center}.price{font-size:10pt;font-weight:700;margin-top:1mm;text-align:right}</style></head><body><main class="grid">${labels}</main></body></html>`;
}
