
const aiPrompts = require("./genAiPrompts");
const { searchSimilarChunks } = require("./embeddingUtils");
const { processDocumentEmbeddings } = require("./embeddingUtils");
const { getDataFromFile } = require("./ioUtils");

const spinner = require("./spinniesUtils");

const {
  getGeminiModel,
  getModelResponse,
} = require("../gemini");
let questionEmbeddings = null;

/**
 * Example function to check job suitability.
 */
const checkSuitability = async (job, profile) => {
  try {
    spinner.start();
    const prompt = aiPrompts.jobSuitabilityPrompt(
      profile.skills,
      job.description
    );
    let answer = await getModelResponse(prompt);
    const jsonData = answer?.includes("```json")
      ? answer.split("```json")[1]?.split("```")[0]?.trim()
      : answer;
    if (!jsonData) {
      throw new Error(
        `Failed to extract JSON data from the response: ${answer}`
      );
    }
    const data = JSON.parse(jsonData);
    if (data.isSuitable == "no" || data.isSuitable == "false")
      data.isSuitable = false;
    if (data.isSuitable == "yes" || data.isSuitable == "true")
      data.isSuitable = true;
    return data;
  } catch (e) {
    console.log(
      "Error while generating content in checking suitability : " + e
    );
    console.log("Generated content is -> ");
    console.log(response.candidates[0].content.parts[0].text);
    throw e;
  } finally {
    spinner.stop();
  }
};

const answerQuestion = async (questions, profileDetails) => {
  try {
    spinner.start("Generating answer...");
    if (questionEmbeddings == null) {
      const questionsData = await getDataFromFile("questions");
      if (questionsData && questionsData.length !== 0) {
        const questionsDataChunks = Object.values(questionsData).map(
          (question) => {
            return `Question: ${question.questionName}\nAnswer: ${question.answer}`;
          }
        );
        questionEmbeddings = await processDocumentEmbeddings(
          questionsDataChunks
        );
      }
    }
    let chunks = [];
    if (questions && questions.length !== 0 && questionEmbeddings !== null) {
      chunks = await Promise.all(
        questions.map(async (question) => {
          return searchSimilarChunks(question.question, questionEmbeddings);
        })
      );
    }

    const prompt = aiPrompts.answerPrompt(questions, profileDetails, chunks);
    let answer = await getModelResponse(prompt);
    const jsonData = answer?.includes("```json")
      ? answer.split("```json")[1]?.split("```")[0]?.trim()
      : answer;
    if (!jsonData) {
      throw new Error(
        `Failed to extract JSON data from the response: ${answer}`
      );
    }
    const data = JSON.parse(jsonData);
    return data;
  } catch (e) {
    console.error("Error while generating Assistant response:", e.message);
    return null;
  } finally {
    spinner.stop();
  }
};



module.exports = {
  checkSuitability,
  answerQuestion,
}