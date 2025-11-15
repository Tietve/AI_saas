import { describe, it, expect } from 'vitest';
import {
  ICON_MAP,
  parseIconsInText,
  hasIcons,
  getAvailableIcons,
  getIcon,
  type IconComponent,
} from './iconParser';

describe('iconParser', () => {
  describe('ICON_MAP', () => {
    it('should contain common icon mappings', () => {
      expect(ICON_MAP.check).toBeDefined();
      expect(ICON_MAP.fire).toBeDefined();
      expect(ICON_MAP.rocket).toBeDefined();
      expect(ICON_MAP.heart).toBeDefined();
    });

    it('should have lowercase keys', () => {
      const keys = Object.keys(ICON_MAP);
      keys.forEach((key) => {
        expect(key).toBe(key.toLowerCase());
      });
    });
  });

  describe('parseIconsInText', () => {
    it('should parse text without icons', () => {
      const result = parseIconsInText('Hello world');
      expect(result).toEqual(['Hello world']);
    });

    it('should parse text with single icon', () => {
      const result = parseIconsInText('Hello :fire: world');
      expect(result).toHaveLength(3);
      expect(result[0]).toBe('Hello ');
      expect(result[1]).toEqual({
        type: 'icon',
        name: 'fire',
        Icon: ICON_MAP.fire,
      });
      expect(result[2]).toBe(' world');
    });

    it('should parse text with multiple icons', () => {
      const result = parseIconsInText(':rocket: :fire: :heart:');
      expect(result).toHaveLength(5);
      expect(result[0]).toEqual({
        type: 'icon',
        name: 'rocket',
        Icon: ICON_MAP.rocket,
      });
      expect(result[1]).toBe(' ');
      expect(result[2]).toEqual({
        type: 'icon',
        name: 'fire',
        Icon: ICON_MAP.fire,
      });
    });

    it('should handle unknown icons as text', () => {
      const result = parseIconsInText(':unknown_icon:');
      expect(result).toEqual([':unknown_icon:']);
    });

    it('should handle mixed known and unknown icons', () => {
      const result = parseIconsInText(':fire: :unknown: :rocket:');
      expect(result).toHaveLength(5);
      expect(result[0]).toEqual({
        type: 'icon',
        name: 'fire',
        Icon: ICON_MAP.fire,
      });
      expect(result[1]).toBe(' ');
      expect(result[2]).toBe(':unknown:');
      expect(result[3]).toBe(' ');
      expect(result[4]).toEqual({
        type: 'icon',
        name: 'rocket',
        Icon: ICON_MAP.rocket,
      });
    });

    it('should handle case-insensitive icon names', () => {
      const result = parseIconsInText(':FIRE: :Fire: :fire:');
      expect(result).toHaveLength(5);
      expect(result[0]).toEqual({
        type: 'icon',
        name: 'fire',
        Icon: ICON_MAP.fire,
      });
      expect(result[2]).toEqual({
        type: 'icon',
        name: 'fire',
        Icon: ICON_MAP.fire,
      });
      expect(result[4]).toEqual({
        type: 'icon',
        name: 'fire',
        Icon: ICON_MAP.fire,
      });
    });

    it('should handle empty string', () => {
      const result = parseIconsInText('');
      expect(result).toEqual([]);
    });

    it('should handle icons at start and end', () => {
      const result = parseIconsInText(':check: middle :x:');
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        type: 'icon',
        name: 'check',
        Icon: ICON_MAP.check,
      });
      expect(result[1]).toBe(' middle ');
      expect(result[2]).toEqual({
        type: 'icon',
        name: 'x',
        Icon: ICON_MAP.x,
      });
    });
  });

  describe('hasIcons', () => {
    it('should return true for text with icons', () => {
      expect(hasIcons('Hello :fire: world')).toBe(true);
      expect(hasIcons(':rocket:')).toBe(true);
      expect(hasIcons('Multiple :fire: :rocket: icons')).toBe(true);
    });

    it('should return false for text without icons', () => {
      expect(hasIcons('Hello world')).toBe(false);
      expect(hasIcons('')).toBe(false);
      expect(hasIcons('No icons here')).toBe(false);
    });

    it('should detect unknown icon syntax', () => {
      expect(hasIcons(':unknown_icon:')).toBe(true);
    });
  });

  describe('getAvailableIcons', () => {
    it('should return array of icon names', () => {
      const icons = getAvailableIcons();
      expect(Array.isArray(icons)).toBe(true);
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should return sorted icon names', () => {
      const icons = getAvailableIcons();
      const sorted = [...icons].sort();
      expect(icons).toEqual(sorted);
    });

    it('should include common icons', () => {
      const icons = getAvailableIcons();
      expect(icons).toContain('fire');
      expect(icons).toContain('rocket');
      expect(icons).toContain('heart');
      expect(icons).toContain('check');
    });
  });

  describe('getIcon', () => {
    it('should return icon component for valid name', () => {
      const icon = getIcon('fire');
      expect(icon).toBeDefined();
      expect(icon).toBe(ICON_MAP.fire);
    });

    it('should return undefined for invalid name', () => {
      const icon = getIcon('unknown_icon');
      expect(icon).toBeUndefined();
    });

    it('should handle case-insensitive lookup', () => {
      const lowercase = getIcon('fire');
      const uppercase = getIcon('FIRE');
      const mixed = getIcon('Fire');
      expect(lowercase).toBe(ICON_MAP.fire);
      expect(uppercase).toBe(ICON_MAP.fire);
      expect(mixed).toBe(ICON_MAP.fire);
    });

    it('should handle empty string', () => {
      const icon = getIcon('');
      expect(icon).toBeUndefined();
    });
  });

  describe('Type Guards Fix', () => {
    it('should properly handle undefined icon with !== undefined check', () => {
      // This test verifies the fix for TS2774
      const result = parseIconsInText(':unknown:');
      // Unknown icon should be kept as text, not as icon object
      expect(result).toEqual([':unknown:']);
    });

    it('should properly type guard defined icons', () => {
      // This test verifies defined icons are correctly identified
      const result = parseIconsInText(':fire:');
      expect(result[0]).toHaveProperty('type', 'icon');
      expect(result[0]).toHaveProperty('Icon');
    });
  });
});
