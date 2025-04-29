const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const spinner = require('./spinniesUtils');
const os = require("os");

const TEMP_DIR = path.join(os.tmpdir(), 'naukri-ninja');
const TIMESTAMP_FILE = path.join(TEMP_DIR, './data/lastCheck.json');
const ONE_DAY_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const {getLatestVersion} = require('./cmdUtils');
const { getConfirmation } = require('./prompts');
const { downloadUpdate } = require('../updateZip');

const checkForUpdates = async (packageName, currentVersion) => {
  try {
    spinner.start("Checking for updates...");
    const latest = await getLatestVersion(packageName);
    if (currentVersion < latest) {
      spinner.succeed(`Update available: ${latest}`);
      return true;
    }
    spinner.succeed("Application is up to date");
    return false;
  } catch(e) {
    spinner.fail(e.message);
    return false;
  }
};

const installUpdate = (packageName) => {
  return new Promise((resolve, reject) => {
    const command = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const args = ['install', '-g', `${packageName}@latest`];

    const child = spawn(command, args, { stdio: 'inherit', shell: true });

    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`npm install exited with code ${code}`));
    });
  });
};


const getLastCheckTime = () => {
  try {
    // Create the directory if it doesn't exist
    if (!fs.existsSync(TIMESTAMP_FILE)) {
      fs.writeFileSync(TIMESTAMP_FILE, JSON.stringify({ lastCheck: 0 }));
      return 0;
    }

    // Read the timestamp file
    const data = fs.readFileSync(TIMESTAMP_FILE, 'utf8');
    return JSON.parse(data).lastCheck;
  } catch (error) {
    // If the file doesn't exist, return "never checked" (epoch 0)
    return 0;
  }
}

const setLastCheckTime = () => {
  const timestamp = Date.now();
  fs.writeFileSync(TIMESTAMP_FILE, JSON.stringify({ lastCheck: timestamp }));
}

const restartProgram = () => {
  return new Promise((resolve, reject) => {
    const command = process.platform === 'win32' ? 'node' : 'node';
    const args = ['--no-warnings','--no-deprecation','index.js'];
    
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

    // Wait for the child process to start before exiting
    child.on('spawn', () => {
      // Give the child process a moment to initialize
      setTimeout(() => {
        process.exit(0);
      }, 100);
    });
  });
};

const autoUpdate = async (force = false) => {
  const packageJson = require('../package.json');
  const packageName = packageJson.name;
  const currentVersion = packageJson.version;
  const lastCheckTime = getLastCheckTime();
  const now = Date.now();

  // Skip check if less than 24 hours have passed
  // if (now - lastCheckTime < ONE_DAY_MS && !force) {
  //   return;
  // }

  // Proceed with update check
  try {
    const updateAvailable = await checkForUpdates(packageName, currentVersion);
    if ( updateAvailable) {
      const res = await getConfirmation("Update available. Install now?");
      if(res) {
        spinner.start('Installing update...');
        // await installUpdate(packageName);
        await downloadUpdate()
        spinner.succeed('Update installed. Restart to apply changes.');
        await restartProgram();
        process.exit(0);
      }
    }
  } catch (error) {
    spinner.fail('Update failed:', error);
  } finally {
    spinner.stop();
    // Always update the timestamp, even if the check failed
    setLastCheckTime();
  }
}

module.exports = {
  checkForUpdates,
  installUpdate,
  autoUpdate,
  restartProgram
};
