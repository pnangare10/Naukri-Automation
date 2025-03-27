function calculateJobMatches(userSkillsStr, jobList) {
  // Normalize skills by removing special chars and standardizing format
  const normalizeSkill = skill => 
      skill.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

  // Process user skills
  const userSkills = new Set(
      userSkillsStr.split(/,\s*/).map(normalizeSkill)
  );

  // Calculate matches for each job
  return jobList.map(jobStr => {
      const jobSkills = new Set(
          jobStr.split(/,\s*/).map(normalizeSkill)
      );
      let matchCount = 0;
      const matchingSkills = [];
      
      jobSkills.forEach(skill => {
          if (userSkills.has(skill)) {
              matchCount++;
              matchingSkills.push(skill);
          }
      });

      return {
          jobText: jobStr,
          score: matchCount,
          matches: matchingSkills,
          matchPercentage: (matchCount / jobSkills.size * 100).toFixed(1)
      };
  }).sort((a, b) => b.score - a.score);
}

const strArr = ["Full Stack, spring boot, javascript",
  "java, spring boot, hibernate framework, microservices",
  "Java, React.Js, Core java, springboot, microservices",
  "software, development, hibernate, oracle, database, j2ee, agile, rest, oracle, web services, version control, jsp, svn, javascript, application development, sql, spring, spring boot, java, git, debugging, code review, html, mysql, technical documentation",
  "project management, sap, lsmw, rollout, team handling, sap sderp implementation, sap support, functional consultancy, sap mm module, idocs, sap mm implementation, end to end implementation, procurement, sap mm, sap abap, sap hana, abap, communication skills"
    ];

const str = "Full Stack Engineering Senior Analyst, spring boot, javascript, angular, spring, react.js, full stack, jquery, node.js, ui development, project management, web development, jsp servlets, software development, api integration, web designing, generative ai";

// Usage example
const results = calculateJobMatches(str, strArr);
console.log("Most relevant jobs:");
results.forEach((job, index) => {
  console.log(`#${index + 1} (Score: ${job.score}): ${job.jobText}`);
  console.log(`Matching skills: ${job.matches.join(', ')}\n`);
});