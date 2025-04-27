// update-helper.js
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { getConfirmation } = require('./utils/prompts');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function logAndWait(message, isError = false) {
  if (isError) {
    console.error(message);
  } else {
    console.log(message);
  }
  await sleep(1000); // Wait 1 second between messages for better readability
}

console.log("Starting update process...");

// Parse and validate arguments
const [one, two, oldExe, newExe] = process.argv;
(async () => {
  await logAndWait("Validating update parameters...");
  await logAndWait(`Update path: ${oldExe}`);
  await logAndWait(`New version path: ${newExe}`);

if (!oldExe || !newExe) {
  await logAndWait("Error: Missing required paths for update", true);
  await logAndWait("Will exit in 20 seconds...", true);
  await sleep(20000);
  process.exit(1);
}
})()

async function waitForFileUnlock(file, timeout = 30000) {
  try {
    await logAndWait(`Checking file access: ${file}`);
    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      const check = async () => {
        try {
          fs.open(file, 'r+', async (err, fd) => {
            if (!err) {
              fs.close(fd, () => resolve());
            } else if (Date.now() - startTime > timeout) {
              await logAndWait(`File still locked after ${timeout/1000} seconds: ${file}`, true);
              reject(new Error('Timeout waiting for file to be unlocked'));
            } else {
              await logAndWait('File is locked, waiting...', true);
              setTimeout(check, 1000);
            }
          });
        } catch (error) {
          await logAndWait(`Error checking file lock: ${error.message}`, true);
          reject(error);
        }
      };

      check();
    });
  } catch (error) {
    await logAndWait(`Failed to check file lock: ${error.message}`, true);
    throw error;
  }
}

async function replaceAndRestart() {
  try {
    await sleep(10000);
    await logAndWait(`Waiting for application to close: ${oldExe}`);
    await waitForFileUnlock(oldExe);

    await logAndWait('Replacing executable...');
    try {
      fs.copyFileSync(newExe, oldExe);
      await logAndWait('Successfully replaced executable');
    } catch (error) {
      await logAndWait(`Failed to replace executable: ${error.message}`, true);
      throw error;
    }

    await logAndWait('Launching updated application...');
    try {
      spawn(oldExe, [], {
        detached: true,
        stdio: 'ignore'
      }).unref();
      await logAndWait('Successfully launched updated application');
    } catch (error) {
      await logAndWait(`Failed to launch updated application: ${error.message}`, true);
      throw error;
    }

    // Clean up temp file
    try {
      fs.unlinkSync(newExe);
      await logAndWait('Cleaned up temporary files');
    } catch (error) {
      await logAndWait(`Warning: Failed to clean up temporary file: ${error.message}`, true);
      // Don't throw here as this is not critical
    }

    await logAndWait('Update completed successfully');
    const shouldContinue = await getConfirmation("Update successful. Press Enter to exit...");
    await logAndWait("Exiting in 20 seconds...");
    await sleep(20000);
    process.exit(0);

  } catch (error) {
    await logAndWait('-----------------------------------', true);
    await logAndWait('Update process encountered errors:', true);
    await logAndWait(error.message, true);
    await logAndWait('-----------------------------------', true);
    
    const shouldRetry = await getConfirmation("Would you like to retry the update?");
    if (shouldRetry) {
      await logAndWait('Retrying update process...');
      return replaceAndRestart();
    }

    await logAndWait("Continuing with current version...");
    await logAndWait("Exiting update helper in 20 seconds...");
    await sleep(20000);
    process.exit(1);
  }
}

// Start the update process
replaceAndRestart().catch(async (error) => {
  await logAndWait('Fatal error in update process:', true);
  await logAndWait(error.message, true);
  await logAndWait("Exiting in 20 seconds...", true);
  await sleep(20000);
  process.exit(1);
})

