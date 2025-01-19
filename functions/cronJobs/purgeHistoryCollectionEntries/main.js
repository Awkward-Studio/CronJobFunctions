import { Client, Databases } from 'node-appwrite';

export default async ({ req, res, log, error }) => {
  try {
    // Initialize the Appwrite client
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);

    // Extract database and collection IDs from environment variables
    const databaseId = process.env.APPWRITE_FUNCTION_DATABASE_ID;
    const collectionId = process.env.APPWRITE_FUNCTION_COLLECTION_ID;

    if (!databaseId || !collectionId) {
      throw new Error(
        'Missing database or collection ID in environment variables.'
      );
    }

    // Get the current date and calculate one week ago
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Query for documents older than a week
    const query = [`$createdAt<=${oneWeekAgo.toISOString()}`];
    const documents = await databases.listDocuments(
      databaseId,
      collectionId,
      query
    );

    if (documents.total === 0) {
      return res.json({
        message: 'No documents older than a week were found.',
      });
    }

    // Delete each document
    for (const document of documents.documents) {
      await databases.deleteDocument(databaseId, collectionId, document.$id);
      log(`Deleted document with ID: ${document.$id}`);
    }

    return res.json({
      message: `${documents.total} document(s) deleted successfully.`,
    });
  } catch (err) {
    error(err.message);
    return res.json(
      {
        error: 'An error occurred while cleaning up old documents.',
        details: err.message,
      },
      500
    );
  }
};
