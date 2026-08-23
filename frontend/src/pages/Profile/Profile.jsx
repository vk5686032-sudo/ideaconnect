import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Calendar, Globe, Edit2, Save, X, MessageSquare, Loader2, GraduationCap, Briefcase, Trash2, Flag } from 'lucide-react';
import { GithubIcon, LinkedinIcon } from '../../components/common/BrandIcons';
import BackButton from '../../components/common/BackButton';
import ReportModal from '../../components/reports/ReportModal';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authSlice';
import api from '../../api/axios';
import userApi from '../../api/user.api';
import chatApi from '../../api/chat.api';
import mentorApi from '../../api/mentor.api';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  bio: z.string().max(500, 'Bio cannot exceed 500 characters').optional(),
  skills: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  education: z.array(z.object({
    institution: z.string().min(1, 'Institution is required'),
    degree: z.string().optional(),
    field: z.string().optional(),
    startYear: z.coerce.number().int().min(1900).max(2100).optional().or(z.literal('')),
    endYear: z.coerce.number().int().min(1900).max(2100).optional().or(z.literal('')),
  })).optional(),
  experience: z.array(z.object({
    company: z.string().min(1, 'Company is required'),
    position: z.string().optional(),
    description: z.string().optional(),
    current: z.boolean().optional(),
  })).optional(),
  socialLinks: z.object({
    github: z.string().url().optional().or(z.literal('')),
    linkedin: z.string().url().optional().or(z.literal('')),
    twitter: z.string().url().optional().or(z.literal('')),
    portfolio: z.string().url().optional().or(z.literal('')),
  }).optional(),
});

