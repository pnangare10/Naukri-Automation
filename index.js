const {
  askQuestion,
  writeToFile,
  chunkArray,
  filterJobs,
  getDataFromFile,
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

const {
  getExistingJobs,
  findNewJobs,
  applyForJobs,
  login,
  getUserProfile,
  manageProfiles,
} = require("./jobUtils");

const noOfPages = 5;
const repetitions = 1;
const quotaLimit = 50;

const doTheStuff = async (profile) => {
  let jobIds = [];
  try {
    console.log("Mission Job search Started...");
    const ans = await askQuestion(
      `Would you like to search for new jobs (Y/N) ?\n`
    );
    if (ans.toLowerCase() == "n") {
      jobIds = await getExistingJobs();
    }
    if (ans.toLowerCase() == "y" || jobIds.length == 0) {
      jobIds = await findNewJobs(noOfPages, repetitions);
    }
    for (let i = 0; i < jobIds.length; i++) {
      try {
        const job = jobIds[i];
        const isAlreadyApplied = job.isApplied;
        const isSuitable =
          job.isSuitable || (await matchingStrategy(job, profile));

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
        job.isSuitable = isSuitable;
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
          if (result.quotaDetails.dailyApplied >= quotaLimit) {
            console.log("Daily quota reached");
            break;
          }
          jobIds[i].isApplied = true;
        }
        // console.log("\n");
      } catch (e) {
        if (e.message == 200 || e.message == 409001) {
          console.error(e.message);
        } else if (e.message == 403) {
          throw new Error(e);
        } else if (e.message == 401) {
          // ;
          await login();
          i--;
          continue;
        } else {
          console.error(e.message);
        }
      } finally {
        // ;
        jobIds[i].isApplied = true;
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
  const args = process.argv.slice(2);
  const command = args[0];
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
  }

  const profile = await getUserProfile();
  manageProfiles(profile, loginInfo);
  doTheStuff(profile);
};

startProgram();
