const prompts = require("@inquirer/prompts");
const {
  getFileData,
  getDataFromFile,
  writeFileData,
  deleteFolder,
} = require("./ioUtils");
const { getProfileDetailsAPI, loginAPI, incrementCounterAPI } = require("../api");
const { getGeminiUserConfiguration } = require("../gemini");
const {
  jobMatchStrategyMenu,
  enableManualAnsweringMenu,
  getConfirmation,
  selectProfileMenu,
  enableGenAiMenu,
  passwordPrompt,
} = require("./prompts");
const spinner = require('./spinniesUtils');
const analytics = require('./analyticsUtils');
const { getAuthorInfo } = require("./about");

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
      profileId: apiData.profileAdditional.profileId,
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
    onlineProfile: apiData.onlineProfile.map((profile) => ({
      type: profile.profile,
      url: profile.url,
    })),
    workSamples: apiData.workSample,
  };
  if (!user.onlineProfile.find((profile) => profile.type === "LinkedIn")) {
    const linkedInProfile = await getLinkedInProfile();
    user.onlineProfile.push({
      type: "LinkedIn",
      url: linkedInProfile,
    });
  }

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
    return [data];
  }
  const profileIndex = profiles.findIndex((p) => p.id === profile.id);

  if (profileIndex !== -1) {
    profiles[profileIndex] = { ...profiles[profileIndex], ...data };
  } else {
    profiles.push(data);
    analytics.setCreateDate(data.id);
    console.log("new user added")
    await incrementCounterAPI('newUser');
  }
  return profiles;
};

const getLinkedInProfile = async () => {
  const linkedInProfile = await prompts.input({
    message: "Please enter your LinkedIn profile URL.",
  });
  return linkedInProfile;
};

const getPreferences = async (user) => {
  let preferences = await getDataFromFile("preferences", user.id);
  let doConfiguration = true; //preferences ? false : true;
  // if (preferences)
  // doConfiguration = await getConfirmation("Do you want to configure your preferences ?");
  if (!preferences) {
    preferences = {};
  }
  let matchStrategy = "naukriMatching"; //doConfiguration ? null : preferences.matchStrategy;
  if (!matchStrategy) {
    matchStrategy = await jobMatchStrategyMenu();
    preferences.matchStrategy = matchStrategy;
  }
  let enableGenAi = doConfiguration ? null : preferences.enableGenAi;
  if (enableGenAi === null || enableGenAi === undefined) {
    enableGenAi = await enableGenAiMenu();
    preferences.enableGenAi = enableGenAi;
    if (enableGenAi || matchStrategy === "ai") {
      let res = "gemini";
      // let res =
      if (res === "gemini") {
        const { config, enableGenAi } = await getGeminiUserConfiguration(
          preferences
        );
        preferences.genAiConfig = config;
        preferences.enableGenAi = enableGenAi;
      }
      preferences.genAiModel = res;
      preferences.matchStrategy = matchStrategy;
    } else {
      const enableManualAnswering = await enableManualAnsweringMenu();
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
    Please enter more desired roles in comma separated format (for example: "Software Engineer, Developer, Analyst")
    Hit enter to skip\n`,
    });
    // ;
    if (res !== "") {
      res.split(",").forEach((role) => {
        preferences.desiredRole.push(role.trim());
      });
    }

    res = await prompts.input({
      message: `Current keywords to match the jobs:
    ${keywords}
    Please enter more keywords to match the jobs in comma separated format (Java, React, HTML, CSS, etc.)
    Hit enter to skip
    Note: Include variation of the keywords as well to match correctly.(for example: use reactjs instead of react.js)\n`,
    });

    if (res !== "") {
      res.split(",").forEach((keyword) => {
        preferences.keywords.push(keyword.trim().toLowerCase());
      });
    }
  }
  if (doConfiguration || !preferences.noOfPages || !preferences.dailyQuota) {
    // let res = await prompts.number({
    //   message: "Enter the number of pages to search for jobs",
    //   default: 5,
    //   min: 1,
    //   max: 10,
    // });
    preferences.noOfPages = 5;
    res = await prompts.number({
      message: "Enter the number of jobs to apply for on daily basis",
      default: 40,
      min: 1,
      max: 50,
      description:
        "This is the number of jobs you want to apply for on daily basis, Maximum quota is 50",
    });
    preferences.dailyQuota = res;
  }
  return preferences;
};

const getUserProfile = async () => {
  const response = await getProfileDetailsAPI();
  const userData = await response.json();

  return constructUser(userData);
};

const login = async (profile) => {
  if (!profile?.creds) {
    const email = await prompts.input({ message: "Enter your email : " });
    const password = await passwordPrompt("Enter your password : ");
    profile = { creds: { username: email, password: password } };
  }
  spinner.start("Logging in...");
  const response = await loginAPI(profile.creds);
  if (!response.ok) {
    spinner.fail('There was an error while logging in');
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
  spinner.succeed('Logged in successfully');
  const loginInfo = {
    creds: profile.creds,
    authorization: cookies.nauk_at,
  };
  return loginInfo;
};

const resetAccount = async (user) => {
  const res = await getConfirmation(
    "Are you sure you want to reset your account?"
  );
  if (!res) {
    console.log("Account reset cancelled");
    return profiles;
  }
  const profiles = await getFileData("profiles");
  const profileIndex = profiles.findIndex((p) => p.id === user.id);
  if (profileIndex !== -1) {
    profiles.splice(profileIndex, 1);
  }
  writeFileData(profiles, "profiles");
  deleteFolder(`data/${user.id}`);
  console.log("Account reset successfully");
  return profiles;
};

const compressProfile = (profile) => {
  delete profile.profile.keySkills;
  profile.employmentHistory.map((item) => delete item.jobDescription);
  return profile;
};

// select a profile
const selectProfile = async () => {
  let selectedProfile = null;
  // if (profiles.length === 1) {
  //   selectedProfile = profiles[0];
  // }
  const profiles = await getFileData("profiles");
  if (!profiles || profiles.length === 0) {
    console.log("No profiles found. Please add profiles to continue.");
    return null;
  }
  while (!selectedProfile) {
    const ans = await selectProfileMenu(profiles);
    
    if (ans === -1) return null;
    if (ans === "exit") throw new Error("ExitPromptError");
    if (ans === "about") {
      await getAuthorInfo();
      const res = await getConfirmation("Press ENTER to continue...", true, true);
      continue;
    };

    const index = parseInt(ans, 10); // Convert ans to a number
    if (isNaN(index) || index <= 0 || index > profiles.length) {
      console.log("Invalid profile number. Please try again.");
    } else {
      selectedProfile = profiles[index - 1];
    }
  }
  return selectedProfile;
};

module.exports = {
  constructUser,
  manageProfiles,
  getLinkedInProfile,
  login,
  getUserProfile,
  getPreferences,
  resetAccount,
  selectProfile,
  compressProfile,
};
