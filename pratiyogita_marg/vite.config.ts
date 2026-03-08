
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";

// Vite plugin: exposes /api/* endpoints that read/write JSON files
// directly into src/Examdata/<CATEGORY>/ folders on the local filesystem.
function mindmapFileServerPlugin() {
  const examdataDir = path.resolve(__dirname, "src/Examdata");

  const readBody = (req: any): Promise<any> =>
    new Promise((resolve, reject) => {
      let body = "";
      req.on("data", (chunk: any) => (body += chunk));
      req.on("end", () => {
        try { resolve(JSON.parse(body)); } catch (e) { reject(e); }
      });
      req.on("error", reject);
    });

  const jsonResponse = (res: any, status: number, data: any) => {
    res.statusCode = status;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(data));
  };

  const scanAllJsonFiles = () => {
    const result: any[] = [];
    if (!fs.existsSync(examdataDir)) return result;
    for (const cat of fs.readdirSync(examdataDir)) {
      const catDir = path.join(examdataDir, cat);
      if (!fs.statSync(catDir).isDirectory()) continue;
      for (const file of fs.readdirSync(catDir)) {
        if (!file.endsWith(".json")) continue;
        try {
          const content = JSON.parse(fs.readFileSync(path.join(catDir, file), "utf-8"));
          result.push({ catDir, file, content });
        } catch { /* skip corrupt files */ }
      }
    }
    return result;
  };

  return {
    name: "mindmap-file-server",
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        const url = new URL(req.url, "http://localhost");
        const p = url.pathname;

        // ── POST /api/save-mindmap ──────────────────────────────────────────
        if (req.method === "POST" && p === "/api/save-mindmap") {
          try {
            const data = await readBody(req);
            const category = data.examCategory;
            if (!category) return jsonResponse(res, 400, { error: "examCategory required" });

            const dir = path.join(examdataDir, category);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

            // Stable filename: one file per map name inside its category
            const filename = data.name.replace(/[^a-zA-Z0-9_\-. ]/g, "_") + ".json";
            const filepath = path.join(dir, filename);
            fs.writeFileSync(
              filepath,
              JSON.stringify({ ...data, savedAt: new Date().toISOString() }, null, 2)
            );
            jsonResponse(res, 200, { success: true, filename });
          } catch (e) {
            jsonResponse(res, 500, { error: String(e) });
          }
          return;
        }

        // ── GET /api/mindmaps ───────────────────────────────────────────────
        if (req.method === "GET" && p === "/api/mindmaps") {
          try {
            const list = scanAllJsonFiles().map(({ content }) => ({
              name: content.name,
              examCategory: content.examCategory || "",
              savedAt: content.savedAt,
            }));
            jsonResponse(res, 200, list);
          } catch (e) {
            jsonResponse(res, 500, { error: String(e) });
          }
          return;
        }

        // ── GET /api/mindmap?name=X ─────────────────────────────────────────
        if (req.method === "GET" && p === "/api/mindmap") {
          const name = url.searchParams.get("name");
          if (!name) return jsonResponse(res, 400, { error: "name required" });
          try {
            const found = scanAllJsonFiles().find(({ content }) => content.name === name);
            if (found) return jsonResponse(res, 200, found.content);
            jsonResponse(res, 404, { error: "Not found" });
          } catch (e) {
            jsonResponse(res, 500, { error: String(e) });
          }
          return;
        }

        // ── DELETE /api/delete-mindmap?name=X ──────────────────────────────
        if (req.method === "DELETE" && p === "/api/delete-mindmap") {
          const name = url.searchParams.get("name");
          if (!name) return jsonResponse(res, 400, { error: "name required" });
          try {
            const found = scanAllJsonFiles().find(({ content }) => content.name === name);
            if (found) {
              fs.unlinkSync(path.join(found.catDir, found.file));
              return jsonResponse(res, 200, { success: true });
            }
            jsonResponse(res, 404, { error: "Not found" });
          } catch (e) {
            jsonResponse(res, 500, { error: String(e) });
          }
          return;
        }

        next();
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mindmapFileServerPlugin(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));

