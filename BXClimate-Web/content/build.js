#!/usr/bin/env deno run --allow-read --allow-write

import { marked } from "https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js";
import { join, extname, basename } from "https://deno.land/std@0.182.0/path/mod.ts";

const SRC = "./content";
const OUT = join(Deno.cwd(), "./public/blog");

await Deno.mkdir(OUT, { recursive: true });

const posts = [];

for await (const entry of Deno.readDir(SRC)) {
  if (
    !entry.isFile ||
    extname(entry.name) !== ".md" ||
    entry.name === "build.js"
  ) continue;
  const slug = basename(entry.name, ".md");
  posts.push(slug);
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
      <body class=" py-8">
        ${html}
      </body>
      </html>`.trim(),
  );

  console.log("Built:", slug);
}

// Generate /blog/index.html with links to all posts
const links = posts.map(slug =>
  `<li class="mb-2"><a href="./${slug}/" class="underline hover:bg-accent px-2 py-1 rounded">${slug}</a></li>`
).join("\n");

await Deno.writeTextFile(
  join(OUT, "index.html"),
  `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8"/>
      <meta name="viewport" content="width=device-width,initial-scale=1"/>
      <title>Blog Index</title>
      <link rel="stylesheet" href="/assets/index.css"/>
    </head>
    <body class=" mx-auto py-8">
      <main class="max-w-xl mx-auto">
        <h1 class="text-3xl font-bold mb-6">Blog Posts</h1>
        <ul>
          ${links}
        </ul>
      </main>
    </body>
    </html>`.trim(),
);

console.log("Built: index");
