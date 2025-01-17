const {
  FunctionDeclarationSchemaType,
  HarmBlockThreshold,
  HarmCategory,
  VertexAI,
} = require("@google-cloud/vertexai");
const { GoogleAuth, GoogleAuthOptions } = require("google-auth-library");
const prompts = require("@inquirer/prompts");
const fs = require("fs");
const path = require("path");
const { localStorage } = require("./helper");
let generativeModel = null; // Global variable to store the instance

/**
 * Captures user configuration through CLI prompts.
 */
const getGeminiUserConfiguration = async (preferences) => {
  // Get existing preferences
  if (!preferences) preferences = {};

  const genAiConfig = preferences.genAiConfig || {};

  // Ensure the apikeys folder exists
  const apikeysFolderPath = path.join(__dirname, "apiKeys");
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
    console.log("No key files found in the 'apiKeys' folder.");
    console.log(
      "Please add your Google Cloud service account key files (.json) to the 'apiKeys' folder."
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

  // Present files as choices to the user
  const keyFilePrompt = await prompts.select({
    type: "select",
    name: "value",
    message: "Select your Google Cloud service account key file:",
    choices: files.map((file) => ({ name: file, value: file })),
  });

  const keyFile = path.join(apikeysFolderPath, keyFilePrompt);

  // Extract default project ID from key file name
  let result = keyFilePrompt.split("-");
  result = result.slice(0, result.length - 1).join("-");
  // debugger;
  console.log(result);
  // Prompt for configuration details
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

  const textModel = await prompts.input({
    type: "text",
    name: "value",
    message: "Enter the text model (e.g., gemini-1.0-pro):",
    default: genAiConfig.textModel || "gemini-1.0-pro",
  });

  // Update preferences
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
    generationConfig: { maxOutputTokens: 256 },
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
      preferences = localStorage.getItem("preferences");
      let config;
      if (preferences.genAiConfig == undefined) {
        config = await getGeminiUserConfiguration(preferences);
        preferences.genAiConfig = config;
        localStorage.setItem("preferences", preferences);
      }
      await initializeGeminiModel(config ?? preferences.genAiConfig);

      const request = {
        contents: [{ role: "user", parts: [{ text: "Hello How are you" }] }],
      };
      const result = await generativeModel.generateContent(request);
      console.log(result);
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
    const prompt = `I'm seeking your assistance in my job application process. I'll provide you with my skills and experience, and your task is to analyze job descriptions to determine their relevance to my skillset. Based on the provided job description, please classify whether the job is suitable for me. If you believe it aligns with my skills, return "yes"; otherwise, return "no".

  My Skills: ${JSON.stringify(profile.skills)}
  
  Job Description: ${JSON.stringify(job.description)}
  
  Your analysis should focus on identifying the primary skill emphasized in the job description and assessing my suitability for that skill.Your response should be strictly in JSON object value that can be parsed directly in JavaScript using JSON.parse. 
  Your output will be parsed and type-checked. Make sure that there are no trailing commas!
  do not include any new line characters. Your response should be plain text in one line without any json formatting. Do not include any text and commas before and after the brackets The JSON object should be in the format: : 
  {
    "isSuitable" : "true",
    "comments" : "Job description mentions React as a skill which you have mentioned in your skill"
  }
`;
    let response;

    const request = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    };
    const result = await generativeModel.generateContent(request);
    response = result.response;
    let answer = response.candidates[0].content.parts[0].text;
    // console.log(answer);
    answer = "{" + answer.split("{")[1].split("}")[0] + "}";
    const answerObject = await JSON.parse(answer);
    // console.log(answerObject)
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

const generatePrompt = (profile, askedQuestion, answerOptions = {}) => {
  const hasOptions = Object.keys(answerOptions).length > 0;

  return `I want you to be my job search assistant. I am applying for a job. The recruiter has asked me a question. ${
    hasOptions
      ? "If the question has options, return the most suitable option based on my details provided below."
      : "If options are not provided, respond with a one or two-word answer."
  }
  ---------------------------------------------
  
  My Details:
  ${JSON.stringify(profile)}
  
  -------------------------------------------------
  
  Mention the experience as '0' for the skills which are not mentioned in the skills list.
  If you are not sure about the question or you do not have enough information, respond with 'NA'. Do not answer the question unless you are 100% sure. Do not consider anything on your own. Use the details mentioned above to answer.
  Your response should be strictly in JSON object value that can be parsed directly in JavaScript using JSON.parse. 
  Your output will be parsed and type-checked. Make sure that there are no trailing commas!
  do not include any new line characters. Your response should be plain text in one line without any json formatting. Do not use \% symbol in confidence field value. Do not include any text and commas before and after the brackets The JSON object should be in the format:
  {"question": "What is your notice period?","answer": ${
    hasOptions ? '["2 Months"]' : '"2 Months"'
  }, "confidence": "80%","comments": "Your notice period is 2 months based on the details provided."}
  
  The "answer" field in the response object should be ${
    hasOptions
      ? "an array if options are provided."
      : "a string if options are not provided."
  }
  
  For example:
  ${
    hasOptions
      ? `If options are provided: { "answer": ["2 Months"], ...remaining fields }`
      : `If options are not provided: { "answer": "2 Months", ...remaining fields }`
  }
  
  Here is the question asked by the recruiter: "${askedQuestion}"
  ${
    hasOptions
      ? `Here are the options from which you have to select the most suitable option: "${JSON.stringify(
          answerOptions
        )}". Your answer field should be an array. Answer should be in [""] format.`
      : `Options are not provided, answer with a one or two-word response.`
  }
  `;
};

const generatePrompt2 = (profile, askedQuestion) => {
  const hasOptions = Object.keys(answerOptions).length > 0;

  return `I want you to be my job search assistant. I am applying for a job. The recruiter has asked me a question. ${
    hasOptions
      ? "If the question has options, return the most suitable option based on my details provided below."
      : "If options are not provided, respond with a one or two-word answer."
  }
  ---------------------------------------------
  
  My Details:
  ${JSON.stringify(profile)}
  
  -------------------------------------------------
  
  Mention the experience as '0' for the skills which are not mentioned in the skills list.
  If you are not sure about the question or you do not have enough information, respond with 'NA'. Do not answer the question unless you are 100% sure. Do not consider anything on your own. Use the details mentioned above to answer.
  Your response should be strictly in JSON object value that can be parsed directly in JavaScript using JSON.parse. 
  Your output will be parsed and type-checked. Make sure that there are no trailing commas!
  do not include any new line characters. Your response should be plain text in one line without any json formatting. Do not use \% symbol in confidence field value. Do not include any text and commas before and after the brackets The JSON object should be in the format:
  {"question": "What is your notice period?","answer": ${
    hasOptions ? '["2 Months"]' : '"2 Months"'
  }, "confidence": "80%","comments": "Your notice period is 2 months based on the details provided."}
  
  The "answer" field in the response object should be ${
    hasOptions
      ? "an array if options are provided."
      : "a string if options are not provided."
  }
  
  For example:
  ${
    hasOptions
      ? `If options are provided: { "answer": ["2 Months"], ...remaining fields }`
      : `If options are not provided: { "answer": "2 Months", ...remaining fields }`
  }
  
  Here is the question asked by the recruiter: "${askedQuestion}"
  ${
    hasOptions
      ? `Here are the options from which you have to select the most suitable option: "${JSON.stringify(
          answerOptions
        )}". Your answer field should be an array. Answer should be in [""] format.`
      : `Options are not provided, answer with a one or two-word response.`
  }
  `;
};

const answerQuestion = async (
  askedQuestion = question,
  answerOptions = options,
  profile
) => {
  // const prompt = `I want you to be my job search assistant. I am applying for a job. The recruiter has asked me a question. If the question has options, return the most suitable option based on my details provided below.

  // ---------------------------------------------

  // My Details:
  // ${JSON.stringify(profile)}

  // -------------------------------------------------

  // Mention the experience as '0' for the skills which are not mentioned in the skills list.
  // If you are not sure about the question or you do not have enough information, respond with 'NA'. Do not answer the question unless you are 100% sure. Do not consider anything on your own. Use the details mentioned above to answer.
  // Your response should be strictly in JSON object value that can be parsed directly in JavaScript using JSON.parse.
  // Your output will be parsed and type-checked. Make sure that there are no trailing commas!
  // do not include any new line characters. Your response should be plain text in one line without any json formatting. Do not use \% symbol in confidence field value. Do not include any text and commas before and after the brackets The JSON object should be in the format:
  // {"question": "What is your notice period?","answer": ["2 Months"],"confidence": "80%","comments": "Your notice period is 2 months based on the details provided."}

  // The "answer" field in the response object should be an array if options are provided. If options are not provided, it should be a string.

  // For example:
  // If options are provided: { "answer": ["2 Months"], ...remaining fields }
  // If options are not provided: { "answer": "2 Months", ...remaining fields }

  // Here is the question asked by the recruiter: "${askedQuestion}"
  // ${
  //   Object.keys(answerOptions).length
  //     ? `Here are the options from which you have to select the most suitable option: "${answerOptions}". Your answer field should be an array. Answer should be in [""] format.`
  //     : `Options are not provided, answer with a one or two-word response.`
  // }
  // `;
  let response;
  const prompt = generatePrompt(profile, askedQuestion, answerOptions);
  try {
    const request = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    };
    const result = await generativeModel.generateContent(request);
    response = result.response;
    let answer = response.candidates[0].content.parts[0].text;
    // console.log(answer)
    answer = "{" + answer.split("{")[1].split("}")[0] + "}";
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

