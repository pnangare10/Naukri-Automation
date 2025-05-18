const {
  applyJobsAPI,
  searchJobsAPI,
  getJobDetailsAPI,
  getSimJobsAPI,
  loginAPI,
  getRecommendedJobsAPI,
  getProfileDetailsAPI,
  matchScoreAPI,
  getResumeAPI,
} = require("../api");

const {
  writeToFile,
  getDataFromFile,
  getAnswerFromUser,
  getEmailsIds,
} = require("./utils");
const { answerQuestion } = require("./geminiUtils");
const { localStorage } = require("./helper");
const spinner = require('./spinniesUtils');
const { compressProfile } = require("./userUtils");
const analyticsManager = require("./analyticsUtils");

// apply for jobs in a string array
const applyForJobs = async (jobs, applyData) => {
  //change this code to apply maximum 5 jobs at a time
  const jobsArr = jobs.map((job) => job.jobId);
  let bodyStr;
  if (applyData) {
    bodyStr = `{"strJobsarr":${JSON.stringify(
      jobsArr
    )},"applyData":${JSON.stringify(applyData)}`;
  } else {
    bodyStr = `{"strJobsarr":${JSON.stringify(jobsArr)}`;
  }
  const response = await applyJobsAPI(bodyStr);
  const data = await response.json();
  if (response.status == 401 || response.status == 403) {
    console.error(data?.message);
    throw new Error(response.status);
  }
  if (!data.jobs) {
    throw new Error(`Already applied for job`);
  }
  return data;
};

const getJobInfo = async (jobIds, batchSize = 5) => {
  const profile = localStorage.getItem("profile");
  const preferences = localStorage.getItem("preferences");
  const jobInfo = [];

  try {
    spinner.start("Fetching job info...");
    for (let i = 0; i < jobIds.length; i += batchSize) {
      const batch = jobIds.slice(i, i + batchSize);

      // Process the current batch in parallel
      const batchPromises = batch.map(async (jobId) => {
        try {
          const matchScoreResponse = await matchScoreAPI(jobId);
          let matchScore = null;
          if (matchScoreResponse.status === 200) {
            matchScore = await matchScoreResponse.json();
            if (
              matchScore.Keyskills == 0 &&
              preferences.matchStrategy === "naukriMatching"
            )
              return null;
          }
          const jobDetailsResponse = await getJobDetailsAPI(jobId);
          if (jobDetailsResponse.status === 200) {
            const data = await jobDetailsResponse.json();
            if (data.jobDetails) {
              const {
                salaryDetail,
                applyCount,
                minimumExperience,
                videoProfilePreferred,
                applyRedirectUrl,
                vacany,
                createdDate,
                jobId,
                jobRole,
                companyDetail,
                description,
                title,
              } = data.jobDetails;

              return {
                minimumSalary: salaryDetail.minimumSalary,
                maximumSalary: salaryDetail.maximumSalary,
                applyCount,
                minimumExperience,
                videoProfilePreferred,
                applyRedirectUrl,
                vacany,
                createdDate,
                jobId,
                jobRole,
                companyName: companyDetail.name,
                description,
                title,
                matchScore: matchScore?.Keyskills,
              };
            }
          } else if (jobDetailsResponse.status === 403) {
            console.log("403 Forbidden:", jobDetailsResponse);
            throw new Error("403 Forbidden");
          } else if (jobDetailsResponse.status === 303) {
            const data = await jobDetailsResponse.json();
            if (data?.metaSearch?.isExpiredJob === "1") {
              process.stdout.write("Expired Job \r");
            }
          } else {
            console.log(
              `Error fetching job details for Job ID: ${jobId}
              Status: ${jobDetailsResponse.status}`
            );
          }
          return null; // Return null if no valid job data is found.
        } catch (error) {
          console.error(
            `Error fetching job details for Job ID: ${jobId}`,
            error.message
          );
          return null; // Return null on error to avoid failing the entire batch.
        }
      });

      const batchResults = await Promise.all(batchPromises);
      // Add the results of the current batch to the overall jobInfo array
      jobInfo.push(...batchResults.filter((job) => job !== null));

      // Print progress after each batch
      // process.stdout.write(
      //   `Completed ${jobInfo.length} jobs out of ${jobIds.length} \r`
      // );
      spinner.update(`Completed ${jobInfo.length} jobs out of ${jobIds.length} \r`);
    }
    spinner.succeed("Job info fetched successfully");
    // Write the results to a file
    writeToFile(jobInfo, "searchedJobs", profile.id);

    return jobInfo;
  } catch (error) {
    spinner.fail("Unexpected error while fetching job info:", error.message);
    throw error;
  }
};

