const productNoiseCharactersPattern = /[^\p{L}\p{N}\s]+/gu;

function collapseWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function normalizeProductName(value: string) {
  return collapseWhitespace(
    value
      .toLowerCase()
      .replace(/ё/g, "е")
      .replace(productNoiseCharactersPattern, " "),
  );
}

export function buildProductTokenKey(value: string) {
  const normalizedName = normalizeProductName(value);

  if (!normalizedName) {
    return "";
  }

  return [...new Set(normalizedName.split(" ").filter(Boolean))].sort().join("|");
}

export function getNormalizedProductKeys(value: string) {
  const normalizedName = normalizeProductName(value);

  return {
    normalizedName,
    tokenKey: buildProductTokenKey(normalizedName),
  };
}
