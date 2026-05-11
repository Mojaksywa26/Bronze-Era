import fs from "node:fs";
import path from "node:path";

const root = path.resolve(".");
const englishDirs = [
  path.join(root, "localization/english"),
  path.join(root, "main_menu/localization/english"),
];
const frenchDirs = [
  path.join(root, "localization/french"),
  path.join(root, "main_menu/localization/french"),
];
const reportPath = path.join(root, "tools/bronze_french_localization_report.txt");

const countryFrench = new Map([
  ["0001G", "Mycenes"], ["0001G_ADJ", "mycenien"],
  ["0002G", "Egypte"], ["0002G_ADJ", "egyptien"],
  ["0003G", "Hatti"], ["0003G_ADJ", "hittite"],
  ["ACRE", "Acre"], ["ACRE_ADJ", "acreen"],
  ["ABRIN", "Abrincates"], ["ABRIN_ADJ", "abrincate"],
  ["ACHAEA", "Achaie"], ["ACHAEA_ADJ", "acheen"],
  ["AEDUI", "Eduens"], ["AEDUI_ADJ", "eduen"],
  ["AEQUI", "Eques"], ["AEQUI_ADJ", "eque"],
  ["AGRIA", "Agrianes"], ["AGRIA_ADJ", "agrianien"],
  ["ALASI", "Alasi"], ["ALASI_ADJ", "alasien"],
  ["ALLOB", "Allobroges"], ["ALLOB_ADJ", "allobroge"],
  ["ALMOP", "Almopiens"], ["ALMOP_ADJ", "almopien"],
  ["ALZIY", "Alziya"], ["ALZIY_ADJ", "alziyen"],
  ["AMBAR", "Ambarres"], ["AMBAR_ADJ", "ambarrien"],
  ["AMURU", "Amurru"], ["AMURU_ADJ", "amurrien"],
  ["ANDES", "Andes"], ["ANDES_ADJ", "ande"],
  ["ARAX", "Araxes"], ["ARAX_ADJ", "araxe"],
  ["ARDIA", "Ardieens"], ["ARDIA_ADJ", "ardieen"],
  ["ARGAR", "El Argar"], ["ARGAR_ADJ", "argarien"],
  ["ARVER", "Arvernes"], ["ARVER_ADJ", "arverne"],
  ["ARWAD", "Arwad"], ["ARWAD_ADJ", "arwadi"],
  ["ASYRI", "Assyrie"], ["ASYRI_ADJ", "assyrien"],
  ["ATHENS", "Athenes"], ["ATHENS_ADJ", "athenien"],
  ["AZZI", "Azzi"], ["AZZI_ADJ", "azzien"],
  ["BAIOC", "Baiocasses"], ["BAIOC_ADJ", "baiocasse"],
  ["BALES", "Baleares"], ["BALES_ADJ", "baleare"],
  ["BALSA", "Balsa"], ["BALSA_ADJ", "balsien"],
  ["BERIT", "Berit"], ["BERIT_ADJ", "beritien"],
  ["BITUR", "Bituriges"], ["BITUR_ADJ", "biturige"],
  ["BOLI", "Boiens"], ["BOLI_ADJ", "boien"],
  ["BOSPH", "Bosphore thrace"], ["BOSPH_ADJ", "bosphorien"],
  ["BOTTI", "Bottiee"], ["BOTTI_ADJ", "bottieen"],
  ["BOULI", "Boulinioi"], ["BOULI_ADJ", "boulinien"],
  ["BYBLO", "Byblos"], ["BYBLO_ADJ", "byblien"],
  ["CALET", "Caletes"], ["CALET_ADJ", "calete"],
  ["CAMUN", "Camuni"], ["CAMUN_ADJ", "camunien"],
  ["CAONI", "Chaonie"], ["CAONI_ADJ", "chaonien"],
  ["CARNI", "Carni"], ["CARNI_ADJ", "carnien"],
  ["CARTI", "Carteia"], ["CARTI_ADJ", "carteien"],
  ["CORIO", "Coriosolites"], ["CORIO_ADJ", "coriosolite"],
  ["DAESI", "Desitiates"], ["DAESI_ADJ", "desitiate"],
  ["DARDN", "Dardaniens"], ["DARDN_ADJ", "dardanien"],
  ["DERRN", "Derrones"], ["DERRN_ADJ", "derronien"],
  ["DIMUN", "Dilmun"], ["DIMUN_ADJ", "dilmunite"],
  ["DOBER", "Doberes"], ["DOBER_ADJ", "doberien"],
  ["DOLOP", "Dolopie"], ["DOLOP_ADJ", "dolopien"],
  ["ELAM", "Elam"], ["ELAM_ADJ", "elamite"],
  ["ELIMI", "Elimi"], ["ELIMI_ADJ", "elimien"],
  ["ELMIT", "Elimiotis"], ["ELMIT_ADJ", "elimiote"],
  ["ELYMI", "Elymie"], ["ELYMI_ADJ", "elymien"],
  ["ESUVI", "Esuviens"], ["ESUVI_ADJ", "esuvien"],
  ["ETRUS", "Etrusques"], ["ETRUS_ADJ", "etrusque"],
  ["FALIS", "Falisques"], ["FALIS_ADJ", "falisque"],
  ["GABAL", "Gabales"], ["GABAL_ADJ", "gabale"],
  ["GETAE", "Getes"], ["GETAE_ADJ", "gete"],
  ["HABIR", "Habiru"], ["HABIR_ADJ", "habiru"],
  ["HAJAS", "Hayasa"], ["HAJAS_ADJ", "hayasien"],
  ["HAPAL", "Hapalla"], ["HAPAL_ADJ", "hapallien"],
  ["HELVE", "Helvetes"], ["HELVE_ADJ", "helvete"],
  ["HIERA", "Hierastamnoi"], ["HIERA_ADJ", "hierastamnien"],
  ["HISTI", "Histriens"], ["HISTI_ADJ", "histrien"],
  ["HYLLO", "Hylloi"], ["HYLLO_ADJ", "hyllien"],
  ["IAPYG", "Iapygie"], ["IAPYG_ADJ", "iapygien"],
  ["IOLCUS", "Iolcos"], ["IOLCUS_ADJ", "iolcien"],
  ["INSUB", "Insubres"], ["INSUB_ADJ", "insubre"],
  ["IONIA", "Ionie"], ["IONIA_ADJ", "ionien"],
  ["KARKA", "Karkamissa"], ["KARKA_ADJ", "karkamissien"],
  ["KASKA", "Kaska"], ["KASKA_ADJ", "kaskan"],
  ["KASSI", "Kassites"], ["KASSI_ADJ", "kassite"],
  ["KUWAL", "Kuwal"], ["KUWAL_ADJ", "kuwalien"],
  ["LAEAE", "Leaeens"], ["LAEAE_ADJ", "leaeen"],
  ["LATIN", "Latins"], ["LATIN_ADJ", "latin"],
  ["LAZPA", "Lazpa"], ["LAZPA_ADJ", "lazpan"],
  ["LEPON", "Lepontiens"], ["LEPON_ADJ", "lepontien"],
  ["LEXOV", "Lexoviens"], ["LEXOV_ADJ", "lexovien"],
  ["LIBUR", "Liburnie"], ["LIBUR_ADJ", "liburnien"],
  ["LIBYA", "Libye"], ["LIBYA_ADJ", "libyen"],
  ["LIGUR", "Ligures"], ["LIGUR_ADJ", "ligure"],
  ["LUKKA", "Lukka"], ["LUKKA_ADJ", "lukkain"],
  ["MAGAN", "Magan"], ["MAGAN_ADJ", "maganais"],
  ["MALAK", "Malaka"], ["MALAK_ADJ", "malakien"],
  ["MANIO", "Manioi"], ["MANIO_ADJ", "manien"],
  ["MANNA", "Mannee"], ["MANNA_ADJ", "manneen"],
  ["MARSI", "Marsiens"], ["MARSI_ADJ", "marsien"],
  ["MASA", "Masa"], ["MASA_ADJ", "masan"],
  ["MIRA", "Mira"], ["MIRA_ADJ", "miran"],
  ["MITAN", "Mitanni"], ["MITAN_ADJ", "mitannien"],
  ["MOESI", "Mesie"], ["MOESI_ADJ", "mesien"],
  ["MOLOS", "Molossie"], ["MOLOS_ADJ", "molossien"],
  ["NAMNE", "Namnetes"], ["NAMNE_ADJ", "namnete"],
  ["NESTI", "Nestioi"], ["NESTI_ADJ", "nestien"],
  ["NPICE", "Picenie du Nord"], ["NPICE_ADJ", "picenien"],
  ["NORIC", "Noriques"], ["NORIC_ADJ", "norique"],
  ["NURAG", "Nuragiques"], ["NURAG_ADJ", "nuragique"],
  ["OENOT", "Oenotriens"], ["OENOT_ADJ", "oenotrien"],
  ["ORCHOMENUS", "Orchomene"], ["ORCHOMENUS_ADJ", "orchomenien"],
  ["OSCAN", "Osques"], ["OSCAN_ADJ", "osque"],
  ["OSISM", "Osismes"], ["OSISM_ADJ", "osisme"],
  ["PAEON", "Peonie"], ["PAEON_ADJ", "peonien"],
  ["PAEOP", "Paeoplae"], ["PAEOP_ADJ", "paeoplaeen"],
  ["PAGON", "Pagonia"], ["PAGON_ADJ", "pagonien"],
  ["PALA", "Pala"], ["PALA_ADJ", "palan"],
  ["PARTH", "Partha"], ["PARTH_ADJ", "parthan"],
  ["PICTO", "Pictons"], ["PICTO_ADJ", "picton"],
  ["POTUL", "Potulatenses"], ["POTUL_ADJ", "potulatense"],
  ["PYLOS", "Pylos"], ["PYLOS_ADJ", "pylien"],
  ["RAETI", "Rhetes"], ["RAETI_ADJ", "rhete"],
  ["REDON", "Redones"], ["REDON_ADJ", "redon"],
  ["RHODES", "Rhodes"], ["RHODES_ADJ", "rhodien"],
  ["RUTEN", "Rutenes"], ["RUTEN_ADJ", "rutene"],
  ["SAHIR", "Sahiriya"], ["SAHIR_ADJ", "sahiriyen"],
  ["SALLU", "Salluviens"], ["SALLU_ADJ", "salluvien"],
  ["SANTN", "Santans"], ["SANTN_ADJ", "santan"],
  ["SASU", "Sasu"], ["SASU_ADJ", "sasuen"],
  ["SCORD", "Scordisques"], ["SCORD_ADJ", "scordisque"],
  ["SCYTH", "Scythes"], ["SCYTH_ADJ", "scythe"],
  ["SEHA", "Pays du fleuve Seha"], ["SEHA_ADJ", "sehan"],
  ["SEGUS", "Segusiaves"], ["SEGUS_ADJ", "segusiave"],
  ["SENOM", "Senomes"], ["SENOM_ADJ", "senome"],
  ["SENON", "Senons"], ["SENON_ADJ", "senon"],
  ["SEQUA", "Sequanes"], ["SEQUA_ADJ", "sequane"],
  ["SICAN", "Sicanie"], ["SICAN_ADJ", "sicanien"],
  ["SICEL", "Sicules"], ["SICEL_ADJ", "sicule"],
  ["SIBUZ", "Sibuzates"], ["SIBUZ_ADJ", "sibuzate"],
  ["SIROP", "Siropaines"], ["SIROP_ADJ", "siropainien"],
  ["SOTIA", "Sotiates"], ["SOTIA_ADJ", "sotiate"],
  ["SPARTA", "Sparte"], ["SPARTA_ADJ", "spartiate"],
  ["SPICE", "Picenie du Sud"], ["SPICE_ADJ", "picenien"],
  ["SURRT", "Surrtenia"], ["SURRT_ADJ", "surrtenien"],
  ["SUTU", "Sutu"], ["SUTU_ADJ", "sutuen"],
  ["TARAN", "Tarentins"], ["TARAN_ADJ", "tarentin"],
  ["TARDL", "Tardelle"], ["TARDL_ADJ", "tardelle"],
  ["TARTS", "Tartessos"], ["TARTS_ADJ", "tartessien"],
  ["TAULA", "Taulantioi"], ["TAULA_ADJ", "taulantien"],
  ["TAURI", "Taurisques"], ["TAURI_ADJ", "taurien"],
  ["TESPR", "Thesprotie"], ["TESPR_ADJ", "thesprotien"],
  ["THEBES", "Thebes"], ["THEBES_ADJ", "thebain"],
  ["THRAC", "Thrace"], ["THRAC_ADJ", "thrace"],
  ["TORRI", "Torreens"], ["TORRI_ADJ", "torreen"],
  ["TRPOL", "Tripoli"], ["TRPOL_ADJ", "tripolitain"],
  ["UGART", "Ougarit"], ["UGART_ADJ", "ougaritique"],
  ["ULIBA", "Uliba"], ["ULIBA_ADJ", "ulibien"],
  ["UMBRI", "Ombriens"], ["UMBRI_ADJ", "ombrien"],
  ["UNELL", "Unelles"], ["UNELL_ADJ", "unelle"],
  ["URATU", "Urartu"], ["URATU_ADJ", "urarteen"],
  ["VASAT", "Vasates"], ["VASAT_ADJ", "vasate"],
  ["VENET", "Venetes"], ["VENET_ADJ", "venete"],
  ["VENES", "Venetes armoricains"], ["VENES_ADJ", "venete"],
  ["VESTI", "Vestins"], ["VESTI_ADJ", "vestin"],
  ["VELIO", "Veliocasses"], ["VELIO_ADJ", "veliocasse"],
  ["VELLA", "Vellaves"], ["VELLA_ADJ", "vellave"],
  ["VIDUC", "Viducasses"], ["VIDUC_ADJ", "viducasse"],
  ["VOCAN", "Voconces"], ["VOCAN_ADJ", "voconcien"],
  ["VOLAR", "Volques arecomiques"], ["VOLAR_ADJ", "arecomique"],
  ["VOLTE", "Volques tectosages"], ["VOLTE_ADJ", "tectosage"],
  ["VOLSC", "Volsques"], ["VOLSC_ADJ", "volsque"],
  ["WALAN", "Walan"], ["WALAN_ADJ", "walan"],
  ["WILUS", "Wilusa"], ["WILUS_ADJ", "wilusien"],
]);

