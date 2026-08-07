const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const { protect } = require('../middlewares/auth');

router.use(protect);

router.post('/ideas/:id/analyze', aiController.analyzeIdea);
router.get('/ideas/:id/similar', aiController.getSimilarIdeas);
router.post('/improve/title', aiController.improveTitle);
router.post('/improve/description', aiController.improveDescription);
router.get('/ideas/:id/teammates', aiController.suggestTeammates);
router.post('/check-duplicates', aiController.checkDuplicates);
router.get('/recommendations', aiController.getRecommendations);

module.exports = router;
