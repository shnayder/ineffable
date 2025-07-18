/**
 * Count the number of occurrences of each string in the array.
 */
export function multisetCounts(arr: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const a of arr) {
    m.set(a, (m.get(a) ?? 0) + 1);
  }
  return m;
}

/**
 * Detect if two arrays contain the same multiset of strings but in a
 * different order.
 */
export function isReorderedSameParts(
  oldParts: string[],
  newParts: string[]
): boolean {
  if (oldParts.length !== newParts.length) return false;
  if (oldParts.join("|") === newParts.join("|")) return false;
  const oldCounts = multisetCounts(oldParts);
  const newCounts = multisetCounts(newParts);
  if (oldCounts.size !== newCounts.size) return false;
  for (const [k, v] of oldCounts) {
    if (newCounts.get(k) !== v) return false;
  }
  return true;
}

/**
 * Compute the multiset overlap between two token arrays.
 */
export function tokenOverlap(a: string[], b: string[]): number {
  const counts = multisetCounts(b);
  let match = 0;
  for (const t of a) {
    const c = counts.get(t);
    if (c && c > 0) {
      match++;
      counts.set(t, c - 1);
    }
  }
  return match;
}

/**
 * Result of attempting to match a new part to an old one.
 */
export interface PartReuse {
  oldIndex: number | null;
  exact: boolean;
}

/**
 * Greedily match an array of new text parts against a list of old parts.
 *
 * @param oldParts Array of old parts with their ids and text.
 * @param newParts Array of new text strings to match.
 * @param tokenizePart Function to split child text for overlap comparison.
 * @param threshold Minimum overlap ratio to consider a partial match.
 *
 * @returns Array of PartReuse objects indicating the match status of each new part.
 */
export function greedyMatchParts(
  oldParts: { id: string; text: string }[],
  newParts: string[],
  tokenizePart: (t: string) => string[],
  threshold = 0.25
): PartReuse[] {
  if (
    isReorderedSameParts(
      oldParts.map((p) => p.text),
      newParts
    )
  ) {
    return newParts.map(() => ({ oldIndex: null, exact: false }));
  }
  const result: PartReuse[] = [];
  // index into oldParts — will keep advancing as we find matches
  let startIdx = 0;

  // go through each new part and try to find a match
  for (const newText of newParts) {
    let matched: PartReuse | null = null;
    for (let j = startIdx; j < oldParts.length; j++) {
      const old = oldParts[j];
      if (old.text === newText) {
        matched = { oldIndex: j, exact: true };

        // once we use up an old part, advance the index
        startIdx = j + 1;
        break;
      }
      const overlap = tokenOverlap(
        tokenizePart(old.text),
        tokenizePart(newText)
      );
      const ratio =
        old.text.trim() === "" ? 0 : overlap / tokenizePart(old.text).length;
      if (ratio > threshold) {
        matched = { oldIndex: j, exact: false };
        startIdx = j + 1;
        break;
      }
    }
    if (!matched) {
      result.push({ oldIndex: null, exact: false });
    } else {
      result.push(matched);
    }
  }
  return result;
}
