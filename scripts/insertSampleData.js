const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017/nazar-analytics';
const dbName = 'nazar-analytics';
const collectionName = 'processed_files';

// Sample MAC addresses for different clients
const sampleMacAddresses = [
  '00:14:22:01:23:45',
  '00:15:5D:FF:FF:FF',
  '08:00:27:12:34:56',
  '52:54:00:12:34:56',
  '02:42:AC:11:00:02',
  '00:0C:29:AB:CD:EF'
];

// Sample file types and categories
const fileTypes = ['document', 'image', 'video', 'audio', 'code', 'archive', 'other'];
const categories = ['document', 'media', 'code', 'archive', 'other'];
const changeTypes = ['add', 'change', 'unlink', 'addDir', 'unlinkDir'];
const extensions = ['.txt', '.jpg', '.mp4', '.mp3', '.js', '.zip', '.pdf', '.png', '.ts', '.doc'];

// Function to generate random sample data
function generateSampleDocument(macAddress, timestamp) {
  const fileType = fileTypes[Math.floor(Math.random() * fileTypes.length)];
  const extension = extensions[Math.floor(Math.random() * extensions.length)];
  const changeType = changeTypes[Math.floor(Math.random() * changeTypes.length)];
  const fileName = `sample_file_${Math.random().toString(36).substring(7)}${extension}`;
  const directory = `/home/user${Math.floor(Math.random() * 5)}/documents`;
  
  let category;
  switch(fileType) {
    case 'image':
    case 'video':
    case 'audio':
      category = 'media';
      break;
    default:
      category = fileType === 'other' ? 'other' : fileType;
  }

  return {
    filePath: `${directory}/${fileName}`,
    fileName: fileName,
    fileExtension: extension,
    directory: directory,
    fileType: fileType,
    category: category,
    changeType: changeType,
    timestamp: timestamp,
    size: Math.floor(Math.random() * 1000000) + 1000, // 1KB to 1MB
    isDirectory: changeType === 'addDir' || changeType === 'unlinkDir',
    clientMacAddress: macAddress,
    createdAt: new Date(timestamp),
    updatedAt: new Date(timestamp)
  };
}

async function insertSampleData() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    
    // Clear existing data
    await collection.deleteMany({});
    console.log('Cleared existing data');
    
    const sampleDocuments = [];
    const now = Date.now();
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
    
    // Generate sample data for the last 7 days
    for (let i = 0; i < 500; i++) {
      const randomMac = sampleMacAddresses[Math.floor(Math.random() * sampleMacAddresses.length)];
      const randomTimestamp = sevenDaysAgo + Math.random() * (now - sevenDaysAgo);
      
      sampleDocuments.push(generateSampleDocument(randomMac, randomTimestamp));
    }
    
    // Insert the sample documents
    const result = await collection.insertMany(sampleDocuments);
    console.log(`Inserted ${result.insertedCount} sample documents`);
    
    // Print summary
    const clientCounts = await collection.aggregate([
      {
        $group: {
          _id: '$clientMacAddress',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]).toArray();
    
    console.log('\nSample data summary by client:');
    clientCounts.forEach(client => {
      console.log(`  ${client._id}: ${client.count} events`);
    });
    
    console.log('\nSample data inserted successfully!');
    console.log('You can now test the routes:');
    console.log('- GET /api/dashboard/analytics');
    console.log('- GET /api/dashboard/clients');
    console.log('- GET /api/dashboard/analytics?clientMacAddress=00:14:22:01:23:45');
    console.log('- GET /api/dashboard/clients/00:14:22:01:23:45');
    
  } catch (error) {
    console.error('Error inserting sample data:', error);
  } finally {
    await client.close();
  }
}

// Run the script
insertSampleData().catch(console.error);