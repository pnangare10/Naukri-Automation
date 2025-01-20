const {
  HarmBlockThreshold,
  HarmCategory,
  VertexAI,
} = require("@google-cloud/vertexai");
const { GoogleAuth } = require("google-auth-library");
const prompts = require("@inquirer/prompts");
const fs = require("fs");
const path = require("path");
const { localStorage, openFolder, openUrl } = require("./helper");
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
    console.log("Let me guide you step by step.");
    console.log(`1. Log In: Go to Google Cloud Console and log in.
2. Navigate to IAM & Admin: From the left-hand menu, go to IAM & Admin > Service Accounts.
3. Select Service Account: Find and click on the service account for which you need the key.
4. Manage Keys: Under the "Keys" section, click Add Key > Create new key.
5. Choose Key Type: Select the JSON option and click Create.
6. Copy the Key: Copy and paste the JSON key file into the "apikeys" folder.`);
    openUrl(
      `https://console.cloud.google.com/iam-admin/serviceaccounts/create`
    );
    let confirmPrompt = await prompts.confirm({
      type: "confirm",
      name: "value",
      message: "Were you able to download the api key file?",
      default: true,
    });

    console.log("7. Paste api key file in apikeys folder");
    if (!fs.existsSync(apikeysFolderPath)) {
      console.log("The 'apiKeys' folder does not exist. Creating it...");
      fs.mkdirSync(apikeysFolderPath);
    }
    await openFolder(apikeysFolderPath);
    confirmPrompt = await prompts.confirm({
      type: "confirm",
      name: "value",
      message: "Have you added the key file(s) to the folder?",
      default: true,
    });

    console.log(`8. Enable Vertex AI API from API's and Services Section.`);
    openUrl(
      `https://console.cloud.google.com/apis/library/aiplatform.googleapis.com`
    );
    confirmPrompt = await prompts.confirm({
      type: "confirm",
      name: "value",
      message: "Were you able to enable the Vertext AI API?",
      default: true,
    });

    console.log(`9. Enable Gemini API from API's and Services Section.`);
    openUrl(
      `https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com`
    );
    confirmPrompt = await prompts.confirm({
      type: "confirm",
      name: "value",
      message: "Were you able to enable the Gemini API?",
      default: true,
    });

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
  try {
    console.log("Pinging gemini model ...");
    await initializeGeminiModel(preferences.genAiConfig);
    await pingModel();
    preferences.enableGenAi = true;
  } catch (e) {
    let choice = await prompts.select({
      message: "Would you like to do configuration again or disable Gen AI application?",
      choices: [{name: "Do configuration", value: "configure"}, {name: "Disable Gen AI", value: "disable"}]
    });
    if(choice === "configure") await getGeminiUserConfiguration(preferences);
    else preferences.enableGenAi = false;
  }

  return {config:preferences.genAiConfig, enableGenAi: preferences.enableGenAi};
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
      if (preferences.genAiConfig === undefined) {
        const {config, enableGenAi} = await getGeminiUserConfiguration(preferences);
        preferences.genAiConfig = config;
        preferences.enableGenAi = enableGenAi;
        localStorage.setItem("preferences", preferences);
        writeToFile(preferences, "preferences");
      }
      await initializeGeminiModel(preferences.genAiConfig);
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
    const prompt = aiPrompts.jobSuitabilityPrompt(
      profile.skills,
      job.description
    );
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

const pingModel = async () => {
  try {
    let response;
    const model = await getGeminiModel();
    if (model == null) return null;
    const request = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: "You are a Job search assistant, Greet the user with your name",
            },
          ],
        },
      ],
    };
    const result = await generativeModel.generateContent(request);
    response = result.response;
    let answer = response.candidates[0].content.parts[0].text;
    console.log(answer);
  } catch (e) {
    console.log("Error while generating Assistant response: ");
    console.log(e);
    throw e;
  }
};

module.exports = {
  checkSuitability,
  answerQuestion,
  getGeminiUserConfiguration,
  initializeGeminiModel,
  getGeminiModel,
};
