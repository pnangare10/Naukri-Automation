const fs = require("fs");
const readline = require("readline");

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
const writeToFile = (data , fileName) => {
  fs.writeFileSync(`./data/${fileName}.json`,JSON.stringify(data), (err) => {
    if (err) {
      console.error(err);
    }
  });
};

// Get the questions from the file and parse into json and return the object
const getDataFromFile = (fileName) => {
  const data = fs.readFileSync(`./data/${fileName}.json`);
  return JSON.parse(data);
};

const filterJobs = (jobInfo) => {
  const preferredSalary = 900000;
  const maxTime = 30;
  const maxApplyCount = 10000;
  const experience = 4;
  const videoProfile = false;
  const vacany = 1;
  const filteredJobs = jobInfo
    .filter((jobDetails) => {
      // const jobDetails = job.jobDetails;
      // if (jobDetailstatusCode === 404) return false;
      const createdDays = jobDetails.createdDate ?
        (new Date() - new Date(jobDetails.createdDate)) / (1000 * 60 * 60 * 24) : 0;
      // console.log(
      //   `Salary: ${
      //     jobDetails.salaryDetail?.minimumSalary
      //   } Days: ${createdDays.toFixed(0)} ApplyCount: ${jobDetails.applyCount} Experience: ${
      //     jobDetails.minimumExperience
      //   } VideoProfile: ${jobDetails.videoProfilePreferred} ApplyRedirectUrl: ${
      //     jobDetails.applyRedirectUrl
      //   } Vacany: ${jobDetails.vacany} `
      // );
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
      maximumSalary: jobDetails.maximumSalary
    }));
  console.log(
    `Total number of Jobs : ${jobInfo.length}\nFiltered Jobs : ${filteredJobs.length}`
  );
  return filteredJobs;
};

module.exports = {
  chunkArray,
  askQuestion,
  writeToFile,
  filterJobs,
  rl,
  getDataFromFile
};
