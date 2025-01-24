#!/usr/bin/env node

const {
  writeToFile,
  rl,
  selectProfile,
  matchingStrategy,
  writeFileData,
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

const repetitions = 1;

const doTheStuff = async (profile) => {
  const preferences = localStorage.getItem("preferences");
  const { noOfPages, dailyQuota } = preferences;
  let jobIds = [];
  try {
    console.log("Mission Job search Started...");
    const ans = await prompts.confirm({
      message: `Would you like to search for new jobs?`,
      default: true,
    });
    if (!ans) {
      jobIds = await getExistingJobs();
    }
    if (ans || jobIds.length == 0) {
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
          console.log(
            `> ${i + 1} of ${jobIds.length} | ${job.jobTitle} in ${
              job.companyName
            } | ${isAlreadyApplied ? "Already applied" : "not suitable"}`
          );
          console.log("\n");
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
        if (result.jobs[0].status !== 200) {
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
    console.error(e);
  } finally {
    writeToFile(jobIds, "filteredJobIds", profile.id);
    rl.close();
  }
};

const startProgram = async () => {
  try {
    const args = process.argv.slice(2);
    const command = args[args.length - 1];
    let loginInfo;
    if (command == "login") {
      loginInfo = await login();
    } else if (command !== "login" && command !== undefined) {
      console.log("Available commands: login");
      system.exit(1);
    } else {
      const profile1 = await selectProfile();
      loginInfo = await login(profile1);
      authorization = loginInfo.authorization;
      localStorage.setItem("authorization", authorization);
    }

    const { user, preferences } = await getUserProfile();
    const updatedProfiles = await manageProfiles(user, loginInfo);
    localStorage.setItem("profile", user);
    localStorage.setItem("preferences", preferences);
    writeToFile(preferences, "preferences", user.id);
    writeFileData(updatedProfiles, "profiles");
    await doTheStuff(user);
  } catch (e) {
    process.exit(1);
  }
};

startProgram();
