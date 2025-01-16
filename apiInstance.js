const axios = require("axios");
const localStorage = require("./localStorage");

// Create an Axios instance
const axiosInstance = axios.create({
  baseURL: "https://www.naukri.com",
  headers: {
    accept: "application/json",
    "accept-language": "en-US,en;q=0.9,en-IN;q=0.8",
    appid: "105",
    "cache-control": "no-cache, no-store, must-revalidate",
    "content-type": "application/json",
    expires: "0",
    gid: "LOCATION,INDUSTRY,EDUCATION,FAREA_ROLE",
    pragma: "no-cache",
    priority: "u=1, i",
    "sec-ch-ua": '"Microsoft Edge";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    systemid: "Naukri",
    "x-requested-with": "XMLHttpRequest",
    Referer: "https://www.naukri.com/mnjuser/recommendedjobs",
    "Referrer-Policy": "strict-origin-when-cross-origin",
  },
});

// Add a request interceptor to include the authorization token
axiosInstance.interceptors.request.use((config) => {
  const authorization = localStorage.getItem("authorization");
  if (authorization) {
    config.headers.Cookie = `nauk_at=${authorization}`;
  }
  return config;
});

module.exports = axiosInstance;
