import fetch from 'node-fetch';

const scriptUrl = "https://script.google.com/macros/s/AKfycbywDevaOpWnuu7xAy4qKMRZrQ3RG8cjZWO-EEcNt1k0WjabFKuigwgNGjJX_XvywQlL/exec";

async function test() {
    const payload = {
        motorista: "Hermes Augusto Martini",
        veiculo: "Uno AID8C51",
        km: "305490",
        litros: "40",
        type: "abastecimento",
        usuario_logado: "Teste Automatizado",
        email_logado: "teste@cetec.com",
        data: "20/05/2026",
        hora: "15:00"
    };

    console.log("Sending payload to Google Apps Script...");
    try {
        const response = await fetch(scriptUrl, {
            method: "POST",
            body: JSON.stringify(payload),
            headers: {
                "Content-Type": "application/json"
            }
        });

        const responseText = await response.text();
        console.log("Response Status:", response.status);
        console.log("Response Body:", responseText);
    } catch (e) {
        console.error("Error during fetch:", e);
    }
}

test();
