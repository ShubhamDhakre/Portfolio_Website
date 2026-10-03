import { Router } from 'express';
import { getSiteSettings } from '../services/settingsStore.js';

const router = Router();

/**
 * GET /api/site-settings
 * Safe public endpoint for all visitors to fetch current global settings & content.
 * Never exposes passwords, hashes, tokens, or private secrets.
 */
router.get('/', (req, res) => {
  try {
    const doc = getSiteSettings();

    // Sanitize and return only safe public fields
    const publicResponse = {
      version: doc.version || 1,
      updatedAt: doc.updatedAt || new Date().toISOString(),
      global: doc.global || doc.settings || {},
      settings: doc.settings || doc.global || {},
      content: {
        notes: doc.content?.notes || '',
        currentFocus: doc.content?.currentFocus || '',
        currentExperiment: doc.content?.currentExperiment || '',
        developerNote: doc.content?.developerNote || ''
      },
      customThemes: doc.customThemes || [],
      customBackgrounds: doc.customBackgrounds || []
    };

    // Cache control: allow browser cache for 15s with revalidation
    res.set('Cache-Control', 'public, max-age=15, stale-while-revalidate=45');
    return res.status(200).json(publicResponse);
  } catch (err) {
    console.error('Error fetching public site settings:', err);
    return res.status(500).json({
      error: 'Failed to retrieve site configuration',
      version: 1,
      global: {},
      settings: {},
      content: {},
      customThemes: [],
      customBackgrounds: []
    });
  }
});

export default router;
