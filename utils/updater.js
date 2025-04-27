// updater.js
const https = require('https');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const { version: currentVersion } = require('../package.json'); // 🔥
const { getConfirmation } = require('./prompts');

const GITHUB_OWNER = 'pnangare10';
const GITHUB_REPO = 'Naukri-Automation';
const EXE_NAME = 'naukri-ninja.exe'; // Must match the asset name on GitHub
const TEMP_EXE_PATH = path.join(os.tmpdir(), 'update.exe');

async function fetchLatestRelease() {
  try {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`,
      headers: {
        'User-Agent': 'Node.js Updater',
        'Accept': 'application/vnd.github+json'
      }
    };

    return await new Promise((resolve, reject) => {
      https.get(options, (res) => {
        let rawData = '';
        res.on('data', chunk => rawData += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(rawData);
            resolve(json);
          } catch (e) {
            reject(e);
          }
        });
      }).on('error', reject);
    });
  } catch (e) {
    console.error('Error fetching latest release:', e);
    const shouldContinue = await getConfirmation("Failed to check for updates. Do you want to continue with current version?");
    if (!shouldContinue) {
      process.exit(1);
    }
    throw e; // Re-throw to be handled by caller
  }
}

async function downloadFile(url, dest) {
  try {
    console.log("downloadFile");
    console.log("url ", url);
    console.log("dest ", dest);
    return await new Promise((resolve, reject) => {
      const file = fs.createWriteStream(dest);
      https.get(url, (response) => {
        response.pipe(file);
        file.on('finish', () => {
          file.close(() => resolve());
        });
      }).on('error', (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
    });
  } catch (e) {
    console.error('Error downloading update:', e);
    const shouldContinue = await getConfirmation("Failed to download update. Do you want to continue with current version?");
    if (!shouldContinue) {
      process.exit(1);
    }
    throw e;
  }
}

async function launchUpdateHelper() {
  try {
    console.log("launchUpdateHelper");
    const currentExePath = process.execPath;
    const helperScript = path.join(__dirname, 'update-helper.js');

    const command = process.platform === 'win32' ? 'node' : 'node';
    const args = [
      helperScript,
      currentExePath.replace(/\\/g, '\\\\'),
      TEMP_EXE_PATH.replace(/\\/g, '\\\\')
    ].map(arg => `"${arg}"`);

    return await new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        stdio: 'inherit',
        shell: true,
        detached: true,
        windowsHide: true
      });

      child.on('error', (err) => {
        console.error('Failed to start child process:', err);
        reject(err);
      });

      child.on('spawn', () => {
        setTimeout(() => {
          resolve();
          process.exit(0);
        }, 100);
      });
    });
  } catch (e) {
    console.error('Error launching update helper:', e);
    const shouldContinue = await getConfirmation("Failed to launch updater. Do you want to continue with current version?");
    if (!shouldContinue) {
      process.exit(1);
    }
    throw e;
  }
}

async function checkForUpdates() {
  try {
    const release = await fetchLatestRelease();
    const latestVersion = release.tag_name.replace(/^v/, '');
    
    console.log(`latestVersion: ${latestVersion}`);
    console.log(`currentVersion: ${currentVersion}`);
    
    if (latestVersion === currentVersion) {
      console.log('App is up to date.');
      return;
    }

    console.log(`Updating from ${currentVersion} to ${latestVersion}...`);

    const asset = release.assets.find(a => a.name === EXE_NAME);
    if (!asset) {
      throw new Error('No matching .exe asset found in release.');
    }
    console.log(`Found update asset: ${asset.name}`);

    console.log('Downloading update...');
    await downloadFile(asset.browser_download_url, TEMP_EXE_PATH);
    
    console.log('Download complete. Launching updater...');
    await launchUpdateHelper();
  } catch (e) {
    console.error('Error in update process:', e);
    const shouldContinue = await getConfirmation("Update process failed. Do you want to continue with current version?");
    if (!shouldContinue) {
      process.exit(1);
    }
  }
}

module.exports = { checkForUpdates };
