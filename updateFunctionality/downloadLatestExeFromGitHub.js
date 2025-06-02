const { https } = require('follow-redirects');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

/**
 * Fetch the latest release asset (.exe) from GitHub API
 */
async function getLatestExeDownloadUrl(owner, repo) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${owner}/${repo}/releases/latest`,
      headers: {
        'User-Agent': 'Node.js App',
        'Accept': 'application/vnd.github.v3+json',
      },
    };

    https.get(options, res => {
      if (res.statusCode !== 200) {
        return reject(new Error(`GitHub API returned ${res.statusCode}`));
      }

      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const release = JSON.parse(data);
          const asset = release.assets.find(a => a.name.endsWith('.exe'));
          if (!asset) return reject(new Error('No .exe asset found'));
          resolve({ url: asset.browser_download_url, name: asset.name });
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

/**
 * Download a file from a given URL and save it locally
 */
async function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outputPath);

    https.get(url, {
      headers: {
        'User-Agent': 'Node.js App',
        'Accept': 'application/octet-stream'
      }
    }, res => {
      if (res.statusCode !== 200) {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          reject(new Error(`Download failed with status ${res.statusCode}, body: ${body}`));
        });
        return;
      }

      res.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', err => {
      fs.unlink(outputPath, () => {});
      reject(err);
    });
  });
}

/**
 * Launch the EXE file and wait briefly before exiting
 */
async function launchNewExeAndExit(exePath) {
  return new Promise((resolve, reject) => {
    console.log(`🚀 Launching: ${exePath}`);

    const command = `start "" "${exePath}"`;

    const child = spawn(command, {
      detached: true,
      stdio: 'ignore',
      shell: true,
      windowsHide: true
    });

    child.on('error', (err) => {
      console.error('❌ Failed to start child process:', err);
      return reject(err);
    });

    child.on('spawn', () => {
      setTimeout(() => {
        resolve();
        process.exit(0);
      }, 100);
    });
   
  });
}

/**
 * Combined flow: download and launch new EXE from GitHub
 */
async function downloadLatestExeFromGitHub(owner, repo, downloadPath) {
  try {
    const { url, name } = await getLatestExeDownloadUrl(owner, repo);
    const baseDir = path.dirname(process.execPath);
    const finalPath = downloadPath || path.join(baseDir, name);

    // console.log(`📥 Downloading from: ${url}`);
    // console.log(`📂 Saving to: ${finalPath}`);

    await downloadFile(url, finalPath);
    // console.log(`✅ Download complete: ${finalPath}`);

    await launchNewExeAndExit(finalPath);

    process.exit(0); // Exit only after launching
  } catch (err) {
    console.error('❌ Update failed:', err);
  }
}

module.exports = {
  launchNewExeAndExit,
  downloadLatestExeFromGitHub
};
