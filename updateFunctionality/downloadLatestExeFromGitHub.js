const { https } = require('follow-redirects'); // follows 3xx redirects
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

/**
 * Downloads the latest .exe file from GitHub Releases
 * @param {string} owner - GitHub username or org
 * @param {string} repo - Repository name
 * @param {string} [downloadPath] - Optional path where to save the .exe. If not provided, uses the release filename in the current executable's folder.
 */
const downloadLatestExeFromGitHub = (owner, repo, downloadPath) => {
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
      console.error(`❌ GitHub API request failed with status: ${res.statusCode}`);
      return;
    }

    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const release = JSON.parse(data);
        const asset = release.assets.find(a => a.name.endsWith('.exe'));

        if (!asset) {
          console.error('❌ No .exe asset found in latest release.');
          return;
        }

        const fileName = asset.name;
        const baseDir = path.dirname(process.execPath); // Use real directory even in pkg
        const finalPath = downloadPath || path.join(baseDir, fileName);
        const file = fs.createWriteStream(finalPath);

        console.log(`📥 Downloading: ${asset.browser_download_url}`);
        console.log(`📂 Saving as: ${finalPath}`);

        https.get(asset.browser_download_url, {
          headers: {
            'User-Agent': 'Node.js App',
            'Accept': 'application/octet-stream'
          }
        }, response => {
          if (response.statusCode !== 200) {
            console.error(`❌ Download failed with status: ${response.statusCode}`);
            response.setEncoding('utf8');
            let body = '';
            response.on('data', chunk => body += chunk);
            response.on('end', () => {
              console.error('❌ Error response body:', body);
            });
            return;
          }

          response.pipe(file);

          file.on('finish', () => {
            file.close(() => {
              console.log(`✅ Download completed: ${finalPath}`);
              launchNewExeAndExit(finalPath);
            });
          });
        }).on('error', err => {
          fs.unlink(finalPath, () => {});
          console.error('❌ Download error:', err.message);
        });

      } catch (err) {
        console.error('❌ JSON Parse error:', err.message);
      }
    });
  }).on('error', err => {
    console.error('❌ GitHub API error:', err.message);
  });
};


/**
 * Launches the new exe and exits the current app
 * @param {string} exePath - Full path to the new .exe file
 */
function launchNewExeAndExit(exePath) {
  console.log(`🚀 Launching new application from: ${exePath}`);

  const child = spawn(exePath, [], {
    detached: true,
    stdio: 'ignore'
  });

  child.unref();

  setTimeout(() => {
    console.log('🛑 Exiting old application...');
    process.exit(0);
  }, 1000);
}

module.exports = {
  launchNewExeAndExit,
  downloadLatestExeFromGitHub
};
