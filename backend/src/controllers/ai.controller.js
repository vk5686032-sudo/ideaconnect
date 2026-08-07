const Idea = require('../models/Idea');
const { successResponse, errorResponse } = require('../utils/response');
const aiService = require('../services/ai.service');

// Analyze idea with AI
exports.analyzeIdea = async (req, res, next) => {
  try {
    const { id } = req.params;

    const idea = await Idea.findById(id);
    if (!idea) {
      return errorResponse(res, 404, 'Idea not found');
    }

    // Check ownership or admin
    if (idea.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return errorResponse(res, 403, 'Not authorized');
    }

    // Analyze idea
    const analysis = await aiService.analyzeIdea(idea);

    // Update idea with AI analysis
    idea.aiAnalysis = {
      suggestions: analysis.suggestions,
      challenges: analysis.challenges,
      recommendedTechnologies: analysis.technologies,
      analyzedAt: new Date(),
    };
    idea.feasibilityScore = analysis.feasibilityScore;
    idea.innovationScore = analysis.innovationScore;

    await idea.save();

    successResponse(res, 200, 'Idea analyzed successfully', {
      feasibilityScore: analysis.feasibilityScore,
      innovationScore: analysis.innovationScore,
      suggestions: analysis.suggestions,
      challenges: analysis.challenges,
      technologies: analysis.technologies,
    });
  } catch (error) {
    next(error);
  }
};

// Get similar ideas
exports.getSimilarIdeas = async (req, res, next) => {
  try {
    const { id } = req.params;

    const idea = await Idea.findById(id);
    if (!idea) {
      return errorResponse(res, 404, 'Idea not found');
    }

    const similarIdeas = await aiService.findSimilarIdeas(idea);

    successResponse(res, 200, 'Similar ideas found', similarIdeas);
  } catch (error) {
    next(error);
  }
};

// Improve idea title
exports.improveTitle = async (req, res, next) => {
  try {
    const { title, description } = req.body;

    const suggestions = await aiService.suggestTitleImprovements(title, description);

    successResponse(res, 200, 'Title suggestions generated', suggestions);
  } catch (error) {
    next(error);
  }
};

// Improve idea description
exports.improveDescription = async (req, res, next) => {
  try {
    const { title, description } = req.body;

    const improved = await aiService.improveDescription(title, description);

    successResponse(res, 200, 'Description improved', { improvedDescription: improved });
  } catch (error) {
    next(error);
  }
};

// Suggest teammates
exports.suggestTeammates = async (req, res, next) => {
  try {
    const { id } = req.params;

    const idea = await Idea.findById(id);
    if (!idea) {
      return errorResponse(res, 404, 'Idea not found');
    }

    const teammates = await aiService.suggestTeammates(idea);

    successResponse(res, 200, 'Teammate suggestions generated', teammates);
  } catch (error) {
    next(error);
  }
};

// Check for duplicates
exports.checkDuplicates = async (req, res, next) => {
  try {
    const { title, description } = req.body;

    const duplicates = await aiService.checkDuplicateIdeas(title, description);

    successResponse(res, 200, 'Duplicate check completed', duplicates);
  } catch (error) {
    next(error);
  }
};

// Get AI recommendations for user
exports.getRecommendations = async (req, res, next) => {
  try {
    const recommendations = await aiService.getPersonalizedRecommendations(req.user);

    successResponse(res, 200, 'Recommendations generated', recommendations);
  } catch (error) {
    next(error);
  }
};
