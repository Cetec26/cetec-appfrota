import express from "express";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Middleware de log para diagnóstico
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Rota de teste para verificar se o servidor está respondendo
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    env: process.env.NODE_ENV,
    distExists: fs.existsSync(path.resolve(__dirname, "dist"))
  });
});

// API Routes
app.get("/api/status", async (req, res) => {
  const scriptUrl = process.env.GOOGLE_SCRIPT_URL;
  res.json({ 
    configOk: !!scriptUrl,
    sheetConnected: !!scriptUrl && scriptUrl.startsWith("https://script.google.com")
  });
});

app.post("/api/submit", async (req, res) => {
  try {
    const scriptUrl = process.env.GOOGLE_SCRIPT_URL?.trim();
    console.log("Submitting travel data to:", scriptUrl);
    
    if (!scriptUrl) {
      return res.status(400).json({ success: false, error: "URL do Google Script não configurada nos Secrets (GOOGLE_SCRIPT_URL)." });
    }

    const response = await fetch(scriptUrl, {
      method: "POST",
      body: JSON.stringify(req.body),
      headers: { "Content-Type": "application/json" },
      redirect: "follow"
    });

    const responseText = await response.text();
    console.log("Google Script Response (Travel):", responseText);
    
    try {
      const result = JSON.parse(responseText);
      res.json(result);
    } catch (e) {
      res.status(500).json({ success: false, error: "Resposta inválida do Google Script.", details: responseText });
    }
  } catch (error: any) {
    console.error("Error submitting travel data:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/fueling", async (req, res) => {
  try {
    const scriptUrl = process.env.GOOGLE_SCRIPT_URL?.trim();
    console.log("Submitting fueling data to:", scriptUrl);
    console.log("Fueling Payload:", JSON.stringify(req.body));

    if (!scriptUrl) {
      return res.status(400).json({ success: false, error: "URL do Google Script não configurada nos Secrets (GOOGLE_SCRIPT_URL)." });
    }

    const response = await fetch(scriptUrl, {
      method: "POST",
      body: JSON.stringify({ ...req.body, type: "abastecimento" }),
      headers: { 
        "Content-Type": "text/plain;charset=utf-8" 
      },
      redirect: "follow"
    });

    const responseText = await response.text();
    console.log("Google Script Response (Fueling):", responseText);

    try {
      const result = JSON.parse(responseText);
      res.json(result);
    } catch (e) {
      res.status(500).json({ success: false, error: "Resposta inválida do Google Script.", details: responseText });
    }
  } catch (error: any) {
    console.error("Error submitting fueling data:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

async function startApp() {
  const distPath = path.resolve(__dirname, "dist");
  const hasDist = fs.existsSync(path.join(distPath, "index.html"));

  // Tenta servir arquivos estáticos se a pasta dist existir
  if (hasDist) {
    console.log("Modo Produção: Servindo arquivos de", distPath);
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  } else {
    // Se a pasta dist não existe, tentamos usar o Vite Middleware
    // Isso é útil no ambiente de desenvolvimento do AI Studio
    console.log("Pasta 'dist' não encontrada. Iniciando Vite Middleware como fallback...");
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.error("Erro ao iniciar Vite Middleware:", e);
      app.get("*", (req, res) => {
        res.status(500).send("Erro: Pasta 'dist' não encontrada e falha ao iniciar Vite.");
      });
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor CETEC rodando na porta ${PORT}`);
  });
}

startApp().catch(err => {
  console.error("Erro ao iniciar o servidor:", err);
});