function readText(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n") : "";
}

function parseLocalization(text) {
  const values = new Map();
  for (const line of text.split("\n")) {
    const match = line.match(/^\s*([A-Za-z0-9_]+):\s*"(.*)"\s*$/);
    if (match) values.set(match[1], match[2]);
  }
  return values;
}

function fileHasHeader(text, language) {
  return new RegExp(`^\\s*l_${language}:`, "m").test(text);
}

function syncFile(englishFile) {
  const englishText = readText(englishFile);
  const englishValues = parseLocalization(englishText);
  const frenchName = path.basename(englishFile).replace(/_l_english\.yml$/, "_l_french.yml");
  const existingFrench = parseLocalization(readText(
    frenchDirs.map((dir) => path.join(dir, frenchName)).find((file) => fs.existsSync(file)) || ""
  ));
  const lines = ["l_french:"];
  let filledFromExisting = 0;
  let filledFromManual = 0;
  let filledFromEnglish = 0;

  for (const [key, englishValue] of englishValues) {
    let value = englishValue;
    if (countryFrench.has(key)) {
      value = countryFrench.get(key);
      filledFromManual++;
    } else if (existingFrench.has(key)) {
      value = existingFrench.get(key);
      filledFromExisting++;
    } else {
      filledFromEnglish++;
    }
    lines.push(` ${key}: "${value.replace(/"/g, '\\"')}"`);
  }

  const writtenFiles = [];
  for (const frenchDir of frenchDirs) {
    const frenchFile = path.join(frenchDir, frenchName);
    fs.mkdirSync(frenchDir, { recursive: true });
    fs.writeFileSync(frenchFile, `\uFEFF${lines.join("\n")}\n`, "utf8");
    writtenFiles.push(path.relative(root, frenchFile));
  }
  return {
    file: writtenFiles.join(", "),
    keys: englishValues.size,
    filledFromExisting,
    filledFromManual,
    filledFromEnglish,
    hadEnglishHeader: fileHasHeader(englishText, "english"),
  };
}

const englishFilesByName = new Map();
for (const englishDir of englishDirs) {
  if (!fs.existsSync(englishDir)) continue;
  for (const name of fs.readdirSync(englishDir).filter((fileName) => fileName.endsWith("_l_english.yml")).sort()) {
    if (!englishFilesByName.has(name)) englishFilesByName.set(name, path.join(englishDir, name));
  }
}
const englishFiles = [...englishFilesByName.values()].sort();

const results = englishFiles.map(syncFile);

const report = [
  "Bronze Era French localization sync",
  "===================================",
  "",
  ...results.flatMap((result) => [
    result.file,
    `- keys: ${result.keys}`,
    `- manual French values: ${result.filledFromManual}`,
    `- preserved existing French values: ${result.filledFromExisting}`,
    `- English fallback values: ${result.filledFromEnglish}`,
    `- English header valid: ${result.hadEnglishHeader ? "yes" : "no"}`,
    "",
  ]),
].join("\n");

fs.writeFileSync(reportPath, report, "utf8");
console.log(report);
