import fs from 'fs';
import path from 'path';

// Use an absolute path so both Next.js and Worker write to the EXACT SAME file!
const DB_PATH = '/home/adarsh_us/campus-hackthon/modules/lost-and-found/data/db.json';

if (!fs.existsSync(path.dirname(DB_PATH))) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}
if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({
        lost_found_items: [],
        lost_found_matches: [],
        lost_found_claims: [],
        lost_found_contact_reveals: [],
        lost_found_item_events: [],
    }, null, 2));
}

export const readDb = () => {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
};

export const writeDb = (data: any) => {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
};
