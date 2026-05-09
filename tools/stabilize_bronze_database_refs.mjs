import fs from "node:fs";
import path from "node:path";

const modRoot = process.cwd();
const gameRoot = process.env.EU5_GAME_ROOT || "D:/SteamLibrary/steamapps/common/Europa Universalis V/game";

const popFile = path.join(modRoot, "main_menu/setup/start/06_pops.txt");
const vanillaLocationTemplates = path.join(gameRoot, "in_game/map_data/location_templates.txt");
const outputLocationTemplates = path.join(modRoot, "in_game/map_data/location_templates.txt");
const outputReligionStubs = path.join(modRoot, "in_game/common/religions/zz_bronze_legacy_reference_stubs.txt");
const reportPath = path.join(modRoot, "tools/bronze_database_stability_report.txt");

const bronzeReligionFallback = "steppe_pagan";
const bronzeCultureFallback = "andronovo";

function readText(file) {
  return fs.readFileSync(file, "utf8");
}

function writeText(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text.replace(/\r\n/g, "\n"), "utf8");
}

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(file));
    else if (entry.isFile() && entry.name.endsWith(".txt")) out.push(file);
  }
  return out;
}

function topLevelDefinitions(dir, options = {}) {
  const defs = new Set();
  if (!fs.existsSync(dir)) return defs;
  for (const file of walk(dir)) {
    if (options.excludeFileNames?.has(path.basename(file))) continue;
    const text = readText(file);
    const re = /^([A-Za-z0-9_]+)\s*=\s*\{/gm;
    let match;
    while ((match = re.exec(text))) defs.add(match[1]);
  }
  return defs;
}

function addWeighted(map, key, weight) {
  if (!key) return;
  map.set(key, (map.get(key) || 0) + (Number.isFinite(weight) ? weight : 0));
}

function chooseWeighted(weighted, firstSeen) {
  let best = null;
  let bestWeight = -1;
  for (const [key, weight] of weighted) {
    if (weight > bestWeight) {
      best = key;
      bestWeight = weight;
    }
  }
  return best || firstSeen || null;
}

function parseDominantPopIdentity() {
  const lines = readText(popFile).split(/\r?\n/);
  const result = new Map();
  let current = null;
  let depth = 0;
  let cultureWeights = new Map();
  let religionWeights = new Map();
  let firstCulture = null;
  let firstReligion = null;

  function finish() {
    if (!current) return;
    const culture = chooseWeighted(cultureWeights, firstCulture);
    const religion = chooseWeighted(religionWeights, firstReligion);
    if (culture || religion) result.set(current, { culture, religion });
  }

  for (const line of lines) {
    const start = line.match(/^([A-Za-z0-9_]+)\s*=\s*\{\s*$/);
    if (start && depth === 1 && start[1] !== "locations") {
      current = start[1];
      depth += 1;
      cultureWeights = new Map();
      religionWeights = new Map();
      firstCulture = null;
      firstReligion = null;
      continue;
    }

    if (current) {
      const pop = line.match(/define_pop\s*=\s*\{[^}]*\bsize\s*=\s*([0-9.]+)[^}]*\bculture\s*=\s*([A-Za-z0-9_]+)[^}]*\breligion\s*=\s*([A-Za-z0-9_]+)/);
      if (pop) {
        const size = Number.parseFloat(pop[1]);
        const culture = pop[2];
        const religion = pop[3];
        firstCulture ||= culture;
        firstReligion ||= religion;
        addWeighted(cultureWeights, culture, size);
        addWeighted(religionWeights, religion, size);
      }
    }

    const open = (line.match(/\{/g) || []).length;
    const close = (line.match(/\}/g) || []).length;
    const before = depth;
    depth += open - close;
    if (current && before === 2 && depth === 1) {
      finish();
      current = null;
    }
  }

  return result;
}