const answerQuestion2 = async (questionsToBeAnswered = question, profile) => {
  const model = await getGeminiModel();
  if (model == null) return null;
  const prompt = `I want you to be my job search assistant. I am applying for a job. The recruiter has asked me a question. If the question has options, return the most suitable option based on my details provided below. 

  ---------------------------------------------
  
  My Details:
  ${JSON.stringify(profile)}
  
  -------------------------------------------------
  
  Mention the experience as '0' for the skills which are not mentioned in the skills list.
  If you are not sure about the question or you do not have enough information, respond with 'NA'. Do not answer the question unless you are 100% sure. Do not consider anything on your own. Use the details mentioned above to answer.
  Your response should be strictly in JSON object value that can be parsed directly in JavaScript using JSON.parse. 
  Your output will be parsed and type-checked. Make sure that there are no trailing commas!
  do not include any new line characters. Your response should be plain text in one line without any json formatting. Do not use \% symbol in confidence field value. Do not include any text and commas before and after the brackets The JSON object should be in the format:
  {"question": "What is your notice period?","answer": ["2 Months"],"confidence": "80%","comments": "Your notice period is 2 months based on the details provided."}
  
  The "answer" field in the response object should be an array if options are provided. If options are not provided, it should be a string.
  
  For example:
  If options are provided: { "answer": ["2 Months"], ...remaining fields }
  If options are not provided: { "answer": "2 Months", ...remaining fields }
  
  Here are the questions asked by the recruiter: "${JSON.stringify(
    questionsToBeAnswered
  )}"
  `;
  let response;
  // const prompt = generatePrompt(profile, askedQuestion, answerOptions);
  try {
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
// checkSuitability();
// answerQuestion();
module.exports = {
  checkSuitability,
  answerQuestion,
  answerQuestion2,
  getGeminiUserConfiguration,
  initializeGeminiModel,
  getGeminiModel,
};
