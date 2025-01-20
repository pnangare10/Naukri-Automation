const {
  HarmBlockThreshold,
  HarmCategory,
  VertexAI,
} = require("@google-cloud/vertexai");
const { GoogleAuth } = require("google-auth-library");
const prompts = require("@inquirer/prompts");
const fs = require("fs");
const path = require("path");
const { localStorage } = require("./helper");
const aiPrompts = require("./prompts");
let generativeModel = null; // Global variable to store the instance

/**
 * Captures user configuration through CLI prompts.
 */
const getGeminiUserConfiguration = async (preferences) => {
  if (!preferences) preferences = {};

  const genAiConfig = preferences.genAiConfig || {};

  // Ensure the apikeys folder exists
  const apikeysFolderPath = path.join(__dirname, "apikeys");
  if (!fs.existsSync(apikeysFolderPath)) {
    console.log("The 'apiKeys' folder does not exist. Creating it...");
    fs.mkdirSync(apikeysFolderPath);
  }

  // Get the list of files in the folder
  let files = fs
    .readdirSync(apikeysFolderPath)
    .filter((file) => file.endsWith(".json"));

  // If the folder is empty, prompt the user to add key files
  while (files.length === 0) {
    console.log("No key files found in the 'apikeys' folder.");
    console.log(
      "Please add your Google Cloud service account key files (.json) to the 'apikeys' folder."
    );

    const confirmPrompt = await prompts.confirm({
      type: "confirm",
      name: "value",
      message: "Have you added the key file(s) to the folder?",
    });

    if (!confirmPrompt) {
      console.log("Operation canceled. Add the key files and try again.");
      return;
    }

    // Refresh the list of files after confirmation
    files = fs
      .readdirSync(apikeysFolderPath)
      .filter((file) => file.endsWith(".json"));
  }

  const keyFilePrompt = await prompts.select({
    type: "select",
    name: "value",
    message: "Select your Google Cloud service account key file:",
    choices: files.map((file) => ({ name: file, value: file })),
  });

  const keyFile = path.join(apikeysFolderPath, keyFilePrompt);

  let result = keyFilePrompt.split("-");
  result = result.slice(0, result.length - 1).join("-");
  const project = await prompts.input({
    type: "text",
    name: "value",
    message: "Enter your Google Cloud project ID:",
    default: genAiConfig.project || result,
    validate: (input) => (input ? true : "Project ID is required."),
  });

  const location = await prompts.input({
    type: "text",
    name: "value",
    message: "Enter your location (e.g., us-central1):",
    default: genAiConfig.location || "us-central1",
  });

  const textModel = await prompts.select({
    name: "value",
    message: "Enter the text model (e.g., gemini-1.5-flash-002):",
    default: genAiConfig.textModel || "gemini-1.5-flash-002",
    choices: [
      { name: "gemini-1.5-flash-002", value: "gemini-1.5-flash-002" },
      { name: "gemini-1.5-flash-001", value: "gemini-1.5-flash-001" },
      { name: "gemini-1.5-pro-002", value: "gemini-1.5-pro-002" },
      { name: "gemini-1.5-pro-001", value: "gemini-1.5-pro-001" },
      { name: "gemini-1.0-pro-002", value: "gemini-1.0-pro-002" },
      { name: "gemini-1.0-pro-001", value: "gemini-1.0-pro-001" },
    ],
  });

  preferences.genAiConfig = {
    project,
    location,
    textModel,
    keyFile,
  };

  return preferences.genAiConfig;
};

/**
 * Initializes the generative model instance.
 */
const initializeGeminiModel = async (config) => {
  const auth = new GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    keyFile: config.keyFile,
  });

  const vertexAI = new VertexAI({
    project: config.project,
    location: config.location,
    googleAuthOptions: auth,
  });

  generativeModel = vertexAI.getGenerativeModel({
    model: config.textModel,
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ],
    generationConfig: { maxOutputTokens: 2048 },
  });

  console.log("Generative model initialized successfully.");
  return generativeModel;
};

/**
 * Returns the generative model instance.
 */
const getGeminiModel = async () => {
  try {
    if (!generativeModel) {
      const preferences = localStorage.getItem("preferences");
      let config;
      if (preferences.genAiConfig === undefined) {
        config = await getGeminiUserConfiguration(preferences);
        preferences.genAiConfig = config;
        localStorage.setItem("preferences", preferences);
      }
      await initializeGeminiModel(config ?? preferences.genAiConfig);
    }
    return generativeModel;
  } catch (e) {
    console.log(e);
    return null;
  }
};

/**
 * Example function to check job suitability.
 */
const checkSuitability = async (job, profile) => {
  try {
    const model = getGeminiModel();
    if (model == null) return null;
    const prompt = aiPrompts.jobSuitabilityPrompt(profile.skills, job.description);
    let response;

    const request = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    };
    const result = await generativeModel.generateContent(request);
    response = result.response;
    let answer = response.candidates[0].content.parts[0].text;
    answer = "{" + answer.split("{")[1].split("}")[0] + "}";
    const answerObject = await JSON.parse(answer);
    if (answerObject.isSuitable == "no" || answerObject.isSuitable == "false")
      answerObject.isSuitable = false;
    if (answerObject.isSuitable == "yes" || answerObject.isSuitable == "true")
      answerObject.isSuitable = true;
    return answerObject;
  } catch (e) {
    console.log(
      "Error while generating content in checking suitability : " + e
    );
    console.log("Generated content is -> ");
    console.log(response.candidates[0].content.parts[0].text);
    throw e;
  }
};

const answerQuestion = async (questions, profileDetails) => {
  try {
    let response;
    const model = await getGeminiModel();
    if (model == null) return null;
    const prompt = aiPrompts.answerPrompt(questions, profileDetails);
    const request = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    };
    const result = await generativeModel.generateContent(request);
    response = result.response;
    let answer = response.candidates[0].content.parts[0].text;
    console.log(answer);
    answer = answer.split("```json")[1].split("```")[0];
    const answerObject = await JSON.parse(answer);
    // console.log(answerObject)
    // console.log([askedQuestion, answerOptions, answerObject]);
    return answerObject;
  } catch (e) {
    console.log("Error while generating Assistant response: " + e);
    console.log("The answer is -> ");
    console.log(response.candidates[0].content.parts[0].text);
    return;
  }
};

module.exports = {
  checkSuitability,
  answerQuestion,
  getGeminiUserConfiguration,
  initializeGeminiModel,
  getGeminiModel,
};
