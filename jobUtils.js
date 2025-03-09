const {
  applyJobsAPI,
  searchJobsAPI,
  getJobDetailsAPI,
  getSimJobsAPI,
  loginAPI,
  getRecommendedJobsAPI,
  getProfileDetailsAPI,
} = require("./api");

const {
  writeToFile,
  writeFileData,
  filterJobs,
  getDataFromFile,
  getFileData,
  getAnswerFromUser,
  compressProfile,
  getEmailsIds,
} = require("./utils");
const { getGeminiUserConfiguration, answerQuestion } = require("./gemini");
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
    console.log("There was an error while logging in");
    const data = await response.json();
    const errors = [
      ...(data?.validationErrors || []),
      ...(data?.fieldValidationErrors || []),
    ];
    errors.forEach((error) => {
      console.log(`${error.field}: ${error.message} `);
    });
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const cookies = {};
  const setCookie = response.headers.get("set-cookie");
  const cookie = setCookie.split(";");
  cookie?.forEach((cookieStr) => {
    const [name, value] = cookieStr.split("=");
    cookies[name] = value;
  });

  // writeToFile(cookies.nauk_at, "accessToken", profile.id);
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
          } else {
            console.log(
              `Error fetching job details for Job ID: ${jobId}
              Status: ${response.status}`
            );
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
    const data = await searchJobsAPI(pageNo, keywords).then(async (results) => {
      if (results.status == 200) return results.json();
      else if (results.status == 403) {
        console.log("403 Forbidden : " + results.statusText);
        throw new Error("403 Forbidden");
      } else {
        console.log(await results.json())
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
  console.log("Clearing jobs");
  writeToFile({}, "searchedJobs", profile.id);
  writeToFile({}, "filteredJobIds", profile.id);
};
// main function90

const findNewJobs = async (noOfPages, repetitions) => {
  const preferences = await localStorage.getItem("preferences");
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
      preferences.desiredRole?.map(encodeURIComponent).join("%2C%20"),
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
  const emailIds = getEmailsIds(jobInfo);
  const filteredJobs = filterJobs(jobInfo);
  writeToFile(filteredJobs, "filteredJobIds", profile.id);
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

const getUserProfile = async () => {
  const response = await getProfileDetailsAPI();
  const userData = await response.json();
  return constructUser(userData);
};

const getPreferences = async (user) => {
  let preferences = await getDataFromFile("preferences", user.id);
  let doConfiguration = preferences ? false : true;
  if (preferences)
    doConfiguration = await prompts.select({
      message: "Do you want to configure your preferences ?",
      choices: [
        {
          name: "No",
          value: false,
          description: "Use default preferences",
        },
        {
          name: "Yes",
          value: true,
          description: "Configure your preferences",
        },
      ],
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
    });
    preferences.matchStrategy = matchStrategy;
  }
  let enableGenAi = doConfiguration ? null : preferences.enableGenAi;
  if (enableGenAi === null || enableGenAi === undefined) {
    let enableGenAi = await prompts.select({
      message: "Would you like to enable Gen Ai based question answering ?",
      choices: [
        {
          name: "Yes",
          value: true,
          description: "Use gen ai model to generate answers for questions asked in job application"
        },
        {
          name: "No",
          value: false,
          description: "Skip gen ai setup."
        }
      ]
    });
    preferences.enableGenAi = false;
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
        const { config, enableGenAi } = await getGeminiUserConfiguration(preferences);
        preferences.genAiConfig = config;
        preferences.enableGenAi = enableGenAi;
      }
      preferences.genAiModel = res;
      preferences.matchStrategy = matchStrategy;
    } else {
      const enableManualAnswering = await prompts.select({
        message: "Would you like to manually answer the questions?",
        choices: [
          { name: "No", value: false, description: "Jobs which require question answering will be skipped." },
          { name: "Yes", value: true, description: "You will have to enter the answers manually. (Not recommended, defeats the purpose of automation :) )" },
        ],
        description: "Selecting no will result skipping the jobs which require question answering."
      });
      preferences.enableManualAnswering = enableManualAnswering;
      
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

  if (doConfiguration || desiredRoles === "None" || keywords === "None") {
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
  if (doConfiguration || !preferences.noOfPages || !preferences.dailyQuota) {
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
      noticePeriod: apiData.profile[0]?.noticePeriod?.value,
      noticeEndDate: apiData.noticePeriod[0]?.noticeEndDate,
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
  return { user, preferences };
};

const manageProfiles = async (profile, loginInfo) => {
  const profiles = await getFileData("profiles");
  const data = {
    id: profile.id,
    creds: loginInfo.creds,
  };
  if (!profiles) {
    writeFileData([data], "profiles");
    return [data];
  }
  const profileIndex = profiles.findIndex((p) => p.id === profile.id);

  if (profileIndex !== -1) {
    profiles[profileIndex] = { ...profiles[profileIndex], ...data };
  } else {
    profiles.push(data);
  }
  return profiles;
};

module.exports = {
  login,
  applyForJobs,
  getJobInfo,
  searchJobs,
  searchSimillarJobs,
  getRecommendedJobs,
  handleQuestionnaire,
  clearJobs,
  findNewJobs,
  getExistingJobs,
  getUserProfile,
  constructUser,
  manageProfiles,
};
