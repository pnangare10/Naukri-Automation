#!/usr/bin/env node
process.env.NODE_NO_WARNINGS = "1";

const {
  writeToFile,
  matchingStrategy,
  writeFileData,
} = require("./utils/utils");
const { rl, askQuestion, getDataFromFile, streamText } = require("./utils/ioUtils");
const {
  selectProfile,
  login,
  getUserProfile,
  manageProfiles,
  getPreferences,
  resetAccount,
} = require("./utils/userUtils");
const {
  getExistingJobs,
  findNewJobs,
  applyForJobs,
  handleQuestionnaire,
} = require("./utils/jobUtils");
const prompts = require("@inquirer/prompts");
const { localStorage } = require("./utils/helper");
const { incrementCounterAPI } = require("./api");
const { handleEmailsMenu } = require("./utils/emailUtils");
const {
  autoUpdate,
  restartProgram,
} = require("./utils/programUtils");
const { showMainMenu } = require("./utils/prompts");
const spinner = require("./utils/spinniesUtils");
const analyticsManager = require('./utils/analyticsUtils');
const { getUnusedPhrase } = require("./constants/funPhrases");
const { getAuthorInfo } = require("./utils/about");
const { checkForUpdates } = require("./utils/updater");
const repetitions = 1;

const isDebugMode = process.execArgv.includes("--inspect");

if (!isDebugMode) {
  console.debug = () => {}; // Disable console.debug in production mode
}

const doTheStuff = async (profile, preferences, useExistingJobs = false) => {
  console.clear();
  const { noOfPages, dailyQuota } = preferences;
  let jobIds = [];
  try {
    console.log("Mission Job search Started...");
    const startTime = Date.now();
    let jobCount = 0;
    // const ans = await jobSearchMenu();
    if (useExistingJobs) {
      jobIds = await getExistingJobs();
    }

    if (!useExistingJobs || jobIds.length === 0) {
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
          spinner.stop();
          console.log(
            `Applied successfully | ${job.jobTitle} | Quota: ${result.quotaDetails.dailyApplied}`
          );
          jobCount++;
          incrementCounterAPI();
          analyticsManager.incrementJobsApplied();
          if (result.quotaDetails.dailyApplied >= dailyQuota) {
            spinner.fail("Daily quota reached");
            break;
          }
          jobIds[i].isApplied = true;
        }
        if (
          result.jobs[0].status !== 200 &&
          (!preferences.enableManualAnswering && !preferences.enableGenAi)
        ) {
          console.log("Skipping job as manual & genAI answering is disabled");
          continue;
        }
        if (
          result.jobs[0].status !== 200 &&
          (preferences.enableManualAnswering || preferences.enableGenAi)
        ) {
          const questionnaire = await handleQuestionnaire(
            result,
            preferences.enableGenAi
          );
          const finalResult = await applyForJobs(jobsSlot, questionnaire);
          if (finalResult.jobs[0].status == 200) {
            spinner.stop();
            console.log(
              `Applied successfully | Quota: ${finalResult.quotaDetails.dailyApplied}`
            );
            jobCount++;
            incrementCounterAPI();
            analyticsManager.incrementJobsApplied();
            jobIds[i].isApplied = true;
          }
        }
      } catch (e) {
        if (e.message == 200 || e.message == 409001) {
          spinner.fail(e.message);
        } else if (e.message == 403) {
          throw new Error(e);
        } else if (e.message == 401) {
          await login();
          i--;
          continue;
        } else {
          if(spinner.spinner){
            spinner.fail(e.message);
          }else{
            console.log(e.message);
          }
        }
      } finally {
        writeToFile(jobIds, "filteredJobIds", profile.id);
      }
    }
    const endTime = Date.now();
    const timeTaken = (endTime - startTime) / 1000;
    console.log(`You applied for ${jobCount} jobs in just ${timeTaken.toFixed(1)} seconds`);
  } catch (e) {
    console.log(isDebugMode ? e : e.message);
  } finally {
    spinner.stop();
    writeToFile(jobIds, "filteredJobIds", profile.id);
  }
};

