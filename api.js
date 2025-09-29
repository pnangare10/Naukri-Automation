const { getFormattedDate, localStorage } = require("./utils/helper");

const commonHeaders = {
  accept: "application/json",
  "accept-language": "en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7",
  appid: "121",
  "cache-control": "no-cache",
  clientid: "d3skt0p",
  "content-type": "application/json",
  gid: "LOCATION,INDUSTRY,EDUCATION,FAREA_ROLE",
  pragma: "no-cache",
  priority: "u=1, i",
    "nkparam": "jH9QnltH+MuGKLwVCzx6nuqLOex1fiLfmrNahP7GLA0SQihJC6d0hDFoJXV65lyEzWcAjLQ7SuUTKBlHw4Artw==",

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
        '_t_ds=1beede871734549822-111beede87-01beede87; J=0; jd=031224508425; test=naukri.com; PS=055474c5913207df0833da5505f0939499f983faf0fa15fe03810eecac297038719f715d2eb9dbc0ebdf31417b362f0d; _ga=GA1.1.1388380775.1734549825; ninjas_new_marketing_token=55944671e42bfe1914d9ff0ff85958bc; ph_phc_s4aJa5RpiiZlHbbxy4Y1Btjhosozg9ECrSuJNVrvZuP_posthog=%7B%22distinct_id%22%3A636236%7D; _clck=1xl6nx5%7C2%7Cftq%7C0%7C1882; _ga_7TYVEWTVRG=GS1.1.1740493309.1.1.1740493404.0.0.0; _ga_JCSR1LRE3X=GS1.1.1740493309.1.1.1740493404.0.0.0; nauk_ps=default; NKWAP=db4fc3d77f3654247ba809e089a4c0fd58822d409817dbb65901a3ad0448c2d9ff003c62a2e1a36431b890266d0ecd01~e57335e68a4c79d57991fe1eeace01ba06af162a82756b4726a28621705d5d90~1~0; MYNAUKRI[UNID]=8cdb4e75d73f4f71b0d8bac441c6b12c; __gads=ID=b2c6fb293a0153e8:T=1743445614:RT=1743843932:S=ALNI_MZ8dAm8cGp4kbfrCe5RXwmJsWu-zg; __gpi=UID=000010825b096814:T=1743445614:RT=1743843932:S=ALNI_MZvPZ40hLG2xMjV4x3oykq_FuA5ZQ; __eoi=ID=6e62ab7ead75e2e0:T=1743445614:RT=1743843932:S=AA-AfjaO2UQSmQZ75wJVJ8lGoTO4; _t_us=68A1F7B4; _t_s=direct; _t_r=1030%2F%2F; persona=default; ak_bmsc=7AB18C302DBAAA9B738A43CF2E6AC652~000000000000000000000000000000~YAAQrQ7EF64VCqeYAQAAVZuvuByWJR1mHGtB+RMVzCQUvs/YoUZSNN9R7pVNsEqQal4mbKCjmfF063YM4MMRChFvO9pOTZ0EeQas1Hq19n2AduqdqW6g0Eq0LJK4PCp0NnQuyvAH2PAsdcophE4GqGz1Iz1V9Fu/IiS5UsjTL3T4MFmWnF4WW98jTZtowYSt88i1WBgPOgimdSPgpBLI378IBGnokNET+EHyMlMPDSLmxRUo4eCkCihnw77Cdio5O0SivcNu7jiseVfE/N8avIbvMxZ28shAGpbtblbNf336/geFgr3fGHW+nMO2dg5XGRSKcu68jrb9nw/hui9zv8HWjtfvZCJv9NfFFdUidi1wQUozva4Gi550/xWIQSXKyWNI9s7qnDYfDecXWaLrhvot99qbwAre+upbHa6ap1tP9qgK67lyOAX6gRjA7AhqegTlWs5wgCBhsA3TZhU=; _gcl_au=1.1.2039033437.1755445174; g_state={\"i_l\":1,\"i_p\":1755452388064}; PHPSESSID=tt6rae8ivu5l4qf2n5ndps3bj5; nauk_at=eyJraWQiOiIzIiwidHlwIjoiSldUIiwiYWxnIjoiUlM1MTIifQ.eyJ1ZF9yZXNJZCI6MTgwNDAzNzg4LCJzdWIiOiIxODYwMDM2OTIiLCJ1ZF91c2VybmFtZSI6ImYxNTg0NTA1MDEuODU5NCIsInVkX2lzRW1haWwiOnRydWUsImlzcyI6IkluZm9FZGdlIEluZGlhIFB2dC4gTHRkLiIsInVzZXJBZ2VudCI6Ik1vemlsbGEvNS4wIChXaW5kb3dzIE5UIDEwLjA7IFdpbjY0OyB4NjQpIEFwcGxlV2ViS2l0LzUzNy4zNiAoS0hUTUwsIGxpa2UgR2Vja28pIENocm9tZS8xMzkuMC4wLjAgU2FmYXJpLzUzNy4zNiBFZGcvMTM5LjAuMC4wIiwiaXBBZHJlc3MiOiIyMDIuMTM2LjcxLjIyIiwidWRfaXNUZWNoT3BzTG9naW4iOmZhbHNlLCJ1c2VySWQiOjE4NjAwMzY5Miwic3ViVXNlclR5cGUiOiJqb2JzZWVrZXIiLCJ1c2VyU3RhdGUiOiJBVVRIRU5USUNBVEVEIiwidWRfaXNQYWlkQ2xpZW50IjpmYWxzZSwidWRfZW1haWxWZXJpZmllZCI6dHJ1ZSwidXNlclR5cGUiOiJqb2JzZWVrZXIiLCJzZXNzaW9uU3RhdFRpbWUiOiIyMDI1LTA4LTE3VDIxOjEwOjAxIiwidWRfZW1haWwiOiJwcmFuZXNobmFuZ2FyZTEwQGdtYWlsLmNvbSIsInVzZXJSb2xlIjoidXNlciIsImV4cCI6MTc1NTQ0ODgwMSwidG9rZW5UeXBlIjoiYWNjZXNzVG9rZW4iLCJpYXQiOjE3NTU0NDUyMDEsImp0aSI6IjFlNjE2NzQ4N2JhNDQ3MDE4NWY1Yjc5YjYzOTJkNDk2IiwicG9kSWQiOiJwcm9kLTU0YjhjNmQ5OC1rbnA2dyJ9.K54S5kXZ2iued0UCNTWN3U-Z3_5DnGDO1MmShigccq2O8y-cjx1edzCazmDYW08KTVJ9sXhsPS5kcFM1H6QW8hGk5ny84OfOsJgHUy40nLVKOg_GlsYFNr541noLTdWCCqdsIug4nKtXbaI5v70ZSDOVsvrrAlC8b1a7Ai-lBSdxN5mOR0dkjfjmKnlrvkBnDeEzBWC9l9VqBc-HA47kqbbDeBmjs9OGzAxSnjER0HOcjBPWRhiD4Lo_AC5gGPXtYwPbMWJZoxR-RYBUZwQTy7-X3ckxlHPdx6hM_0etMOtvtcuNdSU3Oiq4rUs4TqR7LaHd4UIG_ikK9kVSyvoAlg; nauk_rt=1e6167487ba4470185f5b79b6392d496; is_login=1; nauk_sid=1e6167487ba4470185f5b79b6392d496; nauk_otl=1e6167487ba4470185f5b79b6392d496; _ga_T749QGK6MQ=GS2.1.s1755445174$o30$g0$t1755445201$j33$l0$h0; ACTIVE=1755445214; _ga_K2YBNZVRLL=GS2.1.s1755445172$o102$g1$t1755445216$j16$l0$h0; bm_sv=9DBE0D69EA00DB12A9FFF892133C5090~YAAQrQ7EF3AqCqeYAQAAUDa4uBzDb/bXKvFpiKSmnO6tn7znkgI4/Q/55imj157Ndq8rFautiFJtLi78BEMTA33bssJoYvFfAZ/ycU63apJCXvy+s8+9pBrvSJbJ5rtKJBzTYX91moKmmR4ruEfY9QTybZko8LGr/YVUFQjNfw9gNj2idV39q2XSdxZXTpXOG72gHxta4r+PUOhzl8W+oia7xdOrLfWld3r4S2k5ObmVZk2zRkkqwFq9BlZniGLyrA==~1',
    }),
  };
  return headers;
};

