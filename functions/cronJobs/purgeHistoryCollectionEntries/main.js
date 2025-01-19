import { Client, Databases, Query } from 'node-appwrite';

export default async ({ req, res, log, error }) => {
  log('Function execution started.');

  try {
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    log('Appwrite client initialized.');

    const databases = new Databases(client);
    const databaseId = process.env.APPWRITE_FUNCTION_DATABASE_ID;
    const collectionId = process.env.APPWRITE_FUNCTION_COLLECTION_ID;

    if (!databaseId || !collectionId) {
      log('Missing environment variables.');
      throw new Error('Database ID or Collection ID is missing.');
    }

    log(`Database ID: ${databaseId}, Collection ID: ${collectionId}`);

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    log(`Deleting documents older than: ${oneWeekAgo.toISOString()}`);

    const query = [
      Query.lessThanOrEqual('$createdAt', oneWeekAgo.toISOString()),
    ];
    log(`Query: ${JSON.stringify(query)}`);

    const documents = await databases.listDocuments(
      databaseId,
      collectionId,
      query
    );

    log(`Documents fetched: ${documents.total}`);

    if (documents.total === 0) {
      log('No documents found to delete.');
      return res.json({ message: 'No documents older than a week found.' });
    }

    for (const document of documents.documents) {
      await databases.deleteDocument(databaseId, collectionId, document.$id);
      log(`Deleted document with ID: ${document.$id}`);
    }

    log('All matching documents deleted successfully.');
    return res.json({ message: `${documents.total} document(s) deleted.` });
  } catch (err) {
    error('Error occurred during function execution:', err.message);
    log(`Error details: ${err.stack}`);
    return res.json({ error: err.message }, 500);
  }
};
