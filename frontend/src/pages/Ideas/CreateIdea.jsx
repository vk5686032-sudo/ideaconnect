import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Sparkles, Loader2, X, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import ideaApi from '../../api/idea.api';
import aiApi from '../../api/ai.api';
import { CATEGORIES, COMMON_SKILLS, VISIBILITY_OPTIONS } from '../../utils/constants';

const ideaSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().min(20, 'Description must be at least 20 characters').max(5000),
  category: z.string().min(1, 'Please select a category'),
  visibility: z.string(),
  tags: z.array(z.string()).optional(),
});

const CreateIdea = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const isEditing = !!id;

  const { data: existingData } = useQuery({
    queryKey: ['idea', id],
    queryFn: () => ideaApi.getById(id),
    enabled: isEditing,
  });

  const existingIdea = existingData?.data?.data;

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(ideaSchema),
    defaultValues: {
      title: existingIdea?.title || '',
      description: existingIdea?.description || '',
      category: existingIdea?.category || '',
      visibility: existingIdea?.visibility || 'public',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => (isEditing ? ideaApi.update(id, data) : ideaApi.create(data)),
    onSuccess: (response) => {
      queryClient.invalidateQueries(['ideas']);
      toast.success(isEditing ? 'Idea updated!' : 'Idea created!');
      navigate(`/ideas/${response.data.data._id}`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to save idea');
    },
  });

  const improveTitleMutation = useMutation({
    mutationFn: (data) => aiApi.improveTitle(data),
    onSuccess: (response) => {
      toast.success('AI title suggestions ready');
      setTitleSuggestions(response.data.data);
    },
  });

  const improveDescriptionMutation = useMutation({
    mutationFn: (data) => aiApi.improveDescription(data),
    onSuccess: (response) => {
      setValue('description', response.data.data.improvedDescription || response.data.data);
      toast.success('Description improved by AI');
    },
  });

  const checkDuplicatesMutation = useMutation({
    mutationFn: (data) => aiApi.checkDuplicates(data),
    onSuccess: (response) => {
      if (response.data.data.hasDuplicates) {
        toast.warning('Similar ideas found!');
      } else {
        toast.success('No duplicates found');
      }
    },
  });

  const [titleSuggestions, setTitleSuggestions] = useState([]);

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim().toLowerCase())) {
      setTags([...tags, tagInput.trim().toLowerCase()]);
      setTagInput('');
    }
  };

  const onSubmit = (data) => {
    createMutation.mutate({
      ...data,
      requiredSkills: skills,
      tags,
    });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">{isEditing ? 'Edit Idea' : 'Create New Idea'}</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input {...register('title')} className="input-field" placeholder="Give your idea a catchy title" />
          {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
          <button
            type="button"
            onClick={() => improveTitleMutation.mutate({
              title: setValue ? '' : '',
              description: setValue ? '' : '',
            })}
            className="mt-2 text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            <Sparkles className="w-4 h-4" /> Get AI suggestions
          </button>
          {titleSuggestions.length > 0 && (
            <div className="mt-2 space-y-2">
              {titleSuggestions.map((suggestion, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setValue('title', suggestion)}
                  className="block w-full text-left px-3 py-2 bg-gray-50 hover:bg-primary-50 rounded-lg text-sm"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            {...register('description')}
            className="input-field min-h-40"
            rows={6}
            placeholder="Describe your idea in detail - what problem does it solve, how does it work, who is it for?"
          />
          {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
          <button
            type="button"
            onClick={() => improveDescriptionMutation.mutate({
              title: document.querySelector('[name="title"]')?.value || '',
              description: document.querySelector('[name="description"]')?.value || '',
            })}
            className="mt-2 text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            <Sparkles className="w-4 h-4" /> Improve with AI
          </button>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select {...register('category')} className="input-field">
            <option value="">Select a category</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
          {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>}
        </div>

        {/* Visibility */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
          <select {...register('visibility')} className="input-field">
            {VISIBILITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Required Skills */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Required Skills</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {skills.map((skill) => (
              <span key={skill} className="badge-primary flex items-center gap-1">
                {skill}
                <button type="button" onClick={() => setSkills(skills.filter(s => s !== skill))}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
              placeholder="Add required skill..."
              className="input-field"
            />
            <button type="button" onClick={addSkill} className="btn-secondary">Add</button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {COMMON_SKILLS.slice(0, 10).map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => skills.includes(skill) ? setSkills(skills.filter(s => s !== skill)) : setSkills([...skills, skill])}
                className={`px-2 py-1 rounded-full text-xs transition-colors ${
                  skills.includes(skill) ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag) => (
              <span key={tag} className="badge bg-purple-100 text-purple-700 flex items-center gap-1">
                #{tag}
                <button type="button" onClick={() => setTags(tags.filter(t => t !== tag))}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            placeholder="Add tag and press Enter"
            className="input-field"
          />
        </div>

        <div className="flex justify-end">
          <button type="submit" className="btn-primary flex items-center gap-2" disabled={createMutation.isPending}>
            {createMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" /> {isEditing ? 'Update Idea' : 'Create Idea'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateIdea;
