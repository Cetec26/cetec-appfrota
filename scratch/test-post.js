const url = "https://script.google.com/macros/s/AKfycbywDevaOpWnuu7xAy4qKMRZrQ3RG8cjZWO-EEcNt1k0WjabFKuigwgNGjJX_XvywQlL/exec";
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
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
  redirect: "follow"
})
.then(res => res.text())
.then(text => console.log("JSON response:", text.substring(0, 500)))
.catch(err => console.error(err));

fetch(url, {
  method: "POST",
  headers: { "Content-Type": "text/plain;charset=utf-8" },
  body: JSON.stringify(payload),
  redirect: "follow"
})
.then(res => res.text())
.then(text => console.log("TEXT response:", text.substring(0, 500)))
.catch(err => console.error(err));

fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ ...payload, type: "saida", data_saida: "25/05/2026", hora_saida: "14:00", km_saida: "305000", local_saida: "Escritorio", local_destino: "Obra", checklist: [] }),
  redirect: "follow"
})
.then(res => res.text())
.then(text => console.log("SAIDA response:", text.substring(0, 500)))
.catch(err => console.error(err));
