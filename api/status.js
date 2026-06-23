import axios from 'axios';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const scriptUrl = "https://script.google.com/macros/s/AKfycbzlHmFrDC_MIxpSgpa3_YBnjGxZVM0vitkOPSW9JHMyBwFQUtTzU8G4GnIfiWvLPDPZ/exec";

    res.status(200).json({
        configOk: !!scriptUrl,
        sheetConnected: !!scriptUrl && scriptUrl.startsWith("https://script.google.com"),
        scriptUrl: scriptUrl || ""
    });
}
