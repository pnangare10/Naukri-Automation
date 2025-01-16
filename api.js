const { getFormattedDate, localStorage } = require("./helper");
const axiosInstance = require("./apiInstance");

const commonHeaders = {
  accept: "application/json",
  "accept-language": "en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7",
  appid: "109",
  "cache-control": "no-cache",
  clientid: "d3skt0p",
  "content-type": "application/json",
  gid: "LOCATION,INDUSTRY,EDUCATION,FAREA_ROLE",
  pragma: "no-cache",
  priority: "u=1, i",
  "sec-ch-ua":
    '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"',
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-origin",
  "x-requested-with": "XMLHttpRequest",
  systemid: "Naukri",
  "Referer-Policy": "strict-origin-when-cross-origin",
};

const getHeaders = (isAuthenticated, isCookieRequired) => {
  const authorization = localStorage.getItem("authorization");
  const headers = {
    ...commonHeaders,
    ...(isAuthenticated && {
      authorization: `Bearer ${authorization}`,
      Cookie: `nauk_at=${authorization})}`,
    }),
    ...(isCookieRequired && {
      cookie:
        "ak_bmsc=846DD46392B0310751DEA749E2379E51~000000000000000000000000000000~YAAQj/7UF/09qNGOAQAAuDbtIhfElrhYBy/92mVF3dUGENtEizaBaKOS8xbW7bTEjA5V11GIGWwTBcuGlmgAP3lhsq1I5klHC0VBvLOB/gKpZE2Wy+2dgXf96ju+SeUfw1FcAyfJjojwUcUHwS2BrTClnyP5NeLKVWc/gWU7tCDhj/z/GytxGmKy+uebM/RRpJsCHrUvovui1amSVFcRxp5PQTvxxFc3gu8lGRR64hKeiGXhZGnQ5vtoOig3zrsqGSeIrp0vLUaTYOsluvW2ALXhIkFC/gcfKkgbm72+QlA3tb4Indwx4KyNVK8wGdFD8Lnx8jJb4iX28HDGOADVeOg3BgQ/qfFbqVrjxQiXLH4R6KpatE4H7MNBsqw76amXuc5yCg1oIJzMb4H/L+QG8/a3sItgqb/JreU022hoLrPSMmR6cBZubh01BcqPH4Q0n72KimI0Pb2+WJsEry/liwuRnp2unTtGUD5Cjn+2FDzXiNKvn6W8tJ11EgvH; bm_sv=38CC44BC5CE5C6A49FCEB4BAEA7980ED~YAAQj/7UF8jZqdGOAQAAWRP8IheL7KnJCKaQXkBDplbMZVV6KOLs6+Ul++nFSfpBSldOutc9QMtYZOHORS5qv/2gaxKX2FSooAap3vINpmIfUVL4IoTx6FR1Swj7OadpaJXwa5Duxd8R+S4yuN83YheKsKoOzl798g18YJGEkVhfaPM+8PNnQoUBtSVVOQr9/CZdIGQ6WpZpogkuOCCA3uWb7raej5KQAAT+MQn7ypo24LbkxGKBdmXVb0o/5pWPCw==~1;",
    }),
  };
  return headers;
};

const applyJobsAPI = async (bodyStr) =>
  fetch(
    "https://www.naukri.com/cloudgateway-workflow/workflow-services/apply-workflow/v1/apply",
    {
      headers: getHeaders(true, false),
      body: `${bodyStr},"logstr":"--drecomm_profile-2-F-0-1--17140801091455348-","flowtype":"show","crossdomain":true,"jquery":1,"rdxMsgId":"","chatBotSDK":true,"mandatory_skills":["CSS","HTML","React.Js"],"optional_skills":["Typescript","Angular"],"applyTypeId":"107","closebtn":"y","applySrc":"drecomm_profile","sid":"17140801091455348","mid":""}`,
      method: "POST",
    }
  );

const searchJobsAPI = (pageNo, keywords) =>
  fetch(
    `https://www.naukri.com/jobapi/v3/search?noOfResults=20&urlType=search_by_key_loc&searchType=adv&location=pune%2C%20mumbai%2C%20bengaluru%2C%20bangalore&keyword=${keywords}&sort=p&pageNo=${pageNo}&experience=3&ctcFilter=6to10&ctcFilter=10to15&ctcFilter=15to25&ctcFilter=25to50&ctcFilter=50to75&ctcFilter=75to100&k=${keywords}&l=pune%2C%20mumbai%2C%20bengaluru%2C%20bangalore&nignbevent_src=jobsearchDeskGNB&experience=3&ctcFilter=6to10&ctcFilter=10to15&ctcFilter=15to25&ctcFilter=25to50&ctcFilter=50to75&ctcFilter=75to100&src=cluster&latLong=18.7506117_73.8764436&sid=17143714288347830_8`,
    {
      headers: getHeaders(true, false),
      body: null,
      method: "GET",
    }
  );

const getJobDetailsAPI = (jobId) =>
  fetch(
    `https://www.naukri.com/jobapi/v4/job/${jobId}?microsite=y&src=jobsearchDesk&sid=1714278791789807&xp=1&px=1`,
    {
      headers: getHeaders(true, true),
      body: null,
      method: "GET",
    }
  );

const getSimJobsAPI = (jobId) =>
  fetch(
    `https://www.naukri.com/jobapi/v2/search/simjobs/${jobId}?noOfResults=6&searchType=sim`,
    {
      headers: getHeaders(true, false),
      body: null,
      method: "GET",
    }
  );

const loginAPI = (creds) =>
  fetch("https://www.naukri.com/central-login-services/v1/login", 
  {
    headers: {
      ...getHeaders(false, false),
      systemid: "jobseeker",
    },
    body: `{"username": "${creds.username}","password":"${creds.password}"}`,
    method: "POST",
  }
);

const getRecommendedJobsAPI = async (clusterId) =>
  fetch("https://www.naukri.com/jobapi/v2/search/recom-jobs", 
  {
    headers: getHeaders(true, false),
    body: `{"clusterId":"${clusterId}","src":"recommClusterApi","clusterSplitDate":{"apply":"${getFormattedDate()}","preference":"${getFormattedDate()}","profile":"${getFormattedDate()}","similar_jobs":"${getFormattedDate()}"}}`,
    method: "POST",
  }
);

const getProfileDetailsAPI = async () =>
  fetch(
    "https://www.naukri.com/cloudgateway-mynaukri/resman-aggregator-services/v2/users/self?expand_level=4",
    {
      headers: getHeaders(true, false),
      body: null,
      method: "GET",
    }
  );

module.exports = {
  applyJobsAPI,
  searchJobsAPI,
  getJobDetailsAPI,
  getSimJobsAPI,
  loginAPI,
  getRecommendedJobsAPI,
  getProfileDetailsAPI,
};
