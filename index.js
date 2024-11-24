const {
  applyJobsAPI,
  searchJobsAPI,
  getJobDetailsAPI,
  getSimJobsAPI,
  loginAgainAPI,
  loginAPI,
} = require("./api");

const {
  askQuestion,
  writeToFile,
  chunkArray,
  filterJobs,
  getDataFromFile,
  rl,
} = require("./utils");
const { checkSuitability, answerQuestion, answerQuestion2 } = require("./gemini");
const { profiles } = require("./data/profiles");

const noOfPages = 1;
const repetitions = 1;
var authorization = getDataFromFile("accessToken");
const profile = profiles[0];

const searchSimillarJobs = async (jobIds) => {
  let simillarJobIds = [];
  if (jobIds.length == 0) return simillarJobIds;
  const jobs = [];
  for (const jobId of jobIds) {
    const response = await getSimJobsAPI(jobId, authorization);
    if (response.status === 200) {
      const data = await response.json();
      const jobIdsArr = data.simJobDetails.content.map((job) => job.jobId);
      jobs.push(...jobIdsArr);
    } else {
      console.log("Error in fetching similar jobs:");
      console.log(response);
      throw new Error("403 Forbidden");
    }
    // Wait for 200ms before making the next request
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  // jobs.forEach((job) => {
  //   job.simJobDetails.content.forEach((job) => {
  //     simillarJobIds.push(job.jobId);
  //   });
  // });
  return jobs;
};

//Search all the jobs
const searchJobs = async (pageNo, keywords) => {
  try {
    const data = await searchJobsAPI(pageNo, keywords, authorization).then(
      (results) => {
        if (results.status == 200) return results.json();
        else if (results.status == 403) {
          console.log("403 Forbidden : " + results.statusText);
          throw new Error("403 Forbidden");
        }
      }
    );

    if (!data?.jobDetails) {
      console.log(data);
      return [];
    }
    const jobIds = data.jobDetails.map((job) => job.jobId);
    console.log(`Found ${jobIds.length} jobs on page ${pageNo}`);
    let simillarJobs = [...jobIds];
    console.log(`Searching for simillar jobs for ${repetitions} times`);
    for (let i = 1; i <= repetitions; i++) {
      simillarJobs = await searchSimillarJobs(simillarJobs);
      jobIds.push(...simillarJobs);
    }
    console.log(
      "Simillar jobs found : " +
        simillarJobs.length +
        " jobs : " +
        jobIds.length
    );
    // const uniqueJobIds = Array.from(new Set(jobIds));
    console.log(
      `Found ${jobIds.length} jobs in total from ${repetitions} repetitions on page ${pageNo}`
    );

    return jobIds;
  } catch (error) {
    console.log(error);
    if (error.message == "403 Forbidden") throw new Error("403 Forbidden");
    return [];
  }
};

const getJobInfo = async (jobIds) => {
  const jobInfo = [];
  for (const jobId of jobIds) {
    try {
      const response = await getJobDetailsAPI(jobId, authorization);
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
      }
      console.log(`Completed ${jobInfo.length} jobs out of ${jobIds.length}`);
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (e) {
      console.log(e);
    }
  }
  writeToFile(jobInfo, "searchedJobs");
  return jobInfo;
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

  const response = await applyJobsAPI(bodyStr, authorization);

  if (response.status == 401 || response.status == 403) {
    throw new Error(response.status);
  }

  const data = await response.json();
  if (!data.jobs) {
    throw new Error(`Already applied for job`);
  }
  return data;
};

const handleQuestionnaire2 = async (data) => {
  const applyData = {};
  const questions = await getDataFromFile("questions");

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
        questionsToBeAnswered.push(question);
      }
    });
    if (questionsToBeAnswered.length > 0) {
      const answeredQuestions = answerQuestion2(questionsToBeAnswered, profile);
      answeredQuestions.forEach((question) => {
        answers[question.questionId] = question.answer;
      });
    }
    applyData[job.jobId] = { answers: answers };
  }
  return applyData;
};

const handleQuestionnaire = async (data) => {
  const applyData = {};
  const questions = await getDataFromFile("questions");
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
            writeToFile(questions, "questions");
            // debugger;
          }
        }
        applyData[job.jobId] = { answers: answers };
      }
    }
  }
  // console.log("applyData : " + JSON.stringify(applyData));
  writeToFile(questions, "questions");
  return applyData;
};