//Search all the jobs
const searchJobs = async (pageNo, keywords, repetitions) => {
  try {
    const data = await searchJobsAPI(pageNo, keywords).then(async (results) => {
      if (results.status == 200) return results.json();
      else if (results.status == 403) {
        console.log("403 Forbidden : " + results.statusText);
        throw new Error("403 Forbidden");
      } else {
        console.log(await results.json());
      }
    });
    if (!data?.jobDetails) {
      console.log(data);
      return [];
    }
    const jobIds = data.jobDetails.map((job) => job.jobId);
    // console.log(`Found ${jobIds.length} jobs on page ${pageNo}`);
    let simillarJobs = [...jobIds];
    // console.log(`Searching for simillar jobs for ${repetitions} times`);
    for (let i = 1; i <= repetitions; i++) {
      simillarJobs = await searchSimillarJobs(simillarJobs);
      jobIds.push(...simillarJobs);
    }
    return jobIds;
  } catch (error) {
    console.error(error.message);
    if (error.message == "403 Forbidden") throw new Error("403 Forbidden");
    return [];
  }
};

const searchSimillarJobs = async (jobIds) => {
  let simillarJobIds = [];
  if (jobIds.length == 0) return simillarJobIds;
  const jobs = [];
  for (const jobId of jobIds) {
    const response = await getSimJobsAPI(jobId);
    if (response.status === 200) {
      const data = await response.json();
      const jobIdsArr = data.simJobDetails.content.map((job) => job.jobId);
      jobs.push(...jobIdsArr);
    } else {
      console.error("Error in fetching similar jobs:");
      // console.log(response);
      throw new Error("403 Forbidden");
    }
    // Wait for 200ms before making the next request
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return jobs;
};

const getRecommendedJobs = async () => {
  const response = await getRecommendedJobsAPI(null);
  if (response.status !== 200) {
    return [];
  }
  const data = await response.json();
  const clusters = data.recommendedClusters?.map(
    (cluster) => cluster.clusterId
  ); //["profile", "apply", "preference", "similar_jobs"];

  const jobPromises = clusters.map(async (cluster) => {
    try {
      const response = await getRecommendedJobsAPI(cluster);
      if (response.status !== 200) {
        console.error("Error in fetching recommended jobs:", response);
        return [];
      }
      const data = await response.json();
      return data.jobDetails?.map((job) => job.jobId) || [];
    } catch (error) {
      console.error(`Error fetching jobs for cluster: ${cluster}`, error.message);
      return []; // Return an empty array on error to avoid failing all promises.
    }
  });

  const allJobIds = await Promise.all(jobPromises);
  const jobIds = allJobIds.flat(); // Flatten the array of arrays into a single array.
  return jobIds;
};

const handleQuestionnaire = async (data, enableGenAi) => {
  const applyData = {};
  const profile = localStorage.getItem("profile");
  const questions = (await getDataFromFile("questions", profile.id)) ?? {};
  const updatedProfile = compressProfile(profile);
  for (const job of data.jobs) {
    const answers = {};
    const questionsToBeAnswered = [];
    job.questionnaire.forEach((question) => {
      // Some questions have empty options
      const isEmptyOptions = Object.values(question.answerOption).every(
        (value) => value === ""
      );
      if (isEmptyOptions) question.answerOption = {};
      const uniqueQid = `${question.questionName}_${JSON.stringify(
        question.answerOption
      )}`;
      const que = questions ? questions[uniqueQid] : null;
      if (que) {
        answers[question.questionId] = que.answer;
        que.options = question.answerOption;
      } else {
        questionsToBeAnswered.push({
          questionId: question.questionId,
          question: question.questionName,
          options: question.answerOption,
        });
      }
      analyticsManager.incrementQuestionsAnswered();
    });
    if (questionsToBeAnswered.length > 0 && enableGenAi) {
      const answeredQuestions = await answerQuestion(
        questionsToBeAnswered,
        updatedProfile
      );
      answeredQuestions?.forEach((question) => {
        if (
          (typeof question.answer === "string" ||
            typeof question.answer === "number" ||
            question.answer instanceof Array) &&
          question.answer.length !== 0 &&
          Number(question.confidence) > 40
        ) {
          answers[question.questionId] = question.answer;
        } else {
          const index = job.questionnaire.findIndex(
            (que) => que.questionId == question.questionId
          );
          job.questionnaire[index].answer = question.answer;
        }
      });
    }
    //get all the questions job.questionnaire which are not present in answers using question id
    const remainingQuestions = job.questionnaire.filter(
      (question) => !answers[question.questionId]
    );
    if (remainingQuestions.length > 0) {
      for (const question of remainingQuestions) {
        const answer = await getAnswerFromUser(question);
        answers[question.questionId] = answer;
      }
    }

    // Normalize answers based on question type
    for (const question of job.questionnaire) {
      const questionId = question.questionId;
      const answer = answers[questionId];

      if (question.questionType === "Text Box") {
        answers[questionId] = Array.isArray(answer)
          ? answer.join(" ")
          : String(answer || "");
      } else if (
        ["Check Box", "Radio Button", "List Menu"].includes(
          question.questionType
        ) &&
        !Array.isArray(answer)
      ) {
        answers[questionId] = [answer].filter(Boolean); // Wrap non-array answer and handle falsy values
      }
    }

    // Add normalized answers to applyData
    applyData[job.jobId] = { answers };

    // Save the questions in the file
    if (!questions) questions = {};

    job.questionnaire.forEach((question) => {
      const uniqueId = `${question.questionName}_${JSON.stringify(
        question.answerOption
      )}`;
      if (!questions[uniqueId]) {
        questions[uniqueId] = {
          questionId: question.questionId,
          questionName: question.questionName,
          answerOption: question.answerOption,
          questionType: question.questionType,
          answer: answers[question.questionId],
        };
      }
    });

    writeToFile(questions, "questions", profile.id);
  }

  return applyData;
};

const clearJobs = async () => {
  const profile = await localStorage.getItem("profile");
  console.debug("Clearing jobs");
  writeToFile({}, "searchedJobs", profile.id);
  writeToFile({}, "filteredJobIds", profile.id);
};
// main function90

const findNewJobs = async (noOfPages=5, repetitions=1) => {
  spinner.start("Searching for jobs...");
  const preferences = await localStorage.getItem("preferences");
  const profile = await localStorage.getItem("profile");
  clearJobs();
  const searchedJobIds = [];
  const recommendedJobs = getRecommendedJobs();

  const promises = [];
  for (let i = 0; i < noOfPages; i++) {
    const jobs = searchJobs(
      i + 1,
      preferences.desiredRole?.map(encodeURIComponent).join("%2C%20"),
      repetitions
    );
    promises.push(jobs);
  }
  const jobs = await Promise.all(promises);
  jobs.forEach((job) => {
    searchedJobIds.push(...job);
  });
  const recommendedJobIds = await recommendedJobs;
  searchedJobIds.push(...recommendedJobIds);
  const uniqueJobIds = Array.from(new Set(searchedJobIds));
  spinner.succeed(
    `Found total ${uniqueJobIds.length} jobs from ${noOfPages} pages.`
  );
  const jobInfo = await getJobInfo(uniqueJobIds);
  const emailIds = getEmailsIds(jobInfo, profile.id);
  const filteredJobs = filterJobs(jobInfo);
  writeToFile(filteredJobs, "filteredJobIds", profile.id);
  spinner.succeed(`Found ${filteredJobs.length} jobs.`);
  return filteredJobs;
};

const getExistingJobs = async () => {
  const jobsFromFile = await getDataFromFile("filteredJobIds");
  console.log(`Jobs from file : ${jobsFromFile?.length}`);
  if (
    !jobsFromFile ||
    jobsFromFile.length === 0 ||
    Object.keys(jobsFromFile).length === 0
  )
    return [];
  const filteredJobs = jobsFromFile?.filter(
    (job) => !job.isSuitable || job.isApplied
  );
  if (filteredJobs?.length > 0) {
    console.log("Found jobs from file " + filteredJobs.length);
    return filteredJobs;
  } else {
    console.log("No jobs found in file");
    return [];
  }
};

const getResume = async () => {
  try {
    const profile = await localStorage.getItem("profile");
    const response = await getResumeAPI(profile.profile.profileId);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const filename = "Resume.pdf";

    writeToFile(buffer, filename, null, (isBuffer = true));
    return filename;
  } catch (error) {
    console.error("Error fetching resume : ", error.message);
    return null;
  }
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
      matchScore: jobDetails.matchScore,
    }))
    .sort((a, b) => b.maximumSalary - a.maximumSalary);
  return filteredJobs;
};

module.exports = {
  applyForJobs,
  getJobInfo,
  searchJobs,
  searchSimillarJobs,
  getRecommendedJobs,
  handleQuestionnaire,
  clearJobs,
  findNewJobs,
  getExistingJobs,
  getResume,
  filterJobs,
};
