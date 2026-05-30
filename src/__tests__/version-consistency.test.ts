import { describe, it, expect } from 'vitest';
import { CHANGELOG } from '../lib/changelog';
import { APP_DEFAULT_VERSION, validateVersion } from '../lib/appConfig';
import { VERSION } from '../lib/version';
import pkg from '../../package.json';

describe('version consistency', () => {
  it('CHANGELOG latest entry matches VERSION constant', () => {
    expect(VERSION).toBe(CHANGELOG[0].version);
  });

  it('package.json version matches changelog latest', () => {
    expect(pkg.version).toBe(CHANGELOG[0].version);
  });

  it('APP_DEFAULT_VERSION matches changelog latest', () => {
    expect(APP_DEFAULT_VERSION).toBe(CHANGELOG[0].version);
  });

  it('all changelog versions are valid semver', () => {
    for (const entry of CHANGELOG) {
      expect(validateVersion(entry.version)).toBe(true);
    }
  });

  it('changelog is sorted descending (newest first)', () => {
    for (let i = 1; i < CHANGELOG.length; i++) {
      const prev = CHANGELOG[i - 1].version.split('.').map(Number);
      const curr = CHANGELOG[i].version.split('.').map(Number);
      for (let j = 0; j < 3; j++) {
        if (prev[j] !== curr[j]) {
          expect(prev[j]).toBeGreaterThan(curr[j]);
          break;
        }
      }
    }
  });
});
