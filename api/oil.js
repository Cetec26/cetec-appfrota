export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const scriptUrl = "https://script.google.com/macros/s/AKfycbzlHmFrDC_MIxpSgpa3_YBnjGxZVM0vitkOPSW9JHMyBwFQUtTzU8G4GnIfiWvLPDPZ/exec";
        if (!scriptUrl) {
            return res.status(400).json({ success: false, error: "URL do Google Script não configurada." });
        }

        const fetchUrl = scriptUrl + (scriptUrl.includes('?') ? '&' : '?') + 'action=getOilRefs';

        const response = await fetch(fetchUrl, {
            method: "GET",
            redirect: "follow"
        });

        const responseText = await response.text();
        try {
            const result = JSON.parse(responseText);
            res.status(200).json(result);
        } catch (e) {
            res.status(500).json({ success: false, error: "Retorno HTML ao invés de JSON", details: responseText });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}
