/** Parse an import file, preserving commas and line breaks inside quoted fields. */
export function parseCSV(text: string): Record<string, string>[] {
  const lines: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  let closedQuote = false;

  function finishCell() {
    row.push(cell.trim());
    cell = "";
    closedQuote = false;
  }

  function finishRow() {
    finishCell();
    if (row.some(Boolean)) lines.push(row);
    row = [];
  }

  text = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < text.length; i++) {
    const character = text[i];
    if (quoted) {
      if (character !== '"') cell += character;
      else if (text[i + 1] === '"') {
        cell += '"';
        i++;
      } else {
        quoted = false;
        closedQuote = true;
      }
    } else if (character === ",") {
      finishCell();
    } else if (character === "\n" || character === "\r") {
      if (character === "\r" && text[i + 1] === "\n") i++;
      finishRow();
    } else if (closedQuote) {
      if (character !== " " && character !== "\t") {
        throw new Error("Unexpected character after closing quote.");
      }
    } else if (character === '"') {
      if (cell.length) throw new Error("Unexpected quote.");
      quoted = true;
    } else {
      cell += character;
    }
  }

  if (quoted) throw new Error("Unclosed quoted CSV field.");
  finishRow();
  if (lines.length < 2)
    throw new Error("Include headers and at least one data row.");
  const headers = lines.shift()!.map((header) => header.toLowerCase());
  if (headers.some((header) => !header))
    throw new Error("CSV headers cannot be empty.");
  if (new Set(headers).size !== headers.length)
    throw new Error("Duplicate CSV headers.");
  return lines.map((values, index) => {
    if (values.length !== headers.length) {
      throw new Error(`Row ${index + 2}: incorrect number of columns.`);
    }
    return Object.fromEntries(
      headers.map((header, column) => [header, values[column]]),
    );
  });
}
