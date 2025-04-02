const prompts = require("@inquirer/prompts");
const {
  getDataFromFile,
  getFileData,
  writeToFile,
  writeFileData,
  getCsvFile,
} = require("./ioUtils");
const { matchScoreAPI } = require("../api");
const { getConfirmation, questionMenu, checkBoxMenu } = require("./prompts");

const getEmailsIds = async (jobs, profile) => {
  let emailIds = await getDataFromFile("hrEmails");
  if (!emailIds) emailIds = [];
  jobs?.forEach((jobDetails) => {
    if (jobDetails.matchScore == 0) return;
    const emailId = jobDetails.description.match(
      /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi
    );
    const contact = jobDetails.description.match(
      /\b(?:\+?(\d{1,3})[-.\s]?)?(\(?\d{3}\)?|\d{3})[-.\s]?\d{3}[-.\s]?\d{4}\b/g
    );
    if (emailId && emailId.length > 0) {
      const index = emailIds.filter(
        (emailObj) => emailObj.email[0] === emailId[0]
      );
      if (index.length === 0)
        emailIds.push({
          company: jobDetails.companyName,
          email: emailId,
          title: jobDetails.title,
          jobId: jobDetails.jobId,
          contact: contact,
        });
    }
  });
  writeToFile(emailIds, "hrEmails");
  getCsvFile(emailIds, `${profile}-hrContactDetails.csv`);
  return emailIds;
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
    return await manualMatching(jobInfo);
  }
};

const manualMatching = async (jobInfo) => {
  const res = await getConfirmation(`Is this job suitable: ${jobInfo.jobTitle} ?`);
  return res;
};

const naukriMatching = async (jobInfo, profile) => {
  // Check if matchScore exists and is explicitly 0 or null/undefined
  if (jobInfo.matchScore == 0) {
    return false;
  } else if (jobInfo.matchScore == null || jobInfo.matchScore == undefined) {
    const matchScore = await matchScoreAPI(jobInfo.jobId);
    if (matchScore.Keyskills == 0) {
      return false;
    }
  }
  return true;
};

const matchingMethods = {
  ai: aiMatching,
  manual: manualMatching,
  keywords: matchKeywords,
  naukriMatching: naukriMatching,
};

const matchingStrategy = async (jobInfo, profile, matchDescription = false) => {
  const preferences = await getDataFromFile("preferences");
  let matchingResult = false;
  let matchStrategy = "keywords";
  if (preferences && preferences.matchStrategy)
    matchStrategy = preferences.matchStrategy;
  switch (matchStrategy) {
    case "naukriMatching":
      matchingResult = await matchingMethods.naukriMatching(jobInfo, profile);
      break;
    case "ai":
      matchingResult = await matchingMethods.ai(jobInfo, profile);
      break;
    case "manual":
      matchingResult = await matchingMethods.manual(jobInfo);
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
    case "Radio Button":
      res = await questionMenu(question);
      question.answer = [res];
      break;
    case "Check Box":
      res = await checkBoxMenu(question);
      question.answer = res;
      break;
    default:
      res = await prompts.input({
        message: question.questionName,
        default: question.answer,
      });
      question.answer = res;
  }
  return question.answer;
};

module.exports = {
  writeToFile,
  writeFileData,
  getEmailsIds,
  getDataFromFile,
  getFileData,
  matchingMethods,
  matchingStrategy,
  getAnswerFromUser,
};
