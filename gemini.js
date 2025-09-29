const {
  HarmBlockThreshold,
  HarmCategory,
  VertexAI,
} = require("@google-cloud/vertexai");
const { GoogleAuth } = require("google-auth-library");
const prompts = require("@inquirer/prompts");
const fs = require("fs");
const path = require("path");
const { localStorage } = require("./utils/helper");
const { openFolder, openUrl } = require("./utils/cmdUtils");
const aiPrompts = require("./utils/genAiPrompts");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { getDataFromFile } = require("./utils/ioUtils");
const {
  textModelMenu,
  keyFileMenu,
  getConfirmation,
} = require("./utils/prompts");
const spinner = require("./utils/spinniesUtils");

let generativeModel = null;
let questionEmbeddings = null;
/**
 * Captures user configuration through CLI prompts.
 */
const getGeminiUserConfiguration = async (preferences) => {
  try {
    if (!preferences) preferences = {};

    const genAiConfig = preferences.genAiConfig || {};

    //Get the authenticaton type for gemini
    // const authType = await selectAuthTypeMenu();
    let authType = "apiKey";
    if (authType === "serviceAccount") {
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
        let confirmPrompt = await getConfirmation(
          "Were you able to download the api key file?"
        );

        console.log("7. Paste api key file in apikeys folder");
        if (!fs.existsSync(apikeysFolderPath)) {
          console.log("The 'apiKeys' folder does not exist. Creating it...");
          fs.mkdirSync(apikeysFolderPath);
        }
        await openFolder(apikeysFolderPath);
        confirmPrompt = await getConfirmation(
          "Have you added the key file(s) to the folder?"
        );

        console.log(`8. Enable Vertex AI API from API's and Services Section.`);
        openUrl(
          `https://console.cloud.google.com/apis/library/aiplatform.googleapis.com`
        );
        confirmPrompt = await getConfirmation(
          "Were you able to enable the Vertext AI API?"
        );

        console.log(`9. Enable Gemini API from API's and Services Section.`);
        openUrl(
          `https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com`
        );
        confirmPrompt = await getConfirmation(
          "Were you able to enable the Gemini API?"
        );

        // Refresh the list of files after confirmation
        files = fs
          .readdirSync(apikeysFolderPath)
          .filter((file) => file.endsWith(".json"));
      }

      const keyFilePrompt = await keyFileMenu(files);

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
      let apiKey = genAiConfig.apiKey;
      let choice = "yes";
      if (genAiConfig.apiKey) {
        choice = await getConfirmation(
          `Do you want to use the existing api key? (Current api key: ${genAiConfig.apiKey})`
        );
        if (choice) {
          apiKey = genAiConfig.apiKey;
        }
      }
      if (!genAiConfig.apiKey || choice === false) {
        console.log(
          "Please get the api key from https://aistudio.google.com/app/u/3/apikey and press enter to continue"
        );
        console.log(
          "Click on create api key button and copy the api key and paste it below, You can paste using ctrl+v or right click and paste."
        );

        await prompts.input({
          message:
            "Press enter to continue, This will open the api key creation page.",
        });

        openUrl(`https://aistudio.google.com/app/u/3/apikey`);
        apiKey = await prompts.input({
          type: "text",
          name: "value",
          message: "Enter your Google API Key: ",
          default: genAiConfig.apiKey ?? "",
          validate: (input) =>
            input && input.length > 0 ? true : "API Key is required.",
        });
      }

      preferences.genAiConfig = {
        authType,
        apiKey,
      };
    }

    const textModel = await textModelMenu(genAiConfig.textModel);

    preferences.genAiConfig.textModel = textModel;
    try {
      await initializeGeminiModel(preferences.genAiConfig);
      await pingModel();
      preferences.enableGenAi = true;
    } catch (e) {
      let choice = await getConfirmation(
        "Would you like to do configuration again? (Select no to disable Gen AI application)"
      );
      if (choice) await getGeminiUserConfiguration(preferences);
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
    spinner.update("Model initialized successfully");
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
  try {
    spinner.start("Getting model response...");
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
    spinner.stop();
    return answer;
  } catch (e) {
    debugger;
    spinner.fail(`this is the error ${e.message}\n\n\n`);
    throw e;
  } finally {
    spinner.stop();
  }
};
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
        const { processDocumentEmbeddings } = require("./embeddings");

        questionEmbeddings = await processDocumentEmbeddings(
          questionsDataChunks
        );
      }
    }
    let chunks = [];
    if (questions && questions.length !== 0 && questionEmbeddings !== null) {
      const searchSimilarChunks = require("./vectorSearch");
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

const pingModel = async (prompt) => {
  try {
    spinner.start("Pinging model...");
    const model = await getGeminiModel();
    if (model == null) return null;
    const result = await model.generateContent(prompt ?? "Hello How are you");
    spinner.succeed("Model pinged successfully");
  } catch (e) {
    spinner.fail(`Error while pinging model: ${e.message}`);
    throw e;
  }
};

module.exports = {
  checkSuitability,
  answerQuestion,
  getGeminiUserConfiguration,
  initializeGeminiModel,
  getGeminiModel,
  pingModel,
  getModelResponse,
};
