import { describe, it, expect, vi } from 'vitest';
import { cn } from '@/utils/cn';
import { storage } from '@/utils/storage';
import { toSafeExternalUrl, toSafeInstagramUrl } from '@/utils/url';

describe('cn utility', () => {
  it('merges class names and ignores falsy values', () => {
    expect(cn('px-4', false && 'hidden', undefined, 'py-2')).toBe('px-4 py-2');
  });

  it('resolves Tailwind utility conflicts keeping the latest class', () => {
    expect(cn('px-2 bg-red-500', 'px-6 bg-blue-500')).toBe('px-6 bg-blue-500');
  });
});

describe('storage utility', () => {
  it('stores, retrieves, and removes auth token', () => {
    expect(storage.getToken()).toBeNull();
    storage.setToken('jwt-token-123');
    expect(storage.getToken()).toBe('jwt-token-123');
    storage.removeToken();
    expect(storage.getToken()).toBeNull();
  });

  it('serializes and deserializes arbitrary JSON items', () => {
    const prefs = { theme: 'warm', pageSize: 12 };
    storage.setItem('prefs', prefs);
    expect(storage.getItem<typeof prefs>('prefs')).toEqual(prefs);
    storage.removeItem('prefs');
    expect(storage.getItem('prefs')).toBeNull();
  });

  it('returns null on invalid JSON in localStorage', () => {
    localStorage.setItem('corrupted', '{invalid-json');
    expect(storage.getItem('corrupted')).toBeNull();
  });

  it('handles localStorage exceptions gracefully', () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('QuotaExceeded');
    });
    expect(storage.getToken()).toBeNull();
    spy.mockRestore();
  });
});

describe('url sanitization utilities', () => {
  it('allows http/https URLs and blocks javascript/data schemes', () => {
    expect(toSafeExternalUrl('https://refugio.org/info')).toBe('https://refugio.org/info');
    expect(toSafeExternalUrl('refugio.org')).toBe('https://refugio.org/');
    expect(toSafeExternalUrl('javascript:alert(1)')).toBeNull();
    expect(toSafeExternalUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
    expect(toSafeExternalUrl('')).toBeNull();
  });

  it('normalizes Instagram handles and blocks unsafe schemes', () => {
    expect(toSafeInstagramUrl('@refugio_cumpa')).toBe('https://instagram.com/refugio_cumpa');
    expect(toSafeInstagramUrl('refugio.oficial')).toBe('https://instagram.com/refugio.oficial');
    expect(toSafeInstagramUrl('https://instagram.com/cumpa')).toBe('https://instagram.com/cumpa');
    expect(toSafeInstagramUrl('javascript:alert(1)')).toBeNull();
    expect(toSafeInstagramUrl('invalid handle with spaces')).toBeNull();
  });
});
