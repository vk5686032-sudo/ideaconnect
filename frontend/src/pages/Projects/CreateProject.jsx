import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';
import BackButton from '../../components/common/BackButton';
import projectApi from '../../api/project.api';
import ideaApi from '../../api/idea.api';

const projectSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().min(20, 'Description must be at least 20 characters').max(5000),
  repository: z.string().url('Invalid URL').optional().or(z.literal('')),
  demoUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  deadline: z.string().optional(),
});

const CreateProject = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const ideaId = searchParams.get('idea');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [technologies, setTechnologies] = useState([]);
  const [techInput, setTechInput] = useState('');

  const isEditing = !!id;

  const { data: ideaData } = useQuery({
    queryKey: ['idea', ideaId],
    queryFn: () => ideaApi.getById(ideaId),
    enabled: !!ideaId,
  });

  const idea = ideaData?.data?.data;

  const { data: existingData } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectApi.getById(id),
    enabled: isEditing,
  });

  const existingProject = existingData?.data?.data;

  // Format deadline for date input (YYYY-MM-DD)
  const formatDateForInput = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  };

  // Pre-fill technologies when editing an existing project
  useEffect(() => {
    if (existingProject?.technologies?.length) {
      setTechnologies(existingProject.technologies);
    }
  }, [existingProject?._id]);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: existingProject?.title || idea?.title || '',
      description: existingProject?.description || idea?.description || '',
      repository: existingProject?.repository || '',
      demoUrl: existingProject?.demoUrl || '',
      deadline: formatDateForInput(existingProject?.deadline) || '',
    },
  });

  const currentDeadline = watch('deadline');

  const createMutation = useMutation({
    mutationFn: (data) => (isEditing ? projectApi.update(id, data) : projectApi.create(data)),
    onSuccess: (response) => {
      queryClient.invalidateQueries(['projects']);
      toast.success(isEditing ? 'Project updated!' : 'Project created!');
      navigate(`/projects/${response.data.data._id}`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create project');
    },
  });

  const addTech = () => {
    if (techInput.trim() && !technologies.includes(techInput.trim())) {
      setTechnologies([...technologies, techInput.trim()]);
      setTechInput('');
    }
  };

  const onSubmit = (data) => {
    createMutation.mutate({
      ...data,
      ideaId: ideaId || undefined,
      technologies,
    });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-4">
        <BackButton />
      </div>
      <h1 className="text-2xl font-bold mb-8">{isEditing ? 'Edit Project' : 'Create New Project'}</h1>

      {idea && !isEditing && (
        <div className="card bg-primary-50 border-primary-200 mb-6">
          <h3 className="font-semibold mb-2">From Idea: "{idea.title}"</h3>
          <p className="text-sm text-gray-600 line-clamp-2">{idea.description}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input {...register('title')} className="input-field" placeholder="Project title" />
          {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            {...register('description')}
            className="input-field min-h-40"
            rows={6}
            placeholder="Describe your project..."
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Technologies</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {technologies.map((tech) => (
              <span key={tech} className="badge-primary flex items-center gap-1">
                {tech}
                <button type="button" onClick={() => setTechnologies(technologies.filter(t => t !== tech))}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={techInput}
              onChange={(e) => setTechInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTech())}
              placeholder="Add technology..."
              className="input-field"
            />
            <button type="button" onClick={addTech} className="btn-secondary">Add</button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Repository URL</label>
            <input {...register('repository')} className="input-field" placeholder="https://github.com/..." />
            {errors.repository && <p className="text-red-500 text-sm mt-1">{errors.repository.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Demo URL</label>
            <input {...register('demoUrl')} className="input-field" placeholder="https://..." />
            {errors.demoUrl && <p className="text-red-500 text-sm mt-1">{errors.demoUrl.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
            Deadline
            <span className="text-xs text-gray-400 font-normal">(optional)</span>
          </label>
          <div className="flex items-center gap-2">
            <input type="date" {...register('deadline')} className="input-field flex-1" />
            {currentDeadline && (
              <button
                type="button"
                onClick={() => setValue('deadline', '', { shouldValidate: true })}
                className="text-xs text-red-500 hover:text-red-700 font-medium"
                title="Remove deadline"
              >
                Remove
              </button>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" className="btn-primary flex items-center gap-2" disabled={createMutation.isPending}>
            {createMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Creating...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" /> {isEditing ? 'Update Project' : 'Create Project'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateProject;
