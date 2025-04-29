const https = require('https');
const fs = require('fs');
const unzipper = require('unzipper');
const { exec } = require('child_process');
const path = require('path');

const latestReleaseUrl = 'https://github.com/pnangare10/Naukri-Automation/archive/refs/tags/v2.12.3.zip';

function downloadUpdate() {
    console.log("Checking for updates...");

    const file = fs.createWriteStream("update.zip");
    https.get(latestReleaseUrl, function(response) {
        if (response.statusCode === 302 && response.headers.location) {
            // GitHub sometimes redirects to another URL
            https.get(response.headers.location, (redirectedResponse) => {
                redirectedResponse.pipe(file);
                file.on('finish', function() {
                    file.close(() => extractUpdate());
                });
            });
        } else {
            response.pipe(file);
            file.on('finish', function() {
                file.close(() => extractUpdate());
            });
        }
    }).on('error', function(err) {
        console.error("Error downloading update:", err.message);
    });
}

function extractUpdate() {
    console.log("Extracting update...");

    fs.createReadStream('update.zip')
      .pipe(unzipper.Extract({ path: '.' }))
      .on('close', () => {
          console.log('Update completed successfully.');
          fs.unlinkSync('update.zip');

          // Optional: Restart application automatically
          console.log('Restarting application...');
          exec('run-app.bat');
          process.exit();
      });
}

module.exports = {
  downloadUpdate
}
