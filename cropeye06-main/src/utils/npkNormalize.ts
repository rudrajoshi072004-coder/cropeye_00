/**
 * required-n API returns soilN, soilP, soilK; the Fertilizer UI uses N, P, K.
 * Preloaders/cache often store the raw API shape — normalize on read/write.
 */
export function normalizeNpkFromApi(json: any): any {
  if (!json || typeof json !== "object") return {};
  const N = json.N ?? json.soilN;
  const P = json.P ?? json.soilP;
  const K = json.K ?? json.soilK;
  return {
    ...json,
    N,
    P,
    K,
  };
}

/** True when soil N/P/K are present and numeric (matches successful required-n responses). */
export function isValidSoilNpkResponse(json: any): boolean {
  if (!json || typeof json !== "object") return false;
  const n = json.soilN ?? json.N;
  const p = json.soilP ?? json.P;
  const k = json.soilK ?? json.K;
  return [n, p, k].every((v) => v !== undefined && v !== null && Number.isFinite(Number(v)));
}