const handleMainMenu = async (user, preferences) => {
  while(true){
    let res = await showMainMenu();
    if(!preferences) res = "configure";
    switch (res) {
      case "search-jobs":
        await doTheStuff(user, preferences);
        break;
      case "use-existing-jobs":
        await doTheStuff(user, preferences, true);
        break;
      case "send-emails":
        await handleEmailsMenu();
        break;
      case "analytics":
        await showAnalytics(user);
        break;
      case "reset":
        await resetAccount(user);
        await restartProgram();
        break;
      case "check-updates":
        await prompts.input({
          message: "Restart is required. Press ENTER to restart...",
        });
        await restartProgram();
        break;
      case "exit":
        process.exit(0);
      case "restart":
        await restartProgram();
        break;
      case "configure":
        preferences = await getPreferences(user);
        localStorage.setItem("preferences", preferences);
        writeToFile(preferences, "preferences", user.id);
        return preferences;
      default:
        break;
    }
  }
};

const showAnalytics = async (user) => {
  const stats = analyticsManager.getStats();
  
  console.clear();
  console.log("\n📊 Application Usage Statistics");
  console.log("=============================");
  console.log(`Last Updated: ${new Date(stats.lastUpdated).toLocaleString()}`);
  console.log(`Using this app since: ${new Date(stats.createDate).toLocaleString()}`);
  console.log("\nTotal Statistics:");
  console.log(`- Jobs Applied: ${stats.totalJobsApplied}`);
  console.log(`- Questions Answered: ${stats.totalQuestionsAnswered}`);
  console.log(`- Emails Sent: ${stats.totalEmailsSent}`);
  
  console.log("\nLast 7 Days Statistics:");
  if(stats.dailyStats){
    Object.entries(stats.dailyStats).forEach(([date, dayStats]) => {
      console.log(`\n${new Date(date).toLocaleDateString()}:`);
      console.log(`- Jobs Applied: ${dayStats.jobsApplied}`);
      console.log(`- Questions Answered: ${dayStats.questionsAnswered}`);
      console.log(`- Emails Sent: ${dayStats.emailsSent}`);
    });
  }else{
    console.log("No daily stats available");
  }

  await prompts.input({
    message: "\nPress ENTER to continue...",
  });
};

const startSequence = async () => {
  const startPhrase = await getUnusedPhrase();
  await streamText(startPhrase, 50);
  await new Promise(resolve => setTimeout(resolve, 200));
};

const startProgram = async () => {
  try {
    await startSequence();
    await autoUpdate();
    const profile = await selectProfile();
  
    const loginInfo = await login(profile);
    const authorization = loginInfo.authorization;
    localStorage.setItem("authorization", authorization);
    const user = await getUserProfile();
    localStorage.setItem("profile", user);
    const updatedProfiles = await manageProfiles(user, loginInfo);
    writeFileData(updatedProfiles, "profiles");
    analyticsManager.loadStats();

    if (isDebugMode) console.clear();
    let preferences = await getDataFromFile("preferences");
    localStorage.setItem("preferences", preferences);
    preferences = await handleMainMenu(user, preferences);
    if(preferences) await doTheStuff(user, preferences);
    else{
      console.log("Please configure the application first");
    }
  } catch (e) {
    if(e instanceof Error && (e.name === 'ExitPromptError' || e.message === 'ExitPromptError')){
      console.log("👋 until next time!");
    }else{
      console.log("Error in main process:", isDebugMode ? e : e.message);
    }
  } finally {
    console.log("Program ended");
    await prompts.input({
      message: "Press ENTER to exit...",
    });
    rl.close();
  }
};

// Handle process exit
process.on('exit', (code) => {
  console.log(`👋 See you next time!`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  spinner.stop();
  rl.close();
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  spinner.stop();
  rl.close();
  process.exit(1);
});

// Handle SIGINT (Ctrl+C)
process.on("SIGINT", async () => {
  try {
    console.log("\nShutting down...");
    spinner.stop();
    rl.close();
    console.log("👋 Goodbye!");
    process.exit(0);
  } catch (error) {
    console.error("Error during shutdown:", error);
    process.exit(1);
  }
});

// Handle SIGTERM (normal termination)
process.on("SIGTERM", async () => {
  try {
    console.log("\nReceived SIGTERM. Shutting down...");
    spinner.stop();
    rl.close();
    console.log("👋 Goodbye!");
    process.exit(0);
  } catch (error) {
    console.error("Error during shutdown:", error);
    process.exit(1);
  }
});

if(!isDebugMode){
  process.removeAllListeners('warning');
}

startProgram();
