import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("AIzaSyDBGs8hh0-GsQlyqxU7dCmxWfpEhfBomTA");

// Split document into chunks
export function splitIntoChunks(document, chunkSize = 100) {
  const chunks = [];
  for (let i = 0; i < document.length; i += chunkSize) {
    chunks.push(document.substring(i, i + chunkSize));
  }
  return chunks;
}

// Get embeddings for text
export async function getEmbeddings(text) {
  const model = genAI.getGenerativeModel({ model: "embedding-001" });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

// Process document and get embeddings
export async function processDocumentEmbeddings(document, chunkSize = 100) {
  const chunks = splitIntoChunks(document, chunkSize);
  const documentData = {
    chunks: [],
    embeddings: []
  };

  for (const chunk of chunks) {
    const embedding = await getEmbeddings(chunk);
    documentData.chunks.push(chunk);
    documentData.embeddings.push(embedding);
  }

  return documentData;
} 