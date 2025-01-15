const {
  FunctionDeclarationSchemaType,
  HarmBlockThreshold,
  HarmCategory,
  VertexAI,
} = require("@google-cloud/vertexai");
const { GoogleAuth, GoogleAuthOptions } = require("google-auth-library");

// const skills = `React Js, Javascript, Material UI, HTML5, CSS, Java, Frontend Development, Redux, Full Stack developer, Bootstrap, jQuery, MySQL, UI Developer, REST`;
const skills = `HANA Database, HANA landscape, sap bw, sap basis, sap hana, sap hana administration, hana db, sap basis administration, sap basis hana, sap upgrade, sap installation, hana upgrade, sap, basis, S4 Migration, Cloud Connector, System REfresh, System upgrade`;

const description1 = "<p>Askmeoffers.com is a leading online platform that provides users with the latest deals, discounts, and offers from a wide range of online retailers. Our mission is to help users save money and make smart shopping decisions by providing them with the best deals available.</p><br /><p><strong>Position Overview:</strong> We are looking for a skilled and passionate Software Engineer to join our growing team. The ideal candidate will be responsible for designing, developing, and implementing software solutions to meet the needs of our customers and business.</p><br /><p><strong>Responsibilities:</strong></p><ul><li>Collaborate with cross-functional teams to define, design, and ship new features</li><li>Develop high-quality software design and architecture</li><li>Identify, prioritize, and execute tasks in the software development life cycle</li><li>Develop tools and applications by producing clean, efficient code</li><li>Automate tasks through appropriate tools and scripting</li><li>Review and debug code</li><li>Perform validation and verification testing</li><li>Collaborate with internal teams to fix and improve software</li></ul><br /><p><strong>Qualifications:</strong></p><ul><li>Bachelor's degree in Computer Science or related field</li><li>Proven work experience as a Software Engineer or Software Developer</li><li>Experience with software development methodologies and practices</li><li>Strong proficiency in one or more programming languages (e.g., Java, Python, C++)</li><li>Experience with databases and web technologies</li><li>Excellent analytical and problem-solving skills</li><li>Ability to work independently and in a team environment</li><li>Excellent communication skills</li></ul><br /><p><strong>How to Apply:</strong> Interested candidates should send their resume and cover letter to upasana@askmeoffers.com. Please include \"Software Engineer Application\" in the subject line of your email.</p>"

const question = `Select the framework you have worked on.`;

let options = ["React", "Angular", ".Net"];
const experience = `3 Years`;

const project = "fifth-totality-401110";
const location = "us-central1";
const textModel = "gemini-1.0-pro";

const auth = new GoogleAuth({
  scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  keyFile: "fifth-totality-401110-34ba6376d058.json",
});

const vertexAI = new VertexAI({
  project: project,
  location: location,
  googleAuthOptions: auth,
});

// Instantiate Gemini models
const generativeModel = vertexAI.getGenerativeModel({
  model: textModel,
  // The following parameters are optional
  // They can also be passed to individual content generation requests
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ],
  generationConfig: { maxOutputTokens: 256 },
});

const checkSuitability = async (
  job,
  profile,
) => {
  const prompt = `I'm seeking your assistance in my job application process. I'll provide you with my skills and experience, and your task is to analyze job descriptions to determine their relevance to my skillset. Based on the provided job description, please classify whether the job is suitable for me. If you believe it aligns with my skills, return "yes"; otherwise, return "no".

  My Skills: ${profile.skills}
  
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
  try {
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
    if (answerObject.isSuitable == "no" || answerObject.isSuitable == "false") answerObject.isSuitable = false;
    if (answerObject.isSuitable == "yes" || answerObject.isSuitable == "true") answerObject.isSuitable = true;
    return answerObject;
  } catch (e) {
    console.log(
      "Error while generating content in checking suitability : " + e
    );
    console.log("Generated content is -> ");
    console.log(response.candidates[0].content.parts[0].text);
    return;
  }
};

const generatePrompt = (profile, askedQuestion, answerOptions = {}) => {
  const hasOptions = Object.keys(answerOptions).length > 0;

  return `I want you to be my job search assistant. I am applying for a job. The recruiter has asked me a question. ${
    hasOptions ? 
    'If the question has options, return the most suitable option based on my details provided below.' : 
    'If options are not provided, respond with a one or two-word answer.'
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
  {"question": "What is your notice period?","answer": ${hasOptions ? '["2 Months"]' : '"2 Months"'}, "confidence": "80%","comments": "Your notice period is 2 months based on the details provided."}
  
  The "answer" field in the response object should be ${hasOptions ? 'an array if options are provided.' : 'a string if options are not provided.'}
  
  For example:
  ${
    hasOptions 
      ? `If options are provided: { "answer": ["2 Months"], ...remaining fields }` 
      : `If options are not provided: { "answer": "2 Months", ...remaining fields }`
  }
  
  Here is the question asked by the recruiter: "${askedQuestion}"
  ${
    hasOptions
      ? `Here are the options from which you have to select the most suitable option: "${JSON.stringify(answerOptions)}". Your answer field should be an array. Answer should be in [""] format.`
      : `Options are not provided, answer with a one or two-word response.`
  }
  `;
};

const generatePrompt2 = (profile, askedQuestion) => {
  const hasOptions = Object.keys(answerOptions).length > 0;

  return `I want you to be my job search assistant. I am applying for a job. The recruiter has asked me a question. ${
    hasOptions ? 
    'If the question has options, return the most suitable option based on my details provided below.' : 
    'If options are not provided, respond with a one or two-word answer.'
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
  {"question": "What is your notice period?","answer": ${hasOptions ? '["2 Months"]' : '"2 Months"'}, "confidence": "80%","comments": "Your notice period is 2 months based on the details provided."}
  
  The "answer" field in the response object should be ${hasOptions ? 'an array if options are provided.' : 'a string if options are not provided.'}
  
  For example:
  ${
    hasOptions 
      ? `If options are provided: { "answer": ["2 Months"], ...remaining fields }` 
      : `If options are not provided: { "answer": "2 Months", ...remaining fields }`
  }
  
  Here is the question asked by the recruiter: "${askedQuestion}"
  ${
    hasOptions
      ? `Here are the options from which you have to select the most suitable option: "${JSON.stringify(answerOptions)}". Your answer field should be an array. Answer should be in [""] format.`
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

const answerQuestion2 = async (
  questionsToBeAnswered = question,
  profile
) => {
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
  
  Here are the questions asked by the recruiter: "${JSON.stringify(questionsToBeAnswered)}"
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
    console.log(answer)
    debugger;
    answer = answer.split('```json')[1].split('```')[0];
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
  skills,
  experience,
  checkSuitability,
  answerQuestion,
  answerQuestion2,
};
