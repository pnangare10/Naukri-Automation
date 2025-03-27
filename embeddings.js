const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI("AIzaSyDBGs8hh0-GsQlyqxU7dCmxWfpEhfBomTA");

// Split document into chunks
const splitIntoChunks = (document, chunkSize = 100) => {
  let chunks = [];
  // for (let i = 0; i < document.length; i += chunkSize) {
  //   chunks.push(document.substring(i, i + chunkSize));
  // }
  // split document on the basis of ';'
  chunks = document.split(';');

  return chunks;
}

// Get embeddings for text
const getEmbeddings = async (text) => {
  try {
    const model = genAI.getGenerativeModel({ model: "embedding-001" });
    const result = await model.embedContent(text);
    
    if (!result) {
      console.error("embedContent returned undefined or null!");
      return null;
    }

    return result.embedding.values;
  } catch (error) {
    console.error("Error in getEmbeddings:", error.message);
    return null;
  }
}

// Process document and get embeddings
const processDocumentEmbeddings = async (documentChunks) => {
  const documentData = {
    chunks: [],
    embeddings: []
  };

  // Process all chunks in parallel and push results directly
  await Promise.all(
    documentChunks.map(chunk => 
      getEmbeddings(chunk)
        .then(embedding => {
          if (embedding) {
            documentData.chunks.push(chunk);
            documentData.embeddings.push(embedding);
          }
        })
        .catch(error => {
          console.error(`Error processing chunk: ${chunk.substring(0, 50)}...`, error.message);
        })
    )
  );

  return documentData;
}

getEmbeddings("How many years of experience do you have in Angular?");

module.exports = {
  processDocumentEmbeddings,
  getEmbeddings,
  splitIntoChunks
};

