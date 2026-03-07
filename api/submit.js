import axios from 'axios';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const scriptUrl = process.env.GOOGLE_SCRIPT_URL?.trim();
        if (!scriptUrl) {
            return res.status(400).json({ success: false, error: "URL do Google Script não configurada nos Secrets (GOOGLE_SCRIPT_URL)." });
        }

        const response = await axios.post(scriptUrl, req.body, {
            headers: { "Content-Type": "application/json" }
        });

        res.status(200).json(response.data);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}
