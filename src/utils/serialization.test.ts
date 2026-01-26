import { describe, expect, it } from 'vitest';

import { serialize } from './serialization';

describe('serialization utility', () => {
  it('should serialize Date objects to ISO strings', () => {
    const date = new Date('2023-01-01T00:00:00.000Z');
    const result = serialize(date);

    expect(result).toBe('2023-01-01T00:00:00.000Z');
  });

  it('should handle primitive values', () => {
    expect(serialize(123)).toBe(123);
    expect(serialize('test')).toBe('test');
    expect(serialize(true)).toBe(true);
    expect(serialize(null)).toBe(null);
    expect(serialize(undefined)).toBe(undefined);
  });

  it('should handle arrays recursively', () => {
    const date = new Date('2023-01-01T00:00:00.000Z');
    const input = [1, 'two', date];
    const result = serialize(input);

    expect(result).toEqual([1, 'two', '2023-01-01T00:00:00.000Z']);
  });

  it('should handle nested objects recursively', () => {
    const date = new Date('2023-01-01T00:00:00.000Z');
    const input = {
      id: 1,
      nested: {
        dateField: date,
        arrayField: [date, 'string'],
      },
    };

    const result = serialize(input);

    expect(result).toEqual({
      id: 1,
      nested: {
        dateField: '2023-01-01T00:00:00.000Z',
        arrayField: ['2023-01-01T00:00:00.000Z', 'string'],
      },
    });
  });

  it('should not mutate the original object', () => {
    const date = new Date('2023-01-01T00:00:00.000Z');
    const input = { date };
    const result = serialize(input);

    expect(input.date).toBeInstanceOf(Date);
    expect(result.date).toBeTypeOf('string');
  });
});
