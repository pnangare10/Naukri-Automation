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
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0",
  nkparam:
    "jH9QnltH+MuGKLwVCzx6nuqLOex1fiLfmrNahP7GLA0SQihJC6d0hDFoJXV65lyEzWcAjLQ7SuUTKBlHw4Artw==",
  "sec-ch-ua":
    '"Chromium";v="139", "Google Chrome";v="139", "Not-A.Brand";v="99"',
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
    ...(isCookieRequired &&
      false && {
        cookie:
          '_t_ds=1beede871734549822-111beede87-01beede87; J=0; PS=055474c5913207df0833da5505f0939499f983faf0fa15fe03810eecac297038719f715d2eb9dbc0ebdf31417b362f0d; _ga=GA1.1.1388380775.1734549825; _ga_7TYVEWTVRG=GS1.1.1740493309.1.1.1740493404.0.0.0; _ga_JCSR1LRE3X=GS1.1.1740493309.1.1.1740493404.0.0.0; _ga_T749QGK6MQ=GS2.1.s1756365934$o31$g1$t1756365951$j43$l0$h0; ACTIVE=1759774314; g_state={"i_l":2,"i_p":1759860799879}; nauk_rt=9429223a690c4b95b60d433b146a0591; nauk_sid=9429223a690c4b95b60d433b146a0591; nauk_otl=9429223a690c4b95b60d433b146a0591; NKWAP=06f957e61bb11685b9ea922eb6a996bb2cd7f3fb40c29a18ff003c62a2e1a36431b890266d0ecd01~055474c5913207df0833da5505f0939499f983faf0fa15fe03810eecac297038719f715d2eb9dbc0ebdf31417b362f0d~1~0; MYNAUKRI[UNID]=3cdda6110f2c49d6a28568a4ae56f656; nauk_ps=default; __gads=ID=b2c6fb293a0153e8:T=1743445614:RT=1759774427:S=ALNI_MZ8dAm8cGp4kbfrCe5RXwmJsWu-zg; __gpi=UID=000010825b096814:T=1743445614:RT=1759774427:S=ALNI_MZvPZ40hLG2xMjV4x3oykq_FuA5ZQ; __eoi=ID=56818efb5621024f:T=1759124867:RT=1759774427:S=AA-AfjaOl3zqlIwKvnX9lM5x2q0W; test=naukri.com; nauk_cs=default; _gcl_au=1.1.811142471.1773895596; _fbp=fb.1.1773896258136.988599158443800048; nauk_at=eyJraWQiOiIzIiwidHlwIjoiSldUIiwiYWxnIjoiUlM1MTIifQ.eyJkZXZpY2VUeXBlIjoiZDNza3QwcCIsInVkX3Jlc0lkIjoyMjUwODgzNTgsInN1YiI6IjE4NTQ3MTQ0MyIsInVkX3VzZXJuYW1lIjoiZjE1ODMzMzY0NzQuOTY1My4xNjc4MzA1NjE4IiwidWRfaXNFbWFpbCI6dHJ1ZSwiaXNzIjoiSW5mb0VkZ2UgSW5kaWEgUHZ0LiBMdGQuIiwidXNlckFnZW50IjoiTW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV2luNjQ7IHg2NCkgQXBwbGVXZWJLaXQvNTM3LjM2IChLSFRNTCwgbGlrZSBHZWNrbykgQ2hyb21lLzE0MS4wLjAuMCBTYWZhcmkvNTM3LjM2IEVkZy8xNDEuMC4wLjAiLCJpcEFkcmVzcyI6IjI0MDE6NDkwMDpjMGI5OjVhM2Y6N2M1MTo5ZjQ3OmRlNTU6ODIzNCIsInVkX2lzVGVjaE9wc0xvZ2luIjpmYWxzZSwidXNlcklkIjoxODU0NzE0NDMsInN1YlVzZXJUeXBlIjoiIiwidXNlclN0YXRlIjoiQVVUSEVOVElDQVRFRCIsInVkX2lzUGFpZENsaWVudCI6ZmFsc2UsInVkX2VtYWlsVmVyaWZpZWQiOnRydWUsInVzZXJUeXBlIjoiam9ic2Vla2VyIiwic2Vzc2lvblN0YXRUaW1lIjoiMjAyNS0xMC0wNlQyMzo0MzozNSIsInVkX2VtYWlsIjoiYW5raXRhdXlAZ21haWwuY29tIiwidXNlclJvbGUiOiJ1c2VyIiwiZXhwIjoxNzc0NTk1NDEwLCJ0b2tlblR5cGUiOiJhY2Nlc3NUb2tlbiIsImlhdCI6MTc3NDU5MTgxMCwianRpIjoiOTQyOTIyM2E2OTBjNGI5NWI2MGQ0MzNiMTQ2YTA1OTEiLCJwb2RJZCI6InByb2QtODVkYjY5ZmQ0OC1xcHQ1bSJ9.hy0hZIilvkvkFYvuZHZw3ChUZ8rZVc8zzPEKb-sahzewozELtRBwcmwhLie1aKAVsMJ2obwNSMMurEEdrkBGUgR0m-6RGum5aWrYOn3aGjHgR7X_ggLuoA0nRDu1WjEEWFS9JLZBQ7pllEb6iIqXQ2btnnp59AhoLrXtvs2TMc5caj_MTVRuYNdvoFLGVPiflZEbZCWBOZUbeshowdA_ePWmhNlYXNuLhyX7bLKL9NTF4rmq6tovWYyI_wzCbPp_AAcgnfhW1XECELrfmZ8vQnCKBfdTclojzpJDTb8Ajy4t2qx1HXBaPEjlS0X1v8IHxA-vm6E8eKxYezaPmLlmGQ; is_login=1; failLoginCount=0; HOWTORT=cl=1774591829127&r=https%3A%2F%2Fwww.naukri.com%2Fmnjuser%2Fhomepage; bm_mi=A3D6BD51E3724283D55FFF86EE856D8D~YAAQjwFAF/VCBgGdAQAA22XqLR+1VZ3jLPB3Z/1NLR2PDggiKPk9M8Sy+MY2gj6or+0kR3eUKyN7d0h3m2y3yUfNU3QnKw5HFZRUgz/f1YV0kup4t26qwT/9huxkV7eiz+rhGrPv3K69XJfdz+DBJ7YKsUozsvUh633FbcZ3uVTW/lNvwpoQTufaQq6AEU80olnXd+uKxmhc0TpvVBkWzaA1GloNr7AZ2qy9DvX47x/E+MCCa9Lhu2Ao71bVAVUrqwRfqbTB8H6o//aYDni8D8+0zRxRPJtCYa4hoSc8rJUz+0BlTH/m79JTQo15yzkPXx0XPWzmkYsSlHmQOThJL7G6EFdiIqpy3R07HlVWedov5dgLp2ehhguln8eZ+gVYUIkP9S1RSxuvWBwJHJEDG3wmWSrMEMguN3LaIT6uYVggJrQJvBd77zAuNdpITrLThB6JrpkTj7sSRPeX2gA=~1; _ga_K2YBNZVRLL=GS2.1.s1774591812$o122$g1$t1774591829$j43$l0$h0; ak_bmsc=6E2375D830CEC4F1643EB3F9A63C4E73~000000000000000000000000000000~YAAQjwFAF/JEBgGdAQAAlmjqLR9pL3wfpkxNwDh44o258i/Jw2HafYSWnFcdGVR1ya2qMKK7Fp2N4ikkQrojUK/Ni/ezPw8nWte3pm+Vvef99zHdWCPvy6h/6Kpgqq4VZ2jSglM57JAkNv5ewj7hM333xyOomSzsty/eusCIJibZHIw9wsDkkU2fIh2iCiMj/uGalQmQQM7GFvmPaNDLfR7DyVB6WmPukdP7kZGPpYx9Zpj3erfeA/HTCN1fNiFRIALgeqCY8iKkACJZZFyAe1mBFGyiZ5O9cc3gBDdzyBdqD4UpuX/aFm1IDHbDZlmP61KrKexq160Vh7zLH/SuGjK7GVJthNsopZCqdB9w9iRmKo7UrmXAfuzv598Pv0CAPuuPdx8w0IAzxbCkc1DAhCCYzYZ3rWSB+dQHC3bNXOqU8vKX2SuR3V9UHdV+zEDfNdXtF01GSia6jBtYhxurweOAjoVnepBey5K1G4nVthKY9bUi7KxtR6NIUIc9MLmaKakmaqzS1GZfGnFzlsiT4d6Qioykqajjh/Mqs80A6COVcPNdKSxGj6Ruf6bXYfpakOZWVs0vbzAnUh650vXC0MDhLSLJRo5Ws3uVGGMSCjdBZlWrLUrYyN6S8MFiuu3Bsfc=; bm_sv=1B266965F205DDE71F8E3B8909C7AA50~YAAQjwFAF7NHBgGdAQAA1GzqLR+uVCBpMARnzJ5DR4KEceY1NXO+2H3g9stqMiM0NGroLIm+V5AIO9ecVPoHNmjSrB7578TFtZrF8kplYNsRhqnVYAJRatAs3VU7t/AjT06gmabGkPfSoq3T78yV7FWDW2Z4gEymag75nUHT9wlPSiJNNOLyHGsGKfMib3OYVrkQN+GpfN4Ks7KvZEoV15BjIdykNPw0Ia/A+gc9wBa4v507anIwlZlnMUvcx8BA/Q==~1',
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
    },
  );

