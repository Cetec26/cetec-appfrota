import axios from 'axios';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const scriptUrl = process.env.GOOGLE_SCRIPT_URL;

    res.status(200).json({
        configOk: !!scriptUrl,
        sheetConnected: !!scriptUrl && scriptUrl.startsWith("https://script.google.com"),
        scriptUrl: scriptUrl || ""
    });
}
