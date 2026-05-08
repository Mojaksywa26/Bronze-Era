import fs from "fs";
import path from "path";

const root = path.resolve(".");
const culturesPath = "in_game/common/cultures/00_bronze_age_cultures.txt";
const languageFamiliesPath = "in_game/common/language_families/00_bronze_age_language_families.txt";
const languagesPath = "in_game/common/languages/00_bronze_age_languages.txt";
const localizationPath = "main_menu/localization/english/Bronze_cultures_l_english.yml";
const popsPath = "main_menu/setup/start/06_pops.txt";
const reportPath = "tools/bronze_italy_culture_overhaul_report.txt";

function readText(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function writeText(rel, text) {
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
  return `${text.slice(0, match.index)}${block}${text.slice(close + 1)}`;
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

const languageFamilies = [
  { id: "italian_bronze_language_family", color: "149 106 88" },
  { id: "alpine_bronze_language_family", color: "104 133 112" },
  { id: "adriatic_bronze_language_family", color: "112 128 151" },
  { id: "island_bronze_language_family", color: "154 122 76" },
];

const languages = [
  {
    id: "italian_bronze_language",
    color: "149 106 88",
    family: "italian_bronze_language_family",
    male: ["Tites", "Aulus", "Mamercus", "Vibennus"],
    female: ["Tana", "Ruma", "Acca", "Larthia"],
  },
  {
    id: "alpine_bronze_language",
    color: "104 133 112",
    family: "alpine_bronze_language_family",
    male: ["Camun", "Raet", "Lauco", "Brenno"],
    female: ["Retia", "Camuna", "Lauca", "Brixia"],
  },
  {
    id: "adriatic_bronze_language",
    color: "112 128 151",
    family: "adriatic_bronze_language_family",
    male: ["Daunos", "Iapyx", "Messapios", "Hyllos"],
    female: ["Dauna", "Iapya", "Messapia", "Adria"],
  },
  {
    id: "island_bronze_language",
    color: "154 122 76",
    family: "island_bronze_language_family",
    male: ["Nora", "Sardo", "Iolaos", "Eryx"],
    female: ["Sarda", "Nora", "Elyma", "Segesta"],
  },
];

const cultures = [
  { id: "canegrate", language: "alpine_bronze_language", color: "121 112 95", tags: "west_mediterranean_gfx european_gfx", group: "alpine_bronze_group" },
  { id: "terramare", language: "italian_bronze_language", color: "150 100 82", tags: "west_mediterranean_gfx mediterranean_gfx european_gfx", group: "italian_bronze_group" },
  { id: "polada", language: "alpine_bronze_language", color: "94 133 119", tags: "west_mediterranean_gfx european_gfx", group: "alpine_bronze_group" },
  { id: "luco", language: "alpine_bronze_language", color: "91 122 98", tags: "west_mediterranean_gfx european_gfx", group: "alpine_bronze_group" },
  { id: "castellieri", language: "adriatic_bronze_language", color: "105 119 145", tags: "west_mediterranean_gfx mediterranean_gfx european_gfx", group: "adriatic_bronze_group" },
  { id: "camunni", language: "alpine_bronze_language", color: "82 116 104", tags: "west_mediterranean_gfx european_gfx", group: "alpine_bronze_group" },
  { id: "raeti", language: "alpine_bronze_language", color: "114 131 102", tags: "west_mediterranean_gfx european_gfx", group: "alpine_bronze_group" },
  { id: "apennine", language: "italian_bronze_language", color: "137 105 83", tags: "west_mediterranean_gfx mediterranean_gfx european_gfx", group: "italian_bronze_group" },
  { id: "proto_villanovan", language: "italian_bronze_language", color: "162 107 87", tags: "west_mediterranean_gfx mediterranean_gfx european_gfx", group: "italian_bronze_group" },
  { id: "latial", language: "italian_bronze_language", color: "156 84 76", tags: "west_mediterranean_gfx mediterranean_gfx european_gfx", group: "italian_bronze_group" },
  { id: "rinaldone", language: "italian_bronze_language", color: "124 93 86", tags: "west_mediterranean_gfx mediterranean_gfx european_gfx", group: "italian_bronze_group" },
  { id: "ausonian", language: "italian_bronze_language", color: "174 117 77", tags: "west_mediterranean_gfx mediterranean_gfx european_gfx", group: "italian_bronze_group" },
  { id: "oenotrian", language: "italian_bronze_language", color: "153 118 72", tags: "west_mediterranean_gfx mediterranean_gfx european_gfx", group: "italian_bronze_group" },
  { id: "iapygian", language: "adriatic_bronze_language", color: "103 137 151", tags: "west_mediterranean_gfx mediterranean_gfx european_gfx", group: "adriatic_bronze_group" },
  { id: "sicel", language: "island_bronze_language", color: "168 125 83", tags: "west_mediterranean_gfx mediterranean_gfx european_gfx", group: "island_bronze_group" },
  { id: "sicanian", language: "island_bronze_language", color: "150 112 78", tags: "west_mediterranean_gfx mediterranean_gfx european_gfx", group: "island_bronze_group" },
  { id: "elymian", language: "island_bronze_language", color: "132 100 92", tags: "west_mediterranean_gfx mediterranean_gfx european_gfx", group: "island_bronze_group" },
  { id: "nuragic", language: "island_bronze_language", color: "126 119 79", tags: "west_mediterranean_gfx mediterranean_gfx", group: "island_bronze_group" },
  { id: "torrean", language: "island_bronze_language", color: "111 122 83", tags: "west_mediterranean_gfx mediterranean_gfx", group: "island_bronze_group" },
  { id: "golasecca", language: "alpine_bronze_language", color: "87 126 126", tags: "west_mediterranean_gfx european_gfx", group: "alpine_bronze_group" },
  { id: "este", language: "adriatic_bronze_language", color: "124 134 109", tags: "west_mediterranean_gfx mediterranean_gfx european_gfx", group: "adriatic_bronze_group" },
];

const localization = new Map([
  ["italian_bronze_group", ["Italian Bronze", "Communities of Bronze Age peninsular Italy, before the later Latin, Etruscan, and Roman identities."]],
  ["alpine_bronze_group", ["Alpine Bronze", "Lake, valley, and pass communities of northern Italy and the adjoining Alps."]],
  ["adriatic_bronze_group", ["Adriatic Bronze", "Hillfort and maritime-facing communities around the north-eastern Adriatic and Apulian coast."]],
  ["island_bronze_group", ["Island Bronze", "Bronze Age cultures of Sardinia, Corsica, and Sicily."]],
  ["canegrate", ["Canegrate", "Canegrate"]],
  ["terramare", ["Terramare", "Terramare"]],
  ["polada", ["Polada", "Poladan"]],
  ["luco", ["Luco", "Luco"]],
  ["castellieri", ["Castellieri", "Castellieri"]],
  ["camunni", ["Camunni", "Camunnian"]],
  ["raeti", ["Raeti", "Raetian"]],
  ["apennine", ["Apennine", "Apennine"]],
  ["proto_villanovan", ["Proto-Villanovan", "Proto-Villanovan"]],
  ["latial", ["Latial", "Latial"]],
  ["rinaldone", ["Rinaldone", "Rinaldone"]],
  ["ausonian", ["Ausonian", "Ausonian"]],
  ["oenotrian", ["Oenotrian", "Oenotrian"]],
  ["iapygian", ["Iapygian", "Iapygian"]],
  ["sicel", ["Sicel", "Sicel"]],
  ["sicanian", ["Sicanian", "Sicanian"]],
  ["elymian", ["Elymian", "Elymian"]],
  ["nuragic", ["Nuragic", "Nuragic"]],
  ["torrean", ["Torrean", "Torrean"]],
  ["golasecca", ["Golasecca", "Golaseccan"]],
  ["este", ["Este", "Este"]],
]);

const locationCulture = {
  canegrate: [
    "genoa", "lavagna", "sarzana", "albenga", "cairo_montenotte", "finalborgo", "savona", "ventimiglia",
    "milano", "legnano", "rho", "monza", "treviglio", "pavia", "lomello", "novara", "vercelli",
    "alessandria", "novi", "rovegno", "tortona", "mondovi", "alba", "ceva", "casale", "acqui", "asti",
    "turin", "ivrea", "lanzo", "carmagnola", "chieri", "cuneo", "biella", "varallo", "cortenuova",
  ],
  terramare: [
    "bologna", "medicina", "ferrara", "argenta", "comacchio", "ficarolo", "rovigo", "modena", "frassinoro",
    "nonantola", "mirandola", "parma", "berceto", "sandonnino", "piacenza", "bardi", "bobbio",
    "fiorenzuola", "reggioem", "canossa", "guastalla", "cremona", "casalmaggiore", "soncino",
    "lodi", "mantova", "goito", "ostiglia", "voghera",
  ],
  polada: [
    "varese", "arona", "lecco", "locarno", "brescia", "asola", "palazzolo", "salo_ita",
    "peschiera", "verona", "legnago", "clusone", "zogno",
  ],
  luco: [
    "cavalese", "silandro", "cles", "neumarkt", "pieve", "belluno", "feltre", "bassano", "schio",
  ],
  camunni: [
    "breno", "nozza", "bormio", "tresivio",
  ],
  raeti: [
    "tarasp", "zuoz", "disentis", "davos", "ilanz", "mesocco", "domodossola",
  ],
  castellieri: [
    "aquileia", "cividale", "gemona", "tolmezzo", "pordenone", "spilimbergo", "udine", "trieste",
    "gorizia", "tolmin", "pola", "buzet", "pazin", "rovinj", "rijeka",
  ],
  proto_villanovan: [
    "rimini", "cesena", "faenza", "imola", "modigliana", "ravenna", "urbino", "montefeltro", "pesaro",
    "arezzo", "cortona", "sansepolcro", "florence", "mangona", "poggibonsi", "prato", "sanlorenzo",
    "pistoia", "lucca", "massa", "fosdinovo", "pescia", "pisa", "livorno", "pontedera", "volterra",
    "siena", "perugia", "cittacastello", "marsciano", "civitavecchia", "corneto", "orte", "viterbo",
    "padova", "este", "monselice", "venice", "mestre", "treviso", "castelfranco", "ceneda",
    "chioggia", "conegliano", "vicenza",
  ],
  rinaldone: [
    "orvietano", "pitigliano", "montalcino", "chiusi",
  ],
  latial: [
    "anagni", "palestrina", "sabina", "tivoli", "rome", "terracina", "velletri", "bracciano",
  ],
  apennine: [
    "aquila", "celano", "cittaducale", "sulmona", "teramo", "chieti", "lanciano", "vasto", "atri",
    "csantangelo", "bojano", "isernia", "larino", "trivento", "ascolipiceno", "camerino", "fabriano",
    "fermo", "macerata", "gubbio", "ancona", "spoleto", "assisi", "narni", "rieti", "todi",
    "montepeloso", "grosseto", "massamar", "piombino", "vergato",
  ],
  ausonian: [
    "naples", "caserta", "gaeta", "nola", "piedimonte", "sora", "venafro", "salerno", "campagna",
    "salacon", "vallo", "avellino", "ariano", "benevento", "santangelo", "monteleone", "scalea",
  ],
  oenotrian: [
    "potenza", "acerenza", "lagonegro", "matera", "melfi", "cosenza", "cassano", "castrovillari",
  ],
  iapygian: [
    "bari", "altamura", "andria", "barletta", "monopoli", "foggia", "bovino", "lucera", "manfredonia",
    "rotondo", "sansevero", "brindisi", "martinafr", "taranto",
  ],
  sicel: [
    "messina", "catania", "mistretta", "nicosiasic", "patti", "piazza", "syracuse", "caltagirone",
    "modica", "noto", "terranovasic",
  ],
  sicanian: [
    "girgenti", "bivona", "caltanisetta", "cefalu", "sciacca", "termini", "palermo", "corleone", "malta",
  ],
  elymian: [
    "mazara", "salemi", "trapani",
  ],
  nuragic: [
    "oristano", "ales", "sorgono", "terralba", "cagliari", "tratalias", "villa_di_chiesa", "isili",
    "muravera", "seddori", "tortoli", "terranova_pausania", "orosei", "posada", "tempiopausania",
    "sassari", "alghero", "bosa", "castelsardo", "macomer", "bitti", "ozieri", "thiesi",
  ],
  torrean: [
    "bastia", "aleria", "calvi", "corte", "ajaccio", "bonifacio", "sartene", "vico",
  ],
  germanic: [
    "weissenburg", "eichstatt", "parsberg", "beilngries", "wunsiedel", "eschenbach", "tirschenreuth",
    "regensburg", "cham", "amberg", "leuchtenberg", "roding", "burglengenfeld",
  ],
  illyrian: [
    "dubrovnik",
  ],
};

const cultureReligion = new Map([
  ["nuragic", "nuragic"],
  ["torrean", "nuragic"],
  ["germanic", "nordic_pagan"],
  ["illyrian", "illyrian_pagan"],
  ["castellieri", "italic_pagan"],
  ["iapygian", "italic_pagan"],
  ["sicel", "italic_pagan"],
  ["sicanian", "italic_pagan"],
  ["elymian", "italic_pagan"],
]);

function defaultReligion(culture) {
  return cultureReligion.get(culture) || "italic_pagan";
}

function upsertLanguageFamilies() {
  let text = readText(languageFamiliesPath);
  for (const family of languageFamilies) {
    text = upsertTopLevelBlock(text, family.id, languageFamilyBlock(family));
  }
  writeText(languageFamiliesPath, text);
}

function upsertLanguages() {
  let text = readText(languagesPath);
  for (const language of languages) {
    text = upsertTopLevelBlock(text, language.id, languageBlock(language));
  }
  writeText(languagesPath, text);
}

function upsertCultures() {
  let text = readText(culturesPath);
  for (const culture of cultures) {
    text = upsertTopLevelBlock(text, culture.id, cultureBlock(culture));
  }
  writeText(culturesPath, text);
}

function upsertLocalization() {
  let text = readText(localizationPath);
  const body = text
    .split("\n")
    .filter((line) => !line.includes("l_english:"))
    .join("\n")
    .replace(/^\s*\n/, "");
  text = `l_english:\n${body}`;

  for (const [key, [name, descOrAdj]] of localization) {
    if (key.endsWith("_group")) {
      const groupLine = ` ${key}: "${name}"`;
      const descLine = ` ${key}_desc: "${descOrAdj}"`;
      text = upsertLocalizationLine(text, key, groupLine);
      text = upsertLocalizationLine(text, `${key}_desc`, descLine);
    } else {
      const nameLine = ` ${key}: "${name}"`;
      const adjLine = ` ${key}_ADJ: "${descOrAdj}"`;
      text = upsertLocalizationLine(text, key, nameLine);
      text = upsertLocalizationLine(text, `${key}_ADJ`, adjLine);
    }
  }
  writeText(localizationPath, text);
}

function upsertLocalizationLine(text, key, line) {
  const re = new RegExp(`^ ${key}: .*$`, "m");
  if (re.test(text)) return text.replace(re, line);
  return `${text.replace(/\s*$/, "\n")}${line}\n`;
}

function applyLocationCultures() {
  const byLocation = new Map();
  for (const [culture, locations] of Object.entries(locationCulture)) {
    for (const location of locations) {
      if (byLocation.has(location)) throw new Error(`Duplicate location mapping: ${location}`);
      byLocation.set(location, culture);
    }
  }

  const input = readText(popsPath);
  let output = "";
  let cursor = 0;
  const changedLocations = [];
  const missingLocations = [];
  const changedPopLines = new Map();

  for (const match of input.matchAll(/^([A-Za-z0-9_]+)\s*=\s*\{\s*$/gm)) {
    const location = match[1];
    const culture = byLocation.get(location);
    const open = input.indexOf("{", match.index);
    const close = findBlockEnd(input, open);
    if (!culture || close < 0) continue;

    const body = input.slice(open + 1, close);
    const popLines = [...body.matchAll(/\bdefine_pop\s*=/g)].length;
    const religion = defaultReligion(culture);
    let nextBody = body.replace(/\bculture\s*=\s*[A-Za-z0-9_]+/g, `culture = ${culture}`);
    nextBody = nextBody.replace(/\breligion\s*=\s*[A-Za-z0-9_]+/g, `religion = ${religion}`);

    output += input.slice(cursor, open + 1);
    output += nextBody;
    cursor = close;
    changedLocations.push(location);
    changedPopLines.set(culture, (changedPopLines.get(culture) || 0) + popLines);
    byLocation.delete(location);
  }
  output += input.slice(cursor);
  missingLocations.push(...byLocation.keys());

  writeText(popsPath, output);
  return { changedLocations, missingLocations, changedPopLines };
}

function main() {
  upsertLanguageFamilies();
  upsertLanguages();
  upsertCultures();
  upsertLocalization();
  const { changedLocations, missingLocations, changedPopLines } = applyLocationCultures();

  let report = "Bronze Age Italy culture overhaul report\n";
  report += "=========================================\n\n";
  report += `Cultures defined/updated: ${cultures.length}\n`;
  report += `Locations assigned: ${changedLocations.length}\n`;
  report += `Missing mapped locations: ${missingLocations.length}\n\n`;
  report += "Assigned pop lines by culture:\n";
  for (const [culture, count] of [...changedPopLines.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    report += `- ${culture}: ${count}\n`;
  }
  if (missingLocations.length) report += `\nMissing locations:\n- ${missingLocations.join("\n- ")}\n`;
  writeText(reportPath, report);

  console.log(`Applied Bronze Age Italy culture overhaul to ${changedLocations.length} locations.`);
}

main();
