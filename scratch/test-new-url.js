const url = "https://script.google.com/macros/s/AKfycbwh_ieqiVL9eiRTtBksQXZmbVvQ-j9OaEq3qy30TzBii-E2gQ49JDykXw5sD84W9FI/exec";
const payload = {
  "motorista": "Hermes",
  "veiculo": "Uno Branco AID8C51",
  "km": "305001",
  "litros": "35",
  "tanque_cheio": "Sim",
  "type": "abastecimento",
  "usuario_logado": "Usuário",
  "email_logado": "usuario@cetec.com",
  "data": "26/05/2026",
  "hora": "11:17"
};
fetch(url, {
  method: "POST",
  headers: { "Content-Type": "text/plain;charset=utf-8" },
  body: JSON.stringify(payload),
  redirect: "follow"
})
.then(res => res.text())
.then(text => console.log("RESPOSTA:", text))
.catch(err => console.error(err));
