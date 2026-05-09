import fs from "node:fs";
import path from "node:path";

const root = path.resolve(".");

const paths = {
  cultures: "in_game/common/cultures/00_bronze_age_cultures.txt",
  cultureGroups: "in_game/common/culture_groups/00_bronze_age_culture_groups.txt",
  languageFamilies: "in_game/common/language_families/00_bronze_age_language_families.txt",
  languages: "in_game/common/languages/00_bronze_age_languages.txt",
  localization: "main_menu/localization/english/Bronze_cultures_l_english.yml",
  pops: "main_menu/setup/start/06_pops.txt",
  expansionReport: "tools/bronze_ie_europe_expansion_report.txt",
  compatibilityReport: "tools/bronze_vanilla_compatibility_report.txt",
};

function readText(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function writeText(rel, text) {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), text.replace(/\n/g, "\r\n"), "utf8");
}

function findBlockEnd(text, openIndex) {
  let depth = 0;
  for (let i = openIndex; i < text.length; i++) {
    if (text[i] === "{") depth++;
    else if (text[i] === "}") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function upsertTopLevelBlock(text, key, block) {
  const re = new RegExp(`^${key}\\s*=\\s*\\{`, "m");
  const match = re.exec(text);
  if (!match) return `${text.replace(/\s*$/, "\n\n")}${block}\n`;
  const open = text.indexOf("{", match.index);
  const close = findBlockEnd(text, open);
  if (close === -1) throw new Error(`Could not find end of block ${key}`);
  return `${text.slice(0, match.index)}${block}${text.slice(close + 1)}`;
}

function removeTopLevelBlock(text, key) {
  const re = new RegExp(`^${key}\\s*=\\s*\\{`, "m");
  const match = re.exec(text);
  if (!match) return text;
  const open = text.indexOf("{", match.index);
  const close = findBlockEnd(text, open);
  if (close === -1) throw new Error(`Could not find end of block ${key}`);
  return `${text.slice(0, match.index)}${text.slice(close + 1)}`.replace(/\n{3,}/g, "\n\n");
}

function topLevelDefinitions(text) {
  const defs = new Set();
  const re = /^([A-Za-z0-9_]+)\s*=\s*\{/gm;
  let match;
  while ((match = re.exec(text))) defs.add(match[1]);
  return defs;
}

function topLevelDefinitionCounts(text) {
  const counts = new Map();
  const re = /^([A-Za-z0-9_]+)\s*=\s*\{/gm;
  let match;
  while ((match = re.exec(text))) counts.set(match[1], (counts.get(match[1]) || 0) + 1);
  return counts;
}

function braceBalance(text) {
  let balance = 0;
  let minimum = 0;
  for (const char of text) {
    if (char === "{") balance++;
    else if (char === "}") balance--;
    if (balance < minimum) minimum = balance;
  }
  return { balance, minimum };
}

function cultureBlock({ id, language, color, tags, group }) {
  return `${id} = {
\tlanguage = ${language}
\tcolor = rgb { ${color} }
\ttags = { ${tags} }
\topinions = {
\t}
\tculture_groups = {
\t\t${group}
\t}
}
`;
}

function languageFamilyBlock({ id, color }) {
  return `${id} = {
\tcolor = rgb { ${color} }
}
`;
}

function languageBlock({ id, color, family, male, female }) {
  return `${id} = {
\tcolor = rgb { ${color} }
\tfamily = ${family}

\tmale_names = { ${male.join(" ")} }
\tfemale_names = { ${female.join(" ")} }
\tdynasty_names = { ${male.join(" ")} }
\tlowborn = { ${male.slice(0, 3).join(" ")} }
}
`;
}

const cultureGroups = [
  { id: "danubian_bronze_group" },
  { id: "central_european_bronze_group" },
];

const languageFamilies = [
  { id: "danubian_bronze_language_family", color: "137 112 96" },
  { id: "central_european_bronze_language_family", color: "126 128 84" },
];

const languages = [
  {
    id: "danubian_bronze_language",
    color: "137 112 96",
    family: "danubian_bronze_language_family",
    male: ["Danu", "Vatin", "Monteor", "Baden"],
    female: ["Teia", "Wieta", "Cotofa", "Dava"],
  },
  {
    id: "central_european_bronze_language",
    color: "126 128 84",
    family: "central_european_bronze_language_family",
    male: ["Arno", "Gavo", "Holigrad", "Brigo"],
    female: ["Gava", "Urna", "Briga", "Duna"],
  },
];

const cultures = [
  { id: "yamnaya", language: "steppe_bronze_language", color: "145 132 84", tags: "central_asian_gfx nomad_gfx", group: "steppe_bronze_group" },
  { id: "corded_ware", language: "steppe_bronze_language", color: "116 133 118", tags: "northern_european_gfx european_gfx", group: "steppe_bronze_group" },
  { id: "catacomb", language: "steppe_bronze_language", color: "132 116 87", tags: "central_asian_gfx nomad_gfx", group: "steppe_bronze_group" },
  { id: "noua_sabatinovka", language: "steppe_bronze_language", color: "135 127 96", tags: "eastern_european_gfx european_gfx", group: "steppe_bronze_group" },
  { id: "gava_holigrady", language: "central_european_bronze_language", color: "109 124 82", tags: "eastern_european_gfx european_gfx", group: "central_european_bronze_group" },
  { id: "baden", language: "danubian_bronze_language", color: "132 100 88", tags: "eastern_european_gfx european_gfx", group: "danubian_bronze_group" },
  { id: "cotofeni", language: "danubian_bronze_language", color: "118 104 88", tags: "eastern_european_gfx european_gfx", group: "danubian_bronze_group" },
  { id: "wietenberg", language: "danubian_bronze_language", color: "125 111 91", tags: "eastern_european_gfx european_gfx", group: "danubian_bronze_group" },
  { id: "monteoru", language: "danubian_bronze_language", color: "144 111 84", tags: "eastern_european_gfx european_gfx", group: "danubian_bronze_group" },
  { id: "tei", language: "danubian_bronze_language", color: "151 119 83", tags: "eastern_european_gfx european_gfx", group: "danubian_bronze_group" },
  { id: "vatin", language: "danubian_bronze_language", color: "128 117 98", tags: "eastern_european_gfx european_gfx", group: "danubian_bronze_group" },
  { id: "encrusted_pottery", language: "danubian_bronze_language", color: "154 128 91", tags: "eastern_european_gfx european_gfx", group: "danubian_bronze_group" },
  { id: "vuchedol", language: "balkanic_bronze_language", color: "118 116 101", tags: "south_slavic_gfx eastern_european_gfx european_gfx", group: "balkans_bronze_group" },
  { id: "cetina", language: "balkanic_bronze_language", color: "96 121 132", tags: "south_slavic_gfx mediterranean_gfx european_gfx", group: "balkans_bronze_group" },
  { id: "glasinac_mati", language: "balkanic_bronze_language", color: "111 126 107", tags: "south_slavic_gfx eastern_european_gfx european_gfx", group: "balkans_bronze_group" },
  { id: "central_bosnian", language: "balkanic_bronze_language", color: "124 132 101", tags: "south_slavic_gfx eastern_european_gfx european_gfx", group: "balkans_bronze_group" },
  { id: "ezero", language: "balkanic_bronze_language", color: "104 136 104", tags: "south_slavic_gfx eastern_european_gfx european_gfx", group: "balkans_bronze_group" },
  { id: "urnfield", language: "central_european_bronze_language", color: "142 128 79", tags: "central_european_gfx european_gfx", group: "central_european_bronze_group" },
];

const localization = new Map([
  ["danubian_bronze_group", ["Danubian Bronze", "Fortified, riverine, and metallurgical communities of the Danube basin and Carpathian foothills."]],
  ["central_european_bronze_group", ["Central European Bronze", "Late Bronze Age Central European horizons linking the upper Danube, Bohemia, the Alps, and Carpathian edges."]],
  ["danubian_bronze_language_family", ["Danubian Bronze"]],
  ["central_european_bronze_language_family", ["Central European Bronze"]],
  ["danubian_bronze_language", ["Danubian"]],
  ["central_european_bronze_language", ["Central European"]],
  ["yamnaya", ["Yamnaya", "Yamnaya"]],
  ["corded_ware", ["Corded Ware", "Corded Ware"]],
  ["catacomb", ["Catacomb", "Catacomb"]],
  ["noua_sabatinovka", ["Noua-Sabatinovka", "Noua-Sabatinovka"]],
  ["gava_holigrady", ["Gava-Holigrady", "Gava-Holigrady"]],
  ["baden", ["Baden", "Baden"]],
  ["cotofeni", ["Cotofeni", "Cotofeni"]],
  ["wietenberg", ["Wietenberg", "Wietenberg"]],
  ["monteoru", ["Monteoru", "Monteoru"]],
  ["tei", ["Tei", "Tei"]],
  ["vatin", ["Vatin", "Vatin"]],
  ["encrusted_pottery", ["Encrusted Pottery", "Encrusted Pottery"]],
  ["vuchedol", ["Vucedol", "Vucedol"]],
  ["cetina", ["Cetina", "Cetina"]],
  ["glasinac_mati", ["Glasinac-Mati", "Glasinac-Mati"]],
  ["central_bosnian", ["Central Bosnian", "Central Bosnian"]],
  ["ezero", ["Ezero", "Ezero"]],
  ["urnfield", ["Urnfield", "Urnfield"]],
]);

function upsertLocalization(text, key, value) {
  const escaped = value.replace(/"/g, '\\"');
  const re = new RegExp(`^(\\s*${key}:\\s*").*(")$`, "m");
  if (re.test(text)) return text.replace(re, `$1${escaped}$2`);
  return `${text.replace(/\s*$/, "\n")} ${key}: "${escaped}"\n`;
}

function applyLocalization(text, entries) {
  let next = text;
  for (const [key, [name, adjectiveOrDescription]] of entries) {
    next = upsertLocalization(next, key, name);
    if (key.endsWith("_group")) next = upsertLocalization(next, `${key}_desc`, adjectiveOrDescription);
    else if (!key.endsWith("_language") && !key.endsWith("_family")) next = upsertLocalization(next, `${key}_ADJ`, adjectiveOrDescription);
  }
  return next;
}

function dominantCulture(blockLines) {
  const counts = new Map();
  let first = null;
  for (const line of blockLines) {
    const matches = line.matchAll(/\bculture\s*=\s*([A-Za-z0-9_]+)/g);
    for (const match of matches) {
      first ||= match[1];
      counts.set(match[1], (counts.get(match[1]) || 0) + 1);
    }
  }
  let best = first;
  let bestCount = 0;
  for (const [culture, count] of counts) {
    if (count > bestCount) {
      best = culture;
      bestCount = count;
    }
  }
  return { culture: best, hasCulture: counts.size > 0 };
}

function range(index, start, end) {
  return index >= start && index <= end;
}

function targetCultureFor(location, popIndex) {
  // Location order follows vanilla EU5 setup blocks; the ranges below are kept broad
  // to avoid brittle one-province patchwork while still following geographic corridors.
  if (range(popIndex, 592, 645)) return "corded_ware";       // Schleswig, Brandenburg, north-east Germany
  if (range(popIndex, 646, 717)) return "urnfield";          // Rhine/Main and Hessian uplands
  if (range(popIndex, 718, 802)) return "corded_ware";       // Lower Saxony and north German plain
  if (range(popIndex, 803, 867)) return "urnfield";          // Harz, Thuringia, Saxony uplands
  if (range(popIndex, 868, 913)) return "corded_ware";       // Pomerania and lower Oder
  if (range(popIndex, 914, 931)) return "baden";             // Vienna basin and lower Austria
  if (range(popIndex, 932, 1040)) return "urnfield";         // Upper Austria, Alpine forelands, Swiss plateau
  if (range(popIndex, 1050, 1264)) return "urnfield";        // Bavaria, Bohemia, Moravia, upper Danube

  if (range(popIndex, 2763, 2805)) return "monteoru";        // Moldavia and eastern Carpathian approaches
  if (range(popIndex, 2806, 2887)) return "gava_holigrady";  // Slovakia, Transcarpathia, north-east Hungary
  if (range(popIndex, 2888, 2914)) return "vatin";           // Banat and Serbian plain
  if (range(popIndex, 2915, 2919)) return "encrusted_pottery";
  if (range(popIndex, 2920, 2929)) return "baden";
  if (range(popIndex, 2930, 2945)) return "encrusted_pottery";
  if (range(popIndex, 2949, 2978)) return "wietenberg";      // Transylvania
  if (range(popIndex, 2979, 2993)) return "monteoru";        // Sub-Carpathian Muntenia
  if (range(popIndex, 2994, 3000)) return "cotofeni";        // Oltenian and south Carpathian foothills
  if (range(popIndex, 3001, 3012)) return "tei";             // Lower Wallachian plain
  if (range(popIndex, 3013, 3014)) return "cotofeni";
  if (range(popIndex, 3015, 3022)) return "tei";

  if (range(popIndex, 3023, 3399)) return "corded_ware";     // Baltic, Poland, Belarus, upper Vistula
  if (range(popIndex, 3402, 3445)) return "noua_sabatinovka";
  if (range(popIndex, 3446, 3504)) return "gava_holigrady";
  if (range(popIndex, 3505, 3573)) return "corded_ware";
  if (range(popIndex, 3574, 3612)) return "noua_sabatinovka";
  if (range(popIndex, 3613, 3668)) return "corded_ware";

  if (range(popIndex, 3848, 3861)) return "catacomb";        // Crimea
  if (range(popIndex, 3874, 3930)) return "catacomb";        // Lower Dnieper and north Black Sea
  if (range(popIndex, 3931, 3978)) return "noua_sabatinovka";
  if (range(popIndex, 3984, 4041)) return "catacomb";        // Donets, Azov, lower Don
  if (range(popIndex, 4042, 4159)) return "yamnaya";         // Lower Don, lower Volga, Caspian steppe

  if (range(popIndex, 4923, 4949)) return "vuchedol";
  if (range(popIndex, 4954, 4971)) return "cetina";
  if (range(popIndex, 4972, 4987)) return "glasinac_mati";
  if (range(popIndex, 4990, 4999)) return "central_bosnian";
  if (range(popIndex, 5000, 5029)) return "vatin";
  if (range(popIndex, 5030, 5034)) return "cetina";
  if (range(popIndex, 5035, 5039)) return "glasinac_mati";
  if (range(popIndex, 5040, 5046)) return "tei";
  if (range(popIndex, 5047, 5088)) return "ezero";
  if (range(popIndex, 5104, 5108)) return "ezero";
  if (range(popIndex, 5121, 5127)) return "ezero";
  if (range(popIndex, 5128, 5167)) return "thracian";
  if (range(popIndex, 5168, 5172)) return "ezero";

  // A few named coastal links keep Castellieri connected to the Adriatic hillfort network.
  if (["senj", "crikvenica", "kaseg", "krk", "pag", "rijeka"].includes(location)) return "castellieri";

  return null;
}

const protectedExistingCultures = new Set([
  "canegrate", "terramare", "polada", "luco", "castellieri", "camunni", "raeti",
  "apennine", "proto_villanovan", "latial", "rinaldone", "ausonian", "oenotrian",
  "iapygian", "sicel", "sicanian", "elymian", "nuragic", "torrean", "golasecca", "este",
]);

function updatePops(text) {
  const lines = text.split("\n");
  const out = [];
  let depth = 0;
  let current = null;
  let popIndex = -1;
  const changedByCulture = new Map();
  const changedByOldCulture = new Map();
  const sampleChanges = [];

  function finishCurrent() {
    const { culture, hasCulture } = dominantCulture(current.lines);
    let nextLines = current.lines;
    if (hasCulture) {
      popIndex += 1;
      const target = targetCultureFor(current.name, popIndex);
      if (target && target !== culture && !protectedExistingCultures.has(culture)) {
        nextLines = current.lines.map((line) => line.replace(/\bculture\s*=\s*[A-Za-z0-9_]+/g, `culture = ${target}`));
        changedByCulture.set(target, (changedByCulture.get(target) || 0) + 1);
        changedByOldCulture.set(culture, (changedByOldCulture.get(culture) || 0) + 1);
        if (sampleChanges.length < 80) sampleChanges.push(`${current.name}: ${culture} -> ${target}`);
      }
    }
    out.push(...nextLines);
  }

  for (const line of lines) {
    const start = line.match(/^([A-Za-z0-9_]+)\s*=\s*\{\s*$/);
    if (!current && start && depth === 1 && start[1] !== "locations") {
      current = { name: start[1], lines: [line] };
    } else if (current) {
      current.lines.push(line);
    } else {
      out.push(line);
    }

    const before = depth;
    const open = (line.match(/\{/g) || []).length;
    const close = (line.match(/\}/g) || []).length;
    depth += open - close;

    if (current && before === 2 && depth === 1) {
      finishCurrent();
      current = null;
    }
  }

  return {
    text: out.join("\n").replace(/\bvucedol\b/g, "vuchedol"),
    stats: {
      changedByCulture,
      changedByOldCulture,
      sampleChanges,
      popLocationsParsed: popIndex + 1,
    },
  };
}

function formatMap(map) {
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, value]) => `- ${key}: ${value}`)
    .join("\n");
}

function countDominantCultures(text, cultureIds) {
  const wanted = new Set(cultureIds);
  const counts = new Map();
  let depth = 0;
  let current = null;

  for (const line of text.split("\n")) {
    const start = line.match(/^([A-Za-z0-9_]+)\s*=\s*\{\s*$/);
    if (!current && start && depth === 1 && start[1] !== "locations") {
      current = { lines: [line] };
    } else if (current) {
      current.lines.push(line);
    }

    const before = depth;
    depth += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
    if (current && before === 2 && depth === 1) {
      const { culture, hasCulture } = dominantCulture(current.lines);
      if (hasCulture && wanted.has(culture)) counts.set(culture, (counts.get(culture) || 0) + 1);
      current = null;
    }
  }

  return counts;
}

function writeCompatibilityReport(cultureDefs) {
  const activeReligions = topLevelDefinitions(readText(paths.religions ?? "in_game/common/religions/00_bronze_age_religions.txt"));
  const reusableCultures = [
    "egyptian", "nubian", "berber", "assyrian", "babylonian", "elamite", "arabian",
    "thracian", "illyrian", "dacian", "scythian", "gaulish", "iberian", "aquitanian",
    "persian", "hellenic",
  ].filter((key) => cultureDefs.has(key));

  const reusableReligions = [
    "hellenic", "kemetic", "mesopotamian", "canaanite", "phoenician", "berber_pagan",
    "arabian_pagan", "steppe_pagan", "nordic_pagan",
  ].filter((key) => activeReligions.has(key));

  const removedCultures = [
    "roman", "italian", "tuscan", "venetian", "lombard", "sicilian", "neapolitan",
    "french", "occitan", "german", "saxon", "english", "anglo_saxon", "dutch",
    "castilian", "portuguese", "catalan", "turkish", "ottoman", "byzantine",
    "serbian", "croatian", "bosnian", "russian", "polish", "czech", "hungarian",
    "norse", "sarmatian",
  ].filter((key) => !cultureDefs.has(key));

  const anachronisticReligions = [
    "catholic", "orthodox", "protestant", "reformed", "sunni", "shia", "ibadi",
    "theravada", "mahayana", "vajrayana", "confucian", "taoism", "shinto", "jewish",
  ];

  writeText(paths.compatibilityReport, [
    "Bronze Era vanilla compatibility pass",
    "=====================================",
    "",
    "Reused active culture IDs when Bronze-compatible:",
    reusableCultures.length ? reusableCultures.map((x) => `- ${x}`).join("\n") : "- none",
    "",
    "Reused active religion IDs when Bronze-compatible:",
    reusableReligions.length ? reusableReligions.map((x) => `- ${x}`).join("\n") : "- none",
    "",
    "Vanilla culture IDs deliberately absent from active Bronze setup:",
    removedCultures.map((x) => `- ${x}`).join("\n"),
    "",
    "Anachronistic religions remain absent from active province placement.",
    "Some keys may still exist only as inert legacy reference stubs to prevent null-reference crashes from hardcoded vanilla scripts.",
    anachronisticReligions.map((x) => `- ${x}`).join("\n"),
    "",
  ].join("\n"));
}

let cultureGroupsText = readText(paths.cultureGroups);
for (const group of cultureGroups) {
  cultureGroupsText = upsertTopLevelBlock(cultureGroupsText, group.id, `${group.id} = {
}
`);
}
writeText(paths.cultureGroups, cultureGroupsText);

let languageFamiliesText = readText(paths.languageFamilies);
for (const family of languageFamilies) {
  languageFamiliesText = upsertTopLevelBlock(languageFamiliesText, family.id, languageFamilyBlock(family));
}
writeText(paths.languageFamilies, languageFamiliesText);

let languagesText = readText(paths.languages);
for (const language of languages) {
  languagesText = upsertTopLevelBlock(languagesText, language.id, languageBlock(language));
}
writeText(paths.languages, languagesText);

let culturesText = readText(paths.cultures).replace(/\bvucedol\b/g, "vuchedol");
culturesText = removeTopLevelBlock(culturesText, "vucedol");
for (const culture of cultures) {
  culturesText = upsertTopLevelBlock(culturesText, culture.id, cultureBlock(culture));
}
writeText(paths.cultures, culturesText);

let localizationText = readText(paths.localization).replace(/\bvucedol\b/g, "vuchedol");
localizationText = applyLocalization(localizationText, localization);
writeText(paths.localization, localizationText);

const popUpdate = updatePops(readText(paths.pops));
writeText(paths.pops, popUpdate.text);
const currentExpansionCounts = countDominantCultures(popUpdate.text, cultures.map((culture) => culture.id));

const cultureDefs = topLevelDefinitions(readText(paths.cultures));
const duplicateCultures = [...topLevelDefinitionCounts(readText(paths.cultures)).entries()].filter(([, count]) => count > 1);
const duplicateGroups = [...topLevelDefinitionCounts(readText(paths.cultureGroups)).entries()].filter(([, count]) => count > 1);
const duplicateLanguages = [...topLevelDefinitionCounts(readText(paths.languages)).entries()].filter(([, count]) => count > 1);

writeCompatibilityReport(cultureDefs);

const checkedFiles = [paths.cultures, paths.cultureGroups, paths.languageFamilies, paths.languages, paths.localization, paths.pops];
const balances = checkedFiles.map((file) => {
  const { balance, minimum } = braceBalance(readText(file));
  return `- ${file}: balance=${balance}, min=${minimum}`;
});

writeText(paths.expansionReport, [
  "Bronze Era Indo-European Europe expansion",
  "=========================================",
  "",
  "Added or updated culture groups:",
  cultureGroups.map((x) => `- ${x.id}`).join("\n"),
  "",
  "Added or updated cultures:",
  cultures.map((x) => `- ${x.id} (${x.group})`).join("\n"),
  "",
  "Province/location culture replacements by new culture:",
  formatMap(popUpdate.stats.changedByCulture) || "- none",
  "",
  "Province/location culture replacements by previous dominant culture:",
  formatMap(popUpdate.stats.changedByOldCulture) || "- none",
  "",
  "Current dominant province/location counts for expansion cultures:",
  formatMap(currentExpansionCounts) || "- none",
  "",
  `Pop-bearing locations parsed: ${popUpdate.stats.popLocationsParsed}`,
  "",
  "Sample replacements:",
  popUpdate.stats.sampleChanges.map((x) => `- ${x}`).join("\n") || "- none",
  "",
  "Duplicate definition checks:",
  `- cultures: ${duplicateCultures.length ? duplicateCultures.map(([id, count]) => `${id} x${count}`).join(", ") : "ok"}`,
  `- culture groups: ${duplicateGroups.length ? duplicateGroups.map(([id, count]) => `${id} x${count}`).join(", ") : "ok"}`,
  `- languages: ${duplicateLanguages.length ? duplicateLanguages.map(([id, count]) => `${id} x${count}`).join(", ") : "ok"}`,
  "",
  "Brace checks:",
  balances.join("\n"),
  "",
].join("\n"));

console.log(readText(paths.expansionReport));
