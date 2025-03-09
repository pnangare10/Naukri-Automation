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
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { documentQA, callFunc } = require("./vectorSearch");

/**
 * Captures user configuration through CLI prompts.
 */
const getGeminiUserConfiguration = async (preferences) => {
  try {
    if (!preferences) preferences = {};

    const genAiConfig = preferences.genAiConfig || {};

    //Get the authenticaton type for gemini
    const authType = await prompts.select({
      type: "select",
      name: "value",
      message: "Select your authentication type:",
      choices: [
        { name: "API Key (Recommended)", value: "apiKey" },
        { name: "Service Account", value: "serviceAccount" },
      ],
      default: genAiConfig.authType || "apiKey",
    });

    console.log(authType);
    if (authType === "serviceAccount") {
      console.log(1);
      console.log(authType);
      // Ensure the apikeys folder exists
      const apikeysFolderPath = path.join(__dirname, "apikeys");
      //check if the file exists and create the file if it does not exist
      if (!fs.existsSync(apikeysFolderPath)) {
        fs.mkdirSync(apikeysFolderPath);
      }
      // Get the list of files in the folder
      let files = fs
        .readdirSync(apikeysFolderPath)
        .filter((file) => file.endsWith(".json"));

      console.log(2);
      // If the folder is empty, prompt the user to add key files
      while (files.length === 0) {
        console.log(3);
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

      preferences.genAiConfig = {
        authType,
        project,
        location,
        keyFile,
      };
    } else {
      openUrl(`https://aistudio.google.com/app/u/3/apikey`);
      const apiKey = await prompts.input({
        type: "text",
        name: "value",
        message: "Enter your Google API Key: ",
        default: genAiConfig.apiKey ?? "",
        validate: (input) =>
          input && input.length > 0 ? true : "API Key is required.",
      });
      preferences.genAiConfig = {
        authType,
        apiKey,
      };
    }

    const textModel = await prompts.select({
      name: "value",
      message: "Enter the text model (e.g., gemini-1.5-flash-002):",
      default: genAiConfig.textModel || "gemini-1.5-flash-002",
      choices: [
        { name: "gemini-2.0-flash-001", value: "gemini-2.0-flash-001" },
        { name: "gemini-1.5-flash-002", value: "gemini-1.5-flash-002" },
        { name: "gemini-1.5-flash-001", value: "gemini-1.5-flash-001" },
        { name: "gemini-1.5-pro-002", value: "gemini-1.5-pro-002" },
        { name: "gemini-1.5-pro-001", value: "gemini-1.5-pro-001" },
        { name: "gemini-1.0-pro-002", value: "gemini-1.0-pro-002" },
        { name: "gemini-1.0-pro-001", value: "gemini-1.0-pro-001" },
      ],
    });

    preferences.genAiConfig.textModel = textModel;
    try {
      console.log("Pinging gemini model ...");
      await initializeGeminiModel(preferences.genAiConfig);
      await pingModel();
      preferences.enableGenAi = true;
    } catch (e) {
      let choice = await prompts.select({
        message:
          "Would you like to do configuration again or disable Gen AI application?",
        choices: [
          { name: "Do configuration", value: "configure" },
          { name: "Disable Gen AI", value: "disable" },
        ],
      });
      if (choice === "configure") await getGeminiUserConfiguration(preferences);
      else preferences.enableGenAi = false;
    }

    return {
      config: preferences.genAiConfig,
      enableGenAi: preferences.enableGenAi,
    };
  } catch (e) {
    console.log(e);
    throw e;
  }
};

/**
 * Initializes the generative model instance.
 */
const initializeGeminiModel = async (config) => {
  if (config.authType == "serviceAccount") {
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
    return generativeModel;
  } else {
    const genAI = new GoogleGenerativeAI(config.apiKey);
    generativeModel = genAI.getGenerativeModel({ model: config.textModel });
    console.log("Generative model initialized successfully.");
    return generativeModel;
  }
};

/**
 * Returns the generative model instance.
 */
const getGeminiModel = async () => {
  try {
    if (!generativeModel) {
      const preferences = localStorage.getItem("preferences");
      if (preferences?.genAiConfig === undefined) {
        const { config, enableGenAi } = await getGeminiUserConfiguration(
          preferences
        );
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

const getModelResponse = async (prompt) => {
  const model = await getGeminiModel();
  if (model == null) return null;
  const preferences = localStorage.getItem("preferences");
  const genAiConfig = preferences.genAiConfig;

  if (!genAiConfig) {
    throw new Error("AI configuration not found in preferences.");
  }

  let answer;
  if (genAiConfig.authType === "serviceAccount") {
    const request = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    };
    const result = await model.generateContent(request);
    answer = result.response?.candidates?.[0]?.content?.parts?.[0]?.text;
  } else if (genAiConfig.authType === "apiKey") {
    const result = await model.generateContent(prompt);
    answer = result.response?.text();
  } else {
    throw new Error(`Unsupported authType: ${genAiConfig.authType}`);
  }

  if (!answer) {
    throw new Error("No answer generated by the model.");
  }
  return answer;
};
/**
 * Example function to check job suitability.
 */
const checkSuitability = async (job, profile) => {
  try {
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
  }
};

const answerQuestion = async (questions, profileDetails) => {
  try {
    debugger;
    const prompt = aiPrompts.answerPrompt(questions, profileDetails);
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
    console.error("Error while generating Assistant response:", e);
    return null;
  }
};

const pingModel = async (prompt) => {
  try {
    let response;
    const model = await getGeminiModel();
    if (model == null) return null;
    const result = await model.generateContent(prompt ?? "Hello How are you");
    console.log(result.response.text());
  } catch (e) {
    console.log("Error while generating Assistant response: ");
    console.log(e.message);
    throw e;
  }
};

// callFunc();

module.exports = {
  checkSuitability,
  answerQuestion,
  getGeminiUserConfiguration,
  initializeGeminiModel,
  getGeminiModel,
  pingModel
};
