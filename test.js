const { getDataFromFile } = require("./utils");

const jobsFromFile = getDataFromFile("searchedJobs", "Pranesh Nangare").then(
  (data) => {
    // check if there is a email id present in description of jobs
    const emails = [];
    data.forEach((job) => {
      if (job.description.includes("@")) {
        //extract email from the description string
        const email = job.description.match(
          /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi
        );
        if (email)
          emails.push({
            company: job.companyName,
            email: email[0],
            title: job.title,
          });
      }
    });
    console.log(emails);
  }
);
