// Get the emails from json file and create a custom email body, replace the placeholders with the actual values

const {
  getDataFromFile,
  writeToFile,
  deleteFile,
  checkFileExists,
  getResumePath,
  getEmailTemplatePath,
} = require("./ioUtils");
const nodemailer = require("nodemailer");
const prompts = require("@inquirer/prompts");
const { localStorage} = require("./helper");
const { openUrl, openFile } = require("./cmdUtils");
const path = require("path");
const { getResume, findNewJobs } = require("./jobUtils");
const { getCsvFile } = require("./ioUtils");
const { emailMenu, subEmailMenu, getConfirmation, selectEmails, passwordPrompt } = require("./prompts");
const { emailTemplate } = require("./emailTemplate");
const spinner = require("./spinniesUtils");
const { incrementCounterAPI } = require("../api");
const analyticsManager = require("./analyticsUtils");

const getEmails = async () => {
  const emails = await getDataFromFile("hrEmails");
  if (!emails) return null;
  const newEmails = emails?.filter((email) => !email.mailSent);
  // the emails field is an array of emails in each object, i want to add a new object for that array
  if (newEmails.length > 0) {
    return newEmails;
  }
  return null;
};

// Email template with placeholders

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
  await getConfirmation("Hit enter to open the browser");
  await openUrl("https://myaccount.google.com/apppasswords");
  const password = await passwordPrompt("Enter your password");
  preferences.mailPassword = password;
  await localStorage.setItem("preferences", preferences);
  writeToFile(preferences, "preferences");
  return password;
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
  const res = await emailMenu();
  if (res === "previous") return null;
  if (res === "exit") throw new Error("ExitPromptError");
  if (!existingTemplate || res === "reset") {
    existingTemplate = await resetEmailTemplate();
    if (res === "reset") return editEmailTemplate();
  }
  if (res === "view") {
    console.log(existingTemplate);
    await getConfirmation("Press enter to continue", true);
    return editEmailTemplate();
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
    const templatePath = await getEmailTemplatePath("emailTemplate.html");
    openFile(templatePath);
    const newTemplate = (
      await getDataFromFile("emailTemplate.html", null, true)
    )?.toString();
    console.log(newTemplate);
    if (newTemplate) return editEmailTemplate();
    console.log("No template found, resetting to default");
    const defaultTemplate = await resetEmailTemplate();
    return editEmailTemplate();
  }
};

const sendEmails = async (
  recipients,
  mailPassword,
  emailTemplate,
  resumePath
) => {
  try {
    spinner.start("Sending emails...");
    const startTime = Date.now();
    const profile = await localStorage.getItem("profile");
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: profile.userDetails.email,
        pass: mailPassword,
      },
    });

    // Get all existing emails to preserve them
    const allEmails = await getDataFromFile("hrEmails") || [];
    let totalEmails = 0;
    let successfulEmails = 0;
    
    // Calculate total number of emails to be sent
    for (const recipient of recipients) {
      totalEmails += recipient.email.length;
    }
    //measure the time taken to send the emails
    // Create an array of all email sending promises
    const emailPromises = recipients.flatMap(recipient => {
      const updatedTemplate = emailTemplate
        .replace("{{position}}", recipient.title)
        .replace("{{company}}", recipient.company);

      return recipient.email.map(async (email) => {
        if (!email) {
          console.log(`❌ Email not found for ${recipient.name}`);
          return;
        }

        const mailOptions = {
          from: profile.userDetails.email,
          to: email,
          subject: `Application for ${recipient.title} at ${recipient.company}`,
          html: updatedTemplate,
          attachments: [
            {
              filename: `${profile.id}-resume.pdf`,
              path: resumePath,
            },
          ],
        };

        try {
          const info = await transporter.sendMail(mailOptions);
          successfulEmails++;
          spinner.update(`Sent ${successfulEmails} out of ${totalEmails} emails`);
          
          // Update mailSent status in allEmails array
          const emailIndex = allEmails.findIndex(e => 
            e.company === recipient.company && 
            e.title === recipient.title
          );
          if (emailIndex !== -1) {
            allEmails[emailIndex].mailSent = false;
          }
          
          analyticsManager.incrementEmailsSent();
          incrementCounterAPI("emailSent");
          return info;
        } catch (error) {
          console.log(`❌ Error sending to ${email}:`, error.message);
          // Update mailSent status to false in case of error
          const emailIndex = allEmails.findIndex(e => 
            e.company === recipient.company && 
            e.title === recipient.title
          );
          if (emailIndex !== -1) {
            allEmails[emailIndex].mailSent = false;
          }
          throw error;
        }
      });
    });

    // Wait for all emails to be sent
    await Promise.allSettled(emailPromises);
    const endTime = Date.now(); 
    const timeTaken = (endTime - startTime) / 1000;
    // Write the updated allEmails array back to file
    writeToFile(allEmails, "hrEmails");
    spinner.succeed(`Successfully sent ${successfulEmails} out of ${totalEmails} emails in just ${timeTaken.toFixed(1)} seconds`);
  } catch (error) {
    spinner.fail(error.message);
  } finally {
    spinner.stop();
  }
};

