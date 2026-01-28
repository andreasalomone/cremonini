import { describe, expect, it } from 'vitest';

import { getDocumentTypeFromPath } from './constants';

describe('getDocumentTypeFromPath', () => {
  describe('image files -> PHOTO_REPORT', () => {
    it.each([
      'org_123/documents/abc123.jpg',
      'org_123/documents/abc123.jpeg',
      'org_123/documents/abc123.png',
      'org_123/documents/abc123.webp',
      'org_123/documents/abc123.gif',
    ])('returns PHOTO_REPORT for %s', (path) => {
      expect(getDocumentTypeFromPath(path)).toBe('PHOTO_REPORT');
    });

    it('handles uppercase extensions', () => {
      expect(getDocumentTypeFromPath('org_123/docs/photo.JPG')).toBe('PHOTO_REPORT');
      expect(getDocumentTypeFromPath('org_123/docs/photo.PNG')).toBe('PHOTO_REPORT');
    });

    it('handles mixed case extensions', () => {
      expect(getDocumentTypeFromPath('org_123/docs/photo.JpG')).toBe('PHOTO_REPORT');
    });
  });

  describe('email files -> CORRESPONDENCE', () => {
    it.each([
      'org_123/documents/email.eml',
      'org_123/documents/outlook.msg',
    ])('returns CORRESPONDENCE for %s', (path) => {
      expect(getDocumentTypeFromPath(path)).toBe('CORRESPONDENCE');
    });

    it('handles uppercase email extensions', () => {
      expect(getDocumentTypeFromPath('org_123/docs/email.EML')).toBe('CORRESPONDENCE');
      expect(getDocumentTypeFromPath('org_123/docs/email.MSG')).toBe('CORRESPONDENCE');
    });
  });

  describe('default files -> CMR_DDT', () => {
    it.each([
      'org_123/documents/transport.pdf',
      'org_123/documents/document.doc',
      'org_123/documents/spreadsheet.xlsx',
      'org_123/documents/data.csv',
      'org_123/documents/archive.zip',
      'org_123/documents/unknown.xyz',
    ])('returns CMR_DDT for %s', (path) => {
      expect(getDocumentTypeFromPath(path)).toBe('CMR_DDT');
    });
  });

  describe('edge cases', () => {
    it('handles path with no extension', () => {
      expect(getDocumentTypeFromPath('org_123/documents/noextension')).toBe('CMR_DDT');
    });

    it('handles empty string', () => {
      expect(getDocumentTypeFromPath('')).toBe('CMR_DDT');
    });

    it('handles path with multiple dots', () => {
      expect(getDocumentTypeFromPath('org_123/docs/file.backup.jpg')).toBe('PHOTO_REPORT');
      expect(getDocumentTypeFromPath('org_123/docs/file.2024.01.pdf')).toBe('CMR_DDT');
    });

    it('handles path with only extension', () => {
      expect(getDocumentTypeFromPath('.jpg')).toBe('PHOTO_REPORT');
      expect(getDocumentTypeFromPath('.pdf')).toBe('CMR_DDT');
    });

    it('does not match partial extensions in filename', () => {
      // File named "jpgfile.pdf" should be CMR_DDT, not PHOTO_REPORT
      expect(getDocumentTypeFromPath('org_123/jpgfile.pdf')).toBe('CMR_DDT');
    });

    it('handles deeply nested paths', () => {
      expect(getDocumentTypeFromPath('org/a/b/c/d/e/f/photo.png')).toBe('PHOTO_REPORT');
    });
  });
});
