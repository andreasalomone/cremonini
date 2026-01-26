/**
 * Deeply serializes data for passing between Server and Client Components.
 * Converts Date objects to ISO strings and handles nested objects/arrays recursively.
 *
 * Performance: O(n) traversal, avoids JSON.stringify/parse overhead for non-Date objects.
 */

// Helper type to infer the serialized shape of T
export type Serialized<T> = T extends Date
  ? string
  : T extends Array<infer U>
    ? Array<Serialized<U>>
    : T extends object
      ? { [K in keyof T]: Serialized<T[K]> }
      : T;

export function serialize<T>(data: T): Serialized<T> {
  if (data === null || data === undefined) {
    return data as any;
  }

  if (data instanceof Date) {
    return data.toISOString() as any;
  }

  if (Array.isArray(data)) {
    return data.map(item => serialize(item)) as any;
  }

  if (typeof data === 'object') {
    const result: any = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        result[key] = serialize((data as any)[key]);
      }
    }
    return result;
  }

  return data as any;
}
