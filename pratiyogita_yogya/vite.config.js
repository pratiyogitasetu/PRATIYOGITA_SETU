import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from "path"
import fs from "fs"


function examJsonWriterPlugin() {
  return {
    name: "exam-json-writer",
    configureServer(server) {
      server.middlewares.use("/__save-exam-json", (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: "Method not allowed" }));
          return;
        }

        let body = "";
        req.on("data", (chunk) => (body += chunk));
        req.on("end", () => {
          try {
            const { category, fileName, json } = JSON.parse(body);

            if (!category || !fileName || !json) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: "Missing category, fileName or json" }));
              return;
            }

            // Sanitize to prevent path traversal
            const safeCat = path.basename(category);
            const safeFile = path.basename(fileName);

            const dir = path.resolve(__dirname, "public", "examsdata", safeCat);
            fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(path.join(dir, safeFile), json, "utf-8");

            res.statusCode = 200;
            res.end(JSON.stringify({ ok: true, path: `examsdata/${safeCat}/${safeFile}` }));
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
        });
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), examJsonWriterPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
