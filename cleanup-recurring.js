// Run this script to delete all recurring transactions
// Usage: node cleanup-recurring.js

const admin = require('firebase-admin');

// You'll need to download your service account key from Firebase Console
// Go to: Project Settings > Service Accounts > Generate New Private Key
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function deleteAllRecurringTransactions() {
  try {
    console.log('Starting cleanup of recurring transactions...');

    const snapshot = await db.collection('transactions')
      .where('isRecurring', '==', true)
      .get();

    if (snapshot.empty) {
      console.log('No recurring transactions found.');
      return;
    }

    console.log(`Found ${snapshot.size} recurring transactions to delete.`);

    const batchSize = 500;
    let batch = db.batch();
    let count = 0;
    let totalDeleted = 0;

    for (const doc of snapshot.docs) {
      batch.delete(doc.ref);
      count++;
      totalDeleted++;

      if (count >= batchSize) {
        await batch.commit();
        console.log(`Deleted ${totalDeleted} transactions so far...`);
        batch = db.batch();
        count = 0;
      }
    }

    // Commit remaining batch
    if (count > 0) {
      await batch.commit();
    }

    console.log(`✅ Successfully deleted ${totalDeleted} recurring transactions!`);
    process.exit(0);
  } catch (error) {
    console.error('Error deleting recurring transactions:', error);
    process.exit(1);
  }
}

deleteAllRecurringTransactions();
