'use strict';

import { describe, expect, it } from '@jest/globals';

import { arrayValuesToHtml, escapeHtml } from '../html';

describe('escapeHtml()', () => {
  it('renders script and event-handler payloads as text', () => {
    expect(escapeHtml("<script>alert('npy')</script>")).toBe(
      '&lt;script&gt;alert(&#39;npy&#39;)&lt;/script&gt;'
    );
    expect(escapeHtml('<img src=x onerror="alert(1)">')).toBe(
      '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;'
    );
  });

  it('escapes ampersands before other HTML metacharacters', () => {
    expect(escapeHtml('&lt;tag>')).toBe('&amp;lt;tag&gt;');
  });
});

describe('arrayValuesToHtml()', () => {
  it('escapes each array value without escaping the separators', () => {
    expect(arrayValuesToHtml(['<script>alert(1)</script>', '<img onerror=alert(2)>'])).toBe(
      '&lt;script&gt;alert(1)&lt;/script&gt;,&lt;img onerror=alert(2)&gt;'
    );
  });
});
