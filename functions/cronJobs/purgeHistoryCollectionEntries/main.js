import { Client, Databases, Query } from 'node-appwrite';

export default async ({ req, res, log, error }) => {
  try {
    log('Function execution started.');

    const client = new Client()
      .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);

    const databaseId = process.env.APPWRITE_FUNCTION_DATABASE_ID;
    const collectionId = process.env.APPWRITE_FUNCTION_COLLECTION_ID;

    if (!databaseId || !collectionId) {
      throw new Error('Database ID or Collection ID is missing.');
    }

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    log(`Deleting documents older than: ${oneWeekAgo.toISOString()}`);

    let totalDeleted = 0;

    // Loop to fetch and delete documents in batches
    while (true) {
      // Fetch a batch of documents
      const documents = await databases.listDocuments(
        databaseId,
        collectionId,
        [
          Query.lessThanOrEqual('$createdAt', oneWeekAgo.toISOString()),
          Query.limit(100), // Appwrite's maximum limit per request
        ]
      );

      if (documents.total === 0) {
        log('No more documents to delete.');
        break; // Exit the loop when no more documents are found
      }

      log(`Fetched ${documents.documents.length} documents for deletion.`);

      // Delete each document in the batch
      for (const document of documents.documents) {
        await databases.deleteDocument(databaseId, collectionId, document.$id);
        log(`Deleted document with ID: ${document.$id}`);
        totalDeleted++;
      }
    }

    log(
      `All matching documents deleted successfully. Total deleted: ${totalDeleted}`
    );
    return res.json({
      message: `${totalDeleted} document(s) deleted successfully.`,
    });
  } catch (err) {
    error(err.message);
    return res.json({ error: err.message }, 500);
  }
};
