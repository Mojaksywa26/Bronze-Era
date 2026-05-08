import fs from "fs";
import path from "path";

const root = path.resolve(".");
const painterPath = "in_game/setup/location_painter/00_location_painter.txt";
const countriesPath = "main_menu/setup/start/10_countries.txt";
const defaultCountriesPath = "in_game/setup/countries/_default.txt";
const localizationPath = "main_menu/localization/english/Bronze_country_names_l_english.yml";
const popsPath = "main_menu/setup/start/06_pops.txt";
const reportPath = "tools/location_painter_country_import_report.txt";

const tagOverrides = new Map([
  ["AHHIY", "0001G"],
  ["KEMET", "0002G"],
  ["HATTI", "0003G"],
  ["SIDON", "ACRE"],
  ["AGRIANES", "AGRIA"],
  ["ALMOPIANS", "ALMOP"],
  ["ALZIYA", "ALZIY"],
  ["ARDIAIOI", "ARDIA"],
  ["BOTTIA", "BOTTI"],
  ["BOULINOI", "BOULI"],
  ["CAONIA", "CAONI"],
  ["DARDANIANS", "DARDN"],
  ["DERRONES", "DERRN"],
  ["DOBERES", "DOBER"],
  ["DOLOPIA", "DOLOP"],
  ["ELIMIOTIS", "ELMIT"],
  ["HIERASTAMNOI", "HIERA"],
  ["HYLLOI", "HYLLO"],
  ["KARKAMISSA", "KARKA"],
  ["LAEAEANS", "LAEAE"],
  ["MANIOI", "MANIO"],
  ["MOLOSIA", "MOLOS"],
  ["NESTIOI", "NESTI"],
  ["PAEONIA", "PAEON"],
  ["PAEOPLAE", "PAEOP"],
  ["SAHIRIYA", "SAHIR"],
  ["SIROPAINES", "SIROP"],
  ["TAULANTIOI", "TAULA"],
  ["TESPROTIA", "TESPR"],
  ["THRACE", "THRAC"],
  ["THRACE TRIBLE BOSPHORUS", "BOSPH"],
]);

const names = new Map([
  ["0001G", ["Ahhiyawa", "Ahhiyawan"]],
  ["0002G", ["Kemet", "Kemetic"]],
  ["0003G", ["Hatti", "Hittite"]],
  ["ACRE", ["Acre", "Acrean"]],
  ["ELIMI", ["Elimi", "Elimian"]],
  ["AGRIA", ["Agrianes", "Agrianian"]],
  ["ALMOP", ["Almopians", "Almopian"]],
  ["ALZIY", ["Alziya", "Alziyan"]],
  ["ARDIA", ["Ardiaioi", "Ardiaean"]],
  ["BOTTI", ["Bottiaea", "Bottiaean"]],
  ["BOULI", ["Boulinoi", "Boulinian"]],
  ["CAONI", ["Chaonia", "Chaonian"]],
  ["DARDN", ["Dardanians", "Dardanian"]],
  ["DERRN", ["Derrones", "Derronian"]],
  ["DOBER", ["Doberes", "Doberian"]],
  ["DOLOP", ["Dolopia", "Dolopian"]],
  ["ELMIT", ["Elimiotis", "Elimiote"]],
  ["HIERA", ["Hierastamnoi", "Hierastamnian"]],
  ["HYLLO", ["Hylloi", "Hyllian"]],
  ["KARKA", ["Karkamissa", "Karkamissan"]],
  ["KASKA", ["Kaska", "Kaskan"]],
  ["LAEAE", ["Laeaeans", "Laeaean"]],
  ["LAZPA", ["Lazpa", "Lazpan"]],
  ["MANIO", ["Manioi", "Manian"]],
  ["MIRA", ["Mira", "Miran"]],
  ["MOLOS", ["Molossia", "Molossian"]],
  ["NESTI", ["Nestioi", "Nestian"]],
  ["PAEON", ["Paeonia", "Paeonian"]],
  ["PAEOP", ["Paeoplae", "Paeoplaean"]],
  ["SAHIR", ["Sahiriya", "Sahiriyan"]],
  ["SEHA", ["Seha River Land", "Sehan"]],
  ["SIROP", ["Siropaines", "Siropainian"]],
  ["TAULA", ["Taulantioi", "Taulantian"]],
  ["TESPR", ["Thesprotia", "Thesprotian"]],
  ["THRAC", ["Thrace", "Thracian"]],
  ["BOSPH", ["Thracian Bosporus", "Bosphoran"]],
]);

