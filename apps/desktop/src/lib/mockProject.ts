import type { FileNode } from "./fs";

interface MockNode {
  name: string;
  is_dir?: boolean;
  children?: MockNode[];
  content?: string;
}

const TREE: MockNode[] = [
  {
    name: "src",
    is_dir: true,
    children: [
      {
        name: "main.tsx",
        content: `import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
`,
      },
      {
        name: "App.tsx",
        content: `import { useState } from "react";
import { Header } from "./components/Header";
import { ProductGrid } from "./components/ProductGrid";
import { fetchProducts } from "./lib/api";

export default function App() {
  const [products, setProducts] = useState([]);

  return (
    <main className="container">
      <Header title="Acme Store" />
      <ProductGrid products={products} />
    </main>
  );
}
`,
      },
      {
        name: "components",
        is_dir: true,
        children: [
          {
            name: "Header.tsx",
            content: `export function Header({ title }: { title: string }) {
  return (
    <header className="site-header">
      <h1>{title}</h1>
      <nav>
        <a href="/">Home</a>
        <a href="/about">About</a>
      </nav>
    </header>
  );
}
`,
          },
          {
            name: "ProductGrid.tsx",
            content: `interface Product {
  id: string;
  name: string;
  price: number;
}

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <section className="grid">
      {products.map((p) => (
        <article key={p.id} className="card">
          <h3>{p.name}</h3>
          <span>{p.price}</span>
        </article>
      ))}
    </section>
  );
}
`,
          },
        ],
      },
      {
        name: "styles",
        is_dir: true,
        children: [
          {
            name: "global.css",
            content: `:root {
  --bg: #0b0d10;
  --fg: #e6e6ec;
  font-family: system-ui, sans-serif;
}

.container {
  max-width: 980px;
  margin: 0 auto;
  padding: 24px;
}
`,
          },
        ],
      },
      {
        name: "lib",
        is_dir: true,
        children: [
          {
            name: "api.ts",
            content: `export async function fetchProducts() {
  const res = await fetch("/api/products");
  if (!res.ok) throw new Error("failed to load");
  return res.json();
}
`,
          },
        ],
      },
    ],
  },
  {
    name: "package.json",
    content: `{
  "name": "acme-store",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "vite": "^7.0.0",
    "typescript": "^5.9.0"
  }
}
`,
  },
  {
    name: "tsconfig.json",
    content: `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true
  },
  "include": ["src"]
}
`,
  },
  {
    name: "README.md",
    content: `# Acme Store

A demo storefront managed by Codvly.

## Getting started

\`\`\`bash
npm install
npm run dev
\`\`\`

Open the editor in Codvly to explore the source.
`,
  },
  {
    name: ".gitignore",
    content: `node_modules
dist
.env.local
`,
  },
];

function find(path: string): MockNode | undefined {
  if (path === "") return undefined; // root
  const parts = path.split("/");
  let nodes = TREE;
  let current: MockNode | undefined;
  for (const part of parts) {
    current = nodes.find((n) => n.name === part);
    if (!current) return undefined;
    nodes = current.children ?? [];
  }
  return current;
}

/** Children of a mock path ("" = project root). Returns an empty array at leaves. */
export function mockChildren(path: string): FileNode[] {
  const node = path === "" ? { children: TREE } : find(path);
  const kids = node?.children ?? [];
  return kids.map((k) => ({
    name: k.name,
    path: path === "" ? k.name : `${path}/${k.name}`,
    is_dir: Boolean(k.is_dir),
  }));
}

export function mockContent(path: string): string {
  return find(path)?.content ?? "";
}