function rebuildLocationTemplates(popIdentity, bronzeCultures, bronzeReligions) {
  let mappedCultures = 0;
  let mappedReligions = 0;
  let fallbackCultures = 0;
  let fallbackReligions = 0;

  const output = readText(vanillaLocationTemplates)
    .split(/\r?\n/)
    .map((line) => {
      const location = line.match(/^([A-Za-z0-9_]+)\s*=\s*\{/);
      const identity = location ? popIdentity.get(location[1]) : null;
      let next = line;

      next = next.replace(/\bculture\s*=\s*([A-Za-z0-9_]+)/, (full, oldCulture) => {
        if (identity?.culture) {
          mappedCultures += oldCulture === identity.culture ? 0 : 1;
          return `culture = ${identity.culture}`;
        }
        if (!bronzeCultures.has(oldCulture)) {
          fallbackCultures += 1;
          return `culture = ${bronzeCultureFallback}`;
        }
        return full;
      });

      next = next.replace(/\breligion\s*=\s*([A-Za-z0-9_]+)/, (full, oldReligion) => {
        if (identity?.religion) {
          mappedReligions += oldReligion === identity.religion ? 0 : 1;
          return `religion = ${identity.religion}`;
        }
        if (!bronzeReligions.has(oldReligion)) {
          fallbackReligions += 1;
          return `religion = ${bronzeReligionFallback}`;
        }
        return full;
      });

      return next;
    })
    .join("\n");

  writeText(outputLocationTemplates, output + "\n");
  return { mappedCultures, mappedReligions, fallbackCultures, fallbackReligions };
}

function generateLegacyReligionStubs(bronzeReligions) {
  const vanillaReligions = topLevelDefinitions(path.join(gameRoot, "in_game/common/religions"));
  const legacy = [...vanillaReligions].filter((key) => !bronzeReligions.has(key)).sort();

  const lines = [
    "# Bronze Era compatibility definitions.",
    "# These legacy keys are not placed by the 1205 BCE setup; they only satisfy hardcoded vanilla references",
    "# in map templates, monuments, scripted triggers, and old saves so the database does not produce null religions.",
    "",
  ];

  for (const key of legacy) {
    lines.push(`${key} = {`);
    lines.push("\tcolor = rgb { 85 85 85 }");
    lines.push("\tgroup = bronze_legacy_reference_religion_group");
    lines.push("\tdefinition_modifier = {");
    lines.push("\t}");
    lines.push("\topinions = {");
    lines.push("\t}");
    lines.push("\ttags = { pagan_gfx }");
    lines.push("}");
    lines.push("");
  }

  writeText(outputReligionStubs, lines.join("\n"));
  return legacy.length;
}

const bronzeCultures = topLevelDefinitions(path.join(modRoot, "in_game/common/cultures"));
const bronzeReligions = topLevelDefinitions(path.join(modRoot, "in_game/common/religions"), {
  excludeFileNames: new Set(["zz_bronze_legacy_reference_stubs.txt"]),
});
const popIdentity = parseDominantPopIdentity();
const locationStats = rebuildLocationTemplates(popIdentity, bronzeCultures, bronzeReligions);
const legacyReligionCount = generateLegacyReligionStubs(bronzeReligions);

writeText(reportPath, [
  "Bronze Era database stability rebuild",
  "======================================",
  "",
  `Pop identity locations parsed: ${popIdentity.size}`,
  `Location template cultures replaced from pops: ${locationStats.mappedCultures}`,
  `Location template religions replaced from pops: ${locationStats.mappedReligions}`,
  `Location template fallback cultures: ${locationStats.fallbackCultures}`,
  `Location template fallback religions: ${locationStats.fallbackReligions}`,
  `Legacy religion compatibility stubs generated: ${legacyReligionCount}`,
  "",
  `Generated: ${path.relative(modRoot, outputLocationTemplates)}`,
  `Generated: ${path.relative(modRoot, outputReligionStubs)}`,
  "",
].join("\n"));

console.log(readText(reportPath));
