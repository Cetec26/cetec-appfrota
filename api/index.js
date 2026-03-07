import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

app.get("/api/health", (req, res) => {
    res.json({
        status: "ok",
        env: process.env.NODE_ENV,
        vercel: true
    });
});

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
        try {
            const result = JSON.parse(responseText);
            res.json(result);
        } catch (e) {
            res.status(500).json({ success: false, error: "Resposta inválida do Google Script.", details: responseText });
        }
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post("/api/fueling", async (req, res) => {
    try {
        const scriptUrl = process.env.GOOGLE_SCRIPT_URL?.trim();
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
        try {
            const result = JSON.parse(responseText);
            res.json(result);
        } catch (e) {
            res.status(500).json({ success: false, error: "Resposta inválida do Google Script.", details: responseText });
        }
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default app;
