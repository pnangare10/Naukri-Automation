const fs = require("fs");
const { localStorage } = require("./helper");
const path = require("path");
const readline = require("readline");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;


const getDataFromFile = async (fileName, profile, isBuffer = false) => {
  if (profile === undefined || profile === null) {
    profile = await localStorage.getItem("profile");
    profile = profile.id;
  }
  if(isBuffer){
    debugger;
  }
  return getFileData(`${profile}/${fileName}`, isBuffer);
};

const getFileData = async (fileName, isBuffer = false) => {
  try {
    //check if file exists
    if (!fs.existsSync(`./data/${fileName}${isBuffer ? '' : '.json'}`)) {
      console.debug(`File ${fileName} does not exist`);
      return null;
    }
    if (isBuffer) {
      const data = fs.readFileSync(`./data/${fileName}`);
      return data;
    }
    const data = fs.readFileSync(`./data/${fileName}.json`);
    return JSON.parse(data);
  } catch (err) {
    console.debug(err);
    return null;
  }
};

// Write the questions to the file
const writeToFile = (data, fileName, profile, isBuffer = false) => {
  //check if file exists
  if (profile === undefined || profile === null) {
    profile = localStorage.getItem("profile").id;
  }
  if (!fs.existsSync(`./data/${profile}`)) {
    fs.mkdirSync(`./data/${profile}`, { recursive: true });
  }
  writeFileData(data, `${profile}/${fileName}`, isBuffer

  );
};

const writeFileData = (data, fileName, isBuffer = false) => {
  try {
    if (!fs.existsSync(`./data`)) {
      fs.mkdirSync(`./data`, { recursive: true });
    }
    if (isBuffer) {
      fs.writeFileSync(`./data/${fileName}`, data, (err) => {
        if (err) {
          console.debug(err);
        }
      });
    } else {
      fs.writeFileSync(`./data/${fileName}.json`, JSON.stringify(data), (err) => {
        if (err) {
          console.debug(err);
        }
      });
    }
  } catch (err) {
    console.debug(err);
  }
};

const deleteFile = (fileName) => {
  if (!fs.existsSync(`./${fileName}`)) {
    console.debug(`File ${fileName} does not exist`);
    return;
  }
  try {
    fs.unlinkSync(`./${fileName}`);
  } catch (err) {
    console.debug(err);
  }
};

const deleteFolder = (folderName) => {
  if (!fs.existsSync(`./${folderName}`)) {
    console.debug(`Folder ${folderName} does not exist`);
    return;
  }
  fs.rmdirSync(`./${folderName}`, { recursive: true });
};

const checkFileExists = (fileName) => { 
  return fs.existsSync(`./${fileName}`);
};

const exportFile = (filePath) => {
  let destinationPath = "";
  if(process.platform === "win32"){
    destinationPath = `C:\\Users\\${process.env.USERNAME}\\Downloads\\`;
  }else if(process.platform === "darwin"){
    destinationPath = `~/Downloads/`;
  }else if(process.platform === "linux"){
    destinationPath = `~/Downloads/`;
  } else if(process.platform === "android"){
    destinationPath = `~/storage/downloads/`;
  } else {
    destinationPath = `~/Downloads/`;
  }
  fs.copyFileSync(filePath, destinationPath);
}

const getCsvFile = async (data, fileName) => {
  try {
    const profile = await localStorage.getItem("profile");
    const downloadsFolder = path.join(require("os").homedir(), "Downloads");
    // const downloadsFolder = `./data/${profile.id}`;
    //Check if the folder exists
    if (!fs.existsSync(downloadsFolder)) {
      fs.mkdirSync(downloadsFolder, { recursive: true });
    }
    const filePath = `${downloadsFolder}/${fileName}`;
    const csvWriter = createCsvWriter({
      path: filePath, // Save file to Downloads folder
      header: Object.keys(data[0]).map((key) => ({ id: key, title: key })),
    });
    await csvWriter.writeRecords(data);
    // await exportFile(filePath);
    console.log("CSV file was exported successfully to the Downloads folder!");
  } catch (e) {
    console.error("Error writing CSV file:", e.message);
  }
};

// Create an interface to read from the console
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Ask the question and return the answer
const askQuestion = async (question) => {
  return new Promise((resolve, reject) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
};

const streamText = async (text, delay = 100) => {
  // Use spread operator to properly split the string into graphemes
  const chars = [...text];
  
  for (const char of chars) {
    process.stdout.write(char);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  process.stdout.write('\n');
}

module.exports = {
  getDataFromFile,
  getFileData,
  writeToFile,
  writeFileData,
  deleteFile,
  checkFileExists,
  deleteFolder,
  exportFile,
  getCsvFile,
  askQuestion,
  rl,
  streamText,
};
