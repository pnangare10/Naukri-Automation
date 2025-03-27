// Get the emails from json file and create a custom email body, replace the placeholders with the actual values

const {
  getDataFromFile,
  writeToFile,
  deleteFile,
  checkFileExists,
} = require("./ioUtils");
const nodemailer = require("nodemailer");
const prompts = require("@inquirer/prompts");
const { openUrl, localStorage, openFile } = require("./helper");
const path = require("path");
const { getResume, findNewJobs } = require("./jobUtils");
const { getCsvFile } = require("./utils");

const getEmails = async () => {
  const emails = await getDataFromFile("hrEmails", "Pranesh Nangare");
  if (!emails) return null;
  const newEmails = emails?.filter((email) => !email.mailSent);
  // the emails field is an array of emails in each object, i want to add a new object for that array
  if (newEmails.length > 0) {
    return newEmails;
  }
  return emails;
};

// Email template with placeholders
const emailTemplate = (
  name,
  contact,
  linkedInProfile,
  totalExperience,
  skills,
  workSamples
) =>
  `<p>Dear Recruiter,</p>
<p>I hope you're doing well!</p>
<p>I came across the {{position}} opening at {{company}} and wanted to express my interest. 
<br>I have <b>${totalExperience.year} years and 
${totalExperience.month} months of experience in ${skills
    .slice(0, 2)
    .map((skill) => skill.skillName)
    .join(", ")}</b> 
and I believe I can contribute effectively to your team.</p>
<p>Attached is my resume for your reference. I would love the opportunity to discuss how 
my skills align with your needs.</p>
${
  workSamples && workSamples.length > 0
    ? `<p>Here are some of my worksamples:</p>
  ${workSamples
    ?.slice(0, 2)
    .map((worksample) => `<b>${worksample.title}</b><br>${worksample.url}`)
    .join("<br>")}</p>`
    : ""
}
Looking forward to your response.</p>
<p>Best regards,<br>
${name}<br>
Contact: ${contact}<br>
${linkedInProfile ? `LinkedIn Profile: ${linkedInProfile}` : ""}
`;

const getMailPassword = async () => {
  const preferences = await localStorage.getItem("preferences");
  if (preferences.mailPassword) {
    return preferences.mailPassword;
  }
  console.log(
    "Sending email requires an app password. Please follow these steps:"
  );
  console.log("1. Go to https://myaccount.google.com/apppasswords");
  console.log("2. Enter app name as 'gmail'");
  console.log("3. Click on 'Create' button");
  console.log("4. Copy the generated password");
  console.log("5. Paste the password in the prompt");
  await prompts.confirm({
    message: "Hit enter to open the browser",
    default: true,
  });
  await openUrl("https://myaccount.google.com/apppasswords");
  const password = await prompts.password({ message: "Enter your password" });
  preferences.mailPassword = password;
  await localStorage.setItem("preferences", preferences);
  writeToFile(preferences, "preferences");
  return password;
};

// Resume file path
const getResumePath = async () => {
  const profile = await localStorage.getItem("profile");
  const filename = await getResume();
  if (!filename) {
    return null;
  }
  return path.join(__dirname, `data/${profile.id}/${filename}`);
};

const resetEmailTemplate = async () => {
  const user = await localStorage.getItem("profile");
  const linkedInProfile = user.onlineProfile.find(
    (profile) => profile.type === "LinkedIn"
  )?.url;
  existingTemplate = emailTemplate(
    user.userDetails.name,
    user.userDetails.mobile,
    linkedInProfile,
    user.profile.totalExperience,
    user.skills,
    user.workSamples
  );
  writeToFile(existingTemplate, "emailTemplate.html", null, true);
  return existingTemplate;
};

const editEmailTemplate = async () => {
  const profile = await localStorage.getItem("profile");
  let existingTemplateBuffer = await getDataFromFile(
    "emailTemplate.html",
    null,
    true
  );
  let existingTemplate = existingTemplateBuffer
    ? existingTemplateBuffer.toString()
    : null;
  const res = await prompts.select({
    message: "Please select an option",
    default: "skip",
    choices: [
      { title: "Skip", value: "skip" },
      { title: "Edit email template", value: "edit" },
      { title: "View email template", value: "view" },
      { title: "Reset email template", value: "reset" },
    ],
  });
  if (!existingTemplate || res === "reset") {
    existingTemplate = await resetEmailTemplate();
    if (res === "reset") return existingTemplate;
  }
  if (res === "view") {
    console.log(existingTemplate);
    return existingTemplate;
  }
  if (res === "skip") return existingTemplate;
  if (res === "edit") {
    console.log(`Here are some instructions to edit the email template:
    1. Do not replace fields mentioned with {{...}}
    2. You can add html tags to format the email. For example, <b>bold text</b>, <i>italic text</i>
    3. Save the file after editing
    4. Use CTRL + X to exit the editor
    5. Press Y to save the changes
    6. Press Enter to confirm the file name
    Important Note: Do not change the file name`);
    const templatePath = path.join(
      __dirname,
      `data/${profile.id}/emailTemplate.html`
    );
    openFile(templatePath);
    const newTemplate = (
      await getDataFromFile("emailTemplate.html", null, true)
    )?.toString();
    if (newTemplate) return newTemplate;
    const defaultTemplate = await resetEmailTemplate();
    return defaultTemplate;
  }
};

