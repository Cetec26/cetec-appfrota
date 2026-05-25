import fetch from 'node-fetch';

async function testProductionStatus() {
    const url = "https://cetec-appfrota.vercel.app/api/status";
    console.log("Fetching status from production Vercel app:", url);
    try {
        const response = await fetch(url);
        const responseText = await response.text();
        console.log("Production Status:", response.status);
        console.log("Production Body:", responseText);
    } catch (e) {
        console.error("Error fetching production status:", e);
    }
}

testProductionStatus();
