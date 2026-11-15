const profaneTerms = [
  "arse",
  "ass",
  "asshole",
  "bastard",
  "bitch",
  "bitches",
  "bitching",
  "bullshit",
  "crap",
  "cunt",
  "damn",
  "dammit",
  "dick",
  "fuck",
  "fucked",
  "fucker",
  "fuckers",
  "fucking",
  "fucks",
  "motherfucker",
  "motherfucking",
  "piss",
  "prick",
  "shit",
  "shits",
  "shitty",
  "shitting",
  "slut",
  "twat",
  "whore",
];

const profanePatterns = profaneTerms.map((term) => {
  const spacedTerm = [...term].join("[\\W_]{0,2}");
  return new RegExp(`\\b${spacedTerm}\\b`, "i");
});

function normalizeLeetspeak(message: string) {
  return message
    .toLowerCase()
    .replace(/[0]/g, "o")
    .replace(/[1]/g, "i")
    .replace(/[3]/g, "e")
    .replace(/[4@]/g, "a")
    .replace(/[5$]/g, "s")
    .replace(/[7]/g, "t")
    .replace(/(?<=[a-z])[!|](?=[a-z])/g, "i");
}

export function containsProfanity(message: string) {
  const normalized = normalizeLeetspeak(message);
  return profanePatterns.some((pattern) => pattern.test(normalized));
}
