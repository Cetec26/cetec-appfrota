export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const scriptUrl = process.env.GOOGLE_SCRIPT_URL?.trim();
        if (!scriptUrl) {
            return res.status(400).json({ success: false, error: "URL do Google Script não configurada." });
        }

        const d = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

        // =====================================================
        // SAÍDA — campos limpos e nomeados
        // =====================================================
        let payload;
        if (d.type === "saida") {
            payload = {
                type: "saida",
                col_A: d.data_saida    || "",  // DATA SAÍDA
                col_B: d.hora_saida    || "",  // HORÁRIO
                col_C: d.motorista     || "",  // MOTORISTA
                col_D: d.veiculo       || "",  // VEÍCULO
                col_E: d.km_saida      || "",  // KM SAÍDA
                col_F: d.local_saida   || "",  // LOCAL SAÍDA
                col_G: d.local_destino || "",  // CÓD + CIDADE
                col_H: d.checklist     || ""   // VERIFICAÇÃO
            };

        // =====================================================
        // CHEGADA — campos limpos e nomeados
        // =====================================================
        } else if (d.type === "chegada") {
            payload = {
                type: "chegada",
                col_D: d.veiculo       || "",  // VEÍCULO (para localizar a linha)
                col_I: d.data_chegada  || "",  // DATA CHEGADA
                col_J: d.km_chegada    || "",  // KM CHEGADA
                col_K: d.kms_rodados   || "",  // KMS RODADOS
                col_L: d.avarias       || "",  // AVARIAS
                col_M: d.fotos         || ""   // FOTO AVARIAS
            };

        // =====================================================
        // ABASTECIMENTO — passa direto
        // =====================================================
        } else {
            payload = d;
        }

        const response = await fetch(scriptUrl, {
            method: "POST",
            body: JSON.stringify(payload),
            headers: { "Content-Type": "application/json" },
            redirect: "follow"
        });

        const responseText = await response.text();
        try {
            const data = JSON.parse(responseText);
            if (data.success === false) {
                return res.status(400).json({ success: false, error: data.error });
            }
            res.status(200).json({ success: true, data });
        } catch (e) {
            res.status(500).json({ success: false, error: "Resposta inesperada do Google: " + responseText.substring(0, 200) });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}
