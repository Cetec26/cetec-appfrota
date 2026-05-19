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

        let payload;

        // ==============================================
        // SAÍDA: monta array na ORDEM EXATA das colunas
        // A  B         C           D         E          F             G               H
        // A=Data Saída, B=Horário, C=Motorista, D=Veículo, E=KM Saída, F=Local Saída, G=Cód+Cidade, H=Verificação,
        // I=Data Chegada, J=KM Chegada, K=KMS Rodados, L=Avarias, M=Foto Avarias
        // ==============================================
        if (d.type === "saida") {
            payload = {
                type: "saida",
                row: [
                    d.data_saida   || "",  // A - DATA SAÍDA
                    d.hora_saida   || "",  // B - HORÁRIO
                    d.motorista    || "",  // C - MOTORISTA
                    d.veiculo      || "",  // D - VEÍCULO
                    d.km_saida     || "",  // E - KM SAÍDA
                    d.local_saida  || "",  // F - LOCAL SAÍDA
                    d.local_destino|| "",  // G - CÓD + CIDADE
                    d.checklist    || "",  // H - VERIFICAÇÃO
                    "",                    // I - DATA CHEGADA (vazio)
                    "",                    // J - KM CHEGADA (vazio)
                    "",                    // K - KMS RODADOS (vazio)
                    "",                    // L - AVARIAS (vazio)
                    ""                     // M - FOTO AVARIAS (vazio)
                ]
            };

        // ==============================================
        // CHEGADA: monta array apenas com os campos de chegada (I a M)
        // O script vai localizar a linha pela placa e atualizar
        // ==============================================
        } else if (d.type === "chegada") {
            payload = {
                type: "chegada",
                veiculo: d.veiculo || "",
                chegada: [
                    d.data_chegada  || "",  // I - DATA CHEGADA
                    d.km_chegada    || "",  // J - KM CHEGADA
                    d.kms_rodados   || "",  // K - KMS RODADOS
                    d.avarias       || "",  // L - AVARIAS
                    d.fotos         || ""   // M - FOTO AVARIAS
                ]
            };

        // ==============================================
        // ABASTECIMENTO: passa direto
        // ==============================================
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