const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [interestInput, setInterestInput] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const queryClient = useQueryClient();

  // Use route param id if present; fall back to logged-in user's id
  const targetId = id || user?._id;
  const isOwnProfile = !id || id === user?._id;

  const { data: userData, isFetched } = useQuery({
    queryKey: ['user', targetId],
    queryFn: () => userApi.getById(targetId),
    enabled: !!targetId,
  });

  const profile = userData?.data?.data || user;

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profile?.name || '',
      bio: profile?.bio || '',
      skills: profile?.skills || [],
      interests: profile?.interests || [],
      education: profile?.education || [],
      experience: profile?.experience || [],
      socialLinks: profile?.socialLinks || {},
    },
  });

  // Reset form when profile data loads (prevents stale Zustand data on first render)
  useEffect(() => {
    if (profile) {
      reset({
        name: profile.name || '',
        bio: profile.bio || '',
        skills: profile.skills || [],
        interests: profile.interests || [],
        education: (profile.education || []).map((e) => ({
          institution: e.institution || '',
          degree: e.degree || '',
          field: e.field || '',
          startYear: e.startYear ?? '',
          endYear: e.endYear ?? '',
        })),
        experience: (profile.experience || []).map((e) => ({
          company: e.company || '',
          position: e.position || '',
          description: e.description || '',
          current: !!e.current,
        })),
        socialLinks: profile.socialLinks || {},
      });
    }
  }, [profile, reset]);

  const updateMutation = useMutation({
    mutationFn: (data) => api.put('/users/profile', data),
    onSuccess: (response) => {
      queryClient.invalidateQueries(['user']);
      // Update local Zustand store with fresh server data so UI stays in sync
      if (response?.data?.data) {
        useAuthStore.getState().updateUser(response.data.data);
      }
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

  const addInterest = () => {
    if (interestInput.trim()) {
      const current = watch('interests') || [];
      if (!current.includes(interestInput.trim())) {
        setValue('interests', [...current, interestInput.trim()]);
      }
      setInterestInput('');
    }
  };

  const removeInterest = (interest) => {
    const current = watch('interests') || [];
    setValue('interests', current.filter((i) => i !== interest));
  };

  const addEducation = () => {
    setValue('education', [
      ...(watch('education') || []),
      { institution: '', degree: '', field: '', startYear: '', endYear: '' },
    ]);
  };

  const removeEducation = (index) => {
    const current = watch('education') || [];
    setValue('education', current.filter((_, i) => i !== index));
  };

  const addExperience = () => {
    setValue('experience', [
      ...(watch('experience') || []),
      { company: '', position: '', description: '', current: false },
    ]);
  };

  const removeExperience = (index) => {
    const current = watch('experience') || [];
    setValue('experience', current.filter((_, i) => i !== index));
  };

  // Start or open a direct chat with the profile user
  const startChat = useMutation({
    mutationFn: (userId) => chatApi.createDirect(userId),
    onSuccess: (response) => {
      const chat = response?.data?.data;
      if (chat?._id) {
        navigate(`/chat/${chat._id}`);
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to start conversation');
    },
  });

  // Request mentorship from this user (approved mentors only)
  const mentorRequestMutation = useMutation({
    mutationFn: ({ mentorId, message }) => mentorApi.sendRequest(mentorId, { message }),
    onSuccess: () => toast.success('Mentorship request sent!'),
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to send mentorship request');
    },
  });

  const isApprovedMentor =
    profile?.role === 'mentor' && profile?.isMentorApproved;

  const handleMentorRequest = () => {
    const message = prompt(`Ask ${profile?.name || 'this mentor'} to be your mentor (optional message):`);
    if (message !== null) {
      mentorRequestMutation.mutate({ mentorId: profile._id, message });
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-4">
        <BackButton />
      </div>
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
          <div className="flex flex-col sm:flex-row gap-2 sm:self-start flex-shrink-0">
            {!isOwnProfile && user && isFetched && profile?.role !== 'admin' && (
              <button
                onClick={() => setReportOpen(true)}
                className="p-2.5 rounded-lg border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 justify-center"
                title="Report this user"
              >
                <Flag className="w-4 h-4" />
              </button>
            )}
            {!isOwnProfile && user && isFetched && isApprovedMentor && (
              <button
                onClick={handleMentorRequest}
                disabled={mentorRequestMutation.isPending}
                className="btn-outline flex items-center gap-2 justify-center disabled:opacity-60"
              >
                {mentorRequestMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <GraduationCap className="w-4 h-4" />}
                Request Mentorship
              </button>
            )}
            {!isOwnProfile && user && isFetched && (
              <button
                onClick={() => startChat.mutate(profile._id)}
                disabled={startChat.isLoading}
                className="btn-primary flex items-center gap-2 justify-center disabled:opacity-60"
              >
                {startChat.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                Message
              </button>
            )}
            {isOwnProfile && (
              <button onClick={() => setIsEditing(!isEditing)} className="btn-outline flex items-center gap-2 justify-center">
                {isEditing ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            )}
          </div>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Interests</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {(watch('interests') || []).map((interest) => (
                  <span key={interest} className="badge-success flex items-center gap-1">
                    {interest}
                    <button type="button" onClick={() => removeInterest(interest)} className="hover:text-red-600">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={interestInput}
                  onChange={(e) => setInterestInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addInterest())}
                  placeholder="Add an interest..."
                  className="input-field"
                />
                <button type="button" onClick={addInterest} className="btn-secondary">Add</button>
              </div>
            </div>

            {/* Education */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">Education</label>
                <button type="button" onClick={addEducation} className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
                  + Add
                </button>
              </div>
              <div className="space-y-3">
                {(watch('education') || []).map((edu, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <div className="flex gap-2">
                      <input {...register(`education.${index}.institution`)} placeholder="Institution *" className="input-field flex-1" />
                      {errors.education?.[index]?.institution && (
                        <p className="text-red-500 text-xs self-center">{errors.education[index].institution.message}</p>
                      )}
                      <button type="button" onClick={() => removeEducation(index)} className="p-2 text-gray-400 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <input {...register(`education.${index}.degree`)} placeholder="Degree" className="input-field" />
                      <input {...register(`education.${index}.field`)} placeholder="Field of study" className="input-field" />
                      <input {...register(`education.${index}.startYear`)} placeholder="Start year" type="number" className="input-field" />
                      <input {...register(`education.${index}.endYear`)} placeholder="End year" type="number" className="input-field" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Experience */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">Experience</label>
                <button type="button" onClick={addExperience} className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
                  + Add
                </button>
              </div>
              <div className="space-y-3">
                {(watch('experience') || []).map((exp, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <div className="flex gap-2">
                      <input {...register(`experience.${index}.company`)} placeholder="Company *" className="input-field flex-1" />
                      {errors.experience?.[index]?.company && (
                        <p className="text-red-500 text-xs self-center">{errors.experience[index].company.message}</p>
                      )}
                      <button type="button" onClick={() => removeExperience(index)} className="p-2 text-gray-400 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <input {...register(`experience.${index}.position`)} placeholder="Position" className="input-field" />
                    <textarea {...register(`experience.${index}.description`)} placeholder="Description" rows={2} className="input-field" />
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                      <input type="checkbox" {...register(`experience.${index}.current`)} className="w-4 h-4 rounded border-gray-300 text-primary-600" />
                      I currently work here
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Twitter / X</label>
                <input {...register('socialLinks.twitter')} className="input-field" placeholder="https://x.com/..." />
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

            {profile?.education?.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-primary-600" /> Education
                </h3>
                <div className="space-y-3">
                  {profile.education.map((edu, i) => (
                    <div key={i} className="text-sm">
                      <p className="font-medium">{edu.degree || 'Study'}{edu.field ? `, ${edu.field}` : ''}</p>
                      <p className="text-gray-600">{edu.institution}</p>
                      {(edu.startYear || edu.endYear) && (
                        <p className="text-xs text-gray-400">
                          {edu.startYear || '?'} – {edu.endYear || 'Present'}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {profile?.experience?.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-primary-600" /> Experience
                </h3>
                <div className="space-y-3">
                  {profile.experience.map((exp, i) => (
                    <div key={i} className="text-sm">
                      <p className="font-medium">{exp.position || 'Role'} · {exp.company}</p>
                      {exp.description && <p className="text-gray-600">{exp.description}</p>}
                      {exp.current && <span className="badge-success text-[10px]">Current</span>}
                    </div>
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

      {/* Report user dialog */}
      {reportOpen && profile && (
        <ReportModal
          targetType="user"
          targetId={profile._id}
          targetLabel={profile.name}
          onClose={() => setReportOpen(false)}
        />
      )}
    </div>
  );
};

export default Profile;
