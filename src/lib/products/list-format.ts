const listMarkers = /^(?:(?:[-*•●▪◦‣]\s*)|(?:\d+[.)]\s*))+/;

function splitTitleCaseList(value: string) {
  const words = value.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  let current: string[] = [];

  for (const word of words) {
    const previous = current[current.length - 1];
    const startsNewEntry = Boolean(
      previous
      && /^[A-Z]/.test(word)
      && (/[a-z]$/.test(previous) || previous.includes("/")),
    );
    if (startsNewEntry && current.length >= 2) {
      chunks.push(current.join(" "));
      current = [];
    }
    current.push(word);
  }
  if (current.length) chunks.push(current.join(" "));

  const hasListShape = words.length >= 8
    && chunks.length >= 4
    && chunks.every((chunk) => {
      const count = chunk.split(/\s+/).length;
      return count >= 2 && count <= 10;
    });
  return hasListShape ? chunks : [value];
}

export function formatProductListItems(values: readonly string[]) {
  return values.flatMap((value) => {
    const lines = value
      .replace(/\r\n?/g, "\n")
      .split(/\n+|[•●▪◦‣]\s*|;\s*|\s+\|\s+/)
      .map((line) => line.replace(listMarkers, "").trim())
      .filter(Boolean);
    return lines.flatMap(splitTitleCaseList);
  });
}

export function parseProductListText(value: string) {
  return formatProductListItems([value]);
}
