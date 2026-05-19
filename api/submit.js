export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const scriptUrl = process.env.GOOGLE_SCRIPT_URL?.trim();
        if (!scriptUrl) {
            return res.status(400).json({ success: false, error: "URL do Google Script não configurada." });
        }

        // Ensure we handle both string and object req.body correctly
        const payloadData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const bodyContent = JSON.stringify(payloadData);

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
            const data = JSON.parse(responseText);
            if (data.success === false) {
                return res.status(400).json({ success: false, error: data.error });
            }
            res.status(200).json({ success: true, text: responseText, data });
        } catch (e) {
            res.status(500).json({ success: false, error: "Resposta inesperada do Google: " + responseText.substring(0, 100) });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}
