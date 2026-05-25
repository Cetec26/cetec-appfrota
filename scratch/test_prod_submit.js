import fetch from 'node-fetch';

async function testProductionSubmit() {
    const url = "https://cetec-appfrota.vercel.app/api/submit";
    const payload = {
        motorista: "Hermes Augusto Martini",
        veiculo: "Uno AID8C51",
        km: "305490",
        litros: "40",
        type: "abastecimento",
        usuario_logado: "Teste Producao",
        email_logado: "teste@cetec.com",
        data: "20/05/2026",
        hora: "15:00"
    };

    console.log("Sending fueling POST to production Vercel app:", url);
    try {
        const response = await fetch(url, {
            method: "POST",
            body: JSON.stringify(payload),
            headers: {
                "Content-Type": "application/json"
            }
        });
        const responseText = await response.text();
        console.log("Production Submit Response Status:", response.status);
        console.log("Production Submit Response Body:", responseText);
    } catch (e) {
        console.error("Error submitting to production:", e);
    }
}

testProductionSubmit();
