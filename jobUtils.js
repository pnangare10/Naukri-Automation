const {
  applyJobsAPI,
  searchJobsAPI,
  getJobDetailsAPI,
  getSimJobsAPI,
  loginAgainAPI,
  loginAPI,
  getRecommendedJobsAPI,
  getProfileDetailsAPI,
} = require("./api");

const {
  askQuestion,
  writeToFile,
  writeFileData,
  chunkArray,
  filterJobs,
  getDataFromFile,
  getFileData,
  rl,
  selectProfile,
  selectedProfile,
  matchingMethods,
  matchingStrategy,
} = require("./utils");
const {
  checkSuitability,
  answerQuestion,
  answerQuestion2,
  getGeminiUserConfiguration,
  initializeGeminiModel,
} = require("./gemini");
const { localStorage } = require("./helper");
const prompts = require("@inquirer/prompts");

const login = async (profile) => {
  if (!profile?.creds) {
    const email = await prompts.input({ message: "Enter your email : " });
    const password = await prompts.password({
      message: "Enter your password : ",
    });
    profile = { creds: { username: email, password: password } };
  }
  const response = await loginAPI(profile.creds);
  if (!response.ok) {
    console.error(response);
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const cookies = {};
  response.headers.getSetCookie().forEach((cookieStr) => {
    const [name, value] = cookieStr.split(";")[0].split("=");
    cookies[name] = value;
  });

  // writeToFile(cookies.nauk_at, "accessToken", profile.id);
  localStorage.setItem("authorization", cookies.nauk_at);
  console.log("Logged in successfully");
  const loginInfo = {
    creds: profile.creds,
    authorization: cookies.nauk_at,
  };
  return loginInfo;
};

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
  const jobInfo = [];

  try {
    for (let i = 0; i < jobIds.length; i += batchSize) {
      const batch = jobIds.slice(i, i + batchSize);

      // Process the current batch in parallel
      const batchPromises = batch.map(async (jobId) => {
        try {
          const response = await getJobDetailsAPI(jobId);
          if (response.status === 200) {
            const data = await response.json();
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
              };
            }
          } else if (response.status === 403) {
            console.log("403 Forbidden:", response);
            throw new Error("403 Forbidden");
          } else if (response.status === 303) {
            const data = await response.json();
            if (data?.metaSearch?.isExpiredJob === "1") {
              process.stdout.write("Expired Job \r");
            }
          }
          return null; // Return null if no valid job data is found.
        } catch (error) {
          console.error(
            `Error fetching job details for Job ID: ${jobId}`,
            error
          );
          return null; // Return null on error to avoid failing the entire batch.
        }
      });

      const batchResults = await Promise.all(batchPromises);
      // debugger;
      // Add the results of the current batch to the overall jobInfo array
      jobInfo.push(...batchResults.filter((job) => job !== null));

      // Print progress after each batch
      process.stdout.write(
        `Completed ${jobInfo.length} jobs out of ${jobIds.length} \r`
      );
    }

    // Write the results to a file
    writeToFile(jobInfo, "searchedJobs", profile.id);

    return jobInfo;
  } catch (error) {
    console.error("Unexpected error while fetching job info:", error);
    throw error;
  }
};

