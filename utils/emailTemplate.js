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
${totalExperience.month} months of experience in ${skills.length === 0 ? '' : 
  skills.length === 1 ? skills[0].skillName :
  skills.slice(0, Math.min(3, skills.length) - 1).map(skill => skill.skillName).join(", ") + 
  (skills.length > 1 ? " and " + skills[Math.min(2, skills.length - 1)].skillName : "")}</b> 
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

module.exports = { emailTemplate };
