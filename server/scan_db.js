const { MongoClient } = require('mongodb');
const uri = 'mongodb://root:Ayush1994*@169.58.12.127:27017/scholar_hub?authSource=admin&directConnection=true';

(async () => {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('scholar_hub');

  // Search all collections for the email
  const collections = await db.listCollections().toArray();
  console.log('=== Searching Coolify DB collections for "ayushsood965@gmail.com" ===');
  
  for (const col of collections) {
    const name = col.name;
    // We will do a text/regex search on all fields
    const items = await db.collection(name).find({
      $or: [
        { email: /ayushsood965@gmail.com/i },
        { username: /ayushsood965@gmail.com/i },
        { to: /ayushsood965@gmail.com/i },
        { recipient: /ayushsood965@gmail.com/i }
      ]
    }).toArray();
    
    if (items.length > 0) {
      console.log(`\nFound in collection [${name}]:`, JSON.stringify(items, null, 2));
    }
  }
  
  console.log('\nSearch completed.');
  await client.close();
})().catch(e => { console.error('❌', e.message); process.exit(1); });
