// Compila o JSX antes de publicar.
//
// Em desenvolvimento o index.html carrega o Babel por CDN e compila no navegador,
// o que é prático pra editar mas custa 617 KB gzip no carregamento de cada pessoa.
// Este script faz a compilação aqui, uma vez, e escreve em dist/ o que vai pro ar:
// mesmo app, sem o compilador junto.

import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync, statSync } from "node:fs";
import { transformSync } from "@babel/core";

const SRC = "index.html", OUT = "dist";

const html = readFileSync(SRC, "utf8");
const bloco = html.match(/<script type="text\/babel">([\s\S]*?)<\/script>/);
if (!bloco) throw new Error(`não achei o <script type="text/babel"> em ${SRC}`);

// transformSync lança em erro de sintaxe — é o que antes exigia o compile-check
// manual, e o que impedia uma página em branco de ir pro ar.
const { code } = transformSync(bloco[1], {
  presets: [["@babel/preset-react"]],
  filename: "app.jsx",
  compact: false
});

const saida = html
  .replace(/^.*babel-standalone.*\n/m, "")
  .replace(bloco[0], () => `<script>\n${code}\n</script>`);

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
writeFileSync(`${OUT}/index.html`, saida);
if (existsSync("functions")) cpSync("functions", `${OUT}/functions`, { recursive: true });

const kb = (n) => (n / 1024).toFixed(1) + " KB";
console.log(`${SRC} ${kb(statSync(SRC).size)}  ->  ${OUT}/index.html ${kb(statSync(`${OUT}/index.html`).size)}`);
console.log("Babel fora do navegador: -617 KB gzip no carregamento de quem usa.");