const handleEmailsMenu = async () => {
  const res = await subEmailMenu();
  switch(res) {
    case "clear" :
      await clearEmails();
      break;
    case "export": 
      await exportEmails();
      break;
    case "send-all": 
      await setupEmails();
      break;
    case "send-selected":
      await setupEmails(true);
      break;
    case "previous":
      return null;
    case "exit":
      throw new Error("ExitPromptError");
    default: 
      console.log("Please select a correct option");
  }
};
// Function to send emails
const setupEmails = async (sendSelected = false) => {
  try {
  const profile = await localStorage.getItem("profile");

  let recipients = await getEmails();
 
  if (!recipients) {
    console.log(
      "No emails to send. Please search for new jobs to collect emails."
    );
    const res = await getConfirmation("Do you want to search for new emails?");
    if (res) {
      spinner.start("Searching for new emails...");
      deleteFile(`${profile.id}/hrEmails.json`);
      await findNewJobs();
      let count = 0;
      spinner.update("Waiting for emails to be created ");
      while (!checkFileExists(`data/${profile.id}/hrEmails.json`)) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        count++;
        if (count > 10) {
          spinner.fail("Timeout waiting for hrEmails file");
          return;
        }
      }
      recipients = await getEmails();
      if (!recipients) {
        spinner.fail("No emails found");
        return;
      }
      spinner.succeed(`Found ${recipients.length} new emails`);
    } else return;
  }
  if (sendSelected) {
    recipients = await selectEmails(recipients);
  }
  let mailPassword = await getMailPassword();
  let filename = await getResume();
  let resumePath = await getResumePath(filename);
  if (!mailPassword) {
    console.log("Email password not found");
    return;
  }
  if (!resumePath) {
    console.log(`Resume not found in your Naukri profile\nPlease upload your resume to proceed`);
    const res = await getConfirmation("Do you want to upload now?");
    if (res) {
      await openUrl("https://www.naukri.com/mnjuser/profile");
      const response = await getConfirmation("Press enter after uploading the resume");
      if (!response) {
        console.log(`Please upload your resume and try again`);
        return;
      } else {
        filename = await getResume();
        resumePath = await getResumePath(filename);
      }
    } else {
      console.log(`Please upload your resume and try again`);
      return;
    }
  }
  let emailTemplate = await editEmailTemplate();
  if (!emailTemplate) return;
  await sendEmails(recipients, mailPassword, emailTemplate, resumePath);
} catch(error){
  if(error.responseCode == 535) {
    await getMailPassword();
    await selectEmails();
    return;
  }
}
};

const clearEmails = async () => {
  try{
    spinner.start("Clearing emails...");
    const profile = await localStorage.getItem("profile");
    deleteFile(`${profile.id}/hrEmails.json`);
    deleteFile(`${profile.id}/hrEmails.csv`);
    spinner.succeed(`Emails cleared successfully`);
  } catch (error) {
    spinner.fail(error.message);
  } finally {
    spinner.stop();
  }
};

const exportEmails = async () => {
  const emails = await getDataFromFile("hrEmails");
  if (!emails) {
    console.log(`No emails to export`);
    return;
  }
  const profile = await localStorage.getItem("profile");
  await getCsvFile(emails, `${profile.id}-HR-Emails.csv`);
};

module.exports = {
  sendEmails,
  setupEmails,
  clearEmails,
  exportEmails,
  handleEmailsMenu,
};
