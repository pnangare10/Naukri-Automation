#!/usr/bin/env node
process.env.NODE_NO_WARNINGS = "1";

const {
  writeToFile,
  rl,
  selectProfile,
  matchingStrategy,
  writeFileData,
  askQuestion,
  getEmailsIds,
} = require("./utils");

const {
  getExistingJobs,
  findNewJobs,
  applyForJobs,
  login,
  getUserProfile,
  manageProfiles,
  handleQuestionnaire,
} = require("./jobUtils");
const prompts = require("@inquirer/prompts");
const { localStorage } = require("./helper");
const { incrementCounterAPI } = require("./api");
const { getResumeAPI } = require("./api");
const { sendEmails, setupEmails, showEmailsMenu } = require("./emailUtils");
const repetitions = 1;

const isDebugMode = process.execArgv.includes('--inspect');

if (!isDebugMode) {
  console.debug = () => {}; // Disable console.debug in dev mode
}

const doTheStuff = async (profile) => {
  const preferences = localStorage.getItem("preferences");
  const { noOfPages, dailyQuota } = preferences;
  let jobIds = [];
  try {
    console.log("Mission Job search Started...");
    const ans = await prompts.select({
      message: `Please select a option : `,
      choices: [
        { name: "Search for new jobs", value: 1 },
        { name: "Use previously searched jobs", value: 2 },
        { name: "Send emails to recruiters", value: 3 },
      ],
    });
    if (ans === 2) {
      jobIds = await getExistingJobs();
    }
    if (ans === 3) {
      await showEmailsMenu();
      return;
    }
    if ((ans === 1) || jobIds.length === 0) {
      jobIds = await findNewJobs(noOfPages, repetitions);
    }
    for (let i = 0; i < jobIds.length; i++) {
      try {
        const job = jobIds[i];
        const isAlreadyApplied = job.isApplied;
        const isSuitable = 
          job.isSuitable || (await matchingStrategy(job, profile));
        job.isSuitable = isSuitable;

        if (!isSuitable || isAlreadyApplied) {
          console.debug(
            `> ${i + 1} of ${jobIds.length} | ${job.jobTitle} in ${
              job.companyName
            } | ${isAlreadyApplied ? "Already applied" : "not suitable"}`
          );
          console.debug("\n");
          continue;
        }

        console.log(
          `> ${i + 1} of ${jobIds.length} | ${job.jobTitle} in ${
            job.companyName
          } | ${isSuitable ? "Suitable" : "Not Suitable"}`
        );
        const jobsSlot = [job];
        const result = await applyForJobs(jobsSlot);

        if (!result) {
          console.log("result undefined");
          continue;
        }
        if (!result.jobs) {
          throw new Error("409001");
        }
        if (result.jobs[0].status == 200) {
          console.log(
            `Applied successfully | Quota: ${result.quotaDetails.dailyApplied}`
          );
          incrementCounterAPI();
          if (result.quotaDetails.dailyApplied >= dailyQuota) {
            console.log("Daily quota reached");
            break;
          }
          jobIds[i].isApplied = true;
        }
        if (result.jobs[0].status !== 200 && (preferences.enableManualAnswering || preferences.enableGenAi)) {
          const questionnaire = await handleQuestionnaire(result, preferences.enableGenAi);
          const finalResult = await applyForJobs(jobsSlot, questionnaire);
          if (finalResult.jobs[0].status == 200) {
            console.log(
              `Applied successfully | Quota: ${finalResult.quotaDetails.dailyApplied}`
            );
            incrementCounterAPI();
            jobIds[i].isApplied = true;
          }
        }
      } catch (e) {
        if (e.message == 200 || e.message == 409001) {
          console.error(e.message);
        } else if (e.message == 403) {
          throw new Error(e);
        } else if (e.message == 401) {
          await login();
          i--;
          continue;
        } else {
          console.error(e.message);
        }
      } finally {
        writeToFile(jobIds, "filteredJobIds", profile.id);
      }
    }
  } catch (e) {
    console.error(e.message);
  } finally {
    writeToFile(jobIds, "filteredJobIds", profile.id);
  }
};

const startProgram = async () => {
  try {
    const profile = await selectProfile();
    const loginInfo = await login(profile);
    const authorization = loginInfo.authorization;
    localStorage.setItem("authorization", authorization);
    const { user, preferences } = await getUserProfile();
    const updatedProfiles = await manageProfiles(user, loginInfo);
    debugger;

    localStorage.setItem("profile", user);
    localStorage.setItem("preferences", preferences);
    writeToFile(preferences, "preferences", user.id);
    writeFileData(updatedProfiles, "profiles");
 
    await doTheStuff(user);
  } catch (e) {
    console.error("Error in main process:", e.message);
    // process.exit(1);
  } finally {
    console.log("Program ended");
    await prompts.input({
      message:"Press ENTER to exit...",
    });
    rl.close();
  }
};

startProgram();
