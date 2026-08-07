import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, MapPin, Calendar, Globe, Edit2, Save, X } from 'lucide-react';
import { GithubIcon, LinkedinIcon } from '../../components/common/BrandIcons';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authSlice';
import api from '../../api/axios';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  bio: z.string().max(500, 'Bio cannot exceed 500 characters').optional(),
  skills: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  socialLinks: z.object({
    github: z.string().url().optional().or(z.literal('')),
    linkedin: z.string().url().optional().or(z.literal('')),
    portfolio: z.string().url().optional().or(z.literal('')),
  }).optional(),
});

const Profile = () => {
  const { id } = useParams();
  const { user } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const queryClient = useQueryClient();

  // Use route param id if present; fall back to logged-in user's id
  const targetId = id || user?._id;
  const isOwnProfile = !id || id === user?._id;

  const { data: userData } = useQuery({
    queryKey: ['user', targetId],
    queryFn: () => api.get(`/users/${targetId}`),
    enabled: !!targetId,
  });

  const profile = userData?.data?.data || user;

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profile?.name || '',
      bio: profile?.bio || '',
      skills: profile?.skills || [],
      interests: profile?.interests || [],
      socialLinks: profile?.socialLinks || {},
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => api.put('/users/profile', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['user']);
      toast.success('Profile updated successfully');
      setIsEditing(false);
    },
    onError: () => {
      toast.error('Failed to update profile');
    },
  });

  const onSubmit = (data) => {
    updateMutation.mutate(data);
  };

  const addSkill = () => {
    if (skillInput.trim()) {
      const currentSkills = watch('skills') || [];
      if (!currentSkills.includes(skillInput.trim())) {
        setValue('skills', [...currentSkills, skillInput.trim()]);
      }
      setSkillInput('');
    }
  };

  const removeSkill = (skill) => {
    const currentSkills = watch('skills') || [];
    setValue('skills', currentSkills.filter((s) => s !== skill));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
          <div className="flex items-center gap-4 min-w-0">
            {profile?.avatar?.url ? (
              <img src={profile.avatar.url} alt={profile.name} className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex-shrink-0" />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                <User className="w-10 h-10 sm:w-12 sm:h-12 text-primary-600" />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold truncate">{profile?.name}</h1>
              <p className="text-gray-600 truncate">{profile?.email}</p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className={`badge ${profile?.role === 'admin' ? 'badge-error' : profile?.role === 'mentor' ? 'badge-success' : 'badge-primary'}`}>
                  {profile?.role}
                </span>
                {profile?.isVerified && (
                  <span className="badge-success">Verified</span>
                )}
              </div>
            </div>
          </div>
          {isOwnProfile && (
            <button onClick={() => setIsEditing(!isEditing)} className="btn-outline flex items-center gap-2 justify-center sm:self-start flex-shrink-0">
              {isEditing ? <X className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input {...register('name')} className="input-field" />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea {...register('bio')} className="input-field" rows={4} placeholder="Tell us about yourself..." />
              {errors.bio && <p className="text-red-500 text-sm mt-1">{errors.bio.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {(watch('skills') || []).map((skill) => (
                  <span key={skill} className="badge-primary flex items-center gap-1">
                    {skill}
                    <button type="button" onClick={() => removeSkill(skill)} className="hover:text-red-600">
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
                  placeholder="Add a skill..."
                  className="input-field"
                />
                <button type="button" onClick={addSkill} className="btn-secondary">Add</button>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <GithubIcon className="w-4 h-4" /> GitHub
                </label>
                <input {...register('socialLinks.github')} className="input-field" placeholder="https://github.com/..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <LinkedinIcon className="w-4 h-4" /> LinkedIn
                </label>
                <input {...register('socialLinks.linkedin')} className="input-field" placeholder="https://linkedin.com/in/..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Globe className="w-4 h-4" /> Portfolio
                </label>
                <input {...register('socialLinks.portfolio')} className="input-field" placeholder="https://..." />
              </div>
            </div>

            <button type="submit" className="btn-primary flex items-center gap-2" disabled={updateMutation.isPending}>
              <Save className="w-5 h-5" />
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            {profile?.bio && (
              <div>
                <h3 className="font-semibold mb-2">About</h3>
                <p className="text-gray-600">{profile.bio}</p>
              </div>
            )}

            {profile?.skills?.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill) => (
                    <span key={skill} className="badge-primary">{skill}</span>
                  ))}
                </div>
              </div>
            )}

            {profile?.interests?.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest) => (
                    <span key={interest} className="badge-success">{interest}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Joined {new Date(profile?.createdAt).toLocaleDateString()}
              </div>
              {profile?.socialLinks?.github && (
                <a href={profile.socialLinks.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary-600">
                  <GithubIcon className="w-4 h-4" /> GitHub
                </a>
              )}
              {profile?.socialLinks?.linkedin && (
                <a href={profile.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary-600">
                  <LinkedinIcon className="w-4 h-4" /> LinkedIn
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
