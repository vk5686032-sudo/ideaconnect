const axios = require('axios');
const User = require('../models/User');
const Idea = require('../models/Idea');
const config = require('../config/env');

const callOpenAI = async (prompt) => {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
        temperature: 0.7,
      },
      {
        headers: {
          'Authorization': `Bearer ${config.ai.openaiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API error:', error.response?.data || error.message);
    throw new Error('AI service unavailable');
  }
};

const analyzeIdea = async (idea) => {
  const prompt = `Analyze this idea and provide a structured assessment:

Title: ${idea.title}
Description: ${idea.description}
Category: ${idea.category}
Required Skills: ${idea.requiredSkills?.join(', ') || 'Not specified'}

Please provide:
1. Feasibility Score (0-100): How achievable is this idea?
2. Innovation Score (0-100): How innovative/unique is this idea?
3. Key Suggestions (3-5 bullet points for improvement)
4. Potential Challenges (3-5 bullet points)
5. Recommended Technologies/Tools (list 5-8)

Respond in JSON format:
{
  "feasibilityScore": number,
  "innovationScore": number,
  "suggestions": ["suggestion1", "suggestion2", ...],
  "challenges": ["challenge1", "challenge2", ...],
  "technologies": ["tech1", "tech2", ...]
}`;

  try {
    const response = await callOpenAI(prompt);
    return JSON.parse(response);
  } catch (error) {
    // Return mock data if AI is unavailable
    return {
      feasibilityScore: 75,
      innovationScore: 70,
      suggestions: [
        'Consider adding a unique value proposition',
        'Define clear success metrics',
        'Research existing solutions in the market',
      ],
      challenges: [
        'Market competition',
        'Technical complexity',
        'Resource requirements',
      ],
      technologies: ['React', 'Node.js', 'MongoDB', 'Express', 'Tailwind CSS'],
    };
  }
};

const findSimilarIdeas = async (idea) => {
  // Search for ideas with similar tags or title keywords
  const keywords = idea.title.split(' ').filter(w => w.length > 3);

  const similarIdeas = await Idea.find({
    _id: { $ne: idea._id },
    $or: [
      { tags: { $in: idea.tags } },
      { title: { $regex: keywords.join('|'), $options: 'i' } },
      { category: idea.category },
    ],
    visibility: 'public',
  })
    .populate('author', 'name avatar')
    .limit(5);

  return similarIdeas;
};

const suggestTitleImprovements = async (title, description) => {
  const prompt = `Suggest 3 improved versions of this idea title:

Current Title: ${title}
Description: ${description}

Provide catchy, clear, and professional title suggestions.
Respond as a JSON array: ["title1", "title2", "title3"]`;

  try {
    const response = await callOpenAI(prompt);
    return JSON.parse(response);
  } catch (error) {
    return [
      `${title} - Enhanced`,
      `Next-Gen ${title}`,
      `${title}: A Modern Approach`,
    ];
  }
};

const improveDescription = async (title, description) => {
  const prompt = `Improve this idea description to make it more compelling and clear:

Title: ${title}
Current Description: ${description}

Provide a well-structured description with:
- Clear problem statement
- Proposed solution
- Key features
- Target audience

Keep it under 300 words.`;

  try {
    return await callOpenAI(prompt);
  } catch (error) {
    return description;
  }
};

const suggestTeammates = async (idea) => {
  // Find users with matching skills
  const requiredSkills = idea.requiredSkills || [];

  const users = await User.find({
    _id: { $ne: idea.author },
    skills: { $in: requiredSkills },
  })
    .select('name avatar skills reputation')
    .limit(5);

  return users;
};

const checkDuplicateIdeas = async (title, description) => {
  const keywords = title.toLowerCase().split(' ').filter(w => w.length > 3);

  const potentialDuplicates = await Idea.find({
    $or: [
      { title: { $regex: keywords.join('|'), $options: 'i' } },
      { description: { $regex: keywords.slice(0, 3).join('|'), $options: 'i' } },
    ],
    visibility: 'public',
  })
    .populate('author', 'name avatar')
    .limit(5);

  return {
    hasDuplicates: potentialDuplicates.length > 0,
    similarIdeas: potentialDuplicates,
  };
};

const getPersonalizedRecommendations = async (user) => {
  // Get ideas matching user's interests and skills
  const recommendations = await Idea.find({
    $or: [
      { tags: { $in: user.interests || [] } },
      { requiredSkills: { $in: user.skills || [] } },
      { category: { $in: user.interests?.map(i => i.toLowerCase()) || [] } },
    ],
    author: { $ne: user._id },
    visibility: 'public',
    status: 'open',
  })
    .populate('author', 'name avatar')
    .sort({ createdAt: -1 })
    .limit(10);

  return recommendations;
};

module.exports = {
  analyzeIdea,
  findSimilarIdeas,
  suggestTitleImprovements,
  improveDescription,
  suggestTeammates,
  checkDuplicateIdeas,
  getPersonalizedRecommendations,
};
