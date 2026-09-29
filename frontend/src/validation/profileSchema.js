import { z } from 'zod';

// Split out of pages/Profile/Profile.jsx so it can be tested without pulling in
// the component's auth store, react-query and API dependencies. It is pure
// validation, and the year rule below had no error renderer in the form — so a
// 2-digit year blocked the save with nothing on screen explaining why.
const optionalUrl = z.string().url().optional().or(z.literal(''));

export const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  bio: z.string().max(500, 'Bio cannot exceed 500 characters').optional(),
  skills: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  education: z.array(z.object({
    institution: z.string().min(1, 'Institution is required'),
    degree: z.string().optional(),
    field: z.string().optional(),
    // 4-digit years, 1900-2100. The messages are what the form renders.
    startYear: z.coerce.number({ message: 'Start year must be a 4-digit year' })
      .int('Start year must be a 4-digit year')
      .min(1900, 'Start year must be a 4-digit year')
      .max(2100, 'Start year must be a 4-digit year')
      .optional().or(z.literal('')),
    endYear: z.coerce.number({ message: 'End year must be a 4-digit year' })
      .int('End year must be a 4-digit year')
      .min(1900, 'End year must be a 4-digit year')
      .max(2100, 'End year must be a 4-digit year')
      .optional().or(z.literal('')),
  })).optional(),
  experience: z.array(z.object({
    company: z.string().min(1, 'Company is required'),
    position: z.string().optional(),
    description: z.string().optional(),
    // There is no end date on an experience, only "still here" — so there is
    // nothing for the AC's "currently working hides the end date" to hide.
    current: z.boolean().optional(),
  })).optional(),
  socialLinks: z.object({
    github: optionalUrl,
    linkedin: optionalUrl,
    twitter: optionalUrl,
    portfolio: optionalUrl,
  }).optional(),
});
