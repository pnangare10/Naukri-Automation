const { exec, spawnSync } = require("child_process");
const { promisify } = require('util');
const fs = require('fs');
const execAsync = promisify(exec);

const openUrl = async (url) => {
  try {
    const command = process.platform === "win32"
      ? `start "" "${url}"`
      : process.platform === "darwin"
      ? `open "${url}"`
      : `xdg-open "${url}"`;
    
    await execAsync(command);
  } catch (error) {
    console.error("Error opening URL:", error.message);
  }
};

const openFile = (filePath) => {
  try {
    const command = process.platform === "win32" ? "notepad" : "nano";
    spawnSync(command, [filePath], { stdio: "inherit" });
  } catch (error) {
    console.error("Error opening file:", error.message);
  }
};

const openFolder = (folderPath) => {
  try {
    if (!fs.existsSync(folderPath)) {
      console.error("Folder does not exist:", folderPath);
      return;
    }
    openUrl(folderPath);
  } catch (error) {
    console.error("Error opening folder:", error.message);
  }
};

const updateApplication = async () => {
  try {
    console.log("Updating application...");
    const command = "npm update -g naukri-ninja";
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr && stderr.length > 0 && stderr.includes("npm ERR!")) {
      console.warn("Update warnings:", stderr);
    }
    
    if (stdout) {
      console.log("Update output:", stdout);
    }
    console.log("Application updated successfully!");
    return true;
  } catch (error) {
    console.error("Error updating application:", error.message);
    return false;
  }
};

const restartProgram = async () => {
  try {
    console.log("Restarting program...");
    const command = "npm run dev";
    await execAsync(command);
    console.log("Program restarted successfully!");
    process.exit(0); // Exit the current process after starting the new one
  } catch (error) {
    console.error("Error restarting program:", error.message);
    process.exit(1); // Exit with error cod8034e if restart fails
  }
};

const getLatestVersion = async (packageName) => {
  const command = `npm view ${packageName} version`;
  const { stdout, stderr } = await execAsync(command);
  return stdout.trim();
};

module.exports = {
  openUrl,
  openFile,
  openFolder,
  updateApplication,
  restartProgram,
  getLatestVersion,
};