const searchJobsAPI = (pageNo, keywords) =>
  fetch(
    `https://www.naukri.com/jobapi/v3/search?noOfResults=20&urlType=search_by_key_loc&searchType=adv&location=pune%2C%20mumbai%2C%20bengaluru%2C%20bangalore&keyword=${keywords}&sort=p&pageNo=${pageNo}&experience=3&ctcFilter=6to10&ctcFilter=10to15&ctcFilter=15to25&ctcFilter=25to50&ctcFilter=50to75&ctcFilter=75to100&k=${keywords}&l=pune%2C%20mumbai%2C%20bengaluru%2C%20bangalore&nignbevent_src=jobsearchDeskGNB&experience=3&ctcFilter=6to10&ctcFilter=10to15&ctcFilter=15to25&ctcFilter=25to50&ctcFilter=50to75&ctcFilter=75to100&src=cluster&latLong=18.7506117_73.8764436&sid=17143714288347830_8`,
    {
      headers: getHeaders(true, false),
      body: null,
      method: "GET",
    },
  );

const getJobDetailsAPI = (jobId) =>
  fetch(
    `https://www.naukri.com/jobapi/v4/job/${jobId}?microsite=y&src=jobsearchDesk&sid=17563633043679150&xp=1&px=1`,
    {
      headers: getHeaders(true, true),
      body: null,
      method: "GET",
    },
  );

const getSimJobsAPI = (jobId) =>
  fetch(
    `https://www.naukri.com/jobapi/v2/search/simjobs/${jobId}?noOfResults=6&searchType=sim`,
    {
      headers: getHeaders(true, true),
      body: null,
      method: "GET",
    },
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
    },
  );

const matchScoreAPI = async (jobId) =>
  fetch(`https://www.naukri.com/jobapi/v3/job/${jobId}/matchscore`, {
    headers: getHeaders(true, false),
    body: null,
    method: "GET",
  });

const incrementCounterAPI = async (useCase = "newJobApplied") =>
  fetch(
    `https://us-central1-easyledger-ed2ef.cloudfunctions.net/apiCounter?useCase=${useCase}`,
    {
      headers: {
        "Content-Type": "application/json",
      },
      body: null,
      method: "GET",
    },
  );

const getResumeAPI = async (profileId) =>
  fetch(
    `https://www.naukri.com/cloudgateway-mynaukri/resman-aggregator-services/v1/users/self/profiles/${profileId}/resume`,
    {
      headers: {
        ...getHeaders(true, false),
        "content-type": "application/pdf",
      },
      method: "GET",
    },
  );

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
