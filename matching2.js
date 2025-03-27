function calculateWeightedMatches(userSkillsStr, jobList) {
  // Skill weight configuration - adjust based on priority
  const SKILL_WEIGHTS = {
      java: 3,
      springboot: 3,
      spring: 2,
      javascript: 2,
      angular: 2,
      reactjs: 2,
      nodejs: 2,
      microservices: 2,
      hibernate: 2,
      fullstack: 2,
      projectmanagement: 0.5,
      communication: 0.5,
      documentation: 0.5
  };

  // Normalization function with synonym handling
  const normalizeSkill = skill => {
      const normalized = skill.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      // Handle common synonyms
      return {
          springboot: 'springboot',
          spring: 'spring',
          jsp: 'jsp',
          corejava: 'java',
          'restapi': 'rest'
      }[normalized] || normalized;
  };

  // Process user skills with weights
  const userSkills = new Map();
  userSkillsStr.split(/,\s*/).forEach(skill => {
      const normalized = normalizeSkill(skill);
      const weight = SKILL_WEIGHTS[normalized] || 1; // Default weight 1
      userSkills.set(normalized, weight);
  });

  // Calculate weighted matches
  return jobList.map(jobStr => {
      const jobSkills = new Set(
          jobStr.split(/,\s*/).map(normalizeSkill)
      );
      
      let totalWeight = 0;
      const matchingSkills = [];
      const coreMatches = [];

      jobSkills.forEach(skill => {
          if (userSkills.has(skill)) {
              const weight = userSkills.get(skill);
              totalWeight += weight;
              matchingSkills.push(skill);
              
              // Track core technical matches separately
              if (weight >= 2) coreMatches.push(skill);
          }
      });

      // Boost score if core technical matches exist
      const coreBoost = coreMatches.length * 2;
      const finalScore = totalWeight + coreBoost;

      return {
          jobText: jobStr,
          score: finalScore,
          coreMatches,
          generalMatches: matchingSkills.filter(s => !coreMatches.includes(s)),
          matchPercentage: (totalWeight / Array.from(jobSkills).reduce(
              (sum, s) => sum + (SKILL_WEIGHTS[s] || 1), 0) * 100).toFixed(1)
      };
  }).sort((a, b) => b.score - a.score);
}

const userSkillsStr = "java, springboot, spring, javascript, angular, reactjs, nodejs, microservices, hibernate, fullstack, projectmanagement, communication, documentation";
const jobList = [
    "java, springboot, spring, javascript, angular, reactjs, nodejs, microservices, hibernate, fullstack, projectmanagement, communication, documentation",
    "Computer science, Software design, ISO, Cloud, Agile, Scrum, data privacy, Analytics, Python, Auditing",
    "Business process, Process automation, Automation, Business analysis, Analytical, Consulting, Javascript, professional services, Analytics, Robotics",
    "fullstack development, css, ui development, bootstrap, ajax, jquery, react.js, java, json, html, mysql, api, mongodb, architecture, c#, front end, rest, software development, javascript, angular, spring boot, node.js, full stack, angularjs, aws",
    "java, springboot",
    "java",
    "java, docker, kubernetes",
    "React Js",
    "React.js",
    "coreReact"
];

const matches = calculateWeightedMatches(userSkillsStr, jobList);
console.log(matches);

