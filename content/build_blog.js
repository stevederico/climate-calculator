#!/usr/bin/env deno run --allow-read --allow-write

import { marked } from "https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js";
import { join, extname, basename } from "https://deno.land/std@0.182.0/path/mod.ts";

const SRC = "./content";
// console.log("SRC path:", join(Deno.cwd(), SRC));
const OUT = join(Deno.cwd(), "./public/blog");
// console.log("OUT path:", OUT);


await Deno.mkdir(OUT, { recursive: true });

for await (const entry of Deno.readDir(SRC)) {
    if (
        !entry.isFile ||
        extname(entry.name) !== ".md" ||
        entry.name === "build_blog.js"
    ) continue;
    const slug = basename(entry.name, ".md");
    const md = await Deno.readTextFile(join(SRC, entry.name));
    const html = marked(md);

    const dir = join(OUT, slug);
    await Deno.mkdir(dir, { recursive: true });
    await Deno.writeTextFile(
        join(dir, "index.html"),
        `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${slug}</title>
  <link rel="stylesheet" href="/assets/index.css"/>
</head>
<body class="prose mx-auto py-8">
  ${html}
</body>
</html>`.trim(),
    );

    console.log("Built:", slug);
}
