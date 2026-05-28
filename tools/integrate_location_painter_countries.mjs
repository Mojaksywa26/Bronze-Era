import fs from "node:fs";
import path from "node:path";

const root = path.resolve(".");

const paths = {
  modifiedPainter: "in_game/setup/location_painter/00_location_painter.txt",
  manualPainter: "tools/location_painter_inputs/manual_new_bronze_countries.disabled",
  originalPainter: "../intal.txt",
  countries: "main_menu/setup/start/10_countries.txt",
  defaultCountries: "in_game/setup/countries/_default.txt",
  localizationFiles: [
    "localization/english/Bronze_country_names_l_english.yml",
    "main_menu/localization/english/Bronze_country_names_l_english.yml",
  ],
  pops: "main_menu/setup/start/06_pops.txt",
  locationTemplates: "in_game/map_data/location_templates.txt",
  mapDefinitions: "in_game/map_data/definitions.txt",
  culturesDir: "in_game/common/cultures",
  cultureGroupsDir: "in_game/common/culture_groups",
  religionsDir: "in_game/common/religions",
  internationalOrganizations: "main_menu/setup/start/15_international_organizations.txt",
  celticCultures: "in_game/common/cultures/zz_bronze_celtic_cultures.txt",
  celticCultureGroups: "in_game/common/culture_groups/zz_bronze_celtic_culture_groups.txt",
  celticLocalizationFiles: [
    "localization/english/zz_bronze_celtic_cultures_l_english.yml",
    "main_menu/localization/english/zz_bronze_celtic_cultures_l_english.yml",
  ],
  normalizedPainter: "in_game/setup/location_painter/00_location_painter.txt",
  outputDir: "tools/bronze_country_integration",
};

const reportPaths = {
  finalSetup: `${paths.outputDir}/final_merged_country_setup.txt`,
  conflictLog: `${paths.outputDir}/conflict_resolution_log.txt`,
  duplicateReport: `${paths.outputDir}/duplicate_cleanup_report.txt`,
  removedObsolete: `${paths.outputDir}/removed_obsolete_vanilla_countries.txt`,
  newCountries: `${paths.outputDir}/new_bronze_countries.txt`,
  identityReport: `${paths.outputDir}/country_stability_identity_report.txt`,
  explorationReport: `${paths.outputDir}/country_exploration_regions_report.txt`,
  summary: `${paths.outputDir}/bronze_country_integration_report.txt`,
};

const dynamicTagNames = new Map();
const dynamicTagAdjectives = new Map();
const tagCache = new Map();
const tagOwners = new Map();
let localizationNameCache = null;

const greekTagReplacements = new Map([
  ["ACHAEA", "ACHAE"],
  ["ATHENS", "ATHEN"],
  ["IOLCUS", "IOLC"],
  ["IOLCU", "IOLC"],
  ["ORCHOMENUS", "ORCHO"],
  ["RHODES", "RHODE"],
  ["SPARTA", "SPART"],
  ["THEBES", "THEBE"],
]);

function abs(rel) {
  return path.join(root, rel);
}

