const https = require("https");
const fs = require("fs");
const unzipper = require("unzipper");
const { exec } = require("child_process");
const path = require("path");

const latestReleaseUrl =
  "https://github.com/pnangare10/Naukri-Automation/releases/latest/download/naukri-app.zip";

function downloadUpdate() {
  console.log("Checking for updates...");

  const file = fs.createWriteStream("update.zip");

  https
    .get(latestReleaseUrl, function (response) {
      if (response.statusCode === 302 && response.headers.location) {
        // GitHub redirect detected
        console.log("Redirect detected, following...");
        https.get(response.headers.location, (redirectedResponse) => {
          redirectedResponse.pipe(file);
          file.on("finish", function () {
            file.close(() => extractUpdate());
          });
        });
      } else if (response.statusCode === 200) {
        response.pipe(file);
        file.on("finish", function () {
          file.close(() => extractUpdate());
        });
      } else {
        console.error(
          `Failed to download update. Status code: ${response.statusCode}`
        );
        file.close();
        fs.unlinkSync("update.zip");
      }
    })
    .on("error", function (err) {
      console.error("Error downloading update:", err.message);
    });
}

function cleanOldFiles() {
  const filesToKeep = ["update.js", "run-app.bat", "node.exe", "package.json"]; // Keep updater files
  const allFiles = fs.readdirSync(".");

  allFiles.forEach((file) => {
    if (!filesToKeep.includes(file)) {
      if (fs.lstatSync(file).isDirectory()) {
        fs.rmSync(file, { recursive: true, force: true });
      } else {
        fs.unlinkSync(file);
      }
      console.log(`Deleted old file/folder: ${file}`);
    }
  });
}

function extractUpdate() {
  console.log("Cleaning old files...");
  cleanOldFiles();

  console.log("Extracting update...");
  fs.createReadStream("update.zip")
    .pipe(unzipper.Extract({ path: "." }))
    .on("close", () => {
      console.log("Extracted. Organizing files...");

      // Step 1: Find the extracted folder
      const allFiles = fs.readdirSync(".");
      const extractedFolder = allFiles.find(
        (f) =>
          f.startsWith("Naukri-Automation") && fs.lstatSync(f).isDirectory()
      );

      if (extractedFolder) {
        console.log(`Found extracted folder: ${extractedFolder}`);
        const extractedPath = path.join(".", extractedFolder);

        // Step 2: Move files from extracted folder to root
        const moveFiles = fs.readdirSync(extractedPath);
        moveFiles.forEach((file) => {
          const oldPath = path.join(extractedPath, file);
          const newPath = path.join(".", file);
          fs.renameSync(oldPath, newPath);
          console.log(`Moved: ${file}`);
        });

        // Step 3: Delete the extracted empty folder
        fs.rmdirSync(extractedPath);
        console.log(`Deleted extracted folder: ${extractedFolder}`);
      }

      // Step 4: Clean up zip file
      fs.unlinkSync("update.zip");
      console.log("Update completed successfully.");

      console.log("Restarting application...");
      exec("run-app.bat");
      process.exit();
    });
}

module.exports = {
  downloadUpdate,
};