//Search all the jobs
const searchJobs = async (pageNo, keywords, repetitions) => {
  try {
    const data = await searchJobsAPI(pageNo, keywords).then((results) => {
      if (results.status == 200) return results.json();
      else if (results.status == 403) {
        console.log("403 Forbidden : " + results.statusText);
        throw new Error("403 Forbidden");
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
    console.error(error);
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
      console.error(`Error fetching jobs for cluster: ${cluster}`, error);
      return []; // Return an empty array on error to avoid failing all promises.
    }
  });

  const allJobIds = await Promise.all(jobPromises);
  const jobIds = allJobIds.flat(); // Flatten the array of arrays into a single array.
  return jobIds;
};

const handleQuestionnaire2 = async (data) => {
  const applyData = {};
  const profile = localStorage.getItem("profile");
  const questions = await getDataFromFile("questions", profile.id);

  for (const job of data.jobs) {
    const answers = {};
    const questionsToBeAnswered = [];
    job.questionnaire.forEach((question) => {
      const uniqueQid = `${question.questionName}_${JSON.stringify(
        question.answerOption
      )}`;
      const que = questions ? questions[uniqueQid] : null;
      if (que) {
        answers[question.questionId] = que.answer;
        que.options = question.answerOption;
        console.log(
          `Already answered ${question.questionName}: \n---> ${que.answer}`
        );
      } else {
        questionsToBeAnswered.push({
          questionId: question.questionId,
          question: question.questionName,
          options: question.answerOption,
        });
      }
    });
    if (questionsToBeAnswered.length > 0) {
      const answeredQuestions = await answerQuestion2(
        questionsToBeAnswered,
        profile
      );
      answeredQuestions?.forEach((question) => {
        answers[question.questionId] = question.answer;
      });
    }
    applyData[job.jobId] = { answers: answers };
  }
  return applyData;
};

const handleQuestionnaire = async (data) => {
  const applyData = {};
  const profile = localStorage.getItem("profile");
  const questions = await getDataFromFile("questions", profile.id);
  // const questionsMap = {};
  // for (const qId in questions) {
  //   const question = questions[qId];
  //   questionsMap[question.question] = question;
  // }
  for (const job of data.jobs) {
    if (job.status == "200" || job.status == "409001") {
      throw new Error(job.status);
    } else {
      console.log(
        `Applying for ${job.companyName}\nJob Title : ${job.jobTitle}\n`
      );
      if (job.questionnaire.length > 0) {
        const answers = {};
        for (const question of job.questionnaire) {
          const uniqueQid = `${question.questionName}_${JSON.stringify(
            question.answerOption
          )}`;
          // const que = Object.values(questions).find((item) => (item.question == question.questionName && JSON.stringify(item.options) == JSON.stringify(question.answerOption)));
          // const que = q ?? questions.find((item) => item.question == question.questionName);
          // const que = q ?? questionsMap[question.questionName];
          const que = questions[uniqueQid];
          if (que) {
            answers[question.questionId] = que.answer;
            que.options = question.answerOption;
            console.log(
              `Already answered ${question.questionName}: \n---> ${que.answer}`
            );
          } else {
            // Take the answer from user through console
            // console.log("Please answer the following question");
            // console.log(question.questionName);
            // const ans = await prompts.input({message:
            //   `${JSON.stringify(question.answerOption)}\n`
            // });
            console.log(
              "Taking help from Recruiter Assistant to answer the question"
            );
            const ans = await answerQuestion(
              question.questionName,
              question.answerOption,
              profile
            );
            console.log({
              question: question.questionName,
              options: question.answerOption,
              answer: ans.answer,
            });

            const res = await prompts.input({
              message: `Please confirm the answer ?`,
            });
            if (res !== "") {
              if (
                question.questionType === "List Menu" ||
                question.questionType === "Check Box"
              ) {
                ans.answer = [res];
              } else {
                ans.answer = res;
              }
            }
            answers[question.questionId] = ans.answer;
            // }
            questions[uniqueQid] = {
              question: question.questionName,
              answer: answers[question.questionId],
              options: question.answerOption,
              type: question.questionType,
            };
            writeToFile(questions, "questions", profile.id);
            // ;
          }
        }
        applyData[job.jobId] = { answers: answers };
      }
    }
  }
  // console.log("applyData : " + JSON.stringify(applyData));
  writeToFile(questions, "questions", profile.id);
  return applyData;
};

const clearJobs = async () => {
  const profile = await localStorage.getItem("profile");
  console.log("Clearing jobs");
  writeToFile({}, "searchedJobs", profile.id);
  writeToFile({}, "filteredJobIds", profile.id);
};
// main function90

const findNewJobs = async (noOfPages, repetitions) => {
  const profile = await localStorage.getItem("profile");
  clearJobs();
  const searchedJobIds = [];
  getRecommendedJobs().then((recommendedJobs) => {
    searchedJobIds.push(...recommendedJobs);
    console.log(`Found ${recommendedJobs.length} recommended jobs`);
  });
  const promises = [];
  for (let i = 0; i < noOfPages; i++) {
    const jobs = searchJobs(
      i + 1,
      profile.desiredRole?.map(encodeURIComponent).join("%2C%20"),
      repetitions
    );
    promises.push(jobs);
  }
  const jobs = await Promise.all(promises);
  jobs.forEach((job) => {
    searchedJobIds.push(...job);
  });
  const uniqueJobIds = Array.from(new Set(searchedJobIds));
  console.log(
    `Found total ${uniqueJobIds.length} jobs from ${noOfPages} pages.`
  );
  const jobInfo = await getJobInfo(uniqueJobIds);
  const filteredJobs = filterJobs(jobInfo);
  writeToFile(filteredJobs, "filteredJobIds", profile.id);
  return filteredJobs;
};

const getExistingJobs = async () => {
  const jobsFromFile = await getDataFromFile("filteredJobIds");
  console.log("Jobs from file : ");
  console.log(jobsFromFile.length);
  const filteredJobs = jobsFromFile?.filter(
    (job) => !job.isSuitable || job.isApplied
  );
  if (filteredJobs.length > 0) {
    console.log("Found jobs from file " + filteredJobs.length);
    return filteredJobs;
  } else {
    console.log("No jobs found in file");
    return [];
  }
};

const getUserProfile = async () => {
  const response = await getProfileDetailsAPI();
  const userData = await response.json();
  const profile = await constructUser(userData);
  localStorage.setItem("profile", profile);
  return profile;
};

const getPreferences = async (user) => {
  let preferences = await getDataFromFile("preferences", user.id);
  let doConfiguration = preferences ? false : true;
  if (preferences)
    doConfiguration = await prompts.confirm({
      message: "Do you want to configure your preferences ?",
      default: false,
    });
  if (!preferences) {
    preferences = {};
  }
  let matchStrategy = doConfiguration ? null : preferences.matchStrategy;
  if (!matchStrategy) {
    matchStrategy = await prompts.select({
      message: "Select a strategy to match the jobs",
      choices: [
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
        {
          name: "Keywords Matching",
          value: "keywords",
          description:
            "Match the jobs with keywords provided by you and title of the job",
        },
      ],
    });
    preferences.matchStrategy = matchStrategy;
  }
  let enableGenAi = doConfiguration ? null : preferences.enableGenAi;
  if (enableGenAi === null || enableGenAi === undefined) {
    enableGenAi = await prompts.confirm({
      message: "Would you like to enable Gen Ai based question answering ?",
    });
    if (enableGenAi || matchStrategy === "ai") {
      let res = await prompts.select({
        message: "Please select gen ai model to use",
        choices: [
          { name: "Google Gemini Model", value: "gemini" },
          { name: "ChatGPT", value: "chatgpt" },
        ],
      });
      if (res !== "gemini") {
        console.log(
          "There is only gemini model implementation available currently, selecting gemini as default"
        );
        res = "gemini";
      }
      if (res === "gemini") {
        const config = await getGeminiUserConfiguration();
        initializeGeminiModel(config);
        preferences.genAiConfig = config;
      }
      preferences.enableGenAi = true;
      preferences.genAiModel = res;
      preferences.matchStrategy = matchStrategy;
    } else {
      preferences.enableGenAi = false;
    }
  }

  if (!preferences?.desiredRole)
    preferences.desiredRole = user.profile.desiredRole;
  const desiredRoles = preferences.desiredRole
    ? preferences.desiredRole.join(", ")
    : "None";

  if (!preferences?.keywords) {
    preferences.keywords = user.profile.keySkills
      .split(",")
      .map((skill) => skill.trim());
  }
  const keywords = preferences.keywords
    ? preferences.keywords.join(", ")
    : "None";

  if (doConfiguration || (desiredRoles === "None" || keywords === "None")) {
    let res = await prompts.input({
      message: `Here are current desired roles:
    ${desiredRoles}
    Please enter more desired roles in comma separated format
    Hit enter to skip\n`,
    });
    // debugger;
    if (res !== "") {
      res.split(",").forEach((role) => {
        preferences.desiredRole.push(role.trim());
      });
    }

    res = await prompts.input({
      message: `Current keywords to match the jobs:
    ${keywords}
    Please enter more keywords to match the jobs in comma separated format
    Hit enter to skip
    Note: Include variation of the keywords as well to match correctly.\n`,
    });

    if (res !== "") {
      res.split(",").forEach((keyword) => {
        preferences.keywords.push(keyword.trim());
      });
    }
  }
  if(doConfiguration || preferences.noOfPages || preferences.dailyQuota) {
    let res = await prompts.number({
      message: "Enter the number of pages to search for jobs",
      default: 5,
      min: 1,
      max: 10,
    });
    preferences.noOfPages = res;
    res = await prompts.number({
      message: "Enter the number of jobs to apply for on daily basis",
      default: 40,
      min: 1,
      max: 50,
    });
    preferences.dailyQuota = res;
  }

  writeToFile(preferences, "preferences", user.id);
  localStorage.setItem("preferences", preferences);
  return preferences;
};

const constructUser = async (apiData) => {
  const user = {
    id: apiData.profile[0].name,
    userDetails: {
      email: apiData.user.email,
      mobile: apiData.user.mobile,
      name: apiData.profile[0].name,
    },
    skills: apiData.itskills.map((skill) => ({
      skillName: skill.skill,
      experienceYears: skill.experienceTime.year,
      experienceMonths: skill.experienceTime.month,
    })),
    education: apiData.educations.map((edu) => ({
      degree: edu.course.value,
      specialization: edu.specialisation.value,
      institute: edu.institute,
      marks: edu.marks,
      startYear: edu.yearOfStart,
      completionYear: edu.yearOfCompletion,
    })),
    employmentHistory: apiData.employments.map((emp) => ({
      designation: emp.designation,
      organization: emp.organization,
      startDate: emp.startDate,
      endDate: emp.endDate || "Present",
      jobDescription: emp.jobDescription,
    })),
    schools: apiData.schools.map((school) => ({
      board: school.schoolBoard.value,
      completionYear: school.schoolCompletionYear,
      percentage: school.schoolPercentage.value,
      educationType: school.educationType.value,
    })),
    languages: apiData.languages.map((lang) => ({
      language: lang.lang,
      proficiency: lang.proficiency.value,
      abilities: lang.ability,
    })),
    profile: {
      keySkills: apiData.profile[0].keySkills,
      birthDate: apiData.profile[0].birthDate,
      gender: apiData.profile[0].gender == "M" ? "Male" : "Female",
      maritalStatus: apiData.profile[0].maritalStatus.value,
      pinCode: apiData.profile[0].pincode,
      desiredRole: apiData.profile[0].desiredRole.map((role) => role.value),
      locationPreference: apiData.profile[0].locationPrefId.map(
        (loc) => loc.value
      ),
      expectedCtc: Number(apiData.profile[0].absoluteExpectedCtc),
      disability:
        apiData.profile[0].disability.isDisabled == "N" ? "No" : "Yes",
      noticePeriod: apiData.profile[0].noticePeriod.value,
      currentCtc: Number(apiData.profile[0].absoluteCtc),
      totalExperience: {
        year: apiData.profile[0].experience.year,
        month: apiData.profile[0].experience.month,
      },
      desiredRole: apiData.profile[0].desiredRole.map((role) => role.value),
      currentLocation: ` ${apiData.profile[0].city.value}, ${apiData.profile[0].country.value}`,
    },
  };
  const preferences = await getPreferences(user);
  user.desiredRole = preferences.desiredRole;
  user.keywords = preferences.keywords;
  return user;
};

const manageProfiles = async (profile, loginInfo) => {
  const profiles = await getFileData("profiles");
  const data = {
    id: profile.id,
    creds: loginInfo.creds,
  };
  if (!profiles) {
    writeFileData([data], "profiles");
    return;
  }
  const profileIndex = profiles.findIndex((p) => p.id === profile.id);

  if (profileIndex !== -1) {
    profiles[profileIndex] = { ...profiles[profileIndex], ...data };
  } else {
    profiles.push(data);
  }
  writeFileData(profiles, "profiles");
};

module.exports = {
  login,
  applyForJobs,
  getJobInfo,
  searchJobs,
  searchSimillarJobs,
  getRecommendedJobs,
  handleQuestionnaire,
  handleQuestionnaire2,
  clearJobs,
  findNewJobs,
  getExistingJobs,
  getUserProfile,
  constructUser,
  manageProfiles,
};
