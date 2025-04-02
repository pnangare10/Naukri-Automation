const { getFormattedDate, localStorage } = require("./utils/helper");

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
  nkparam:
    "oFYlsMP9SN/18UTJyWR0J4Far8aGlf/RgiTehgjzAfodyCTha++NVMb+jAOJjH4rULRVnn65HS1K0dD3clyVyQ==",
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
        '_t_ds=1beede871734549822-111beede87-01beede87; J=0; jd=031224508425; _gcl_au=1.1.1303359034.1734549824; test=naukri.com; PS=055474c5913207df0833da5505f0939499f983faf0fa15fe03810eecac297038719f715d2eb9dbc0ebdf31417b362f0d; MYNAUKRI[UNID]=8cdb4e75d73f4f71b0d8bac441c6b12c; NKWAP=db4fc3d77f3654247ba809e089a4c0fd58822d409817dbb65901a3ad0448c2d9ff003c62a2e1a36431b890266d0ecd01~e57335e68a4c79d57991fe1eeace01ba06af162a82756b4726a28621705d5d90~1~0; _ga=GA1.1.1388380775.1734549825; tStp=1737416650760; g_state={"i_p":1737657921031,"i_l":1}; ninjas_new_marketing_token=55944671e42bfe1914d9ff0ff85958bc; ph_phc_s4aJa5RpiiZlHbbxy4Y1Btjhosozg9ECrSuJNVrvZuP_posthog=%7B%22distinct_id%22%3A636236%7D; _clck=1xl6nx5%7C2%7Cftq%7C0%7C1882; _ga_7TYVEWTVRG=GS1.1.1740493309.1.1.1740493404.0.0.0; _ga_JCSR1LRE3X=GS1.1.1740493309.1.1.1740493404.0.0.0; nauk_rt=06ad020b47564912a1dcf732b3d8d6db; nauk_sid=06ad020b47564912a1dcf732b3d8d6db; nauk_otl=06ad020b47564912a1dcf732b3d8d6db; nauk_ps=default; _ga_T749QGK6MQ=GS1.1.1740805728.17.0.1740805735.0.0.0; _fbp=fb.1.1740806059199.527055654643871937; nauk_at=eyJraWQiOiIyIiwidHlwIjoiSldUIiwiYWxnIjoiUlM1MTIifQ.eyJ1ZF9yZXNJZCI6MTgwNDAzNzg4LCJzdWIiOiIxODYwMDM2OTIiLCJ1ZF91c2VybmFtZSI6ImYxNTg0NTA1MDEuODU5NCIsInVkX2lzRW1haWwiOnRydWUsImlzcyI6IkluZm9FZGdlIEluZGlhIFB2dC4gTHRkLiIsInVzZXJBZ2VudCI6Ik1vemlsbGEvNS4wIChXaW5kb3dzIE5UIDEwLjA7IFdpbjY0OyB4NjQpIEFwcGxlV2ViS2l0LzUzNy4zNiAoS0hUTUwsIGxpa2UgR2Vja28pIENocm9tZS8xMzMuMC4wLjAgU2FmYXJpLzUzNy4zNiBFZGcvMTMzLjAuMC4wIiwiaXBBZHJlc3MiOiIyMDIuMTM2LjcxLjIxIiwidWRfaXNUZWNoT3BzTG9naW4iOmZhbHNlLCJ1c2VySWQiOjE4NjAwMzY5Miwic3ViVXNlclR5cGUiOiIiLCJ1c2VyU3RhdGUiOiJBVVRIRU5USUNBVEVEIiwidWRfaXNQYWlkQ2xpZW50IjpmYWxzZSwidWRfZW1haWxWZXJpZmllZCI6dHJ1ZSwidXNlclR5cGUiOiJqb2JzZWVrZXIiLCJzZXNzaW9uU3RhdFRpbWUiOiIyMDI1LTAzLTAxVDEwOjM4OjU1IiwidWRfZW1haWwiOiJwcmFuZXNobmFuZ2FyZTEwQGdtYWlsLmNvbSIsInVzZXJSb2xlIjoidXNlciIsImV4cCI6MTc0MTE2NTg1OCwidG9rZW5UeXBlIjoiYWNjZXNzVG9rZW4iLCJpYXQiOjE3NDExNjIyNTgsImp0aSI6IjA2YWQwMjBiNDc1NjQ5MTJhMWRjZjczMmIzZDhkNmRiIiwicG9kSWQiOiJwcm9kLWNkNWY5OTU2ZC1yZ2JiMiJ9.bINKV_ioApLrIp4Ds4rs4Hliex7wQvCMRCPNVuf_7OlB22jD4qW5gdyB-04hrSOU3SfbJHkIFqSCzdYefNzAGJYrZ1w2oCphhaFPf47v1Hqq0lKDsU2o_Xh1EmMP4WjnAVawMAirDt73lJ7sM9tPMVW2lg77JeFp4r4_zwXwhBsvVhhtqaTpUGujayXkOTSJHEayi6IrFGvHaMFetlyljrpcLqCrxkj84Jd-5N0KsmlxB0O2atPmq_fEFYj-QHn3fUVpK1a2jKOcgPbPWJdRvXI-XSS6Pc68NNMPSlxNMyOENM0NfWhqNbB_M25xjNKRqeeHO2R4rjEJ4GltzoKirg; is_login=1; failLoginCount=0; bm_mi=25C4DF0C9D23844026BF8545A7493391~YAAQjwFAF6WhwkqVAQAAZd5cZRu5bQVSPvxOehBLDgCH1cmOPWX9ywbvErvCGeCaLm22dkGCKIYGTem+AmT4QNTprdMalY/fzqOL+lg6hKbs35JO0YDgoLdBqnHiUzqLFJXEAiM0Xw9bZBNtSTi+19zxqGuw7klhg/05I6ZmqPNajvOCYCokFMTyqmx2hhlXh/bcyZ977E2NpjWMlsMLjfQ24MM6AlUb5DwtLlraO7V0yUjv/rfAGvWSraND04sqx1G27/16MBGe53NMpDFxYRusUXlOJa7OXoCk3rOhP6pmbPoGAf6tcBiNhuTBcCbIh0JkWousXWWjtrwf~1; bm_sv=72EC5EECED8663E61B5F53296CFAB689~YAAQjwFAF6ahwkqVAQAAZd5cZRuwzC+T97bc7pMME3dGvc4sDUteTrqN1qgT4Jv++F/GMc3Gl4i8bpK0GY1u71fQbOOm7W01RZpapKss/D2GBDqqglk0spGtm+X+kNm66PoPYHJBBKPfb/XfviCjQUstW2NPkTQzhA1lZcyIUhifgpNvDnzbe+Borfyn0YMP+Bx/R1PjLQelyXXL/72A6J0xKSm1iu617QbKaIc0fp9X2pmJr3U/uqbDgbUMExFd~1; ACTIVE=1741162794; PHPSESSID=g26v5nevtamg5t75ncf959n0hm; ak_bmsc=6B919B2227BDDF9899767992AC73D3E5~000000000000000000000000000000~YAAQjwFAF7CFw0qVAQAA089jZRtOgHd6WBOJ6LvWJzUdpX1gsX2TbeKQwZoC7Ld350XAY3ksZNLAVV3cTqb1iFh8rmYzX4oBA/jLCSJOHjqTUvZB6O4eE8T2NmcEmpZ1IMah6SLBWsRKgAlL6MPuEHZUbJGAE8e2wV6g8ZbqcphaxmD9L2osba21SJTpoZLDjbYKi62m/UrWf7dVnO9P52ZsXMyfT5g1CMkbNIN12ebHO68jfFlcU31/u9VeawT3LBgLscdPXVsuYuDd6+l+wiO1HDNk2BWcPn+tt1wJIswBjSzS1t7coWAKwvOoDxPV/cFqyquq3Ywx3FBIKRqh3F9ESRCj2fPCmpKVFeSYaTxAMcqD/yuVmzQxKUzj8AQ8OdjVzI/lma8jsKrJ35Sj8lSa7No2Z74hW85rXMY3MKMHeTHE9UGw8PpPmC9IbcOtQ60LurYFLiykWolkDzSgXPR/ffK68tuKe83IaYyA2jPn/TI3lYiuNMlzgnBlFpk=; HOWTORT=ul=1741163260430&r=https%3A%2F%2Fwww.naukri.com%2Fjob-listings-manager-software-engineering-planview-india-private-limited-bengaluru-5-to-8-years-030325502839%3Fsrc%3Ddrecomm_apply%26sid%3D17411627956384809%26xp%3D2%26px%3D1&hd=1741163260596; _ga_K2YBNZVRLL=GS1.1.1741162260.66.1.1741163260.55.0.0',
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
    headers: getHeaders(true, false),
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
