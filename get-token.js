const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read .env manually to avoid dependency on dotenv for a quick script
const env = fs.readFileSync('.env', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();

const supabase = createClient(url, key);

async function getToken() {
    const { data, error } = await supabase.from('lor_users').select('token').limit(1).single();
    if (data) console.log('TOKEN:' + data.token);
    else console.log('ERROR:' + error.message);
}

getToken();
