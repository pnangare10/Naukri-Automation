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
// const open = require('open');
const { checkSuitability, answerQuestion } = require("./gemini");
const { profiles } = require("./data/profiles");

const noOfPages = 1;
const repetitions = 1;
const skills = `React Js, Javascript, Material UI, HTML5, CSS, Java, Frontend Development, Redux, Full Stack developer, Bootstrap, jQuery, MySQL, UI Developer, REST`;
var authorization = getDataFromFile("accessToken");
const profile = profiles[0];
const keywords = `react%20js%2C%20javascript%2C%20front%20end%20developer%2C%20ui%20development%2C%20redux%2C%20frontend%20development`

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
    const data = await searchJobsAPI(pageNo, keywords, authorization).then((results) => {
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
  try {
    //change this code to apply maximum 5 jobs at a time
    const jobsArr = jobs.map((job) => job.jobId);
    console.log(jobsArr);
    let bodyStr;
    console.log("applyData before call : " + JSON.stringify(applyData));
    if (applyData && applyData.length > 0) {
      bodyStr = `{"strJobsarr":${JSON.stringify(
        jobsArr
      )},"applyData":${JSON.stringify(applyData)}`;
      console.log("bodyStr -> ");
      console.log(JSON.stringify(bodyStr));
    } else {
      bodyStr = `{"strJobsarr":${JSON.stringify(jobsArr)}`;
    }
    // console.log(bodyStr);
    const response = await applyJobsAPI(bodyStr, authorization);
    // console.log("After the api");
    debugger;
    console.log('got the response');
    console.log(JSON.stringify(response));
    if (response.status == 401) {
      //Need to login again
      return "Login";
    }
    if (response.status == 403) {
      throw new Error({
        message: "Your daily quota limit exceeded",
        code: 403,
      });
    }
    // console.log(response);
    const data = await response.json();
    // console.log(data);
    if (!data.jobs) {
      throw new Error(`Already applied for job`);
    }
    console.log(
      "applyData : " + JSON.stringify(data.chatbotResponse?.applyData)
    );
    return data;
  } catch (e) {
    console.log(e);
    return;
  }
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
      throw new Error({
        code: job.status,
        message: `Already Applied for ${job.jobTitle}`,
      });
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
          const que = questions[uniqueQid];
          // const que = q ?? questions.find((item) => item.question == question.questionName);
          // const que = q ?? questionsMap[question.questionName];
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
            console.log(
              JSON.stringify({
                question: question.questionName,
                options: question.answerOption,
                answer: ans.answer,
              })
            );
            // if (
            //   question.questionType === "List Menu" ||
            //   question.questionType === "Check Box"
            // ) {
            //   answers[question.questionId] = [ans];
            // } else {
            answers[question.questionId] = ans.answer;
            // }
            questions[uniqueQid] = {
              question: question.questionName,
              answer: answers[question.questionId],
              options: question.answerOption,
              type: question.questionType,
            };
          }
        }
        applyData[job.jobId] = answers;
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
}
// main function
const doTheStuff = async () => {

  const jobIds = [];
  try {
    console.log("Mission Job Switch Started...");
    const ans = await askQuestion(`Would you like to search for new jobs (Y/N) ?`);
    if (ans == 'N') {
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
        const jobs = await searchJobs(i + 1, profile.keywords);
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
      console.log("Writing filtered jobs to file");
      console.log("after filtering the jobs");
      // console.log(JSON.stringify(filteredJobs));
      writeToFile(filteredJobs, "filteredJobIds");
      jobIds.push(...filteredJobs);
    }
    // return;
    const jobsSlottedArr = chunkArray(jobIds, 1);
    console.log(jobsSlottedArr.length);
    // jobsSlottedArr.forEach(async (jobsSlot) => {
    for (let i = 0; i < jobIds.length; i++) {
      try {
        console.log(`Applied Count : ${i} of ${jobIds.length}`);
        console.log(`Applying for ${jobIds[i].jobTitle} in  ${jobIds[i].companyName}`)
        const jobsSlot = [jobIds[i]];
        // const ans = await askQuestion(`Applying for ${jobIds[i].jobTitle} }\n`);
        if (jobIds[i].isSuitable == false || jobIds[i].isApplied == true) {
          console.log("Skipping as not suitable or already applied");
          continue;
        }
        let ans;
        if (jobIds[i].isSuitable) ans = { isSuitable: true };
        else ans = await checkSuitability(jobIds[i]);
        console.log(
          `Suitability for ${jobIds[i].jobTitle} : ${JSON.stringify(ans)}`
        );
        if (!ans.isSuitable) {
          console.log("Skipped as not suitable");
          jobIds[i].isSuitable = false;
          continue;
        }
        const result = await applyForJobs(jobsSlot);
        console.log(JSON.stringify(result));

        if (result == "Login") {
          console.log("login error");
          console.log(result);
          loginFlow(profile.creds);
          continue;
        }
        if (!result) {
          console.log("result undefined");
          continue;
        }
        if (!result.jobs) {
          // console.log(`Already Applied for ${jobIds[i].jobTitle}`)
          // continue;
          throw new Error({
            code: 409001,
            message: `Already Applied for ${jobIds[i].jobTitle}`,
          });
        }
        // continue;
        //wait for 100 ms
        const questionnaire = await handleQuestionnaire(result);
        console.log("final apply to job");
        const finalResult = await applyForJobs(jobsSlot, questionnaire);
        console.log(JSON.stringify(finalResult));
      } catch (e) {
        if (e.code == 200 || e.code == 409001) {
          //delete
          // jobIds.splice(i, 1);
          // i--;
          jobIds[i].isApplied = true;
          console.log(e.message);
        } else if (e.code == 403) {
          throw new Error(e);
        } else {
          console.log(e);
        }
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

async function loginFlow(creds) {
  // const ans = await askQuestion(`Should I start ?`);
  const response = await loginAPI(creds);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const cookies = {};
  response.headers.getSetCookie().forEach((cookieStr) => {
    const [name, value] = cookieStr.split(";")[0].split("=");
    cookies[name] = value;
  });

  console.log(cookies.nauk_at);
  writeToFile(cookies.nauk_at, "accessToken");
  authorization = cookies.nauk_at;
}

// loginFlow();
doTheStuff();
