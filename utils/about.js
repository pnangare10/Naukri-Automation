const { streamText } = require("./ioUtils");

const tempText = [
  "Bond 🔫 ",
  "James Bond 🕵 ",
  ".... Nah, I'm just kidding. 😆"
];
const getAuthorInfo = async () => {
  process.stdout.write("\n");
  await streamText("Hey there, so you want to know about me?", 60, true);
  await new Promise((resolve) => setTimeout(resolve, 1000));

  await streamText("My name is ", 60, false);
  await new Promise((resolve) => setTimeout(resolve, 1000));
  await streamText(tempText[0], 60, false);
  await new Promise((resolve) => setTimeout(resolve, 1000));
  await streamText(tempText[1], 60, false);
  await new Promise((resolve) => setTimeout(resolve, 1000));
  await streamText(tempText[2], 60, false);
  //do a backspace effect
  const backSpaceLength = tempText.join("").length;
  await new Promise((resolve) => setTimeout(resolve, 1000));
  for (let i = 0; i < backSpaceLength; i++) {
    process.stdout.write("\b \b"); // Moves left, deletes last char
    await new Promise((resolve) => setTimeout(resolve, 30));
  }
  await new Promise((resolve) => setTimeout(resolve, 1000));
  await streamText("Pranesh Nangare — naam to bilkul nahi suna hoga 🤷‍♂️", 60, false);
  await new Promise(resolve => setTimeout(resolve, 500));
  await streamText(", and that's okay", 60, false);
  await new Promise(resolve => setTimeout(resolve, 500));
  await streamText(", I prefer my code to be famous instead. 💻😎", 60, true);
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await streamText("I'm a software developer…", 60, false);
  await new Promise(resolve => setTimeout(resolve, 500));
  await streamText(" and a proudly lazy one. 🛌", 60, true);
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await streamText("In fact", 60, false);
  await new Promise(resolve => setTimeout(resolve, 500));
  await streamText(", I was so lazy", 60, false);
  await new Promise(resolve => setTimeout(resolve, 500));
  await streamText(" that I built this program as a hobby just to avoid the hassle of applying to jobs manually. 🏃‍♂️💨", 60, true);
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await streamText("If you're anything like me", 60, false);
  await new Promise(resolve => setTimeout(resolve, 500));
  await streamText(" (lazy but efficient)", 60, false);
  await new Promise(resolve => setTimeout(resolve, 500));
  await streamText(", I hope this tool makes your life easier too! 🚀🔥", 60, true);
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await streamText("So sit back", 60, false);
  await new Promise(resolve => setTimeout(resolve, 500));
  await streamText(", relax", 60, false);
  await new Promise(resolve => setTimeout(resolve, 500));
  await streamText(", and let the code do the hard work.", 60, true);
  await new Promise(resolve => setTimeout(resolve, 1000));
  await streamText("If you ever need to contact me, feel free to reach out to me at ", 60, true);
  await new Promise(resolve => setTimeout(resolve, 500));
  await streamText("🤙 9145266274 \n✉ pranesh.nangare@gmail.com\n🛄 https://www.linkedin.com/in/pranesh-nangare/", 60, true);
  await new Promise(resolve => setTimeout(resolve, 500));
  process.stdout.write("\n");
  await streamText("Peace out! 😎✌\n\n", 60, true);
};

// getAuthorInfo();

module.exports = {
  getAuthorInfo,
};
