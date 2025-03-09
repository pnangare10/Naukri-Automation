import { GoogleGenerativeAI } from "@google/generative-ai";
import { getEmbeddings } from "./embeddings.js";

const genAI = new GoogleGenerativeAI("AIzaSyDBGs8hh0-GsQlyqxU7dCmxWfpEhfBomTA");
const generativeModel = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-001",
});

// Calculate cosine similarity
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
  }
  return dotProduct;
}

// Search relevant chunks from provided embeddings
export async function searchSimilarChunks(query, documentData, topK = 3) {
  const { chunks, embeddings } = documentData;
  const queryEmbedding = await getEmbeddings(query);

  const similarities = embeddings.map((chunkEmbedding) =>
    cosineSimilarity(queryEmbedding, chunkEmbedding)
  );

  const sortedIndices = similarities
    .map((val, idx) => ({ val, idx }))
    .sort((a, b) => b.val - a.val)
    .map(({ idx }) => idx);

  return sortedIndices.slice(0, topK).map((idx) => chunks[idx]);
}

// Generate answer using Gemini
export async function generateAnswer(question, contextChunks) {
  const prompt = `Context:
    ${contextChunks.join("\n\n")}
    Question: ${question}
    Answer the question using the provided context. If the answer isn't in the context, say "I don't know". Answer:`;

  const result = await generativeModel.generateContent(prompt);
  return result.response.text();
}

// Main QA function
export async function documentQA(documentData, question) {
  const relevantChunks = await searchSimilarChunks(question, documentData);
  return await generateAnswer(question, relevantChunks);
}