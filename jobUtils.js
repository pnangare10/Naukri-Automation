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
} = require("./gemini");

const localStorage = require("./localStorage");

const login = async (profile) => {
  if (!profile?.creds) {
    const email = await askQuestion("Enter your email : ");
    const password = await askQuestion("Enter your password : ");
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

const getJobInfo = async (jobIds) => {
  const profile = localStorage.getItem("profile");
  const jobInfo = [];
  for (const jobId of jobIds) {
    try {
      const response = await getJobDetailsAPI(jobId);
      if (response.status == 200) {
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
          jobInfo.push({
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
          });
        }
      } else if (response.status == 403) {
        console.log("403 Forbidden : " + response.statusText);
        throw new Error("403 Forbidden");
      } else if (response.status == 303) {
        const data = await response.json();
        if (data?.metaSearch?.isExpiredJob == "1") {
          process.stdout.write("Expired Job \r");
        }
      }
      // only print these statement for every 5 jobs or at the end
      // if (jobInfo.length % 10 == 0 || jobInfo.length == jobIds.length) {
      process.stdout.write(
        `Completed ${jobInfo.length} jobs out of ${jobIds.length} \r`
      );
      // }
      // await new Promise((resolve) => setTimeout(resolve, 50));
    } catch (e) {
      console.log(e);
    }
  }
  writeToFile(jobInfo, "searchedJobs", profile.id);
  return jobInfo;
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
    // console.log(
    //   "Simillar jobs found : " +
    //     simillarJobs.length +
    //     " jobs : " +
    //     jobIds.length
    // );
    // const uniqueJobIds = Array.from(new Set(jobIds));
    console.log(
      `Found ${jobIds.length} jobs in total from ${repetitions} repetitions on page ${pageNo}`
    );

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
  const jobIds = [];
  const response = await getRecommendedJobsAPI(null);
  if (response.status !== 200) {
    return [];
  }
  const data = await response.json();
  const clusters = data.recommendedClusters?.map(
    (cluster) => cluster.clusterId
  ); //["profile", "apply", "preference", "similar_jobs"];

  for (const cluster of clusters) {
    try {
      const response = await getRecommendedJobsAPI(cluster);
      if (response.status !== 200) {
        console.error("Error in fetching recommended jobs:", response);
        continue;
      }
      const data = await response.json();
      // ;
      const jobIdsArr = data.jobDetails?.map((job) => job.jobId);
      jobIds.push(...(jobIdsArr ?? []));
    } catch (error) {
      console.error(`Error fetching jobs for cluster: ${cluster}`, error);
      throw error; // Optional: Decide if you want to stop or continue on errors.
    }
  }

  console.log(`Found ${jobIds.length} recommended jobs`);
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
      const que = questions[uniqueQid];
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
    // ;
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
            // const ans = await askQuestion(
            //   `${JSON.stringify(question.answerOption)}\n`
            // );
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

            const res = await askQuestion(`Please confirm the answer ?`);
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
  const recommendedJobs = await getRecommendedJobs();
  searchedJobIds.push(...recommendedJobs);
  for (let i = 0; i < noOfPages; i++) {
    // console.log(`Searching for jobs in page ${i + 1}`);
    const jobs = await searchJobs(
      i + 1,
      profile.desiredRole?.map(encodeURIComponent).join("%2C%20"),
      repetitions
    );
    searchedJobIds.push(...jobs);
  }
  const uniqueJobIds = Array.from(new Set(searchedJobIds));
  console.log(
    `Found total ${searchedJobIds.length} jobs from ${noOfPages} pages out of which ${uniqueJobIds.length} are unique`
  );
  const jobInfo = await getJobInfo(uniqueJobIds);
  const filteredJobs = filterJobs(jobInfo);
  if (filteredJobs.length == 0) {
    return;
  }
  writeToFile(filteredJobs, "filteredJobIds", profile.id);
  return filteredJobs;
};

const getExistingJobs = async () => {
  const jobsFromFile = await getDataFromFile("filteredJobIds");
  console.log("Jobs from file : ");
  console.log(jobsFromFile.length);
  const filteredJobs = jobsFromFile?.filter(
    (job) => (job) => !job.isSuitable || job.isApplied
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
  debugger;
  if (!preferences) {
    preferences = {};
  }
  if (!preferences?.desiredRole)
    preferences.desiredRole = user.profile.desiredRole;

  const desiredRoles = preferences.desiredRole
    ? preferences.desiredRole.join(", ")
    : "None";
  let res = await askQuestion(
    `Here are current desired roles:
    ${desiredRoles}
    Please enter more desired roles
    Hit enter to skip\n`
  );

  if (res !== "") {
    res.split(",").forEach((role) => {
      preferences.desiredRole.push(role.trim());
    });
  }

  if (!preferences?.keywords) {
    preferences.keywords = user.profile.keySkills
      .split(",")
      .map((skill) => skill.trim());
  }

  const keywords = preferences.keywords
    ? preferences.keywords.join(", ")
    : "None";
  res = await askQuestion(
    `Current keywords to match the jobs:
    ${keywords}
    Please enter more keywords to match the jobs
    Hit enter to skip
    Note: Include variation of the keywords as well to match correctly.\n`
  );

  if (res !== "") {
    res.split(",").forEach((keyword) => {
      preferences.keywords.push(keyword.trim());
    });
  }
  writeToFile(preferences, "preferences", user.id);
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