const protectedAssignments = new Map([
  ["ELIMI", { rawName: "ELIMI", tag: "ELIMI", color: [83, 213, 124], locations: [] }],
]);

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

function wordsFromBlock(body, key) {
  const match = new RegExp(`${key}\\s*=\\s*\\{([\\s\\S]*?)\\}`).exec(body);
  return match ? match[1].replace(/#.*$/gm, "").trim().split(/\s+/).filter(Boolean) : [];
}

function parsePainter() {
  const text = readText(painterPath);
  const rootMatch = /location_painter_assignments\s*=\s*\{/.exec(text);
  if (!rootMatch) throw new Error("location_painter_assignments block not found");
  const rootOpen = text.indexOf("{", rootMatch.index);
  const rootClose = findBlockEnd(text, rootOpen);
  const body = text.slice(rootOpen + 1, rootClose);
  const assignments = [];
  for (const match of body.matchAll(/^ {4}(\S[^=\n]*?)\s*=\s*\{/gm)) {
    const rawName = match[1].trim();
    const open = body.indexOf("{", match.index);
    const close = findBlockEnd(body, open);
    const entryBody = body.slice(open + 1, close);
    const color = wordsFromBlock(entryBody, "color").map(Number);
    const locations = wordsFromBlock(entryBody, "locations");
    const tag = normalizeTag(rawName);
    assignments.push({ rawName, tag, color, locations });
  }
  return assignments;
}

function normalizeTag(rawName) {
  const clean = rawName.trim();
  if (tagOverrides.has(clean)) return tagOverrides.get(clean);
  const compact = clean.replace(/[^A-Za-z0-9_]/g, "_").toUpperCase();
  if (/^[A-Z0-9_]{1,5}$/.test(compact)) return compact;
  return compact.replace(/_/g, "").slice(0, 5);
}

function parseValidLocations() {
  const text = readText(popsPath);
  return new Set([...text.matchAll(/^([A-Za-z0-9_]+)\s*=\s*\{\s*$/gm)].map((match) => match[1]));
}

function formatLocationList(locations, indent = "\t\t\t") {
  const rows = [];
  for (let i = 0; i < locations.length; i += 8) {
    rows.push(`${indent}${locations.slice(i, i + 8).join(" ")}`);
  }
  return rows.join("\n");
}

function countryEntries(text) {
  const entries = new Map();
  for (const match of text.matchAll(/^\s*([A-Z0-9_]+)\s*=\s*\{/gm)) {
    const tag = match[1];
    if (tag === "countries") continue;
    const open = text.indexOf("{", match.index);
    const close = findBlockEnd(text, open);
    if (close < 0) continue;
    const body = text.slice(open + 1, close);
    if (!/\bown_control_core\s*=/.test(body) && !/\bcapital\s*=/.test(body)) continue;
    entries.set(tag, { tag, start: match.index, open, close, body });
  }
  return entries;
}

function countryDisplayName(assignment) {
  if (names.has(assignment.tag)) return names.get(assignment.tag);
  const fallback = assignment.rawName
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
  return [fallback, `${fallback}ian`];
}

function cleanCountryBody(body) {
  return body
    .replace(/\n\t\taccepted_cultures\s*=\s*\{[^}]*\}/g, "")
    .replace(/\n\t\ttolerated_cultures\s*=\s*\{[^}]*\}/g, "")
    .replace(/country_rank\s*=\s*rank_country/g, "country_rank = rank_kingdom");
}

function replaceOrInsertScalar(body, key, value) {
  const re = new RegExp(`(\\n\\t\\t${key}\\s*=\\s*)[^\\n]+`);
  if (re.test(body)) return body.replace(re, `$1${value}`);
  return `\n\t\t${key} = ${value}${body}`;
}

function replaceOwnControlCore(body, locations) {
  const block = `\n\t\town_control_core = {\n${formatLocationList(locations)}\n\t\t}`;
  const re = /\n\t\town_control_core\s*=\s*\{/;
  const match = re.exec(body);
  if (!match) return `${body}${block}`;
  const open = body.indexOf("{", match.index);
  const close = findBlockEnd(body, open);
  return `${body.slice(0, match.index)}${block}${body.slice(close + 1)}`;
}

function ensureGovernment(body) {
  if (/\n\t\tgovernment\s*=\s*\{/.test(body)) return body;
  return `${body}\n\t\tgovernment = {\n\t\t\truler = random\n\t\t}`;
}

function makeCountryBlock(assignment) {
  const [name] = countryDisplayName(assignment);
  const comment = /^(?:000[123]G|ACRE|ELIMI)$/.test(assignment.tag) ? assignment.tag : name.toUpperCase();
  const capital = assignment.locations[0] || "cairo";
  const locations = assignment.locations.length ? formatLocationList(assignment.locations) : "";
  return `\n\t##${comment}\n\t${assignment.tag} = {\n\t\tcapital = ${capital}\n\n\t\tcountry_rank = rank_kingdom\n\n\t\tinclude = "catholic_monarchy_not_present"\n\n\t\town_control_core = {\n${locations}\n\t\t}\n\t\tgovernment = {\n\t\t\truler = random\n\t\t}\n\t}\n`;
}

function stripTrailingCountryComment(text) {
  return text.replace(/\n\t##[^\n]*\n(?:[ \t]*\n)*$/, "\n");
}

function updateCountries(assignments) {
  const input = readText(countriesPath);
  const existingTags = new Set([...input.matchAll(/^\s*([A-Z0-9_]+)\s*=\s*\{/gm)].map((match) => match[1]).filter((tag) => tag !== "countries"));
  const changedTags = assignments.filter((assignment) => existingTags.has(assignment.tag)).map((assignment) => assignment.tag);
  const addedTags = assignments.filter((assignment) => !existingTags.has(assignment.tag) && assignment.locations.length > 0).map((assignment) => assignment.tag);
  const removedEmptyTags = [];
  const removedRenamedTags = assignments
    .filter((assignment) => assignment.rawName !== assignment.tag && existingTags.has(assignment.rawName))
    .map((assignment) => [assignment.rawName, assignment.tag]);

  const countryBlocks = assignments.filter((assignment) => assignment.locations.length > 0).map(makeCountryBlock).join("");
  const output = `current_age = age_1_traditions

# own_control_core
# own_control_integrated
# own_control_conquered
# own_control_colony
# own_core
# own_conquered
# own_integrated
# own_colony
# control_core
# control
# our_cores_conquered_by_others

countries = {
\tcountries = {
${countryBlocks}\t}
}
`;

  writeText(countriesPath, output);
  return { changedTags, addedTags, removedEmptyTags, removedRenamedTags };
}

function updateDefaultCountries(assignments) {
  let text = readText(defaultCountriesPath);
  for (const assignment of assignments) {
    if (!assignment.color.length) continue;
    const block = `${assignment.tag} = {\n\tcolor = rgb { ${assignment.color.join(" ")} }\n\tcolor2 = rgb { 110 27 27 }\n}\n`;
    const re = new RegExp(`(?:^|\\n)${assignment.tag}\\s*=\\s*\\{`);
    const match = re.exec(text);
    if (match) {
      const start = match.index + (text[match.index] === "\n" ? 1 : 0);
      const open = text.indexOf("{", start);
      const close = findBlockEnd(text, open);
      text = `${text.slice(0, start)}${block}${text.slice(close + 2)}`;
    } else {
      text = `${text.replace(/\s*$/, "\n")}${block}`;
    }
  }
  writeText(defaultCountriesPath, text);
}

function normalizeLocalizationHeader(text) {
  const body = text
    .split("\n")
    .filter((line) => !/^(?:\uFEFF|ï»¿)?l_english:\s*$/.test(line))
    .join("\n")
    .replace(/^\s*\n/, "");
  return `l_english:\n${body}`;
}

function removeDefaultCountryTags(tags) {
  if (!tags.length) return;
  let text = readText(defaultCountriesPath);
  for (const tag of tags) {
    const re = new RegExp(`(?:^|\\n)${tag}\\s*=\\s*\\{`);
    const match = re.exec(text);
    if (!match) continue;
    const start = match.index + (text[match.index] === "\n" ? 1 : 0);
    const open = text.indexOf("{", start);
    const close = findBlockEnd(text, open);
    text = `${text.slice(0, start)}${text.slice(close + 2)}`;
  }
  writeText(defaultCountriesPath, text);
}

function updateLocalization(assignments) {
  let text = normalizeLocalizationHeader(readText(localizationPath));
  for (const assignment of assignments) {
    const [name, adjective] = countryDisplayName(assignment);
    const nameLine = ` ${assignment.tag}: "${name}"`;
    const adjLine = ` ${assignment.tag}_ADJ: "${adjective}"`;
    const nameRe = new RegExp(`^ ${assignment.tag}: .*$`, "m");
    const adjRe = new RegExp(`^ ${assignment.tag}_ADJ: .*$`, "m");
    text = nameRe.test(text) ? text.replace(nameRe, nameLine) : `${text.replace(/\s*$/, "\n")}${nameLine}\n`;
    text = adjRe.test(text) ? text.replace(adjRe, adjLine) : `${text.replace(/\s*$/, "\n")}${adjLine}\n`;
  }
  writeText(localizationPath, text);
}

function removeLocalizationTags(tags) {
  if (!tags.length) return;
  let text = normalizeLocalizationHeader(readText(localizationPath));
  for (const tag of tags) {
    text = text.replace(new RegExp(`^ ${tag}: .*\\n?`, "m"), "");
    text = text.replace(new RegExp(`^ ${tag}_ADJ: .*\\n?`, "m"), "");
  }
  writeText(localizationPath, text);
}

function updatePainter(assignments) {
  let out = "# Generated by EU5 Location Painter\n";
  out += "# Normalized by Bronze Era importer: country keys are valid EU5 tags.\n\n";
  out += "location_painter_assignments = {\n";
  for (const assignment of assignments) {
    out += `    ${assignment.tag} = {\n`;
    out += `        color = { ${assignment.color.join(" ")} }\n`;
    out += "        locations = {\n";
    for (const location of assignment.locations) out += `            ${location}\n`;
    out += "        }\n";
    out += "    }\n";
  }
  out += "}\n";
  writeText(painterPath, out);
}

function main() {
  const validLocations = parseValidLocations();
  const rawAssignments = parsePainter();
  for (const [tag, assignment] of protectedAssignments) {
    if (!rawAssignments.some((row) => normalizeTag(row.rawName) === tag)) rawAssignments.push(assignment);
  }
  const seenTags = new Set();
  const locationOwners = new Map();
  const duplicateLocations = [];
  const invalidLocations = [];
  const renamed = [];

  const assignments = [];
  for (const assignment of rawAssignments) {
    const valid = assignment.locations.filter((location) => {
      const ok = validLocations.has(location);
      if (!ok) invalidLocations.push(`${assignment.rawName}: ${location}`);
      return ok;
    });
    if (assignment.rawName !== assignment.tag) renamed.push(`${assignment.rawName} -> ${assignment.tag}`);
    if (seenTags.has(assignment.tag)) throw new Error(`Duplicate normalized tag: ${assignment.tag}`);
    seenTags.add(assignment.tag);
    for (const location of valid) {
      if (locationOwners.has(location)) duplicateLocations.push(`${location}: ${locationOwners.get(location)} / ${assignment.tag}`);
      else locationOwners.set(location, assignment.tag);
    }
    assignments.push({ ...assignment, locations: valid });
  }

  const { changedTags, addedTags, removedEmptyTags, removedRenamedTags } = updateCountries(assignments);
  const removedRenamedSourceTags = removedRenamedTags.map(([source]) => source);
  updateDefaultCountries(assignments);
  removeDefaultCountryTags([...removedEmptyTags, ...removedRenamedSourceTags]);
  updateLocalization(assignments);
  removeLocalizationTags([...removedEmptyTags, ...removedRenamedSourceTags]);
  updatePainter(assignments);

  let report = "Location painter country import report\n";
  report += "======================================\n\n";
  report += `Assignments read: ${rawAssignments.length}\n`;
  report += `Countries updated from painter: ${changedTags.length}\n`;
  report += `Countries added: ${addedTags.length}\n`;
  report += `Empty stale countries removed: ${removedEmptyTags.length}\n`;
  report += `Renamed source countries removed: ${removedRenamedTags.length}\n`;
  report += `Renamed/normalized tags: ${renamed.length}\n`;
  report += `Invalid locations skipped: ${invalidLocations.length}\n`;
  report += `Duplicate painter locations: ${duplicateLocations.length}\n\n`;
  if (addedTags.length) report += `Added tags: ${addedTags.join(" ")}\n\n`;
  if (removedEmptyTags.length) report += `Removed empty stale tags: ${removedEmptyTags.join(" ")}\n\n`;
  if (removedRenamedTags.length) report += `Removed renamed source tags:\n- ${removedRenamedTags.map(([source, target]) => `${source} -> ${target}`).join("\n- ")}\n\n`;
  if (renamed.length) report += `Tag normalization:\n- ${renamed.join("\n- ")}\n\n`;
  if (invalidLocations.length) report += `Invalid locations skipped:\n- ${invalidLocations.join("\n- ")}\n\n`;
  if (duplicateLocations.length) report += `Duplicate locations in painter:\n- ${duplicateLocations.join("\n- ")}\n\n`;
  writeText(reportPath, report);

  console.log(`Imported ${assignments.length} painter assignments; added ${addedTags.length} countries.`);
}

main();
