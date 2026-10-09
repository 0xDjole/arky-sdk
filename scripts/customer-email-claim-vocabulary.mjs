export function customerEmailClaimContactOffsets(source) {
  return new Set(
    [...source.matchAll(/\bexport type CustomerEmailClaim\s*=\s*\|\s*\{\s*type:\s*["']contact["']\s*\}/g)]
      .map((match) => match.index + match[0].search(/["']contact["']/)),
  );
}
