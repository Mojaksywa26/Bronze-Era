import fs from "node:fs";
import path from "node:path";

const root = path.resolve(".");

const paths = {
  modifiedPainter: "tools/location_painter_inputs/modified_00_location_painter.txt",
  originalPainter: "tools/location_painter_inputs/original_bronze_era_control_core_location_painter_assignments.txt",
  countries: "main_menu/setup/start/10_countries.txt",
  defaultCountries: "in_game/setup/countries/_default.txt",
  localization: "main_menu/localization/english/Bronze_country_names_l_english.yml",
  pops: "main_menu/setup/start/06_pops.txt",
  locationTemplates: "in_game/map_data/location_templates.txt",
  normalizedPainter: "in_game/setup/location_painter/00_location_painter.txt",
  outputDir: "tools/bronze_country_integration",
};

const reportPaths = {
  finalSetup: `${paths.outputDir}/final_merged_country_setup.txt`,
  conflictLog: `${paths.outputDir}/conflict_resolution_log.txt`,
  duplicateReport: `${paths.outputDir}/duplicate_cleanup_report.txt`,
  removedObsolete: `${paths.outputDir}/removed_obsolete_vanilla_countries.txt`,
  newCountries: `${paths.outputDir}/new_bronze_countries.txt`,
  summary: `${paths.outputDir}/bronze_country_integration_report.txt`,
};

function abs(rel) {
  return path.join(root, rel);
}

function readText(rel) {
  return fs.readFileSync(abs(rel), "utf8").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function writeText(rel, text) {
  fs.mkdirSync(path.dirname(abs(rel)), { recursive: true });
  fs.writeFileSync(abs(rel), text.replace(/\n/g, "\r\n"), "utf8");
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
    assignments.push({
      source,
      rawTag,
      tag: normalizeTag(rawTag),
      color: color.length === 3 ? color : [128, 128, 128],
      locations,
      order: assignments.length,
    });
    entryRe.lastIndex = close + 1;
  }
  return assignments;
}

function normalizeTag(rawTag) {
  const clean = rawTag.trim().replace(/\s+/g, "_").replace(/[^A-Za-z0-9_]/g, "_").toUpperCase();
  const tagOverrides = new Map([
    ["AEQUIAN", "AEQUI"],
    ["CAMUNIC", "CAMUN"],
    ["CARNIAN", "CARNI"],
    ["DAESITIAN", "DAESI"],
    ["ETRUSCAN", "ETRUS"],
    ["FALISCAN", "FALIS"],
    ["HELVETII", "HELVE"],
    ["HISTRIAN", "HISTI"],
    ["INSUBRES", "INSUB"],
    ["LEPONTIC", "LEPON"],
    ["LIBURNIA", "LIBUR"],
    ["LIGURIA", "LIGUR"],
    ["MARSIAN", "MARSI"],
    ["NORD_PICENE", "NPICE"],
    ["OENOTRIAN", "OENOT"],
    ["PAGONIA", "PAGON"],
    ["RAETIC", "RAETI"],
    ["SCORDISCIAN", "SCORD"],
    ["SENOMES", "SENOM"],
    ["SENONIAN", "SENON"],
    ["SOUTH_PICENE", "SPICE"],
    ["SURRTENIA", "SURRT"],
    ["TARANTINE", "TARAN"],
    ["TAURISCIAN", "TAURI"],
    ["UMBRIAN", "UMBRI"],
    ["VENETIAN", "VENET"],
    ["VESTINIAN", "VESTI"],
    ["VOLSCIAN", "VOLSC"],
  ]);
  if (tagOverrides.has(clean)) return tagOverrides.get(clean);
  return clean;
}

function parseValidOwnableLocations() {
  const valid = new Set();
  const text = readText(paths.locationTemplates);
  const re = /^([A-Za-z0-9_]+)\s*=\s*\{([^\n}]*)\}/gm;
  let match;
  while ((match = re.exec(text))) {
    const body = match[2];
    if (/\bculture\s*=/.test(body) && /\breligion\s*=/.test(body) && !/\btopography\s*=\s*lakes\b/.test(body)) {
      valid.add(match[1]);
    }
  }
  return valid;
}