function readText(rel) {
  return fs.readFileSync(abs(rel), "utf8").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function readFirstExisting(rels, fallback = "") {
  for (const rel of rels) {
    if (fs.existsSync(abs(rel))) return readText(rel);
  }
  return fallback;
}

function candidateGameRoots() {
  const roots = [];
  if (process.env.EU5_GAME_DIR) roots.push(process.env.EU5_GAME_DIR);
  roots.push(
    "D:/SteamLibrary/steamapps/common/Europa Universalis V/game",
    "E:/SteamLibrary/steamapps/common/Europa Universalis V/game",
    "C:/Program Files (x86)/Steam/steamapps/common/Europa Universalis V/game"
  );
  return roots;
}

function findGameFile(relPath) {
  if (fs.existsSync(abs(relPath))) return abs(relPath);
  for (const gameRoot of candidateGameRoots()) {
    const candidate = path.join(gameRoot, relPath);
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function writeText(rel, text) {
  fs.mkdirSync(path.dirname(abs(rel)), { recursive: true });
  const normalized = text.replace(/^\uFEFF/, "").replace(/\n/g, "\r\n");
  const content = rel.includes("localization/") && rel.endsWith(".yml") ? `\uFEFF${normalized}` : normalized;
  const target = abs(rel);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      fs.writeFileSync(target, content, "utf8");
      return;
    } catch (error) {
      if (attempt === 4) throw error;
      // Windows can briefly lock large setup files while the launcher/editor indexes them.
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 150);
    }
  }
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

function wordsFromBlock(body, key) {
  const match = new RegExp(`\\b${key}\\s*=\\s*\\{([\\s\\S]*?)\\}`).exec(body);
  if (!match) return [];
  return [...match[1].replace(/#.*$/gm, "").matchAll(/[A-Za-z0-9_]+/g)].map((item) => item[0]);
}

function parsePainterFile(rel, source) {
  const text = readText(rel).replace(/#.*$/gm, "");
  const rootMatch = /location_painter_assignments\s*=\s*\{/.exec(text);
  if (!rootMatch) throw new Error(`location_painter_assignments block not found in ${rel}`);
  const rootOpen = text.indexOf("{", rootMatch.index);
  const rootClose = findBlockEnd(text, rootOpen);
  if (rootClose === -1) throw new Error(`Unclosed root block in ${rel}`);
  const body = text.slice(rootOpen + 1, rootClose);
  const assignments = [];
  const entryRe = /^\s*([^\s][^=\n]*?)\s*=\s*\{/gm;
  let match;
  while ((match = entryRe.exec(body))) {
    const rawTag = match[1].trim();
    const open = body.indexOf("{", match.index);
    const close = findBlockEnd(body, open);
    if (close === -1) throw new Error(`Unclosed block for ${rawTag} in ${rel}`);
    const entryBody = body.slice(open + 1, close);
    const color = wordsFromBlock(entryBody, "color").map(Number).filter((value) => Number.isFinite(value)).slice(0, 3);
    const locations = wordsFromBlock(entryBody, "locations");
    const tag = normalizeTag(rawTag);
    rememberDisplayName(rawTag, tag);
    assignments.push({
      source,
      rawTag,
      tag,
      color: color.length === 3 ? color : [128, 128, 128],
      locations,
      order: assignments.length,
    });
    entryRe.lastIndex = close + 1;
  }
  return assignments;
}

function normalizeNameKey(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_-]+/g, " ")
    .replace(/[^A-Za-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function displayNameFromRaw(rawTag) {
  const clean = normalizeNameKey(rawTag);
  if (!clean) return rawTag;
  return clean
    .toLowerCase()
    .split(" ")
    .map((part) => {
      if (part === "cubi") return "Cubi";
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(" ");
}

function rememberDisplayName(rawTag, tag) {
  if (!tag || dynamicTagNames.has(tag)) return;
  const localized = localizedNameForTag(rawTag.trim().toUpperCase());
  if (localized) {
    dynamicTagNames.set(tag, localized);
    return;
  }
  const name = displayNameFromRaw(rawTag);
  if (name && !/^[A-Z0-9_]{1,5}$/.test(rawTag.trim())) dynamicTagNames.set(tag, name);
}

function localizedTagNames() {
  if (localizationNameCache) return localizationNameCache;
  localizationNameCache = new Map();
  const text = readFirstExisting(paths.localizationFiles, "");
  for (const match of text.matchAll(/^\s*([A-Z0-9_]+):\s*"([^"]+)"/gm)) {
    localizationNameCache.set(match[1], match[2]);
  }
  return localizationNameCache;
}

function localizedNameForTag(tag) {
  return localizedTagNames().get(tag) || null;
}

function acronymTag(clean) {
  const parts = clean.split("_").filter(Boolean);
  if (parts.length > 1) {
    const firstLetters = parts.map((part) => part[0]).join("");
    const tail = parts[parts.length - 1].slice(0, Math.max(0, 5 - firstLetters.length));
    return `${firstLetters}${tail}`.slice(0, 5);
  }
  return clean.slice(0, 5);
}

function uniqueTagFor(clean, base) {
  if (tagCache.has(clean)) return tagCache.get(clean);
  let candidate = base.slice(0, 5);
  if (!candidate) candidate = "TAG";
  let suffix = 1;
  while (tagOwners.has(candidate) && tagOwners.get(candidate) !== clean) {
    const text = String(suffix);
    candidate = `${base.slice(0, Math.max(1, 5 - text.length))}${text}`.slice(0, 5);
    suffix += 1;
  }
  tagOwners.set(candidate, clean);
  tagCache.set(clean, candidate);
  return candidate;
}

function normalizeTag(rawTag) {
  const clean = rawTag
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^A-Za-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .toUpperCase();
  const tagOverrides = new Map([
    ...greekTagReplacements,
    ["ABRINCATES", "ABRIN"],
    ["AEQUIAN", "AEQUI"],
    ["ALLOBROGES", "ALLOB"],
    ["AMBARRES", "AMBAR"],
    ["ANDES", "ANDES"],
    ["ARAXES", "ARAX"],
    ["ARVERNES", "ARVER"],
    ["BAIOCASSES", "BAIOC"],
    ["BITURIGES", "BITUR"],
    ["CALETES", "CALET"],
    ["CAL_TES", "CALET"],
    ["CAMUNIC", "CAMUN"],
    ["CARNIAN", "CARNI"],
    ["CORIOSOLITES", "CORIO"],
    ["DAESITIAN", "DAESI"],
    ["ETRUSCAN", "ETRUS"],
    ["ESUVIEN", "ESUVI"],
    ["FALISCAN", "FALIS"],
    ["GABALES", "GABAL"],
    ["HELVETII", "HELVE"],
    ["HISTRIAN", "HISTI"],
    ["INSUBRES", "INSUB"],
    ["LEPONTIC", "LEPON"],
    ["LEXOVIENS", "LEXOV"],
    ["LIBURNIA", "LIBUR"],
    ["LIGURIA", "LIGUR"],
    ["MANNAEA", "MANNA"],
    ["MARSIAN", "MARSI"],
    ["MOESIA", "MOESI"],
    ["NAMNETES", "NAMNE"],
    ["NAMN_TES", "NAMNE"],
    ["NORD_PICENE", "NPICE"],
    ["OENOTRIAN", "OENOT"],
    ["OSISMES", "OSISM"],
    ["PAGONIA", "PAGON"],
    ["POTULATENSIS", "POTUL"],
    ["PICTON", "PICTO"],
    ["RAETIC", "RAETI"],
    ["REDONES", "REDON"],
    ["RUTENES", "RUTEN"],
    ["SALLUVIENS", "SALLU"],
    ["SANTANS", "SANTN"],
    ["SCORDISCIAN", "SCORD"],
    ["SCYTHIANS", "SCYTH"],
    ["SEGUSIAVES", "SEGUS"],
    ["SENOMES", "SENOM"],
    ["SENONIAN", "SENON"],
    ["SEQUANCES", "SEQUA"],
    ["SIBUZATES", "SIBUZ"],
    ["SOTIATES", "SOTIA"],
    ["SOUTH_PICENE", "SPICE"],
    ["SURRTENIA", "SURRT"],
    ["TARANTINE", "TARAN"],
    ["TARDELLE", "TARDL"],
    ["TAURISCIAN", "TAURI"],
    ["UMBRIAN", "UMBRI"],
    ["UNELLES", "UNELL"],
    ["VASATES", "VASAT"],
    ["VENETIAN", "VENET"],
    ["VENETES", "VENES"],
    ["VELIOCASSES", "VELIO"],
    ["VELLAVES", "VELLA"],
    ["VESTINIAN", "VESTI"],
    ["VIDUCASSES", "VIDUC"],
    ["VOCANCES", "VOCAN"],
    ["VOLQUES_ARECOMIQUES", "VOLAR"],
    ["VOLQUES_TECTOSAGES", "VOLTE"],
    ["VOLSCIAN", "VOLSC"],
    ["CAMUNNI", "CMNNI"],
    ["CAMU1", "CMNNI"],
    ["MENTESONI", "METSO"],
    ["MENT1", "METSO"],
    ["SENONES", "SENES"],
    ["SENO1", "SENES"],
    ["SUESSIONES", "SUESO"],
    ["SUES1", "SUESO"],
    ["BITURIGES_CUBI", "BITCU"],
    ["BOII", "BOLI"],
    ["AULERCI_CENOMANI", "ALCEN"],
    ["AULERCI_DIABLINTES", "ALDIA"],
    ["TURDULI_BUDANI", "TUBUD"],
    ["TURDULI_DIPONI", "TUDIP"],
    ["TURDULI_SOSIPONI", "TUSOS"],
    ["TURDULI_ARTIGI", "TUART"],
    ["TURDULI_VETERES", "TUVET"],
  ]);
  if (tagOverrides.has(clean)) {
    const tag = tagOverrides.get(clean);
    tagCache.set(clean, tag);
    if (!tagOwners.has(tag)) tagOwners.set(tag, clean);
    return tag;
  }
  if (/^[A-Z0-9_]{1,5}$/.test(clean)) return uniqueTagFor(clean, clean);
  return uniqueTagFor(clean, acronymTag(clean));
}

function parseLocationTemplateIdentities() {
  const identities = new Map();
  const text = readText(paths.locationTemplates);
  const re = /^([A-Za-z0-9_]+)\s*=\s*\{([^\n}]*)\}/gm;
  let match;
  while ((match = re.exec(text))) {
    const body = match[2];
    const culture = /\bculture\s*=\s*([A-Za-z0-9_]+)/.exec(body)?.[1];
    const religion = /\breligion\s*=\s*([A-Za-z0-9_]+)/.exec(body)?.[1];
    if (culture && religion && !/\btopography\s*=\s*lakes\b/.test(body)) {
      identities.set(match[1], { culture, religion });
    }
  }
  return identities;
}

function parsePopIdentityWeights() {
  const text = readText(paths.pops);
  const result = new Map();
  const locRe = /^([A-Za-z0-9_]+)\s*=\s*\{([\s\S]*?)^\}/gm;
  let match;
  while ((match = locRe.exec(text))) {
    const location = match[1];
    const body = match[2];
    const cultures = new Map();
    const religions = new Map();
    for (const pop of body.matchAll(/define_pop\s*=\s*\{([^}]*)\}/g)) {
      const popBody = pop[1];
      const size = Number.parseFloat(/\bsize\s*=\s*([0-9.]+)/.exec(popBody)?.[1] || "0");
      const weight = Number.isFinite(size) && size > 0 ? size : 0.01;
      const culture = /\bculture\s*=\s*([A-Za-z0-9_]+)/.exec(popBody)?.[1];
      const religion = /\breligion\s*=\s*([A-Za-z0-9_]+)/.exec(popBody)?.[1];
      if (culture) cultures.set(culture, (cultures.get(culture) || 0) + weight);
      if (religion) religions.set(religion, (religions.get(religion) || 0) + weight);
    }
    if (cultures.size || religions.size) result.set(location, { cultures, religions });
  }
  return result;
}

function mergeWeights(target, source, multiplier = 1) {
  for (const [key, value] of source || []) target.set(key, (target.get(key) || 0) + value * multiplier);
}

function listFilesRecursive(relDir) {
  const base = abs(relDir);
  if (!fs.existsSync(base)) return [];
  const out = [];
  for (const entry of fs.readdirSync(base, { withFileTypes: true })) {
    const full = path.join(base, entry.name);
    if (entry.isDirectory()) {
      for (const nested of listFilesRecursive(path.relative(root, full))) out.push(nested);
    } else if (entry.isFile() && entry.name.endsWith(".txt")) {
      out.push(path.relative(root, full));
    }
  }
  return out;
}

function parseTopLevelDefinitionKeys(relDir) {
  const keys = new Set();
  for (const file of listFilesRecursive(relDir)) {
    const text = readText(file).replace(/#.*$/gm, "");
    const re = /^([A-Za-z0-9_]+)\s*=\s*\{/gm;
    let match;
    while ((match = re.exec(text))) keys.add(match[1]);
  }
  return keys;
}

function parseTopLevelDefinitionKeysExcept(relDir, excludedRelPaths) {
  const excluded = new Set(excludedRelPaths.map((rel) => path.normalize(rel)));
  const keys = new Set();
  for (const file of listFilesRecursive(relDir)) {
    if (excluded.has(path.normalize(file))) continue;
    const text = readText(file).replace(/#.*$/gm, "");
    const re = /^([A-Za-z0-9_]+)\s*=\s*\{/gm;
    let match;
    while ((match = re.exec(text))) keys.add(match[1]);
  }
  return keys;
}

const celticBranches = [
  {
    id: "germanic_celtic",
    name: "Germanic Celtic",
    genericCulture: "gaulish",
    religion: "gaulish_pagan",
    language: "celtic_bronze_language",
    color: [97, 132, 142],
    cultures: ["CAMUNNI", "BRENAI", "VENOSTES", "ARESACES", "UBI", "LUGI", "BOII", "TULINGI"],
  },
  {
    id: "belgica",
    name: "Belgica",
    genericCulture: "gaulish",
    religion: "gaulish_pagan",
    language: "celtic_bronze_language",
    color: [88, 144, 176],
    cultures: ["MENAPII", "NERVII", "MORINI", "ATREBATES", "AMBIANI", "ADUATUCI", "EBURONES", "CAEROSI", "TREWEROI", "TEUCOR", "CAEMANAR", "BAETASII", "NEMETES", "RAURAC", "TENCTERI", "TRIBOCC", "TUNGRI", "VANGIONES"],
  },
  {
    id: "gallaecian",
    name: "Gallaecian",
    genericCulture: "lusitanian",
    religion: "lusitanian_pagan",
    language: "celtic_bronze_language",
    color: [89, 145, 118],
    cultures: ["NERII", "BRACARI", "SEURBI", "GROVII", "LEUNI", "QUARQUENI", "BAEDUI", "CAPORI", "LOUGEI", "LEMAVI", "CALADONI"],
  },
  {
    id: "lusitanian_branch",
    groupId: "lusitanian",
    name: "Lusitanian",
    genericCulture: "lusitanian",
    religion: "lusitanian_pagan",
    language: "celtic_bronze_language",
    color: [137, 153, 87],
    cultures: ["OPPIDANI", "TURDILI", "BARDILI", "TALURES", "TAPORI", "ILIPA", "KYNETES", "TURDULI_VETERES", "CALLAECI", "NEMETATI", "ARAOCELENSES", "SEAREAE", "ZOELAE"],
  },
  {
    id: "ibero_celtic",
    name: "Ibero-Celtic",
    genericCulture: "celtiberian",
    religion: "iberian_pagan",
    language: "celtic_bronze_language",
    color: [166, 128, 80],
    cultures: ["VADRULI", "CARISTII", "AUTRIGONES", "CONSGI", "CONCANI", "LUSONES", "TITTII", "AREVACI", "CAUCI", "VETTONES", "MIROBRIGENSES", "CELTICI", "CONI", "IREUCUTIONI", "BLETONESSI", "ARUNDA", "ANTICARIA", "URGAPA", "MENTESONI", "URSO", "ACINIPPO", "EPORA", "KARTUBA", "ONUBA", "IBOLCANI", "PALANTI", "TURDULI_BUDANI", "TURDULI_DIPONI", "CALONTIENES", "COERENSES", "CAMAOLENSES", "VOLTICIANI", "LOBETANI", "BELLI", "URACI", "CRATISTII", "OLCADES", "MENTESANI", "VENATISOCI", "ACCIOCI", "TURDULI_SOSIPONI", "TURDULI_ARTIGI", "PAESICI", "ALBIONES", "CIBARCI", "LAPIATINEI", "ARROTREBAE", "POEMANI", "SEURRI", "TURMOGI", "VACCAEI", "SAELINI", "ORNIACI", "COLIACINI", "CADABRI", "CABRIANGINI"],
  },
  {
    id: "britannic",
    name: "Britannic",
    genericCulture: "britannic",
    religion: "britannic_pagan",
    language: "brittonic_bronze_language",
    color: [92, 126, 166],
    cultures: ["CANTIACI", "REGINI", "BIBROCI", "ANCALITES", "AUTENII", "BRIGANTES", "CAERACATIS", "CAERENI", "CALEDONES", "CARNONACAE", "CARWETII", "CASSI", "CENOMAGNI", "CLAHILIC", "CORIELTAUVI", "CORIONDI", "CORNOVII", "CORNOWII", "CREONES", "DALITERNI", "DAMNONII", "DARINI", "DECANTAE", "DECEANGLI", "DEMETAE", "DOBUNNI", "DUMNANII", "DUMNONII", "DUROTRIGES", "EBODANII", "EPIDII", "ERDIN", "GABRANTOVICES", "GANGANI", "HAEMODAEI", "ICENES", "IWERNI", "LOPOCARES", "MANAKWI", "METANTII", "MONAKWI", "MONE", "NAGNATAE", "NOVANTAE", "ORCII", "ORDOWICI", "RODOGBI", "SEGONTIACI", "SELGOWII", "SILORIKS", "TAEXALI", "TESTWERDI", "THULE", "TRINOVANTES", "UELLABORI", "UENNICNII", "ULUTI", "UPERACI", "USDIAE", "VENICONES", "VOTADIN", "WOCOMIUGI"],
  },
  {
    id: "gaulish",
    name: "Gaulish",
    genericCulture: "gaulish",
    religion: "gaulish_pagan",
    language: "celtic_bronze_language",
    color: [107, 166, 78],
    cultures: ["UELAUII", "SARDONNES", "ATACINI", "BEBRYKES", "GARUMNI", "GALLI", "SUESSETANI", "SOTIA", "PETROCORIIS", "LEMOVICES", "ANDECAMULENSES", "BITURIGES CUBI", "AICUBIDUOI", "LINGONES", "MANDUBIO", "BELLOUACI", "SUESSIONES", "TRICASSES", "SILVANECTES", "MELDI", "CATUWELLAUNOI", "REMI", "SETUEI", "VIROMANDU", "PARISI", "AULERCI", "CARNUTES", "SENONES", "AULERCI CENOMANI", "TURONES", "AULERCI DIABLINTES", "LEUCI", "MEDIOMATERES", "ELISYKOI", "VOLCAE"],
  },
  {
    id: "ligurian",
    name: "Ligurian",
    genericCulture: "ligurian",
    religion: "gaulish_pagan",
    language: "celtic_bronze_language",
    color: [92, 151, 116],
    cultures: ["INGAUMI", "SABATES", "TIGULIN", "GENNATES", "LAPCINI", "STATIELLI", "POLLENTINI", "INTERNELLI", "EPANTERRI", "SUELTERI", "LAGAMI", "VERUCINI"],
  },
  {
    id: "lepontic",
    name: "Lepontic",
    genericCulture: "lepontic",
    religion: "gaulish_pagan",
    language: "celtic_bronze_language",
    color: [112, 152, 164],
    cultures: ["SUBINATES", "OROBLI"],
  },
  {
    id: "balkan_celtic",
    name: "Balkan Celtic",
    genericCulture: "gaulish",
    religion: "gaulish_pagan",
    language: "celtic_bronze_language",
    color: [128, 114, 166],
    cultures: ["TYLE", "DISCODUARTERAE", "TIMACHI", "CELEGERI", "ANARTO", "ERAVISCI", "OSII", "TEURISC"],
  },
  {
    id: "anatolia_celtic",
    name: "Anatolia Celtic",
    genericCulture: "gaulish",
    religion: "gaulish_pagan",
    language: "celtic_bronze_language",
    color: [150, 121, 93],
    cultures: ["TEKTOSAGES", "TOLISTOBOIOI", "TROKMOI"],
  },
];

const celticCultureByName = new Map();
for (const branch of celticBranches) {
  const groupId = branch.groupId || branch.id;
  for (const cultureName of branch.cultures) {
    const id = normalizeCultureId(cultureName);
    celticCultureByName.set(normalizeNameKey(cultureName), {
      id,
      name: displayNameFromRaw(cultureName),
      branch: groupId,
      branchName: branch.name,
      genericCulture: branch.genericCulture,
      religion: branch.religion,
      language: branch.language,
      color: branch.color,
    });
  }
}

function normalizeCultureId(name) {
  return normalizeNameKey(name).toLowerCase().replace(/\s+/g, "_");
}

function colorShift(color, index) {
  return color.map((value, channel) => {
    const shifted = value + ((index * (channel + 3) * 17) % 55) - 22;
    return Math.max(35, Math.min(225, shifted));
  });
}

function celticIdentityForAssignment(assignment) {
  const candidates = [
    assignment.rawTag,
    assignment.tag,
    dynamicTagNames.get(assignment.tag),
    localizedNameForTag(assignment.tag),
    titleFromTag(assignment.tag),
  ].filter(Boolean);
  for (const candidate of candidates) {
    const hit = celticCultureByName.get(normalizeNameKey(candidate));
    if (hit) return hit;
  }
  return null;
}

function writeCelticCultureFiles() {
  const existingCultures = parseTopLevelDefinitionKeysExcept(paths.culturesDir, [paths.celticCultures]);
  const existingGroups = parseTopLevelDefinitionKeysExcept(paths.cultureGroupsDir, [paths.celticCultureGroups]);
  const groupIds = ["celtic", ...celticBranches.map((branch) => branch.groupId || branch.id)];
  const groupLines = [
    "# Bronze Era Celtic culture hierarchy generated from liste pays.txt.",
    "# celtic is the parent group; the other entries are Celtic subdivisions.",
    "",
  ];
  for (const groupId of orderedUnique(groupIds)) {
    if (!existingGroups.has(groupId)) {
      groupLines.push(`${groupId} = {`);
      groupLines.push("}");
      groupLines.push("");
    }
  }
  writeText(paths.celticCultureGroups, groupLines.join("\n"));

  const cultureLines = [
    "# Bronze Era Celtic subcultures generated from liste pays.txt.",
    "# These are archaeological and tribal identities, not centralized states.",
    "",
  ];
  let generated = 0;
  for (const branch of celticBranches) {
    const groupId = branch.groupId || branch.id;
    branch.cultures.forEach((cultureName, index) => {
      const id = normalizeCultureId(cultureName);
      if (existingCultures.has(id)) return;
      const color = colorShift(branch.color, index);
      cultureLines.push(`${id} = {`);
      cultureLines.push(`\tlanguage = ${branch.language}`);
      cultureLines.push(`\tcolor = rgb { ${color.join(" ")} }`);
      cultureLines.push("\ttags = { celtic_gfx western_european_gfx european_gfx }");
      cultureLines.push("\topinions = {");
      cultureLines.push("\t}");
      cultureLines.push("\tculture_groups = {");
      cultureLines.push("\t\tceltic");
      cultureLines.push(`\t\t${groupId}`);
      cultureLines.push("\t}");
      cultureLines.push("}");
      cultureLines.push("");
      generated += 1;
    });
  }
  writeText(paths.celticCultures, cultureLines.join("\n"));

  const locLines = ["l_english:"];
  for (const groupId of orderedUnique(groupIds)) {
    const branch = celticBranches.find((item) => (item.groupId || item.id) === groupId);
    const name = groupId === "celtic" ? "Celtic" : branch?.name || displayNameFromRaw(groupId);
    locLines.push(` ${groupId}: "${name}"`);
  }
  for (const [key, info] of [...celticCultureByName.entries()].sort((a, b) => a[1].id.localeCompare(b[1].id))) {
    void key;
    locLines.push(` ${info.id}: "${info.name}"`);
    locLines.push(` ${info.id}_ADJ: "${adjectiveFromName(info.name)}"`);
  }
  locLines.push("");
  for (const rel of paths.celticLocalizationFiles) writeText(rel, locLines.join("\n"));
  return { generated, groups: orderedUnique(groupIds).length };
}

function rankedWeights(weights) {
  return [...weights.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function sumWeights(weights) {
  let total = 0;
  for (const value of weights.values()) total += value;
  return total;
}

function addLocationIdentityWeights(location, targetCultures, targetReligions, popIdentityWeights, locationIdentities, multiplier = 1) {
  const popIdentity = popIdentityWeights.get(location);
  const templateIdentity = locationIdentities.get(location);
  if (popIdentity?.cultures?.size) mergeWeights(targetCultures, popIdentity.cultures, multiplier);
  else if (templateIdentity?.culture) targetCultures.set(templateIdentity.culture, (targetCultures.get(templateIdentity.culture) || 0) + multiplier);
  if (popIdentity?.religions?.size) mergeWeights(targetReligions, popIdentity.religions, multiplier);
  else if (templateIdentity?.religion) targetReligions.set(templateIdentity.religion, (targetReligions.get(templateIdentity.religion) || 0) + multiplier);
}

function validOverride(value, validValues) {
  return value && validValues.has(value) ? value : null;
}

function historicalIdentityOverride(tag, validCultures, validReligions) {
  const overrides = new Map([
    ["0001G", { culture: "mycenaean", religion: "mycenaean" }],
    ["0002G", { culture: "upper_egyptian", religion: "kemetic" }],
    ["HATTI", { culture: "hittite", religion: "hittite" }],
    ["ACHAE", { culture: "mycenaean", religion: "mycenaean" }],
    ["ACHAEA", { culture: "mycenaean", religion: "mycenaean" }],
    ["ATHEN", { culture: "mycenaean", religion: "mycenaean" }],
    ["ATHENS", { culture: "mycenaean", religion: "mycenaean" }],
    ["BOSPH", { culture: "thracian", religion: "thracian_pagan" }],
    ["ELAM", { culture: "elamite", religion: "elamite" }],
    ["IOLC", { culture: "mycenaean", religion: "mycenaean" }],
    ["IOLCU", { culture: "mycenaean", religion: "mycenaean" }],
    ["IOLCUS", { culture: "mycenaean", religion: "mycenaean" }],
    ["KASSI", { culture: "kassite", religion: "babylonian" }],
    ["LATIN", { culture: "latial", religion: "italic_pagan" }],
    ["NURAG", { culture: "nuragic", religion: "nuragic" }],
    ["ORCHO", { culture: "mycenaean", religion: "mycenaean" }],
    ["ORCHOMENUS", { culture: "mycenaean", religion: "mycenaean" }],
    ["PYLOS", { culture: "mycenaean", religion: "mycenaean" }],
    ["RHODE", { culture: "mycenaean", religion: "mycenaean" }],
    ["RHODES", { culture: "mycenaean", religion: "mycenaean" }],
    ["SIROP", { culture: "paeonian", religion: "thracian_pagan" }],
    ["SPART", { culture: "mycenaean", religion: "mycenaean" }],
    ["SPARTA", { culture: "mycenaean", religion: "mycenaean" }],
    ["THEBE", { culture: "mycenaean", religion: "mycenaean" }],
    ["THEBES", { culture: "mycenaean", religion: "mycenaean" }],
    ["THRAC", { culture: "thracian", religion: "thracian_pagan" }],
    ["WILUS", { culture: "luwian", religion: "luwian" }],
  ]);
  const override = overrides.get(tag);
  if (!override) return {};
  return {
    culture: validOverride(override.culture, validCultures),
    religion: validOverride(override.religion, validReligions),
  };
}

function acceptedCulturesForCountry(primaryCulture, cultureWeights) {
  const ranked = rankedWeights(cultureWeights).map(([culture]) => culture);
  const total = sumWeights(cultureWeights);
  const accepted = [];
  if (primaryCulture) accepted.push(primaryCulture);
  let covered = primaryCulture ? cultureWeights.get(primaryCulture) || 0 : 0;
  for (const culture of ranked) {
    if (accepted.includes(culture)) continue;
    if (accepted.length >= 6) break;
    accepted.push(culture);
    covered += cultureWeights.get(culture) || 0;
    if (accepted.length >= 2 && total > 0 && covered / total >= 0.7) break;
  }
  const tolerated = ranked.filter((culture) => !accepted.includes(culture)).slice(0, 8);
  return { accepted, tolerated };
}

function toleratedReligionsForCountry(stateReligion, religionWeights) {
  return rankedWeights(religionWeights)
    .map(([religion]) => religion)
    .filter((religion) => religion !== stateReligion)
    .slice(0, 6);
}

function inferCountryIdentity(assignment, popIdentityWeights, locationIdentities, validCultures, validReligions) {
  const weights = new Map();
  const religionWeights = new Map();
  for (const location of assignment.locations) addLocationIdentityWeights(location, weights, religionWeights, popIdentityWeights, locationIdentities);
  if (assignment.locations[0]) addLocationIdentityWeights(assignment.locations[0], weights, religionWeights, popIdentityWeights, locationIdentities, 3);
  const rankedCultures = rankedWeights(weights);
  const rankedReligions = rankedWeights(religionWeights);
  const capitalIdentity = locationIdentities.get(assignment.locations[0]);
  const celticIdentity = celticIdentityForAssignment(assignment);
  const override = historicalIdentityOverride(assignment.tag, validCultures, validReligions);
  const celticCulture = celticIdentity && validCultures.has(celticIdentity.id) ? celticIdentity.id : null;
  const celticReligion = celticIdentity && validReligions.has(celticIdentity.religion) ? celticIdentity.religion : null;
  const overrideCulture = celticCulture
    || (override.culture && ((weights.get(override.culture) || 0) > 0 || rankedCultures.length === 0)
    ? override.culture
    : null);
  const overrideReligion = celticReligion
    || (override.religion && ((religionWeights.get(override.religion) || 0) > 0 || rankedReligions.length === 0)
    ? override.religion
    : null);
  const primaryCulture = overrideCulture
    || rankedCultures.find(([culture]) => validCultures.has(culture))?.[0]
    || validOverride(capitalIdentity?.culture, validCultures)
    || "gaulish";
  const stateReligion = overrideReligion
    || rankedReligions.find(([religion]) => validReligions.has(religion))?.[0]
    || validOverride(capitalIdentity?.religion, validReligions)
    || "gaulish_pagan";
  const cultures = celticIdentity
    ? {
      accepted: orderedUnique([
        primaryCulture,
        validCultures.has(celticIdentity.genericCulture) ? celticIdentity.genericCulture : null,
      ].filter(Boolean)),
      tolerated: [],
    }
    : acceptedCulturesForCountry(primaryCulture, weights);
  const toleratedReligions = toleratedReligionsForCountry(stateReligion, religionWeights);
  const cultureTotal = sumWeights(weights);
  const religionTotal = sumWeights(religionWeights);
  const religiouslyCoveredWeight = (religionWeights.get(stateReligion) || 0)
    + toleratedReligions.reduce((sum, religion) => sum + (religionWeights.get(religion) || 0), 0);
  return {
    primaryCulture,
    stateReligion,
    accepted: cultures.accepted,
    tolerated: cultures.tolerated,
    toleratedReligions,
    cultureCoverage: cultureTotal > 0 ? cultures.accepted.reduce((sum, culture) => sum + (weights.get(culture) || 0), 0) / cultureTotal : 1,
    religionCoverage: religionTotal > 0 ? (religionWeights.get(stateReligion) || 0) / religionTotal : 1,
    religionStabilityCoverage: religionTotal > 0 ? religiouslyCoveredWeight / religionTotal : 1,
    rankedCultures,
    rankedReligions,
    overrideCulture: Boolean(overrideCulture),
    overrideReligion: Boolean(overrideReligion),
  };
}

function orderedUnique(values) {
  const seen = new Set();
  const out = [];
  for (const value of values) {
    if (seen.has(value)) continue;
    seen.add(value);
    out.push(value);
  }
  return out;
}

function parseLocationRegions() {
  const definitionsPath = findGameFile(paths.mapDefinitions);
  if (!definitionsPath) {
    throw new Error(`Could not find map definitions at ${paths.mapDefinitions}. Set EU5_GAME_DIR to the game folder if needed.`);
  }
  const text = fs.readFileSync(definitionsPath, "utf8").replace(/#.*$/gm, "");
  const locationRegions = new Map();
  const regionLocations = new Map();
  const regionRe = /([A-Za-z0-9_]+_region)\s*=\s*\{/g;
  let match;
  while ((match = regionRe.exec(text))) {
    const region = match[1];
    const open = text.indexOf("{", match.index);
    const close = findBlockEnd(text, open);
    if (close === -1) continue;
    const body = text.slice(open + 1, close);
    const locations = new Set();
    for (const province of body.matchAll(/([A-Za-z0-9_]+_province)\s*=\s*\{([^}]*)\}/g)) {
      for (const location of province[2].matchAll(/[A-Za-z0-9_]+/g)) {
        const name = location[0];
        locations.add(name);
        if (!locationRegions.has(name)) locationRegions.set(name, region);
      }
    }
    if (locations.size) regionLocations.set(region, locations);
    regionRe.lastIndex = close + 1;
  }
  return { definitionsPath, locationRegions, regionLocations };
}

function discoverRegionsForCountry(assignment, locationRegions) {
  return orderedUnique(assignment.locations.map((location) => locationRegions.get(location)).filter(Boolean)).sort();
}

function mergeAssignments(modified, original, validLocations) {
  const normalizedWarnings = [];
  const invalidLocations = [];
  const duplicateInsideTag = [];
  const duplicateConflicts = [];
  const sourceTagDuplicates = [];

  function cleanAssignment(assignment) {
    if (assignment.rawTag !== assignment.tag) normalizedWarnings.push(`${assignment.rawTag} -> ${assignment.tag}`);
    const seen = new Set();
    const locations = [];
    for (const location of assignment.locations) {
      if (!validLocations.has(location)) {
        invalidLocations.push(`${assignment.rawTag}: ${location}`);
        continue;
      }
      if (seen.has(location)) {
        duplicateInsideTag.push(`${assignment.rawTag}: ${location}`);
        continue;
      }
      seen.add(location);
      locations.push(location);
    }
    return { ...assignment, locations };
  }

  const cleanModified = modified.map(cleanAssignment);
  const cleanOriginal = original.map(cleanAssignment);
  const modifiedTags = new Set(cleanModified.map((assignment) => assignment.tag));
  const originalTags = new Set(cleanOriginal.map((assignment) => assignment.tag));

  const originalOnly = cleanOriginal.filter((assignment) => !modifiedTags.has(assignment.tag));
  const combined = [...cleanModified, ...originalOnly.map((assignment) => ({ ...assignment, source: "original_fallback" }))];

  const byTag = new Map();
  for (const assignment of combined) {
    if (byTag.has(assignment.tag)) {
      sourceTagDuplicates.push(`${assignment.tag}: kept later ${assignment.source}, discarded earlier ${byTag.get(assignment.tag).source}`);
    }
    byTag.set(assignment.tag, assignment);
  }

  const orderedAssignments = [...byTag.values()].sort((a, b) => {
    const sourceRank = (source) => (source === "modified" ? 0 : source === "manual" ? 1 : 2);
    return sourceRank(a.source) - sourceRank(b.source) || a.order - b.order || a.tag.localeCompare(b.tag);
  });

  const finalOwner = new Map();
  const finalPriority = new Map();
  for (const assignment of orderedAssignments) {
    const priority = assignment.source === "manual" ? 3 : assignment.source === "modified" ? 2 : 1;
    for (const location of assignment.locations) {
      if (finalOwner.has(location)) {
        const previous = finalOwner.get(location);
        const previousPriority = finalPriority.get(location);
        const keepNew = priority > previousPriority;
        if (keepNew) {
          duplicateConflicts.push(`${location}: ${previous} -> ${assignment.tag}`);
          finalOwner.set(location, assignment.tag);
          finalPriority.set(location, priority);
        } else {
          duplicateConflicts.push(`${location}: kept ${previous}, removed from ${assignment.tag}`);
        }
      } else {
        finalOwner.set(location, assignment.tag);
        finalPriority.set(location, priority);
      }
    }
  }

  const finalAssignments = orderedAssignments
    .map((assignment) => ({
      ...assignment,
      locations: assignment.locations.filter((location) => finalOwner.get(location) === assignment.tag),
    }))
    .filter((assignment) => assignment.locations.length > 0);

  const emptyTags = orderedAssignments.filter((assignment) => !finalAssignments.some((row) => row.tag === assignment.tag)).map((row) => row.tag);
  const modifiedTagSet = new Set(cleanModified.map((assignment) => assignment.tag));
  const originalTagSet = new Set(cleanOriginal.map((assignment) => assignment.tag));

  return {
    finalAssignments,
    invalidLocations,
    duplicateInsideTag,
    duplicateConflicts,
    sourceTagDuplicates,
    normalizedWarnings: orderedUnique(normalizedWarnings),
    newTags: finalAssignments.filter((assignment) => !originalTagSet.has(assignment.tag)).map((assignment) => assignment.tag),
    modifiedTags: finalAssignments.filter((assignment) => modifiedTagSet.has(assignment.tag) && originalTagSet.has(assignment.tag)).map((assignment) => assignment.tag),
    originalOnlyKept: finalAssignments.filter((assignment) => !modifiedTagSet.has(assignment.tag) && originalTagSet.has(assignment.tag)).map((assignment) => assignment.tag),
    emptyTags,
  };
}

function parseCountryEntries(text) {
  const entries = new Map();
  const re = /^\t([A-Z0-9_]+)\s*=\s*\{/gm;
  let match;
  while ((match = re.exec(text))) {
    const tag = match[1];
    const open = text.indexOf("{", match.index);
    const close = findBlockEnd(text, open);
    if (close === -1) continue;
    entries.set(tag, {
      tag,
      body: text.slice(open + 1, close).replace(/^\n/, "").replace(/\n\t$/, ""),
    });
  }
  return entries;
}

function formatLocationList(locations, indent = "\t\t\t") {
  const rows = [];
  for (let i = 0; i < locations.length; i += 8) {
    rows.push(`${indent}${locations.slice(i, i + 8).join(" ")}`);
  }
  return rows.join("\n");
}

function replaceScalar(body, key, value) {
  const re = new RegExp(`(^|\\n)(\\t\\t${key}\\s*=\\s*)[^\\n]+`);
  if (re.test(body)) return body.replace(re, `$1$2${value}`);
  return `\t\t${key} = ${value}\n\n${body}`;
}

function replaceScalarAfter(body, key, value, afterKey) {
  const re = new RegExp(`(^|\\n)(\\t\\t${key}\\s*=\\s*)[^\\n]+`);
  if (re.test(body)) return body.replace(re, `$1$2${value}`);
  const afterRe = new RegExp(`(^|\\n)(\\t\\t${afterKey}\\s*=\\s*[^\\n]+\\n?)`);
  const match = afterRe.exec(body);
  if (!match) return `\t\t${key} = ${value}\n\n${body}`;
  const insertAt = match.index + match[0].length;
  return `${body.slice(0, insertAt)}\t\t${key} = ${value}\n${body.slice(insertAt)}`;
}

function removeCountryProperty(body, key) {
  let text = body;
  const re = new RegExp(`(^|\\n)\\t\\t${key}\\s*=`);
  let match;
  while ((match = re.exec(text))) {
    const lineStart = match.index + (match[1] ? 1 : 0);
    const equals = text.indexOf("=", lineStart);
    let valueStart = equals + 1;
    while (/\s/.test(text[valueStart] || "")) valueStart += 1;
    let end;
    if (text[valueStart] === "{") {
      const close = findBlockEnd(text, valueStart);
      end = close === -1 ? text.indexOf("\n", lineStart) : close + 1;
    } else {
      end = text.indexOf("\n", lineStart);
    }
    if (end === -1) end = text.length;
    if (text[end] === "\r") end += 1;
    if (text[end] === "\n") end += 1;
    text = text.slice(0, lineStart) + text.slice(end);
  }
  return text.replace(/\n{3,}/g, "\n\n");
}

function replaceOwnControlCore(body, locations) {
  const block = `\t\town_control_core = {\n${formatLocationList(locations)}\n\t\t}`;
  const re = /(^|\n)\t\town_control_core\s*=\s*\{/;
  const match = re.exec(body);
  if (!match) return `${body.replace(/\s*$/, "")}\n\n${block}`;
  const open = body.indexOf("{", match.index);
  const close = findBlockEnd(body, open);
  return `${body.slice(0, match.index)}${match[1] || ""}${block}${body.slice(close + 1)}`;
}

function ensureLineBlock(body, key, values) {
  const line = `\t\t${key} = { ${values.join(" ")} }`;
  const re = new RegExp(`(^|\\n)\\t\\t${key}\\s*=\\s*\\{[^}]*\\}`);
  if (re.test(body)) return body.replace(re, `$1${line}`);
  return `${body.replace(/\s*$/, "")}\n${line}`;
}

function ensureMultilineWordBlock(body, key, values) {
  const cleanValues = orderedUnique(values).filter(Boolean);
  const blockLines = [`\t\t${key} = {`];
  if (cleanValues.length) {
    for (let i = 0; i < cleanValues.length; i += 4) {
      blockLines.push(`\t\t\t${cleanValues.slice(i, i + 4).join(" ")}`);
    }
  }
  blockLines.push("\t\t}");
  const block = blockLines.join("\n");
  const re = new RegExp(`(^|\\n)\\t\\t${key}\\s*=\\s*\\{`);
  const match = re.exec(body);
  if (!match) return `${body.replace(/\s*$/, "")}\n${block}`;
  const open = body.indexOf("{", match.index);
  const close = findBlockEnd(body, open);
  return `${body.slice(0, match.index)}${match[1] || ""}${block}${body.slice(close + 1)}`;
}

function ensureGovernment(body) {
  if (/(^|\n)\t\tgovernment\s*=\s*\{/.test(body)) return body;
  return `${body.replace(/\s*$/, "")}\n\t\tgovernment = {\n\t\t\truler = random\n\t\t}`;
}

function titleFromTag(tag) {
  const overrides = new Map([
    ["0001G", "Mycenae"],
    ["0002G", "Egypt"],
    ["HATTI", "Hatti"],
    ["ABRIN", "Abrincates"],
    ["ACHAE", "Achaea"],
    ["ACHAEA", "Achaea"],
    ["AEDUI", "Aedui"],
    ["AEQUI", "Aequi"],
    ["AGRIA", "Agrianes"],
    ["ALASI", "Alashiya"],
    ["ALLOB", "Allobroges"],
    ["ALMOP", "Almopians"],
    ["ALZIY", "Alziya"],
    ["AMBAR", "Ambarres"],
    ["AMURU", "Amurru"],
    ["ANDES", "Andes"],
    ["ARAX", "Araxes"],
    ["ARDIA", "Ardiaioi"],
    ["ARGAR", "El Argar"],
    ["ARVER", "Arvernes"],
    ["ARWAD", "Arwad"],
    ["ASYRI", "Assyria"],
    ["ATHEN", "Athens"],
    ["ATHENS", "Athens"],
    ["AZZI", "Azzi"],
    ["BAIOC", "Baiocasses"],
    ["BALES", "Balearic Isles"],
    ["BALSA", "Balsa"],
    ["BERIT", "Berit"],
    ["BITUR", "Bituriges"],
    ["BOLI", "Boii"],
    ["BOLI1", "Cisalpine Boii"],
    ["BOSPH", "Thracian Bosporus"],
    ["BOTTI", "Bottiaea"],
    ["BOULI", "Boulinoi"],
    ["BYBLO", "Byblos"],
    ["CALET", "Caletes"],
    ["CAMUN", "Camunic"],
    ["CAONI", "Chaonia"],
    ["CARNI", "Carnian"],
    ["CARTI", "Carteia"],
    ["CORIO", "Coriosolites"],
    ["DAESI", "Daesitian"],
    ["DARDN", "Dardanians"],
    ["DERRN", "Derrones"],
    ["DIMUN", "Dilmun"],
    ["DOBER", "Doberes"],
    ["DOLOP", "Dolopia"],
    ["ELAM", "Elam"],
    ["ELIMI", "Elimi"],
    ["ELMIT", "Elimiotis"],
    ["ELYMI", "Elymians"],
    ["ESUVI", "Esuvien"],
    ["ETRUS", "Etruria"],
    ["FALIS", "Faliscan"],
    ["GABAL", "Gabales"],
    ["GETAE", "Getae"],
    ["HABIR", "Habiru"],
    ["HAJAS", "Hayasa"],
    ["HAPAL", "Hapalla"],
    ["HELVE", "Helvetii"],
    ["HIERA", "Hierastamnoi"],
    ["HISTI", "Histrian"],
    ["HYLLO", "Hylloi"],
    ["IAPYG", "Iapygia"],
    ["IOLC", "Iolcus"],
    ["IOLCUS", "Iolcus"],
    ["IONIA", "Ionia"],
    ["INSUB", "Insubres"],
    ["KARKA", "Karkamissa"],
    ["KASKA", "Kaska"],
    ["KASSI", "Kassites"],
    ["KUWAL", "Kuwal"],
    ["LAEAE", "Laeaeans"],
    ["LATIN", "Latins"],
    ["LAZPA", "Lazpa"],
    ["LEPON", "Lepontic"],
    ["LEXOV", "Lexoviens"],
    ["LIBUR", "Liburnian"],
    ["LIBYA", "Libya"],
    ["LIGUR", "Ligurian"],
    ["LUKKA", "Lukka"],
    ["MAGAN", "Magan"],
    ["MALAK", "Malaka"],
    ["MANIO", "Manioi"],
    ["MANNA", "Mannaea"],
    ["MARSI", "Marsian"],
    ["MASA", "Masa"],
    ["MIRA", "Mira"],
    ["MITAN", "Mitanni"],
    ["MOESI", "Moesia"],
    ["MOLOS", "Molossia"],
    ["NAMNE", "Namnetes"],
    ["NESTI", "Nestioi"],
    ["NPICE", "North Picene"],
    ["NORIC", "Norici"],
    ["NURAG", "Nuragic Sardinia"],
    ["OENOT", "Oenotrian"],
    ["ORCHO", "Orchomenus"],
    ["ORCHOMENUS", "Orchomenus"],
    ["OSCAN", "Osci"],
    ["OSISM", "Osismes"],
    ["PAEON", "Paeonia"],
    ["PAEOP", "Paeoplae"],
    ["PAGON", "Pagonia"],
    ["PALA", "Pala"],
    ["PARTH", "Partha"],
    ["PICTO", "Picton"],
    ["POTUL", "Potulatensis"],
    ["PYLOS", "Pylos"],
    ["RAETI", "Raetic"],
    ["REDON", "Redones"],
    ["RHODE", "Rhodes"],
    ["RHODES", "Rhodes"],
    ["RUTEN", "Rutenes"],
    ["SAHIR", "Sahiriya"],
    ["SALLU", "Salluviens"],
    ["SANTN", "Santans"],
    ["SASU", "Sasu"],
    ["SCORD", "Scordiscian"],
    ["SCYTH", "Scythians"],
    ["SENOM", "Senomes"],
    ["SENON", "Senonian"],
    ["SEHA", "Seha River Land"],
    ["SEGUS", "Segusiaves"],
    ["SEQUA", "Sequances"],
    ["SICAN", "Sicania"],
    ["SICEL", "Sicels"],
    ["SIBUZ", "Sibuzates"],
    ["SIDON", "Sidon"],
    ["SIROP", "Siropaines"],
    ["SOTIA", "Sotiates"],
    ["SPART", "Sparta"],
    ["SPICE", "South Picene"],
    ["SPARTA", "Sparta"],
    ["SURRT", "Surrtenia"],
    ["SUTU", "Sutu"],
    ["TARAN", "Tarantine"],
    ["TARDL", "Tardelle"],
    ["TARTS", "Tartessos"],
    ["TAULA", "Taulantioi"],
    ["TAURI", "Tauriscian"],
    ["TESPR", "Thesprotia"],
    ["THEBE", "Thebes"],
    ["THEBES", "Thebes"],
    ["THRAC", "Thrace"],
    ["TORRI", "Torrean Corsica"],
    ["UGART", "Ugarit"],
    ["ULIBA", "Uliba"],
    ["UMBRI", "Umbrian"],
    ["UNELL", "Unelles"],
    ["URATU", "Urartu"],
    ["VASAT", "Vasates"],
    ["VENET", "Venetic"],
    ["VENES", "Venetes"],
    ["VESTI", "Vestinian"],
    ["VELIO", "Veliocasses"],
    ["VELLA", "Vellaves"],
    ["VIDUC", "Viducasses"],
    ["VOCAN", "Vocances"],
    ["VOLAR", "Volques Arecomiques"],
    ["VOLTE", "Volques Tectosages"],
    ["VOLSC", "Volscian"],
    ["WALAN", "Walan"],
    ["WILUS", "Wilusa"],
  ]);
  if (overrides.has(tag)) return overrides.get(tag);
  if (dynamicTagNames.has(tag)) return dynamicTagNames.get(tag);
  if (localizedNameForTag(tag)) return localizedNameForTag(tag);
  return tag
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function adjectiveFromName(name) {
  const clean = name.trim();
  const overrides = new Map([
    ["Bituriges Cubi", "Biturigan"],
    ["Aulerci Cenomani", "Aulercian"],
    ["Aulerci Diablintes", "Aulercian"],
    ["Turduli Budani", "Turdulian"],
    ["Turduli Diponi", "Turdulian"],
    ["Turduli Sosiponi", "Turdulian"],
    ["Turduli Artigi", "Turdulian"],
    ["Turduli Veteres", "Turdulian"],
  ]);
  if (overrides.has(clean)) return overrides.get(clean);
  if (clean.includes(" ")) return adjectiveFromName(clean.split(/\s+/)[0]);
  if (/iges$/i.test(clean)) return `${clean.slice(0, -4)}igan`;
  if (/ci$/i.test(clean)) return `${clean}an`;
  if (/ii$/i.test(clean)) return `${clean.slice(0, -2)}ian`;
  if (/i$/i.test(clean)) return `${clean}an`;
  if (/es$/i.test(clean)) return `${clean.slice(0, -2)}ian`;
  if (/(ian|ean|ic|ite|an|n)$/i.test(clean)) return clean;
  return `${clean}ian`;
}

function adjectiveFromTag(tag, fallbackName) {
  const overrides = new Map([
    ["0001G", "Mycenaean"], ["0002G", "Egyptian"], ["HATTI", "Hittite"],
    ["ABRIN", "Abrincatian"], ["ACHAE", "Achaean"], ["ACHAEA", "Achaean"],
    ["AEDUI", "Aeduan"], ["AEQUI", "Aequian"],
    ["AGRIA", "Agrianian"], ["ALASI", "Alashiyan"], ["ALMOP", "Almopian"],
    ["ALLOB", "Allobrogian"], ["ALZIY", "Alziyan"], ["AMBAR", "Ambarrian"],
    ["AMURU", "Amurrite"], ["ANDES", "Andean"], ["ARAX", "Araxian"],
    ["ARDIA", "Ardiaean"], ["ARGAR", "Argaric"], ["ARVER", "Arvernian"],
    ["ARWAD", "Arwadian"], ["ASYRI", "Assyrian"], ["ATHEN", "Athenian"], ["ATHENS", "Athenian"], ["AZZI", "Azzian"],
    ["BAIOC", "Baiocassian"], ["BALES", "Balearic"],
    ["BALSA", "Balsan"], ["BERIT", "Beritian"], ["BITUR", "Biturigan"], ["BOLI", "Boian"], ["BOLI1", "Boian"],
    ["BOSPH", "Bosphoran"], ["BOTTI", "Bottiaean"], ["BOULI", "Boulinian"],
    ["BYBLO", "Byblian"], ["CALET", "Caletian"], ["CAMUN", "Camunnian"], ["CAONI", "Chaonian"],
    ["CARNI", "Carnian"], ["CARTI", "Carteian"], ["CORIO", "Coriosolitian"], ["DAESI", "Daesitiate"],
    ["DARDN", "Dardanian"], ["DERRN", "Derronian"], ["DIMUN", "Dilmunite"],
    ["DOBER", "Doberian"], ["DOLOP", "Dolopian"], ["ELAM", "Elamite"],
    ["ELIMI", "Elimian"], ["ELMIT", "Elimiote"], ["ELYMI", "Elymian"],
    ["ESUVI", "Esuvian"], ["ETRUS", "Etruscan"], ["FALIS", "Faliscan"],
    ["GABAL", "Gabalian"], ["GETAE", "Getic"],
    ["HABIR", "Habiru"], ["HAJAS", "Hayasan"], ["HAPAL", "Hapallan"],
    ["HELVE", "Helvetian"], ["HIERA", "Hierastamnian"], ["HISTI", "Histrian"],
    ["HYLLO", "Hyllian"], ["IAPYG", "Iapygian"], ["IOLC", "Iolcian"], ["IOLCUS", "Iolcian"], ["IONIA", "Ionian"],
    ["INSUB", "Insubrian"], ["KARKA", "Karkamissan"], ["KASKA", "Kaskan"],
    ["KASSI", "Kassite"], ["KUWAL", "Kuwalian"], ["LAEAE", "Laeaean"],
    ["LATIN", "Latin"], ["LAZPA", "Lazpan"], ["LEPON", "Lepontic"], ["LEXOV", "Lexovian"],
    ["LIBUR", "Liburnian"], ["LIBYA", "Libyan"], ["LIGUR", "Ligurian"],
    ["LUKKA", "Lukkan"], ["MAGAN", "Maganite"], ["MALAK", "Malakan"],
    ["MANIO", "Manian"], ["MANNA", "Mannaean"], ["MARSI", "Marsian"],
    ["MASA", "Masan"], ["MIRA", "Miran"], ["MITAN", "Mitannian"],
    ["MOESI", "Moesian"], ["MOLOS", "Molossian"], ["NAMNE", "Namnetian"], ["NESTI", "Nestian"],
    ["NPICE", "North Picene"], ["NORIC", "Noric"], ["NURAG", "Nuragic"],
    ["OENOT", "Oenotrian"], ["ORCHO", "Orchomenian"], ["ORCHOMENUS", "Orchomenian"], ["OSCAN", "Oscan"], ["OSISM", "Osismian"], ["PAEON", "Paeonian"],
    ["PAEOP", "Paeoplaean"], ["PAGON", "Pagonian"], ["PALA", "Palaic"],
    ["PARTH", "Parthan"], ["PICTO", "Pictonian"], ["POTUL", "Potulatensian"], ["PYLOS", "Pylian"], ["RAETI", "Raetian"],
    ["REDON", "Redonian"], ["RHODE", "Rhodian"], ["RHODES", "Rhodian"], ["RUTEN", "Rutenian"], ["SAHIR", "Sahiriyan"],
    ["SALLU", "Salluvian"], ["SANTN", "Santanian"], ["SASU", "Sasuan"], ["SCORD", "Scordiscian"],
    ["SCYTH", "Scythian"], ["SEHA", "Sehan"], ["SEGUS", "Segusiavian"], ["SENOM", "Senomanian"],
    ["SENON", "Senonian"], ["SEQUA", "Sequanian"], ["SIBUZ", "Sibuzatian"], ["SICAN", "Sicanian"], ["SICEL", "Sicel"], ["SIDON", "Sidonian"], 
    ["SIROP", "Siropainian"], ["SOTIA", "Sotiatian"], ["SPART", "Spartan"], ["SPARTA", "Spartan"], ["SPICE", "South Picene"], ["SURRT", "Surrtenian"],
    ["SUTU", "Sutuan"], ["TARAN", "Tarantine"], ["TARDL", "Tardellian"], ["TARTS", "Tartessian"],
    ["TAULA", "Taulantian"], ["TAURI", "Tauriscian"], ["TESPR", "Thesprotian"], ["THEBE", "Theban"], ["THEBES", "Theban"],
    ["THRAC", "Thracian"], ["TORRI", "Torrean"],
    ["UGART", "Ugaritic"], ["ULIBA", "Uliban"], ["UMBRI", "Umbrian"],
    ["UNELL", "Unellian"], ["URATU", "Urartian"], ["VASAT", "Vasatian"],
    ["VENET", "Venetic"], ["VENES", "Venetic"], ["VELIO", "Veliocassian"],
    ["VELLA", "Vellavian"], ["VESTI", "Vestinian"], ["VIDUC", "Viducassian"],
    ["VOCAN", "Vocontian"], ["VOLAR", "Arecomic"], ["VOLTE", "Tectosagian"],
    ["VOLSC", "Volscian"], ["WALAN", "Walan"], ["WILUS", "Wilusan"],
  ]);
  return overrides.get(tag) || dynamicTagAdjectives.get(tag) || adjectiveFromName(fallbackName);
}

function buildCountryBody(assignment, existingBody, identity, discoveredRegions) {
  let body = existingBody || "";
  if (!body.trim()) {
    body = [
      `\t\tcapital = ${assignment.locations[0]}`,
      `\t\tculture = ${identity.primaryCulture}`,
      `\t\treligion = ${identity.stateReligion}`,
      "",
      "\t\tdiscovered_regions = {",
      ...discoveredRegions.map((region) => `\t\t\t${region}`),
      "\t\t}",
      "",
      "\t\tcountry_rank = rank_kingdom",
      "",
      "\t\tinclude = \"catholic_monarchy_not_present\"",
      "",
      "\t\tgovernment = {",
      "\t\t\truler = random",
      "\t\t}",
    ].join("\n");
  }
  body = removeCountryProperty(body, "primary_culture");
  body = removeCountryProperty(body, "state_religion");
  body = removeCountryProperty(body, "tolerated_religions");
  if (celticIdentityForAssignment(assignment)) {
    body = replaceScalar(body, "country_rank", "rank_county");
    body = replaceScalar(body, "include", "\"Neolithic\"");
  }
  body = replaceScalar(body, "capital", assignment.locations[0]);
  body = replaceScalarAfter(body, "culture", identity.primaryCulture, "capital");
  body = replaceScalarAfter(body, "religion", identity.stateReligion, "culture");
  body = ensureMultilineWordBlock(body, "discovered_regions", discoveredRegions);
  body = replaceOwnControlCore(body, assignment.locations);
  body = ensureGovernment(body);
  body = ensureLineBlock(body, "accepted_cultures", identity.accepted);
  body = ensureLineBlock(body, "tolerated_cultures", identity.tolerated);
  return body.replace(/\n{3,}/g, "\n\n");
}

function buildCountryIdentities(finalAssignments, popIdentityWeights, locationIdentities, validCultures, validReligions) {
  const identityByTag = new Map();
  for (const assignment of finalAssignments) {
    identityByTag.set(assignment.tag, inferCountryIdentity(assignment, popIdentityWeights, locationIdentities, validCultures, validReligions));
  }
  return identityByTag;
}

function buildCountryExploration(finalAssignments, locationRegions) {
  const explorationByTag = new Map();
  for (const assignment of finalAssignments) {
    explorationByTag.set(assignment.tag, discoverRegionsForCountry(assignment, locationRegions));
  }
  return explorationByTag;
}

function writeCountries(finalAssignments, identityByTag, explorationByTag) {
  const current = readText(paths.countries);
  const existing = parseCountryEntries(current);
  const finalTags = new Set(finalAssignments.map((assignment) => assignment.tag));
  const currentTags = [...existing.keys()];
  const obsoleteTags = currentTags.filter((tag) => !finalTags.has(tag));
  const addedTags = finalAssignments.filter((assignment) => !existing.has(assignment.tag)).map((assignment) => assignment.tag);
  const updatedTags = finalAssignments.filter((assignment) => existing.has(assignment.tag)).map((assignment) => assignment.tag);

  const lines = [
    "current_age = age_1_traditions",
    "",
    "# own_control_core",
    "# own_control_integrated",
    "# own_control_conquered",
    "# own_control_colony",
    "# own_core",
    "# own_conquered",
    "# own_integrated",
    "# own_colony",
    "# control_core",
    "# control",
    "# our_cores_conquered_by_others",
    "",
    "countries = {",
    "\tcountries = {",
    "",
  ];

  for (const assignment of finalAssignments) {
    const displayName = titleFromTag(assignment.tag).toUpperCase();
    lines.push(`\t##${displayName}`);
    lines.push(`\t${assignment.tag} = {`);
    lines.push(buildCountryBody(assignment, existing.get(assignment.tag)?.body, identityByTag.get(assignment.tag), explorationByTag.get(assignment.tag) || []));
    lines.push("\t}");
    lines.push("");
  }

  lines.push("\t}");
  lines.push("}");
  lines.push("");
  writeText(paths.countries, lines.join("\n"));
  return { addedTags, updatedTags, obsoleteTags };
}

function upsertDefaultCountryBlocks(finalAssignments, obsoleteTags) {
  let text = readText(paths.defaultCountries);
  for (const tag of obsoleteTags) text = removeTopLevelBlock(text, tag);
  for (const assignment of finalAssignments) {
    const block = `${assignment.tag} = {\n\tcolor = rgb { ${assignment.color.join(" ")} }\n\tcolor2 = rgb { 110 27 27 }\n}\n`;
    text = upsertTopLevelBlock(text, assignment.tag, block);
  }
  writeText(paths.defaultCountries, text);
}

function upsertTopLevelBlock(text, key, block) {
  const re = new RegExp(`(?:^|\\n)${key}\\s*=\\s*\\{`);
  const match = re.exec(text);
  if (!match) return `${text.replace(/\s*$/, "\n")}${block}`;
  const start = match.index + (text[match.index] === "\n" ? 1 : 0);
  const open = text.indexOf("{", start);
  const close = findBlockEnd(text, open);
  return `${text.slice(0, start)}${block}${text.slice(close + 2)}`;
}

function removeTopLevelBlock(text, key) {
  const re = new RegExp(`(?:^|\\n)${key}\\s*=\\s*\\{`);
  const match = re.exec(text);
  if (!match) return text;
  const start = match.index + (text[match.index] === "\n" ? 1 : 0);
  const open = text.indexOf("{", start);
  const close = findBlockEnd(text, open);
  return `${text.slice(0, start)}${text.slice(close + 2)}`.replace(/\n{3,}/g, "\n\n");
}

function normalizeLocalizationHeader(text) {
  const body = text
    .split("\n")
    .filter((line) => !/^(?:\uFEFF)?l_english:\s*$/.test(line))
    .join("\n")
    .replace(/^\s*\n/, "");
  return `l_english:\n${body}`;
}

function upsertLocalization(finalAssignments, obsoleteTags) {
  let text = normalizeLocalizationHeader(readFirstExisting(paths.localizationFiles, "l_english:\n"));
  for (const tag of obsoleteTags) {
    text = text.replace(new RegExp(`^ ${tag}: .*\\n?`, "m"), "");
    text = text.replace(new RegExp(`^ ${tag}_ADJ: .*\\n?`, "m"), "");
  }
  for (const assignment of finalAssignments) {
    const name = titleFromTag(assignment.tag);
    const adjective = adjectiveFromTag(assignment.tag, name);
    const nameLine = ` ${assignment.tag}: "${name}"`;
    const adjLine = ` ${assignment.tag}_ADJ: "${adjective}"`;
    const nameRe = new RegExp(`^ ${assignment.tag}: .*$`, "m");
    const adjRe = new RegExp(`^ ${assignment.tag}_ADJ: .*$`, "m");
    text = nameRe.test(text) ? text.replace(nameRe, nameLine) : `${text.replace(/\s*$/, "\n")}${nameLine}\n`;
    text = adjRe.test(text) ? text.replace(adjRe, adjLine) : `${text.replace(/\s*$/, "\n")}${adjLine}\n`;
  }
  for (const rel of paths.localizationFiles) writeText(rel, text);
}

function writeNormalizedPainter(finalAssignments) {
  const lines = [
    "# Generated by Bronze Era country integration pass.",
    "# Modified Location Painter assignments are source of truth; duplicate ownership has been normalized.",
    "",
    "location_painter_assignments = {",
  ];
  for (const assignment of finalAssignments) {
    lines.push(`    ${assignment.tag} = {`);
    lines.push(`        color = { ${assignment.color.join(" ")} }`);
    lines.push("        locations = {");
    for (const location of assignment.locations) lines.push(`            ${location}`);
    lines.push("        }");
    lines.push("    }");
  }
  lines.push("}");
  lines.push("");
  writeText(paths.normalizedPainter, lines.join("\n"));
}

function celticLocationTargets(finalAssignments, validCultures, validReligions) {
  const targets = new Map();
  for (const assignment of finalAssignments) {
    const info = celticIdentityForAssignment(assignment);
    if (!info) continue;
    if (!validCultures.has(info.id) || !validReligions.has(info.religion)) continue;
    for (const location of assignment.locations) targets.set(location, info);
  }
  return targets;
}

function updateCelticPopsAndTemplates(finalAssignments, validCultures, validReligions) {
  const targets = celticLocationTargets(finalAssignments, validCultures, validReligions);
  if (!targets.size) return { popLocations: 0, templateLocations: 0 };

  let popText = readText(paths.pops);
  let popUpdates = 0;
  const popRe = /^([A-Za-z0-9_]+)\s*=\s*\{/gm;
  let popMatch;
  const popEdits = [];
  while ((popMatch = popRe.exec(popText))) {
    const location = popMatch[1];
    const target = targets.get(location);
    if (!target) continue;
    const open = popText.indexOf("{", popMatch.index);
    const close = findBlockEnd(popText, open);
    if (close === -1) continue;
    const body = popText
      .slice(open + 1, close)
      .replace(/\bculture\s*=\s*[A-Za-z0-9_]+/g, `culture = ${target.id}`)
      .replace(/\breligion\s*=\s*[A-Za-z0-9_]+/g, `religion = ${target.religion}`);
    popEdits.push([open + 1, close, body]);
    popUpdates += 1;
    popRe.lastIndex = close + 1;
  }
  for (const [start, end, body] of popEdits.reverse()) {
    popText = `${popText.slice(0, start)}${body}${popText.slice(end)}`;
  }
  writeText(paths.pops, popText);

  let templateText = readText(paths.locationTemplates);
  let templateUpdates = 0;
  const lines = templateText.split("\n");
  for (let i = 0; i < lines.length; i += 1) {
    const match = /^([A-Za-z0-9_]+)\s*=\s*\{/.exec(lines[i]);
    if (!match) continue;
    const target = targets.get(match[1]);
    if (!target) continue;
    lines[i] = lines[i]
      .replace(/\bculture\s*=\s*[A-Za-z0-9_]+/, `culture = ${target.id}`)
      .replace(/\breligion\s*=\s*[A-Za-z0-9_]+/, `religion = ${target.religion}`);
    templateUpdates += 1;
  }
  templateText = lines.join("\n");
  writeText(paths.locationTemplates, templateText);
  return { popLocations: popUpdates, templateLocations: templateUpdates };
}

function normalizeInternationalOrganizationTags() {
  if (!fs.existsSync(abs(paths.internationalOrganizations))) return 0;
  let text = readText(paths.internationalOrganizations);
  let count = 0;
  for (const [from, to] of greekTagReplacements.entries()) {
    const re = new RegExp(`\\b${from}\\b`, "g");
    text = text.replace(re, () => {
      count += 1;
      return to;
    });
  }
  writeText(paths.internationalOrganizations, text);
  return count;
}

function writeFinalSetupReviewFile(finalAssignments, identityByTag, explorationByTag) {
  const lines = [
    "# Final merged Bronze Era ownership setup generated from Location Painter assignments.",
    "# This review file keeps painter colors beside own_control_core blocks.",
    "",
  ];
  for (const assignment of finalAssignments) {
    const identity = identityByTag.get(assignment.tag);
    lines.push(`${assignment.tag} = {`);
    lines.push(`    color = { ${assignment.color.join(" ")} }`);
    lines.push(`    culture = ${identity.primaryCulture}`);
    lines.push(`    religion = ${identity.stateReligion}`);
    lines.push(`    discovered_regions = { ${(explorationByTag.get(assignment.tag) || []).join(" ")} }`);
    lines.push("");
    lines.push("    own_control_core = {");
    for (const location of assignment.locations) lines.push(`        ${location}`);
    lines.push("    }");
    lines.push("}");
    lines.push("");
  }
  writeText(reportPaths.finalSetup, lines.join("\n"));
}

function formatCoverage(value) {
  return `${Math.round(value * 1000) / 10}%`;
}

function writeIdentityReport(finalAssignments, identityByTag, validCultures, validReligions) {
  const missingIdentity = [];
  const invalidIdentity = [];
  const lowCultureCoverage = [];
  const lowReligionCoverage = [];
  const detailLines = [
    "Bronze Era country stability and identity report",
    "================================================",
    "",
    "Every final country should have a capital, culture, religion, accepted_cultures, and tolerated_cultures.",
    "",
  ];
  for (const assignment of finalAssignments) {
    const identity = identityByTag.get(assignment.tag);
    if (!identity?.primaryCulture || !identity?.stateReligion) missingIdentity.push(assignment.tag);
    if (identity?.primaryCulture && !validCultures.has(identity.primaryCulture)) invalidIdentity.push(`${assignment.tag}: invalid culture ${identity.primaryCulture}`);
    if (identity?.stateReligion && !validReligions.has(identity.stateReligion)) invalidIdentity.push(`${assignment.tag}: invalid religion ${identity.stateReligion}`);
    for (const religion of identity?.toleratedReligions || []) {
      if (!validReligions.has(religion)) invalidIdentity.push(`${assignment.tag}: invalid tolerated religion ${religion}`);
    }
    if (identity?.cultureCoverage < 0.7) lowCultureCoverage.push(`${assignment.tag}: ${formatCoverage(identity.cultureCoverage)}`);
    if (identity?.religionStabilityCoverage < 0.7) lowReligionCoverage.push(`${assignment.tag}: ${formatCoverage(identity.religionStabilityCoverage)}`);
    const cultureRank = identity.rankedCultures.slice(0, 5).map(([key, value]) => `${key}:${Math.round(value * 100) / 100}`).join(" ");
    const religionRank = identity.rankedReligions.slice(0, 5).map(([key, value]) => `${key}:${Math.round(value * 100) / 100}`).join(" ");
    detailLines.push(`${assignment.tag} (${titleFromTag(assignment.tag)})`);
    detailLines.push(`- culture: ${identity.primaryCulture}${identity.overrideCulture ? " (historical override)" : ""}`);
    detailLines.push(`- religion: ${identity.stateReligion}${identity.overrideReligion ? " (historical override)" : ""}`);
    detailLines.push(`- accepted_cultures: ${identity.accepted.join(" ") || "none"}`);
    detailLines.push(`- tolerated_cultures: ${identity.tolerated.join(" ") || "none"}`);
    detailLines.push(`- religion stability candidates: ${identity.toleratedReligions.join(" ") || "none"}`);
    detailLines.push(`- accepted culture coverage: ${formatCoverage(identity.cultureCoverage)}`);
    detailLines.push(`- state religion coverage: ${formatCoverage(identity.religionCoverage)}`);
    detailLines.push(`- religion stability coverage: ${formatCoverage(identity.religionStabilityCoverage)}`);
    detailLines.push(`- culture weights: ${cultureRank || "none"}`);
    detailLines.push(`- religion weights: ${religionRank || "none"}`);
    detailLines.push("");
  }
  const lines = [
    ...detailLines.slice(0, 4),
    `Countries checked: ${finalAssignments.length}`,
    `Missing identity entries: ${missingIdentity.length}`,
    `Invalid identity references: ${invalidIdentity.length}`,
    `Low accepted-culture coverage warnings: ${lowCultureCoverage.length}`,
    `Low religion-stability coverage warnings: ${lowReligionCoverage.length}`,
    "",
    ...detailLines.slice(4),
  ];
  lines.push("Validation summary:");
  lines.push(`- missing identity: ${missingIdentity.length ? missingIdentity.join(" ") : "none"}`);
  lines.push(`- invalid references: ${invalidIdentity.length ? invalidIdentity.join("; ") : "none"}`);
  lines.push(`- low accepted-culture coverage: ${lowCultureCoverage.length ? lowCultureCoverage.join("; ") : "none"}`);
  lines.push(`- low religion-stability coverage: ${lowReligionCoverage.length ? lowReligionCoverage.join("; ") : "none"}`);
  lines.push("");
  writeText(reportPaths.identityReport, lines.join("\n"));
  return { missingIdentity, invalidIdentity, lowCultureCoverage, lowReligionCoverage };
}

function writeExplorationReport(finalAssignments, explorationByTag, locationRegions, definitionsPath) {
  const missingCountries = [];
  const unmappedLocations = [];
  const lines = [
    "Bronze Era country explored regions report",
    "==========================================",
    "",
    `Map definitions source: ${definitionsPath}`,
    `Countries checked: ${finalAssignments.length}`,
    "",
  ];
  for (const assignment of finalAssignments) {
    const regions = explorationByTag.get(assignment.tag) || [];
    if (!regions.length) missingCountries.push(assignment.tag);
    for (const location of assignment.locations) {
      if (!locationRegions.has(location)) unmappedLocations.push(`${assignment.tag}: ${location}`);
    }
    lines.push(`${assignment.tag} (${titleFromTag(assignment.tag)})`);
    lines.push(`- discovered_regions: ${regions.join(" ") || "none"}`);
    lines.push("");
  }
  lines.push("Validation summary:");
  lines.push(`- countries without discovered_regions: ${missingCountries.length ? missingCountries.join(" ") : "none"}`);
  lines.push(`- owned locations not mapped to a region: ${unmappedLocations.length ? unmappedLocations.join("; ") : "none"}`);
  lines.push("");
  writeText(reportPaths.explorationReport, lines.join("\n"));
  return { missingCountries, unmappedLocations };
}

function writeReports(merge, countryStats, finalAssignments, originalAssignments, modifiedAssignments, identityStats, explorationStats) {
  const finalTags = new Set(finalAssignments.map((assignment) => assignment.tag));
  const originalTags = new Set(originalAssignments.map((assignment) => normalizeTag(assignment.rawTag)));
  const modifiedTags = new Set(modifiedAssignments.map((assignment) => normalizeTag(assignment.rawTag)));
  const originalByTag = new Map(originalAssignments.map((assignment) => [normalizeTag(assignment.rawTag), assignment]));
  const modifiedByTag = new Map(modifiedAssignments.map((assignment) => [normalizeTag(assignment.rawTag), assignment]));
  const changedTags = [...modifiedTags]
    .filter((tag) => originalByTag.has(tag))
    .filter((tag) => {
      const oldAssignment = originalByTag.get(tag);
      const newAssignment = modifiedByTag.get(tag);
      return oldAssignment.color.join(" ") !== newAssignment.color.join(" ")
        || orderedUnique(oldAssignment.locations).join(" ") !== orderedUnique(newAssignment.locations).join(" ");
    })
    .sort();
  const unchangedTags = [...modifiedTags].filter((tag) => originalByTag.has(tag) && !changedTags.includes(tag)).sort();
  const removedObsolete = countryStats.obsoleteTags.filter((tag) => !finalTags.has(tag));
  const newlyCreated = merge.newTags;
  const newlyInsertedThisRun = countryStats.addedTags;
  const removedOriginalOnly = [...originalTags].filter((tag) => !modifiedTags.has(tag) && !finalTags.has(tag));
  const uniqueLocations = new Set(finalAssignments.flatMap((assignment) => assignment.locations));

  writeText(reportPaths.conflictLog, [
    "Bronze Era country integration conflict log",
    "===========================================",
    "",
    `Modified assignment tags read: ${modifiedAssignments.length}`,
    `Original assignment tags read: ${originalAssignments.length}`,
    `Final assignment tags written: ${finalAssignments.length}`,
    `Unique owned locations written: ${uniqueLocations.size}`,
    "",
    "Comparison summary:",
    `- new tags in modified source: ${newlyCreated.length}`,
    `- modified existing tags: ${changedTags.length}`,
    `- unchanged existing tags: ${unchangedTags.length}`,
    `- removed tags from original source: ${removedOriginalOnly.length}`,
    "",
    "Modified existing tags:",
    changedTags.length ? changedTags.join(" ") : "none",
    "",
    "Normalized tags:",
    merge.normalizedWarnings.length ? merge.normalizedWarnings.map((line) => `- ${line}`).join("\n") : "- none",
    "",
    "Original-only fallback tags kept:",
    merge.originalOnlyKept.length ? merge.originalOnlyKept.join(" ") : "none",
    "",
    "Original-only tags removed:",
    removedOriginalOnly.length ? removedOriginalOnly.join(" ") : "none",
    "",
    "Invalid locations skipped:",
    merge.invalidLocations.length ? merge.invalidLocations.map((line) => `- ${line}`).join("\n") : "- none",
    "",
  ].join("\n"));

  writeText(reportPaths.duplicateReport, [
    "Bronze Era duplicate ownership cleanup",
    "======================================",
    "",
    `Duplicate locations inside same tag removed: ${merge.duplicateInsideTag.length}`,
    merge.duplicateInsideTag.length ? merge.duplicateInsideTag.map((line) => `- ${line}`).join("\n") : "- none",
    "",
    `Cross-tag ownership conflicts resolved: ${merge.duplicateConflicts.length}`,
    merge.duplicateConflicts.length ? merge.duplicateConflicts.map((line) => `- ${line}`).join("\n") : "- none",
    "",
    `Duplicate tag blocks resolved: ${merge.sourceTagDuplicates.length}`,
    merge.sourceTagDuplicates.length ? merge.sourceTagDuplicates.map((line) => `- ${line}`).join("\n") : "- none",
    "",
    `Empty tags skipped after cleanup: ${merge.emptyTags.length}`,
    merge.emptyTags.length ? merge.emptyTags.map((line) => `- ${line}`).join("\n") : "- none",
    "",
  ].join("\n"));

  writeText(reportPaths.removedObsolete, [
    "Removed obsolete vanilla/current countries",
    "==========================================",
    "",
    removedObsolete.length ? removedObsolete.map((tag) => `- ${tag}`).join("\n") : "- none",
    "",
  ].join("\n"));

  writeText(reportPaths.newCountries, [
    "Newly created Bronze Age countries",
    "==================================",
    "",
    newlyCreated.length ? newlyCreated.map((tag) => `- ${tag}`).join("\n") : "- none",
    "",
  ].join("\n"));

  writeText(reportPaths.summary, [
    "Bronze Era automated country integration pass",
    "============================================",
    "",
    `Modified source tags: ${modifiedAssignments.length}`,
    `Original comparison tags: ${originalAssignments.length}`,
    `Final countries: ${finalAssignments.length}`,
    `New countries from modified Bronze source: ${newlyCreated.length}`,
    `New countries inserted into setup this run: ${newlyInsertedThisRun.length}`,
    `Existing countries updated in setup: ${countryStats.updatedTags.length}`,
    `Obsolete current countries removed: ${removedObsolete.length}`,
    `Unique owned locations: ${uniqueLocations.size}`,
    `Invalid locations skipped: ${merge.invalidLocations.length}`,
    `Duplicate conflicts resolved: ${merge.duplicateConflicts.length}`,
    `Duplicate same-tag locations removed: ${merge.duplicateInsideTag.length}`,
    `Countries missing identity: ${identityStats.missingIdentity.length}`,
    `Invalid identity references: ${identityStats.invalidIdentity.length}`,
    `Low accepted-culture coverage warnings: ${identityStats.lowCultureCoverage.length}`,
    `Low religion-stability coverage warnings: ${identityStats.lowReligionCoverage.length}`,
    `Countries missing discovered regions: ${explorationStats.missingCountries.length}`,
    `Owned locations missing region mapping: ${explorationStats.unmappedLocations.length}`,
    "",
    `Final setup review file: ${reportPaths.finalSetup}`,
    `Country identity report: ${reportPaths.identityReport}`,
    `Country explored regions report: ${reportPaths.explorationReport}`,
    `Normalized painter file: ${paths.normalizedPainter}`,
    `EU5 country setup updated: ${paths.countries}`,
    "",
  ].join("\n"));
}

function validateFinal(finalAssignments, identityByTag, validCultures, validReligions, explorationByTag) {
  const tagCounts = new Map();
  const locationOwners = new Map();
  const duplicatedTags = [];
  const duplicatedLocations = [];
  const emptyTags = [];
  const missingIdentity = [];
  const invalidIdentity = [];
  const missingExploration = [];
  for (const assignment of finalAssignments) {
    tagCounts.set(assignment.tag, (tagCounts.get(assignment.tag) || 0) + 1);
    if (!assignment.locations.length) emptyTags.push(assignment.tag);
    const identity = identityByTag?.get(assignment.tag);
    if (identityByTag && (!identity?.primaryCulture || !identity?.stateReligion)) missingIdentity.push(assignment.tag);
    if (explorationByTag && !(explorationByTag.get(assignment.tag) || []).length) missingExploration.push(assignment.tag);
    if (identity?.primaryCulture && !validCultures.has(identity.primaryCulture)) invalidIdentity.push(`${assignment.tag}: ${identity.primaryCulture}`);
    if (identity?.stateReligion && !validReligions.has(identity.stateReligion)) invalidIdentity.push(`${assignment.tag}: ${identity.stateReligion}`);
    for (const religion of identity?.toleratedReligions || []) {
      if (!validReligions.has(religion)) invalidIdentity.push(`${assignment.tag}: ${religion}`);
    }
    for (const location of assignment.locations) {
      if (locationOwners.has(location)) duplicatedLocations.push(`${location}: ${locationOwners.get(location)} / ${assignment.tag}`);
      else locationOwners.set(location, assignment.tag);
    }
  }
  for (const [tag, count] of tagCounts) if (count > 1) duplicatedTags.push(`${tag} x${count}`);
  if (duplicatedTags.length) throw new Error(`Duplicate final tags: ${duplicatedTags.join(", ")}`);
  if (duplicatedLocations.length) throw new Error(`Duplicate final locations: ${duplicatedLocations.join(", ")}`);
  if (emptyTags.length) throw new Error(`Empty final countries: ${emptyTags.join(", ")}`);
  if (missingIdentity.length) throw new Error(`Missing country identity: ${missingIdentity.join(", ")}`);
  if (invalidIdentity.length) throw new Error(`Invalid country identity: ${invalidIdentity.join(", ")}`);
  if (missingExploration.length) throw new Error(`Missing country discovered regions: ${missingExploration.join(", ")}`);
}

function main() {
  const celticDefinitionStats = writeCelticCultureFiles();
  const modifiedAssignments = parsePainterFile(paths.modifiedPainter, "modified");
  const manualAssignments = fs.existsSync(abs(paths.manualPainter))
    ? parsePainterFile(paths.manualPainter, "manual")
    : [];
  const sourceAssignments = [...modifiedAssignments, ...manualAssignments];
  const originalAssignments = parsePainterFile(paths.originalPainter, "original");
  const locationIdentities = parseLocationTemplateIdentities();
  const validLocations = new Set(locationIdentities.keys());
  const popIdentityWeights = parsePopIdentityWeights();
  const validCultures = parseTopLevelDefinitionKeys(paths.culturesDir);
  const validReligions = parseTopLevelDefinitionKeys(paths.religionsDir);
  const regionData = parseLocationRegions();
  const merge = mergeAssignments(sourceAssignments, originalAssignments, validLocations);
  const identityByTag = buildCountryIdentities(merge.finalAssignments, popIdentityWeights, locationIdentities, validCultures, validReligions);
  const explorationByTag = buildCountryExploration(merge.finalAssignments, regionData.locationRegions);
  validateFinal(merge.finalAssignments, identityByTag, validCultures, validReligions, explorationByTag);
  const countryStats = writeCountries(merge.finalAssignments, identityByTag, explorationByTag);
  upsertDefaultCountryBlocks(merge.finalAssignments, countryStats.obsoleteTags);
  upsertLocalization(merge.finalAssignments, countryStats.obsoleteTags);
  writeNormalizedPainter(merge.finalAssignments);
  const celticProvinceStats = updateCelticPopsAndTemplates(merge.finalAssignments, validCultures, validReligions);
  const internationalTagUpdates = normalizeInternationalOrganizationTags();
  writeFinalSetupReviewFile(merge.finalAssignments, identityByTag, explorationByTag);
  const identityStats = writeIdentityReport(merge.finalAssignments, identityByTag, validCultures, validReligions);
  const explorationStats = writeExplorationReport(merge.finalAssignments, explorationByTag, regionData.locationRegions, regionData.definitionsPath);
  writeReports(merge, countryStats, merge.finalAssignments, originalAssignments, sourceAssignments, identityStats, explorationStats);
  fs.appendFileSync(abs(reportPaths.summary), [
    `Celtic culture definitions generated: ${celticDefinitionStats.generated}`,
    `Celtic culture groups tracked: ${celticDefinitionStats.groups}`,
    `Celtic pop locations updated: ${celticProvinceStats.popLocations}`,
    `Celtic location template entries updated: ${celticProvinceStats.templateLocations}`,
    `Mycenaean League tag references normalized: ${internationalTagUpdates}`,
    "",
  ].join("\r\n"), "utf8");
  console.log(readText(reportPaths.summary));
}

main();
