const fs = require("fs");
const readline = require("readline");
const { checkSuitability } = require("./gemini");
const { localStorage } = require("./helper");
const prompts = require("@inquirer/prompts");

let selectedProfile = null;

// Split an array into chunks of a given size
const chunkArray = (array, size) => {
  return Array.from({ length: Math.ceil(array.length / size) }, (_, index) =>
    array.slice(index * size, index * size + size)
  );
};

// Create an interface to read from the console
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Ask the question and return the answer
const askQuestion = async (question) => {
  return new Promise((resolve, reject) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
};

// Write the questions to the file
const writeToFile = (data, fileName, profile) => {
  //check if file exists
  if (profile === undefined) {
    profile = localStorage.getItem("profile").id;
  }
  if (!fs.existsSync(`./data/${profile}`)) {
    fs.mkdirSync(`./data/${profile}`, { recursive: true });
  }
  writeFileData(data, `${profile}/${fileName}`);
};

const writeFileData = (data, fileName) => {
  fs.writeFileSync(`./data/${fileName}.json`, JSON.stringify(data), (err) => {
    if (err) {
      console.error(err);
    }
  });
};

const getDataFromFile = async (fileName, profile) => {
  if (profile === undefined) {
    profile = await localStorage.getItem("profile");
    profile = profile.id;
  }
  return getFileData(`${profile}/${fileName}`);
};

const getFileData = async (fileName) => {
  //check if file exists
  if (!fs.existsSync(`./data/${fileName}.json`)) {
    return;
  }
  const data = fs.readFileSync(`./data/${fileName}.json`);
  return JSON.parse(data);
};

const filterJobs = (jobInfo) => {
  const user = localStorage.getItem("profile");
  const preferredSalary = user.profile.expectedCtc ?? 0;
  const maxTime = 30;
  const maxApplyCount = 10000;
  const experience = user.profile.totalExperience.year + 2 ?? 100;
  const videoProfile = false;
  const vacany = 1;
  const filteredJobs = jobInfo
    .filter((jobDetails) => {
      const createdDays = jobDetails.createdDate
        ? (new Date() - new Date(jobDetails.createdDate)) /
          (1000 * 60 * 60 * 24)
        : 0;
      return (
        jobDetails.maximumSalary >= preferredSalary &&
        createdDays <= maxTime &&
        jobDetails.applyCount <= maxApplyCount &&
        jobDetails.minimumExperience <= experience &&
        (jobDetails.videoProfilePreferred === undefined ||
          jobDetails.videoProfilePreferred === videoProfile) &&
        jobDetails.applyRedirectUrl === undefined &&
        (jobDetails.vacany === undefined || jobDetails.vacany >= vacany)
      );
    })
    .map((jobDetails) => ({
      jobId: jobDetails.jobId,
      jobTitle: jobDetails.title,
      companyName: jobDetails.companyName,
      description: jobDetails.description,
      minimumSalary: jobDetails.minimumSalary,
      maximumSalary: jobDetails.maximumSalary,
    }))
    .sort((a, b) => b.maximumSalary - a.maximumSalary);
  console.log(
    `Total number of Jobs : ${jobInfo.length}\nFiltered Jobs : ${filteredJobs.length}`
  );
  return filteredJobs;
};

// select a profile
const selectProfile = async () => {
  let selectedProfile = null;
  // if (profiles.length === 1) {
  //   selectedProfile = profiles[0];
  // }
  const profiles = await getFileData("profiles");
  if (!profiles || profiles.length === 0) {
    console.log("No profiles found. Please add profiles to continue.");
    return null;
  }
  while (!selectedProfile) {
    const profileOptions = profiles?.map((profile, index) => ({
      name: profile.id,
      value: index + 1,
    }));
    profileOptions.push({ name: "Create New Profile", value: -1 });
    const ans = await prompts.select({
      message: `Select a profile from the following list`,
      choices: profileOptions,
    });
    if (ans === -1) return null;

    const index = parseInt(ans, 10); // Convert ans to a number
    if (isNaN(index) || index <= 0 || index > profiles.length) {
      console.log("Invalid profile number. Please try again.");
    } else {
      selectedProfile = profiles[index - 1];
    }
  }
  localStorage.setItem("profile", selectedProfile);
  return selectedProfile;
};

const matchKeywords = async (keywords, jobKeywords) => {
  if (!keywords || keywords.length === 0) {
    preferences = await getDataFromFile("preferences");
    if (!preferences.keywords || preferences.keywords.length === 0) {
      const res = await prompts.input({
        message: "Please enter keywords to match with job description\n",
      });
      keywords = res.split(",");
      const preferences = getDataFromFile("preferences");
      preferences.keywords = keywords;
      writeToFile(preferences, "preferences");
    } else {
      keywords = preferences.keywords;
    }
  }
  const isMatched = keywords.some((keyword) =>
    jobKeywords?.toLowerCase().includes(keyword.toLowerCase())
  );
  return isMatched;
};

const aiMatching = async (jobInfo, profile) => {
  try {
    const res = await checkSuitability(jobInfo, profile);
    return res.isSuitable;
  } catch (e) {
    console.log("Error in AI matching, Switching to manual matching");
    manualMatching(jobInfo);
  }
};

const manualMatching = async (jobInfo) => {
  const res = await prompts.confirm({
    message: `Is this job suitable ?`,
    default: true,
  });
  return res;
};

const matchingMethods = {
  ai: aiMatching,
  manual: manualMatching,
  keywords: matchKeywords,
};

const matchingStrategy = async (jobInfo, profile, matchDescription = false) => {
  const preferences = await getDataFromFile("preferences");
  let matchingResult = false;
  let matchStrategy = "keywords";
  if (preferences && preferences.matchStrategy)
    matchStrategy = preferences.matchStrategy;
  switch (matchStrategy) {
    case "ai":
      matchingResult = await matchingMethods.aiMatching(jobInfo, profile);
      break;
    case "manual":
      matchingResult = await matchingMethods.manualMatching(jobInfo);
      break;
    default:
      matchingResult = await matchingMethods.keywords(
        profile.keywords,
        matchDescription ? jobInfo.description : jobInfo.jobTitle
      );
  }

  return matchingResult;
};

const getAnswerFromUser = async (question) => {
  let res;
  switch (question.questionType) {
    case "List Menu":
      res = await prompts.select({
        message: question.questionName,
        choices: Object.values(question.answerOption).map((option) => ({
          name: option,
          value: option,
        })),
      });
      question.answer = [res];
      break;
    case "Check Box":
      res = await prompts.checkbox({
        message: question.questionName,
        choices: Object.values(question.answerOption).map((option) => ({
          name: option,
          value: option,
        })),
      });
      question.answer = res;
      break;
    default:
      res = await prompts.input({
        message: question.questionName,
      });
      question.answer = res;
  }
  return question.answer;
};

const compressProfile = (profile) => {
  delete profile.profile.keySkills;
  profile.employmentHistory.map((item) => delete item.jobDescription);
  return profile;
}

module.exports = {
  chunkArray,
  askQuestion,
  writeToFile,
  writeFileData,
  filterJobs,
  rl,
  getDataFromFile,
  getFileData,
  selectProfile,
  selectedProfile,
  matchingMethods,
  matchingStrategy,
  getAnswerFromUser,
  compressProfile,
};