//Login again
const loginAgain = async () => {
  const response = await loginAgainAPI();
  return true || response.status == "200";
};

const clearJobs = async () => {
  writeToFile({}, "searchedJobs");
  writeToFile({}, "filteredJobs");
};
// main function
const doTheStuff = async () => {
  const jobIds = [];
  try {
    console.log("Mission Job Switch Started...");
    const ans = await askQuestion(
      `Would you like to search for new jobs (Y/N) ?`
    );
    if (ans == "N") {
      const jobsFromFile = await getDataFromFile("filteredJobIds");
      if (jobsFromFile.length > 0) {
        console.log("Found jobs from file " + jobsFromFile.length);
        jobIds.push(...jobsFromFile);
      }
    } else {
      clearJobs();
      const searchedJobIds = [];
      for (let i = 0; i < noOfPages; i++) {
        console.log(`Searching for jobs in page ${i + 1}`);
        const jobs = await searchJobs(
          i + 1,
          profile.keywords?.map(encodeURIComponent).join("%2C%20")
        );
        searchedJobIds.push(...jobs);
      }
      const uniqueJobIds = Array.from(new Set(searchedJobIds));
      console.log(
        `Found total ${jobIds.length} jobs from ${noOfPages} pages out of which ${uniqueJobIds.length} are unique`
      );
      const jobInfo = await getJobInfo(uniqueJobIds);
      const filteredJobs = filterJobs(jobInfo);
      if (filteredJobs.length == 0) {
        return;
      }
      writeToFile(filteredJobs, "filteredJobIds");
      jobIds.push(...filteredJobs);
    }
    for (let i = 0; i < jobIds.length; i++) {
      try {
        console.log(`Applied Count : ${i} of ${jobIds.length}`);
        console.log(
          `Applying for ${jobIds[i].jobTitle} in  ${jobIds[i].companyName}`
        );
        const jobsSlot = [jobIds[i]];
        if (jobIds[i].isSuitable == false || jobIds[i].isApplied == true) {
          console.log("Skipping as not suitable or already applied");
          continue;
        }
        let ans = {
          isSuitable: true,
        };
        if (jobIds[i].isSuitable) ans.isSuitable = true;
        else {
          const res = await askQuestion(`Is this job suitable ?\n`);
          if (res !== "") ans.isSuitable = false;
          else ans.isSuitable = true;
        }
        // else ans = await checkSuitability(jobIds[i]);
        console.log(
          `Suitability for ${jobIds[i].jobTitle} : ${ans.isSuitable}`
        );
        if (!ans.isSuitable) {
          console.log("Skipped as not suitable");
          jobIds[i].isSuitable = false;
          continue;
        }
        const result = await applyForJobs(jobsSlot);

        // if (result == "Login") {
        //   console.log("login error");
        //   console.log(result);
        //   await loginFlow(profile.creds);
        //   continue;
        // }
        if (!result) {
          console.log("result undefined");
          continue;
        }
        if (!result.jobs) {
          throw new Error("409001");
        }
        debugger;
        if (result.jobs[0].status !== 200) {
          const questionnaire = await handleQuestionnaire2(result);
          const finalResult = await applyForJobs(jobsSlot, questionnaire);
          debugger;
        }
        jobIds[i].isApplied = true;
      } catch (e) {
        if (e.message == 200 || e.message == 409001) {
          console.log(e.message);
        } else if (e.message == 403) {
          throw new Error(e);
        } else if (e.message == 401) {
          debugger;
          await loginFlow(profile.creds);
          i--;
          continue;
        } else {
          console.log(e.message);
        }
      } finally {
        // debugger;
        jobIds[i].isApplied = true;
        writeToFile(jobIds, "filteredJobIds");
      }
    }
  } catch (e) {
    console.log(e);
  } finally {
    writeToFile(jobIds, "filteredJobIds");
    rl.close();
  }
};

// process.exit()

const loginFlow = async (creds) => {
  const ans = await askQuestion(`Should I start ?`);
  const response = await loginAPI(creds);
  if (!response.ok) {
    console.log(response);
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const cookies = {};
  response.headers.getSetCookie().forEach((cookieStr) => {
    const [name, value] = cookieStr.split(";")[0].split("=");
    cookies[name] = value;
  });

  writeToFile(cookies.nauk_at, "accessToken");
  authorization = cookies.nauk_at;
};

const startProgram = async () => {
  await loginFlow();
  doTheStuff();
};

startProgram();
