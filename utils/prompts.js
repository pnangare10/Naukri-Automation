const prompts = require("@inquirer/prompts");

const theme = {
  // prefix: { idle: "🤔", done: "✅" }, // Custom icons for idle and done
  // spinner: {
  //   interval: 100, // Speed of animation (in ms)
  //   frames: ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"], // Frames of the spinner
  // },
};

const context = {
  clearPromptOnDone: true,
};

const showMainMenu = async () => {
  return await prompts.select({
    message: "Please select a option : ",
    choices: [
      {
        name: "Search for new jobs",
        value: "search-jobs",
        description: "Search and apply for new jobs",
      },
      {
        name: "Use previously searched jobs",
        value: "use-existing-jobs",
        description: "Use previously searched jobs",
      },
      {
        name: "Send emails to recruiters",
        value: "send-emails",
        description: "Send emails to recruiters",
      },
      {
        name: "View Analytics",
        value: "analytics",
        description: "View your application usage statistics",
      },
      {
        name: "Configure your preferences",
        value: "configure",
        description: "Configure preferences",
      },
      {
        name: "Reset your account",
        value: "reset",
        description: "This will remove all your data and start fresh",
      },
      {
        name: "Check for updates",
        value: "check-updates",
        description: "Check for updates",
      },
      {
        name: "Exit",
        value: "exit",
        description: "Exit the program",
      },
    ],
  }, context);
};

const textModelMenu = async (defaultOption = "gemini-2.0-flash-001") =>
  await prompts.select(
    {
      name: "value",
      message: "Enter the text model (e.g., gemini-2.0-flash-001):",
      default: defaultOption,
      choices: [
        {
          name: "gemini-2.0-flash-001 (Recommended)",
          value: "gemini-2.0-flash-001",
        },
        { name: "gemini-1.5-flash-002", value: "gemini-1.5-flash-002" },
        { name: "gemini-1.5-flash-001", value: "gemini-1.5-flash-001" },
        { name: "gemini-1.5-pro-002", value: "gemini-1.5-pro-002" },
        { name: "gemini-1.5-pro-001", value: "gemini-1.5-pro-001" },
        { name: "gemini-1.0-pro-002", value: "gemini-1.0-pro-002" },
        { name: "gemini-1.0-pro-001", value: "gemini-1.0-pro-001" },
      ],
      theme,
    },
    context
  );

const jobSearchMenu = async () =>
  await prompts.select(
    {
      message: `Please select a option : `,
      choices: [
        { name: "Search for new jobs", value: 1 },
        { name: "Use previously searched jobs", value: 2 },
        { name: "Send emails to recruiters", value: 3 },
      ],
      theme,
    },
    context
  );

const emailMenu = async () =>
  await prompts.select(
    {
      message: "Please select an option",
      default: "skip",
      choices: [
        { name: "Skip", value: "skip" },
        { name: "Edit email template", value: "edit" },
        { name: "View email template", value: "view" },
        { name: "Reset email template", value: "reset" },
        { name: "Previous menu", value: "previous" },
        { name: "Exit", value: "exit" },
      ],
      theme,
    },
    context
  );

const subEmailMenu = async () =>
  await prompts.select(
    {
      message: "Please select a option: ",
      choices: [
        { name: "Send emails to all emails", value: "send-all" },
        { name: "Send emails to selected emails", value: "send-selected" },
        { name: "Export emails", value: "export" },
        { name: "Clear existing emails", value: "clear" },
        { name: "Previous menu", value: "previous" },
        { name: "Exit", value: "exit" },
      ],
      theme,
    },
    context
  );

const jobMatchStrategyMenu = async () =>
  await prompts.select(
    {
      message: "Select a strategy to match the jobs",
      choices: [
        {
          name: "Naukri Matching",
          value: "naukriMatching",
          description: "Use Naukri Matching strategy to match the jobs",
        },
        {
          name: "Keywords Matching",
          value: "keywords",
          description:
            "Match the jobs with keywords provided by you and title of the job",
        },
        {
          name: "AI Matching",
          value: "ai",
          description: "Use Gen AI model to match the jobs",
        },
        {
          name: "Manual Matching",
          value: "manual",
          description: "Manually match the jobs with your confirmation",
        },
      ],
      theme,
    },
    context
  );

