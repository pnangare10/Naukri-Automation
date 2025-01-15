const fs = require("fs");
const readline = require("readline");
const { profiles } = require("./data/profiles/profiles");
const { checkSuitability } = require("./gemini");
const { loginAPI } = require("./api");
const { get } = require("http");
const localStorage = require("./localStorage");
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
  if (!fs.existsSync(`./data/${profile}`)) {
    fs.mkdirSync(`./data/${profile}`, { recursive: true });
  }
  fs.writeFileSync(
    `./data/${profile}/${fileName}.json`,
    JSON.stringify(data),
    (err) => {
      if (err) {
        console.error(err);
      }
    }
  );
};

// Get the questions from the file and parse into json and return the object
const getDataFromFile = (fileName, profile) => {
  //check if file exists
  if (!fs.existsSync(`./data/${profile}/${fileName}.json`)) {
    return [];
  }
  const data = fs.readFileSync(`./data/${profile}/${fileName}.json`);
  return JSON.parse(data);
};

const filterJobs = (jobInfo) => {
  const preferredSalary = 500000;
  const maxTime = 30;
  const maxApplyCount = 10000;
  const experience = 5;
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
    })).sort((a, b) => b.maximumSalary - a.maximumSalary);
  console.log(
    `Total number of Jobs : ${jobInfo.length}\nFiltered Jobs : ${filteredJobs.length}`
  );
  return filteredJobs;
};

// select a profile
const selectProfile = async () => {
  let selectedProfile = null;
  if (profiles.length === 1) {
    selectedProfile = profiles[0];
  }
  if (profiles.length === 0) {
    console.log("No profiles found. Please add profiles to continue.");
    process.exit(1);
  }
  while (!selectedProfile) {
    const profileNames = profiles?.map(
      (profile, index) => `(${index + 1}) : ${profile.id}`
    );
    const ans = await askQuestion(
      `Select a profile from the following list:\n${profileNames.join("\n")}`
    );

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

const matchKeywords = (keywords, jobKeywords) => {
  const isMatched = keywords.some((keyword) => jobKeywords?.toLowerCase().includes(keyword.toLowerCase()));
  return isMatched;
};

const aiMatching = async (jobInfo, profile) => {
  const res = await checkSuitability(jobInfo, profile);
  return res.isSuitable;
};

const manualMatching = async (jobInfo) => {
  const res = await askQuestion(`Is this job suitable ?\n`);
  if (res !== "") return false;
  return true;
};

const matchingMethods = {
  ai: aiMatching,
  manual: manualMatching,
  keywords: matchKeywords,
};

const matchingStrategy = async (jobInfo, profile) => {
  const keywordMatchingResult = matchingMethods.keywords(
    profile.keywords,
    jobInfo.description
  );
  if (keywordMatchingResult) return true;
  // const aiMatchingResult = matchingMethods.ai(jobInfo, profile);
  // return aiMatchingResult;
  return false;
};

module.exports = {
  chunkArray,
  askQuestion,
  writeToFile,
  filterJobs,
  rl,
  getDataFromFile,
  selectProfile,
  selectedProfile,
  matchingMethods,
  matchingStrategy,
};
