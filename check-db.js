const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkColumn() {
    const { data, error } = await supabase
        .from('lor_users')
        .select('last_downloaded_at')
        .limit(1);

    if (error) {
        if (error.code === '42703') {
            console.log('COLUMN_MISSING: The last_downloaded_at column does not exist in lor_users table.');
        } else {
            console.log('SUPABASE_ERROR:', error.message);
        }
    } else {
        console.log('COLUMN_EXISTS: The last_downloaded_at column exists.');
    }
}

checkColumn();
