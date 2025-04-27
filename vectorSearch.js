const { GoogleGenerativeAI } = require("@google/generative-ai");
const { getEmbeddings } = require("./embeddings.js");
const {getModelResponse} = require("./gemini.js");

const genAI = new GoogleGenerativeAI("AIzaSyDBGs8hh0-GsQlyqxU7dCmxWfpEhfBomTA");
const generativeModel = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-001",
});

// Calculate cosine similarity
const cosineSimilarity = (vecA, vecB) => {
  let dotProduct = 0;  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
  }
  return dotProduct;
}

// Search relevant chunks from provided embeddings
const searchSimilarChunks = async (query, documentData, topK = 3) => {
  try {
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
  } catch (error) {
    console.error(error.message);
    return [];
  }
}

// Generate answer using Gemini
const generateAnswer = async (question, contextChunks) => {
  const prompt = `Context:
    ${contextChunks.join("\n\n")}
    Question: ${question}
    Answer the question using the provided context. If the answer isn't in the context, say "I don't know". Answer:`;
  const result = await getModelResponse(prompt);
  return result.response.text();
}

// Main QA function
const documentQA = async (documentData, question) => {
  const relevantChunks = await searchSimilarChunks(question, documentData);
  return await generateAnswer(question, relevantChunks);
}

const test = async () => {
  const strArr = ["Full Stack, spring boot, javascript",
    "java, spring boot, hibernate framework, microservices",
    "Java, React.Js, Core java, springboot, microservices",
    "software, development, hibernate, oracle, database, j2ee, agile, rest, oracle, web services, version control, jsp, svn, javascript, application development, sql, spring, spring boot, java, git, debugging, code review, html, mysql, technical documentation",
    "project management, sap, lsmw, rollout, team handling, sap sderp implementation, sap support, functional consultancy, sap mm module, idocs, sap mm implementation, end to end implementation, procurement, sap mm, sap abap, sap hana, abap, communication skills"
      ];

  const str = "Full Stack Engineering Senior Analyst, spring boot, javascript, angular, spring, react.js, full stack, jquery, node.js, ui development, project management, web development, jsp servlets, software development, api integration, web designing, generative ai";
  const embedding = await getEmbeddings(str.split(", ").sort().join(", "));
  for (const str of strArr) {
    //convert str to array of strings
    const strArr = str.split(", ");
    // sort the array in ascending order alphabetically
    strArr.sort();
    const embedding2 = await getEmbeddings(strArr.join(", "));
    const similarity = cosineSimilarity(embedding, embedding2);
    console.log(similarity);
  }
}

// test();

module.exports = { documentQA,
  searchSimilarChunks,
  generateAnswer,
  getEmbeddings,
  cosineSimilarity,
 };