const enableGenAiMenu = async () =>
  await prompts.select(
    {
      message: "Would you like to enable Gen Ai based question answering ?",
      choices: [
        {
          name: "Yes",
          value: true,
          description:
            "Use gen ai model to generate answers for questions asked in job application.",
        },
        {
          name: "No",
          value: false,
          description:
            "Skip gen ai setup. This will skip the jobs which require question answering.",
        },
      ],
      theme,
    },
    context
  );

const selectGenAiModel = async () => {
  const res = await prompts.select(
    {
      message: "Please select gen ai model to use",
      choices: [
        { name: "Google Gemini Model", value: "gemini" },
        { name: "ChatGPT", value: "chatgpt" },
      ],
      theme,
    },
    context
  );
  if (res !== "gemini") {
    console.log(
      "There is only gemini model implementation available currently, selecting gemini as default"
    );
    res = "gemini";
  }
  return res;
};

const enableManualAnsweringMenu = async () =>
  await prompts.select(
    {
      message: "Would you like to manually answer the questions?",
      choices: [
        {
          name: "No",
          value: false,
          description: "Jobs which require question answering will be skipped.",
        },
        {
          name: "Yes",
          value: true,
          description:
            "You will have to enter the answers manually. (Not recommended, defeats the purpose of automation :) )",
        },
      ],
      description:
        "Selecting no will result skipping the jobs which require question answering.",
      theme,
    },
    context
  );

const getConfirmation = async (message, defaultAnswer = true) =>
  await prompts.select(
    {
      message: `${message}`,
      choices: [
        { name: "Yes", value: true },
        { name: "No", value: false },
      ],
      default: defaultAnswer,
      theme,
    },
    context
  );

const questionMenu = async (question) =>
  await prompts.select(
    {
      message: question.questionName,
      choices: Object.values(question.answerOption).map((option) => ({
        name: option,
        value: option,
      })),
      default: question.answer,
      theme,
    },
    context
  );

const checkBoxMenu = async (question) =>
  await prompts.checkbox(
    {
      message: question.questionName,
      choices: Object.values(question.answerOption).map((option) => ({
        name: option,
        value: option,
      })),
      default: question.answer,
      theme,
    },
    context
  );

const authTypeMenu = async () =>
  await prompts.select(
    {
      type: "select",
      name: "value",
      message: "Select your authentication type:",
      choices: [
        { name: "API Key (Recommended)", value: "apiKey" },
        { name: "Service Account", value: "serviceAccount" },
      ],
      default: genAiConfig.authType || "apiKey",
      theme,
    },
    context
  );

const keyFileMenu = async (files) =>
  await prompts.select(
    {
      type: "select",
      name: "value",
      message: "Select your Google Cloud service account key file:",
      choices: files.map((file) => ({ name: file, value: file })),
      theme,
    },
    context
  );

const selectProfileMenu = async (profiles) =>
  await prompts.select(
    {
      message: `Select a profile from the following list`,
      choices: profiles
        .map((profile, index) => ({ name: profile.id, value: index + 1 }))
        .concat([
          { name: "Add New Profile", value: -1 },
          { name: "Exit", value: "exit" },
        ]),
      theme,
    },
    context
  );

const selectEmails = async (recipients) =>
  await prompts.checkbox({
    message: "Select the emails you want to send the email to",
    choices: recipients.map((recipient) => ({
      name: recipient.title,
      value: recipient,
      description: `Company: ${recipient.company}\nPosition: ${recipient.title}\nEmail: ${recipient.email}`,
      checked: true,
    })),
    theme,
  },
  context
);

const passwordPrompt = async (message) =>
  await prompts.password({ message, mask: "*", validate: (value) => {
      if (!value) return "Password is required";
      return true;
    },
  });

module.exports = {
  showMainMenu,
  textModelMenu,
  jobSearchMenu,
  emailMenu,
  subEmailMenu,
  jobMatchStrategyMenu,
  enableGenAiMenu,
  selectGenAiModel,
  enableManualAnsweringMenu,
  getConfirmation,
  questionMenu,
  checkBoxMenu,
  authTypeMenu,
  keyFileMenu,
  selectProfileMenu,
  selectEmails,
  passwordPrompt,
};