const applyJobsAPI = async (bodyStr) =>
  fetch(
    "https://www.naukri.com/cloudgateway-workflow/workflow-services/apply-workflow/v1/apply",
    {
      headers: getHeaders(true, true),
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
    `https://www.naukri.com/jobapi/v4/job/${jobId}?microsite=y&src=jobsearchDesk&sid=17563633043679150&xp=1&px=1`,
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
      headers: getHeaders(true, true),
      body: null,
      method: "GET",
    }
  );

const loginAPI = (creds) =>
  fetch("https://www.naukri.com/central-login-services/v1/login", {
    headers: {
      ...getHeaders(false, false),
      systemid: "jobseeker",
    },
    body: `{"username": "${creds.username}","password":"${creds.password}"}`,
    method: "POST",
  });

const getRecommendedJobsAPI = async (clusterId) =>
  fetch("https://www.naukri.com/jobapi/v2/search/recom-jobs", {
    headers: getHeaders(true, true),
    body: `{"clusterId":"${clusterId}","src":"recommClusterApi","clusterSplitDate":{"apply":"${getFormattedDate()}","preference":"${getFormattedDate()}","profile":"${getFormattedDate()}","similar_jobs":"${getFormattedDate()}"}}`,
    method: "POST",
  });

const getProfileDetailsAPI = async () =>
  fetch(
    "https://www.naukri.com/cloudgateway-mynaukri/resman-aggregator-services/v2/users/self?expand_level=4",
    {
      headers: getHeaders(true, false),
      body: null,
      method: "GET",
    }
  );

const matchScoreAPI = async (jobId) =>
  fetch(`https://www.naukri.com/jobapi/v3/job/${jobId}/matchscore`, {
    headers: getHeaders(true, false),
    body: null,
    method: "GET",
  });

const incrementCounterAPI = async (useCase = 'newJobApplied') => 
  fetch(`https://us-central1-easyledger-ed2ef.cloudfunctions.net/apiCounter?useCase=${useCase}`, {
    headers: {
      "Content-Type": "application/json",
    },
    body: null,
    method: "GET",
  });

const getResumeAPI = async (profileId) => 
  fetch(
    `https://www.naukri.com/cloudgateway-mynaukri/resman-aggregator-services/v1/users/self/profiles/${profileId}/resume`, {
    headers: {
      ...getHeaders(true, false),
      "content-type": "application/pdf",
    },
    method: "GET",
  });

const getConstantsAPI = async (type) =>
  fetch(`https://getdata-856678010611.us-central1.run.app?type=${type}`, {
    headers: {
      "Content-Type": "application/json",
    },
    body: null,
    method: "GET",
  });

module.exports = {
  applyJobsAPI,
  searchJobsAPI,
  getJobDetailsAPI,
  getSimJobsAPI,
  loginAPI,
  getRecommendedJobsAPI,
  getProfileDetailsAPI,
  incrementCounterAPI,
  matchScoreAPI,
  getResumeAPI,
  getConstantsAPI,
};
