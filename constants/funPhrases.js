const { getConstantsAPI } = require("../api");
const { writeFileData, getFileData } = require("../utils/ioUtils");

const getUnusedPhrase = async () => {
  try {
    let funPhrases = await getFileData("funPhrases");
    // Always start updating phrases in the background
    const updatePromise = updateFunPhrases();
    
    // If we have no phrases, wait for the update
    if (!funPhrases || funPhrases?.length === 0) {
      funPhrases = await updatePromise;
    }
    
    let usedPhrases = await getFileData("usedPhrases");
    if (!usedPhrases) usedPhrases = [];
    
    const unusedPhrases = usedPhrases.length > 0 
      ? funPhrases.filter(phrase => !usedPhrases.includes(phrase)) 
      : funPhrases;
      
    const phrase = unusedPhrases[Math.floor(Math.random() * unusedPhrases.length)];
    
    if (usedPhrases?.length > 10) usedPhrases.shift();
    usedPhrases.push(phrase);
    writeFileData(usedPhrases, "usedPhrases");
    return phrase;
  } catch (error) {
    console.error(error);
    return "Unagi mode activated—total job awareness! 🎏";
  }
};

const updateFunPhrases = async () => {
  try {
    const response = await getConstantsAPI("FUN_PHRASES");
    const data = await response.json();
    writeFileData(data, "funPhrases");
    return data;
  } catch (error) {
    console.debug("Error updating fun phrases:", error);
    return [];
  }
};

module.exports = {
  getUnusedPhrase,
  updateFunPhrases,
};
