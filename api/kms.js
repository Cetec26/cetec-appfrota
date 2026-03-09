export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const scriptUrl = process.env.GOOGLE_SCRIPT_URL?.trim();
        if (!scriptUrl) {
            return res.status(400).json({ success: false, error: "URL do Google Script não configurada." });
        }

        const fetchUrl = scriptUrl + (scriptUrl.includes('?') ? '&' : '?') + 'action=getKms';

        const response = await fetch(fetchUrl, {
            method: "GET",
            redirect: "follow"
        });

        const result = await response.json();
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}
