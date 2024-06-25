const {
  VertexAI,
  FunctionDeclarationSchemaType,
} = require("@google-cloud/vertexai");
const { GoogleAuth, GoogleAuthOptions } = require("google-auth-library");

const functionDeclarations = [
  {
    function_declarations: [
      {
        name: "apply_for_job",
        description: "This function is used to apply to a job.",
        parameters: {
          type: FunctionDeclarationSchemaType.BOOLEAN,
          properties: {
            isSuitable: { type: FunctionDeclarationSchemaType.BOOLEAN },
          },
          required: ["isSuitable"],
        },
      },
    ],
  },
];

const functionResponseParts = [
  {
    functionResponse: {
      name: "apply_for_job",
      response: {
        name: "apply_for_job",
        content: { isSuitable: true },
      },
    },
  },
];

/**
 * TODO(developer): Update these variables before running the sample.
 */
async function functionCallingStreamContent(
    project = "global-terrain-332514",
    location = "us-central1",
    textModel = "gemini-1.0-pro"
) {
  const auth = new GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    keyFile: "global-terrain-332514-5973072b6666.json",
  });

  const vertexAI = new VertexAI({
    project: project,
    location: location,
    googleAuthOptions: auth,
  });
  // Instantiate the model
  const generativeModel = vertexAI.getGenerativeModel({
    model: textModel,
  });

  const request = {
    contents: [
      { role: "user", parts: [{ text: "I am a react js developer , one job has Java developer job requirement, You have to decide if i should apply for this job, Apply to job if the job is suitable for me." }] },
      {
        role: "model",
        parts: [
          {
            functionCall: {
              name: "apply_for_job",
              args: { isSuitable: true },
            },
          },
        ],
      },
      { role: "user", parts: functionResponseParts },
    ],
    tools: functionDeclarations,
  };
  const streamingResp = await generativeModel.generateContentStream(request);
  for await (const item of streamingResp.stream) {
    console.log(item.candidates[0].content.parts);
  }
}

functionCallingStreamContent();