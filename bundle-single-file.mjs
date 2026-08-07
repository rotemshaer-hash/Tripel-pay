import { readFileSync, writeFileSync, readdirSync } from "fs";

const dist = "./dist";
const cssFile = readdirSync(`${dist}/assets`).find((f) => f.endsWith(".css"));
const js = readFileSync(`${dist}/assets/index.js`, "utf8");
const css = readFileSync(`${dist}/assets/${cssFile}`, "utf8");
const favicon = readFileSync(`${dist}/favicon.svg`, "utf8");
const icon192 = readFileSync(`${dist}/icon-192.png`).toString("base64");
const icon512 = readFileSync(`${dist}/icon-512.png`).toString("base64");
const iconMaskable = readFileSync(`${dist}/icon-maskable-512.png`).toString("base64");

const icon192Uri = `data:image/png;base64,${icon192}`;
const icon512Uri = `data:image/png;base64,${icon512}`;
const iconMaskableUri = `data:image/png;base64,${iconMaskable}`;
const faviconUri = `data:image/svg+xml;base64,${Buffer.from(favicon, "utf8").toString("base64")}`;

const manifest = {
  name: "Triple Pay",
  short_name: "Triple Pay",
  start_url: ".",
  display: "standalone",
  background_color: "#ffffff",
  theme_color: "#72cec0",
  dir: "rtl",
  lang: "he",
  icons: [
    { src: icon192Uri, sizes: "192x192", type: "image/png", purpose: "any" },
    { src: icon512Uri, sizes: "512x512", type: "image/png", purpose: "any" },
    { src: iconMaskableUri, sizes: "512x512", type: "image/png", purpose: "maskable" },
  ],
};
const manifestUri = `data:application/manifest+json;base64,${Buffer.from(JSON.stringify(manifest)).toString("base64")}`;

const html = `<!doctype html>
<html lang="he" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="${faviconUri}" />
    <link rel="icon" type="image/png" sizes="192x192" href="${icon192Uri}" />
    <link rel="apple-touch-icon" href="${icon512Uri}" />
    <link rel="manifest" href="${manifestUri}" />
    <meta name="theme-color" content="#72cec0" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <title>Triple Pay</title>
    <style>${css}</style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module">${js}</script>
  </body>
</html>
`;

writeFileSync("./triplepay-single-file.html", html);
console.log("wrote triplepay-single-file.html", (html.length / 1024 / 1024).toFixed(2), "MB");
