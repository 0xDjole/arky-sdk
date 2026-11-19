export type E164Conversion =
  | { type: "number"; number: string }
  | { type: "empty" }
  | { type: "invalid_characters" }
  | { type: "unknown_country"; country: string }
  | { type: "national_prefix_missing"; prefix: string }
  | { type: "invalid_number" };

export type E164Refusal = Exclude<E164Conversion, { type: "number" }>;

type NationalNumbering =
  | { type: "trunk"; prefix: string }
  | { type: "kept" }
  | { type: "nanp" };

interface CountryNumbering {
  code: string;
  international: string;
  national: NationalNumbering;
}

function trunk(code: string, prefix: string, international = "00"): CountryNumbering {
  return { code, international, national: { type: "trunk", prefix } };
}

function kept(code: string): CountryNumbering {
  return { code, international: "00", national: { type: "kept" } };
}

function nanp(): CountryNumbering {
  return { code: "1", international: "011", national: { type: "nanp" } };
}

const NUMBERING: Readonly<Record<string, CountryNumbering>> = Object.freeze({
  AD: kept("376"),
  AL: trunk("355", "0"),
  AT: trunk("43", "0"),
  AU: trunk("61", "0", "0011"),
  BA: trunk("387", "0"),
  BE: trunk("32", "0"),
  BG: trunk("359", "0"),
  CA: nanp(),
  CH: trunk("41", "0"),
  CY: kept("357"),
  CZ: kept("420"),
  DE: trunk("49", "0"),
  DK: kept("45"),
  EE: kept("372"),
  ES: kept("34"),
  FI: trunk("358", "0"),
  FO: kept("298"),
  FR: trunk("33", "0"),
  GB: trunk("44", "0"),
  GG: trunk("44", "0"),
  GI: kept("350"),
  GL: kept("299"),
  GR: kept("30"),
  HR: trunk("385", "0"),
  HU: trunk("36", "06"),
  IE: trunk("353", "0"),
  IM: trunk("44", "0"),
  IS: kept("354"),
  IT: kept("39"),
  JE: trunk("44", "0"),
  LI: kept("423"),
  LU: kept("352"),
  LV: kept("371"),
  MC: kept("377"),
  MD: trunk("373", "0"),
  ME: trunk("382", "0"),
  MK: trunk("389", "0"),
  MT: kept("356"),
  NL: trunk("31", "0"),
  NO: kept("47"),
  NZ: trunk("64", "0"),
  PL: kept("48"),
  PT: kept("351"),
  RO: trunk("40", "0"),
  RS: trunk("381", "0"),
  SE: trunk("46", "0"),
  SI: trunk("386", "0"),
  SK: trunk("421", "0"),
  SM: kept("378"),
  TR: trunk("90", "0"),
  UA: trunk("380", "0"),
  US: nanp(),
  VA: kept("39"),
  XK: trunk("383", "0"),
});

const SEPARATORS = /[\s().\-/]/g;
const DIALED = /^\+?[0-9]+$/;
const E164 = /^\+[1-9][0-9]{6,14}$/;
const NANP_NUMBER = /^[2-9][0-9]{2}[2-9][0-9]{6}$/;

function checked(candidate: string): E164Conversion {
  return E164.test(candidate) ? { type: "number", number: candidate } : { type: "invalid_number" };
}

export function toE164(country: string, input: string): E164Conversion {
  const dialed = input.replace(SEPARATORS, "");
  if (dialed === "") return { type: "empty" };
  if (!DIALED.test(dialed)) return { type: "invalid_characters" };
  if (dialed.startsWith("+")) return checked(dialed);
  const numbering = NUMBERING[country.trim().toUpperCase()];
  if (!numbering) return { type: "unknown_country", country };
  if (dialed.startsWith(numbering.international)) {
    return checked(`+${dialed.slice(numbering.international.length)}`);
  }
  const national = numbering.national;
  if (national.type === "trunk") {
    if (!dialed.startsWith(national.prefix)) {
      return { type: "national_prefix_missing", prefix: national.prefix };
    }
    const subscriber = dialed.slice(national.prefix.length);
    if (subscriber.startsWith("0")) return { type: "invalid_number" };
    return checked(`+${numbering.code}${subscriber}`);
  }
  if (national.type === "kept") return checked(`+${numbering.code}${dialed}`);
  const local = dialed.length === 11 && dialed.startsWith("1") ? dialed.slice(1) : dialed;
  if (!NANP_NUMBER.test(local)) return { type: "invalid_number" };
  return checked(`+1${local}`);
}
