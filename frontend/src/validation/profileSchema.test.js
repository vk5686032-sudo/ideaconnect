// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { profileSchema } from '../validation/profileSchema';

const edu = (over = {}) => ({ institution: 'VT University', ...over });

describe('profileSchema â€” education years', () => {
  // The AC asks for 4-digit years. The rule existed but had no error renderer
  // in the form, so entering 2 digits silently blocked the save.
  it('rejects a 2-digit start year', () => {
    const r = profileSchema.safeParse({ name: 'Someone', education: [edu({ startYear: '20' })] });
    expect(r.success).toBe(false);
  });

  it('rejects a 3-digit year', () => {
    const r = profileSchema.safeParse({ name: 'Someone', education: [edu({ startYear: '201' })] });
    expect(r.success).toBe(false);
  });

  it('rejects a year outside a plausible range', () => {
    expect(profileSchema.safeParse({ name: 'Someone', education: [edu({ startYear: '1800' })] }).success).toBe(false);
    expect(profileSchema.safeParse({ name: 'Someone', education: [edu({ endYear: '9999' })] }).success).toBe(false);
  });

  it('accepts a 4-digit year, as a string or a number', () => {
    expect(profileSchema.safeParse({ name: 'Someone', education: [edu({ startYear: '2019' })] }).success).toBe(true);
    expect(profileSchema.safeParse({ name: 'Someone', education: [edu({ startYear: 2019 })] }).success).toBe(true);
  });

  it('treats an empty year as absent rather than invalid', () => {
    const r = profileSchema.safeParse({ name: 'Someone', education: [edu({ startYear: '', endYear: '' })] });
    expect(r.success).toBe(true);
  });

  it('requires an institution, and says so in the message', () => {
    // The form registers every field, so a blank entry arrives as '' rather than
    // undefined — and '' is what reaches the custom message. A missing key gets
    // zod's generic "Required" instead, which is worth knowing but is not what
    // the form produces.
    const r = profileSchema.safeParse({ name: 'Someone', education: [{ institution: '', degree: 'BTech' }] });
    expect(r.success).toBe(false);
    // The message is what the form renders, so it has to be useful.
    expect(JSON.stringify(r.error?.issues || [])).toMatch(/institution is required/i);
  });
});

describe('profileSchema â€” experience', () => {
  it('requires a company', () => {
    expect(profileSchema.safeParse({ name: 'Someone', experience: [{ position: 'Dev' }] }).success).toBe(false);
  });

  it('accepts an experience with a company and the current flag', () => {
    const r = profileSchema.safeParse({
      name: 'Someone',
      experience: [{ company: 'Acme', position: 'Dev', current: true }],
    });
    expect(r.success).toBe(true);
  });
});
