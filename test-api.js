const fetch = require('node-fetch');

async function testApi() {
    const res = await fetch('http://localhost:3000/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'd74e6fe7-e158-48df-839a-f4c47d2b9eae', fileName: 'test.pdf' })
    });

    const text = await res.text();
    console.log('STATUS:' + res.status);
    console.log('RESPONSE:' + text);
}

testApi();
