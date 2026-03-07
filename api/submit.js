export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const scriptUrl = process.env.GOOGLE_SCRIPT_URL?.trim();
        if (!scriptUrl) {
            return res.status(400).json({ success: false, error: "URL do Google Script não configurada nos Secrets (GOOGLE_SCRIPT_URL)." });
        }

        const response = await fetch(scriptUrl, {
            method: "POST",
            body: JSON.stringify(req.body),
            headers: {
                "Content-Type": "text/plain;charset=utf-8",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "Accept": "*/*"
            },
            redirect: "follow"
        });

        const responseText = await response.text();
        try {
            const result = JSON.parse(responseText);
            res.status(200).json(result);
        } catch (e) {
            res.status(500).json({ success: false, error: "Resposta inválida do Google Script.", details: responseText });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}
