const fs = require("fs");
const { localStorage } = require("./helper");

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
    if (!fs.existsSync(`./data/${fileName}.json`)) {
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

module.exports = {
  getDataFromFile,
  getFileData,
  writeToFile,
  writeFileData,
  deleteFile,
  checkFileExists,
  exportFile,
};
