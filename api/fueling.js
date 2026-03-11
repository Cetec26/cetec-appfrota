export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const scriptUrl = process.env.GOOGLE_SCRIPT_URL?.trim();
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
        res.status(200).json({ success: true, text: responseText });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}