const sendEmails = async (
  recipients,
  mailPassword,
  emailTemplate,
  resumePath
) => {
  const profile = await localStorage.getItem("profile");
  // Create Nodemailer transporter
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: profile.userDetails.email,
      pass: mailPassword,
    },
  });

  for (const recipient of recipients) {
    if (recipient.mailSent) continue;
    emailTemplate = emailTemplate
      .replace("{{position}}", recipient.title)
      .replace("{{company}}", recipient.company);
    const mailOptions = {
      from: profile.userDetails.email,
      subject: `Application for ${recipient.title} at ${recipient.company}`,
      html: emailTemplate,
      attachments: [
        {
          filename: `${profile.id}.pdf`,
          path: resumePath,
        },
      ],
    };

    for (let i = 0; i < recipient.email.length; i++) {
      const email = recipient.email[i];
      try {
        if (!email) {
          console.log(`❌ Email not found for ${recipient.name}`);
          continue;
        }
        mailOptions.to = email;
        const info = await transporter.sendMail(mailOptions);
        process.stdout.write(`Sent ${i} emails out of ${recipients.length} \r`);
        recipient.mailSent = true;
        writeToFile(recipients, "hrEmails");
      } catch (error) {
        console.error(`❌ Error sending to ${recipient.email}:`, error.message);
      }
    }
  }
};

const showEmailsMenu = async () => {
  const res = await prompts.select({
    message: "Please select a option: ",
    choices: [
      {name: "Clear existing emails", value: "clear"},
      {name: "Export emails", value: "export"},
      {name: "Send emails", value: "send"},
    ]
  })
  switch(res) {
    case "clear" :
      await clearEmails();
      break;
    case "export": 
      await exportEmails();
      break;
    case "send": 
      await setupEmails();
      break;
    default: 
      console.log("Please select a correct option");
  }
}
// Function to send emails
const setupEmails = async () => {
  const profile = await localStorage.getItem("profile");

  let recipients = await getEmails();
  if (!recipients) {
    console.log(
      "No emails to send. Please search for new jobs to collect emails."
    );
    const res = await prompts.select({
      message: "Do you want to search for new emails?",
      choices: [
        { name: "Yes", value: "yes" },
        { name: "No", value: "no" },
      ],
    });
    if (res) {
      deleteFile(`data/${profile.id}/hrEmails.json`);
      await findNewJobs();
      let count = 0;
      process.stdout.write("Waiting for emails to be created ");
      while (!checkFileExists(`data/${profile.id}/hrEmails.json`)) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        process.stdout.write(". ");
        count++;
        if (count > 10) {
          console.log("Timeout waiting for hrEmails file");
          return;
        }
      }
      recipients = await getEmails();
      console.log(`Found ${recipients.length} new emails`);
    } else return;
  }
  let mailPassword = await getMailPassword();
  let resumePath = await getResumePath();
  if (!mailPassword) {
    console.log("Email password not found");
    return;
  }
  if (!resumePath) {
    console.log("Resume not found in your Naukri profile");
    console.log("Please upload your resume to proceed");
    const res = await prompts.confirm({
      message: "Do you want to upload now?",
      default: true,
    });
    if (res) {
      await openUrl("https://www.naukri.com/mnjuser/profile");
      const response = await prompts.confirm({
        message: "Press enter after uploading the resume",
        default: true,
      });
      if (!response) {
        console.log("Please upload your resume and try again");
        return;
      } else {
        resumePath = await getResumePath();
      }
    } else {
      console.log("Please upload your resume and try again");
      return;
    }
  }
  let emailTemplate = await editEmailTemplate();
  console.log("Sending emails...");
  await sendEmails(recipients, mailPassword, emailTemplate, resumePath);
};

const clearEmails = async () => {
  const profile = await localStorage.getItem("profile");
  deleteFile(`data/${profile.id}/hrEmails.json`);
  deleteFile(`data/${profile.id}/hrEmails.csv`);
  console.log("Emails cleared successfully");
};

const exportEmails = async () => {
  const emails = await getDataFromFile("hrEmails");
  if (!emails) {
    console.log("No emails to export");
    return;
  }
  const profile = await localStorage.getItem("profile");
  await getCsvFile(emails, `${profile.id}-HR-Emails.csv`);
  console.log("Emails exported successfully to the Downloads folder!");
};

module.exports = {
  sendEmails,
  setupEmails,
  clearEmails,
  exportEmails,
  showEmailsMenu,
}
