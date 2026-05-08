import fs from "fs";
import path from "path";

const root = path.resolve(".");
const countryPath = "main_menu/setup/start/10_countries.txt";
const popsPath = "main_menu/setup/start/06_pops.txt";
const culturesPath = "in_game/common/cultures/00_bronze_age_cultures.txt";

const manualCountryCultures = new Map([
  ["0001G", {
    accepted: ["mycenaean"],
    tolerated: ["minoan", "ionian", "aeolian", "dorian", "arcadian", "cycladic"],
  }],
  ["0002G", {
    accepted: ["upper_egyptian", "lower_egyptian"],
    tolerated: ["nubian", "medjay", "libyan", "canaanite", "phoenician", "peleset"],
  }],
  ["0003G", {
    accepted: ["hittite"],
    tolerated: ["luwian", "hattian", "palaic", "hurrian", "phrygian", "lukka"],
  }],
  ["ACRE", {
    accepted: ["phoenician"],
    tolerated: ["canaanite", "tjekker"],
  }],
]);

function readText(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function writeText(rel, text) {
  const normalized = text.replace(/\r+\n/g, "\n").replace(/\r/g, "\n").replace(/\n/g, "\r\n");
  fs.writeFileSync(path.join(root, rel), normalized, "utf8");
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

function blockBodyAt(text, assignmentIndex) {
  const open = text.indexOf("{", assignmentIndex);
  const close = findBlockEnd(text, open);
  if (open < 0 || close < 0) return "";
  return text.slice(open + 1, close);
}

function parseCultureGroups() {
  const text = readText(culturesPath);
  const groups = new Map();
  for (const match of text.matchAll(/^([A-Za-z0-9_]+)\s*=\s*\{/gm)) {
    const culture = match[1];
    const body = blockBodyAt(text, match.index);
    const cultureGroups = /culture_groups\s*=\s*\{([\s\S]*?)\}/.exec(body);
    const group = cultureGroups ? cultureGroups[1].replace(/#.*$/gm, "").trim().split(/\s+/).filter(Boolean)[0] : "";
    groups.set(culture, group);
  }
  return groups;
}

function parseLocationCultures() {
  const text = readText(popsPath);
  const locations = new Map();
  let currentLocation = "";
  for (const line of text.split("\n")) {
    const location = /^([A-Za-z0-9_]+)\s*=\s*\{\s*$/.exec(line);
    if (location) {
      currentLocation = location[1];
      if (!locations.has(currentLocation)) locations.set(currentLocation, new Map());
      continue;
    }
    const pop = /\bsize\s*=\s*([0-9.]+)\b[\s\S]*?\bculture\s*=\s*([A-Za-z0-9_]+)/.exec(line);
    if (!pop || !currentLocation) continue;
    const size = Number.parseFloat(pop[1]);
    const weight = Number.isFinite(size) && size > 0 ? size : 0;
    if (weight <= 0) continue;
    const culture = pop[2];
    const counts = locations.get(currentLocation);
    counts.set(culture, (counts.get(culture) || 0) + weight);
  }
  return locations;
}

function parseList(body, key) {
  const match = new RegExp(`${key}\\s*=\\s*\\{([\\s\\S]*?)\\}`).exec(body);
  return match ? match[1].replace(/#.*$/gm, "").trim().split(/\s+/).filter(Boolean) : [];
}

function countryEntries(text) {
  const entries = [];
  for (const match of text.matchAll(/^\s*([A-Z0-9_]+)\s*=\s*\{/gm)) {
    const tag = match[1];
    const open = text.indexOf("{", match.index);
    const close = findBlockEnd(text, open);
    if (close < 0) continue;
    const body = text.slice(open + 1, close);
    if (!/\bown_control_core\s*=/.test(body) && !/\bcapital\s*=/.test(body)) continue;
    entries.push({ tag, start: match.index, open, close, body });
  }
  return entries;
}

function cleanCultureStatusLines(body) {
  return body
    .replace(/\n\t\taccepted_cultures\s*=\s*\{[^}]*\}/g, "")
    .replace(/\n\t\ttolerated_cultures\s*=\s*\{[^}]*\}/g, "");
}

function insertAfterNestedBlock(body, key, insertion) {
  const re = new RegExp(`\\n\\t\\t${key}\\s*=\\s*\\{`, "m");
  const match = re.exec(body);
  if (!match) return null;
  const open = body.indexOf("{", match.index);
  const close = findBlockEnd(body, open);
  if (close < 0) return null;
  return `${body.slice(0, close + 1)}${insertion}${body.slice(close + 1)}`;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function calculateCountryCultures(entry, locationCultures, cultureGroups) {
  if (manualCountryCultures.has(entry.tag)) return manualCountryCultures.get(entry.tag);

  const ownedLocations = parseList(entry.body, "own_control_core");
  const capital = /\bcapital\s*=\s*([A-Za-z0-9_]+)/.exec(entry.body)?.[1];
  const sources = ownedLocations.length ? ownedLocations : capital ? [capital] : [];
  const totals = new Map();
  for (const location of sources) {
    const cultures = locationCultures.get(location);
    if (!cultures) continue;
    for (const [culture, weight] of cultures) {
      totals.set(culture, (totals.get(culture) || 0) + weight);
    }
  }

  if (totals.size === 0) {
    return { accepted: [], tolerated: [] };
  }

  const rows = [...totals.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const totalWeight = rows.reduce((sum, [, weight]) => sum + weight, 0);
  const dominant = rows[0][0];
  const dominantGroup = cultureGroups.get(dominant);
  const accepted = [dominant];

  for (const [culture, weight] of rows.slice(1)) {
    const share = weight / totalWeight;
    const sameGroup = cultureGroups.get(culture) === dominantGroup;
    if (accepted.length < 3 && share >= 0.3 && (sameGroup || rows[0][1] / totalWeight < 0.55)) {
      accepted.push(culture);
    }
  }

  const tolerated = [];
  for (const [culture, weight] of rows) {
    if (accepted.includes(culture)) continue;
    const share = weight / totalWeight;
    if (share >= 0.015 || rows.length <= 4) tolerated.push(culture);
  }

  return {
    accepted: unique(accepted),
    tolerated: unique(tolerated).slice(0, 12),
  };
}

function formatCultureStatus(accepted, tolerated) {
  const safeAccepted = accepted.length ? accepted : ["mycenaean"];
  const safeTolerated = tolerated.filter((culture) => !safeAccepted.includes(culture));
  const acceptedText = ` ${safeAccepted.join(" ")} `;
  const toleratedText = safeTolerated.length ? ` ${safeTolerated.join(" ")} ` : " ";
  return `\n\t\taccepted_cultures = {${acceptedText}}\n\t\ttolerated_cultures = {${toleratedText}}`;
}

function effectiveTolerated(accepted, tolerated) {
  return tolerated.filter((culture) => !accepted.includes(culture));
}

function applyCountryCultures() {
  const cultureGroups = parseCultureGroups();
  const locationCultures = parseLocationCultures();
  const input = readText(countryPath);
  const entries = countryEntries(input);
  const reports = [];
  let output = "";
  let cursor = 0;

  for (const entry of entries) {
    const originalBlock = input.slice(entry.start, entry.close + 1);
    let body = cleanCultureStatusLines(entry.body);
    const { accepted, tolerated } = calculateCountryCultures(entry, locationCultures, cultureGroups);
    const insertion = formatCultureStatus(accepted, tolerated);
    let nextBody = insertAfterNestedBlock(body, "government", insertion);
    if (!nextBody) nextBody = insertAfterNestedBlock(body, "own_control_core", insertion);
    if (!nextBody) nextBody = `${body}${insertion}`;

    const nextBlock = `${input.slice(entry.start, entry.open + 1)}${nextBody}\n\t}`;
    output += input.slice(cursor, entry.start);
    output += nextBlock;
    cursor = entry.close + 1;
    reports.push({ tag: entry.tag, accepted, tolerated: effectiveTolerated(accepted, tolerated) });

    if (originalBlock === nextBlock) {
      // Still count it in the report; stable output is useful when rerunning.
    }
  }

  output += input.slice(cursor);
  writeText(countryPath, output);

  let report = "Bronze Era country culture status report\n";
  report += "========================================\n\n";
  report += `Countries processed: ${reports.length}\n\n`;
  for (const row of reports) {
    report += `${row.tag}\n`;
    report += `- accepted_cultures: ${row.accepted.join(" ") || "none"}\n`;
    report += `- tolerated_cultures: ${row.tolerated.join(" ") || "none"}\n`;
  }
  writeText("tools/bronze_country_culture_status_report.txt", report);

  return reports;
}

const reports = applyCountryCultures();
console.log(`Applied culture status to ${reports.length} countries.`);