function parsePopCultureWeights() {
  const text = readText(paths.pops);
  const result = new Map();
  const locRe = /^([A-Za-z0-9_]+)\s*=\s*\{([\s\S]*?)^\}/gm;
  let match;
  while ((match = locRe.exec(text))) {
    const location = match[1];
    const body = match[2];
    const weights = new Map();
    for (const pop of body.matchAll(/define_pop\s*=\s*\{[^}]*\bsize\s*=\s*([0-9.]+)[^}]*\bculture\s*=\s*([A-Za-z0-9_]+)/g)) {
      const size = Number.parseFloat(pop[1]);
      const culture = pop[2];
      weights.set(culture, (weights.get(culture) || 0) + (Number.isFinite(size) ? size : 0));
    }
    if (weights.size) result.set(location, weights);
  }
  return result;
}

function mergeWeights(target, source, multiplier = 1) {
  for (const [key, value] of source || []) target.set(key, (target.get(key) || 0) + value * multiplier);
}

function inferCountryCultures(locations, popCultureWeights) {
  const weights = new Map();
  for (const location of locations) mergeWeights(weights, popCultureWeights.get(location));
  const ranked = [...weights.entries()].sort((a, b) => b[1] - a[1]).map(([culture]) => culture);
  return {
    accepted: ranked.slice(0, Math.min(2, ranked.length)),
    tolerated: ranked.slice(2, 8),
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
    const sourceRank = (source) => (source === "modified" ? 0 : 1);
    return sourceRank(a.source) - sourceRank(b.source) || a.order - b.order || a.tag.localeCompare(b.tag);
  });

  const finalOwner = new Map();
  const finalPriority = new Map();
  for (const assignment of orderedAssignments) {
    const priority = assignment.source === "modified" ? 2 : 1;
    for (const location of assignment.locations) {
      if (finalOwner.has(location)) {
        const previous = finalOwner.get(location);
        const previousPriority = finalPriority.get(location);
        const keepNew = priority > previousPriority || (priority === previousPriority && assignment.source === "modified");
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

function ensureGovernment(body) {
  if (/(^|\n)\t\tgovernment\s*=\s*\{/.test(body)) return body;
  return `${body.replace(/\s*$/, "")}\n\t\tgovernment = {\n\t\t\truler = random\n\t\t}`;
}

function titleFromTag(tag) {
  const overrides = new Map([
    ["0001G", "Mycenae"],
    ["0002G", "Egypt"],
    ["0003G", "Hatti"],
    ["AEQUI", "Aequi"],
    ["CAMUN", "Camunic"],
    ["CARNI", "Carnian"],
    ["DAESI", "Daesitian"],
    ["ETRUS", "Etruscan"],
    ["FALIS", "Faliscan"],
    ["HELVE", "Helvetii"],
    ["HISTI", "Histrian"],
    ["INSUB", "Insubres"],
    ["LEPON", "Lepontic"],
    ["LIBUR", "Liburnian"],
    ["LIGUR", "Ligurian"],
    ["MARSI", "Marsian"],
    ["NPICE", "North Picene"],
    ["OENOT", "Oenotrian"],
    ["PAGON", "Pagonia"],
    ["RAETI", "Raetic"],
    ["SCORD", "Scordiscian"],
    ["SENOM", "Senomes"],
    ["SENON", "Senonian"],
    ["SPICE", "South Picene"],
    ["SURRT", "Surrtenia"],
    ["TARAN", "Tarantine"],
    ["TAURI", "Tauriscian"],
    ["UMBRI", "Umbrian"],
    ["VENET", "Venetic"],
    ["VESTI", "Vestinian"],
    ["VOLSC", "Volscian"],
  ]);
  if (overrides.has(tag)) return overrides.get(tag);
  return tag
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function adjectiveFromName(name) {
  if (/(ian|ean|ic|ite|i|n)$/i.test(name)) return name;
  return `${name}ian`;
}

function buildCountryBody(assignment, existingBody, popCultureWeights) {
  const cultures = inferCountryCultures(assignment.locations, popCultureWeights);
  let body = existingBody || "";
  if (!body.trim()) {
    body = [
      `\t\tcapital = ${assignment.locations[0]}`,
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
  body = replaceScalar(body, "capital", assignment.locations[0]);
  body = replaceOwnControlCore(body, assignment.locations);
  body = ensureGovernment(body);
  body = ensureLineBlock(body, "accepted_cultures", cultures.accepted);
  body = ensureLineBlock(body, "tolerated_cultures", cultures.tolerated);
  return body.replace(/\n{3,}/g, "\n\n");
}

function writeCountries(finalAssignments, popCultureWeights) {
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
    lines.push(buildCountryBody(assignment, existing.get(assignment.tag)?.body, popCultureWeights));
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
  let text = normalizeLocalizationHeader(readText(paths.localization));
  for (const tag of obsoleteTags) {
    text = text.replace(new RegExp(`^ ${tag}: .*\\n?`, "m"), "");
    text = text.replace(new RegExp(`^ ${tag}_ADJ: .*\\n?`, "m"), "");
  }
  for (const assignment of finalAssignments) {
    const name = titleFromTag(assignment.tag);
    const adjective = adjectiveFromName(name);
    const nameLine = ` ${assignment.tag}: "${name}"`;
    const adjLine = ` ${assignment.tag}_ADJ: "${adjective}"`;
    const nameRe = new RegExp(`^ ${assignment.tag}: .*$`, "m");
    const adjRe = new RegExp(`^ ${assignment.tag}_ADJ: .*$`, "m");
    text = nameRe.test(text) ? text : `${text.replace(/\s*$/, "\n")}${nameLine}\n`;
    text = adjRe.test(text) ? text : `${text.replace(/\s*$/, "\n")}${adjLine}\n`;
  }
  writeText(paths.localization, text);
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

function writeFinalSetupReviewFile(finalAssignments) {
  const lines = [
    "# Final merged Bronze Era ownership setup generated from Location Painter assignments.",
    "# This review file keeps painter colors beside own_control_core blocks.",
    "",
  ];
  for (const assignment of finalAssignments) {
    lines.push(`${assignment.tag} = {`);
    lines.push(`    color = { ${assignment.color.join(" ")} }`);
    lines.push("");
    lines.push("    own_control_core = {");
    for (const location of assignment.locations) lines.push(`        ${location}`);
    lines.push("    }");
    lines.push("}");
    lines.push("");
  }
  writeText(reportPaths.finalSetup, lines.join("\n"));
}

function writeReports(merge, countryStats, finalAssignments, originalAssignments, modifiedAssignments) {
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
    "",
    `Final setup review file: ${reportPaths.finalSetup}`,
    `Normalized painter file: ${paths.normalizedPainter}`,
    `EU5 country setup updated: ${paths.countries}`,
    "",
  ].join("\n"));
}

function validateFinal(finalAssignments) {
  const tagCounts = new Map();
  const locationOwners = new Map();
  const duplicatedTags = [];
  const duplicatedLocations = [];
  const emptyTags = [];
  for (const assignment of finalAssignments) {
    tagCounts.set(assignment.tag, (tagCounts.get(assignment.tag) || 0) + 1);
    if (!assignment.locations.length) emptyTags.push(assignment.tag);
    for (const location of assignment.locations) {
      if (locationOwners.has(location)) duplicatedLocations.push(`${location}: ${locationOwners.get(location)} / ${assignment.tag}`);
      else locationOwners.set(location, assignment.tag);
    }
  }
  for (const [tag, count] of tagCounts) if (count > 1) duplicatedTags.push(`${tag} x${count}`);
  if (duplicatedTags.length) throw new Error(`Duplicate final tags: ${duplicatedTags.join(", ")}`);
  if (duplicatedLocations.length) throw new Error(`Duplicate final locations: ${duplicatedLocations.join(", ")}`);
  if (emptyTags.length) throw new Error(`Empty final countries: ${emptyTags.join(", ")}`);
}

function main() {
  const modifiedAssignments = parsePainterFile(paths.modifiedPainter, "modified");
  const originalAssignments = parsePainterFile(paths.originalPainter, "original");
  const validLocations = parseValidOwnableLocations();
  const popCultureWeights = parsePopCultureWeights();
  const merge = mergeAssignments(modifiedAssignments, originalAssignments, validLocations);
  validateFinal(merge.finalAssignments);
  const countryStats = writeCountries(merge.finalAssignments, popCultureWeights);
  upsertDefaultCountryBlocks(merge.finalAssignments, countryStats.obsoleteTags);
  upsertLocalization(merge.finalAssignments, countryStats.obsoleteTags);
  writeNormalizedPainter(merge.finalAssignments);
  writeFinalSetupReviewFile(merge.finalAssignments);
  writeReports(merge, countryStats, merge.finalAssignments, originalAssignments, modifiedAssignments);
  console.log(readText(reportPaths.summary));
}

main();
