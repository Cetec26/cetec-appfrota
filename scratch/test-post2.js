const url = process.env.GOOGLE_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbywDevaOpWnuu7xAy4qKMRZrQ3RG8cjZWO-EEcNt1k0WjabFKuigwgNGjJX_XvywQlL/exec";
const payload = {
  "motorista": "Hermes",
  "veiculo": "Uno Branco AID8C51",
  "km": "305000",
  "litros": "35",
  "tanque_cheio": "Sim",
  "type": "abastecimento",
  "usuario_logado": "Usuário",
  "email_logado": "usuario@cetec.com",
  "data": "25/05/2026",
  "hora": "14:00"
};

fetch(url, {
  method: "POST",
  headers: { "Content-Type": "text/plain;charset=utf-8" },
  body: JSON.stringify(payload),
  redirect: "follow"
})
.then(res => res.text())
.then(text => console.log("TEXT response for Abastecimento:", text))
.catch(err => console.error(err));
