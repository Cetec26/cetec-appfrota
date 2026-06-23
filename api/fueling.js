export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const scriptUrl = "https://script.google.com/macros/s/AKfycbzlHmFrDC_MIxpSgpa3_YBnjGxZVM0vitkOPSW9JHMyBwFQUtTzU8G4GnIfiWvLPDPZ/exec";
        if (!scriptUrl) {
            return res.status(400).json({ success: false, error: "URL do Google Script não configurada nos Secrets (GOOGLE_SCRIPT_URL)." });
        }

        const payloadData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const payload = { ...payloadData, type: "abastecimento" };
        const bodyContent = JSON.stringify(payload);

        const response = await fetch(scriptUrl, {
            method: "POST",
            body: bodyContent,
            headers: {
                "Content-Type": "application/json",
            },
            redirect: "follow"
        });

        const responseText = await response.text();
        
        try {
            const result = JSON.parse(responseText);
            if (result.success) {
                res.status(200).json(result);
            } else {
                res.status(400).json({ success: false, error: result.error || "Erro desconhecido do Google Script" });
            }
        } catch (e) {
            // It's probably an HTML error from Google
            res.status(500).json({ success: false, error: "Resposta inesperada do Google Script (verifique URL e permissões).", details: responseText.substring(0, 500) });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}
