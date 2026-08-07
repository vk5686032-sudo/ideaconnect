import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Lightbulb, Users, Rocket, Sparkles, ArrowRight, Star } from 'lucide-react';
import ideaApi from '../../api/idea.api';
import projectApi from '../../api/project.api';

const Home = () => {
  const { data: ideasData } = useQuery({
    queryKey: ['ideas', 'featured'],
    queryFn: () => ideaApi.getAll({ limit: 6, sort: 'trending' }),
  });

  const { data: projectsData } = useQuery({
    queryKey: ['projects', 'featured'],
    queryFn: () => projectApi.getAll({ limit: 4 }),
  });

  const featuredIdeas = ideasData?.data?.data || [];
  const featuredProjects = projectsData?.data?.data || [];

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Transform Your Ideas Into
              <span className="block text-gradient bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent">
                Reality
              </span>
            </h1>
            <p className="text-lg md:text-xl text-primary-100 max-w-3xl mx-auto mb-8">
              An AI-powered collaborative innovation platform where ideas evolve into successful
              projects. Connect with like-minded innovators, get AI recommendations, and build
              amazing things together.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="btn-primary bg-white text-primary-600 hover:bg-gray-100">
                Get Started Free
              </Link>
              <Link to="/ideas" className="btn-outline border-white text-white hover:bg-white/10">
                Explore Ideas
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose IdeaConnect?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Everything you need to transform your innovative ideas into successful projects.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Lightbulb,
                title: 'Share Ideas',
                description:
                  'Post your innovative ideas and get feedback from the community. Use our AI to refine your concepts.',
              },
              {
                icon: Users,
                title: 'Find Teammates',
                description:
                  'Connect with skilled individuals who share your passion. AI-powered matching finds the perfect collaborators.',
              },
              {
                icon: Sparkles,
                title: 'AI Assistance',
                description:
                  'Get intelligent recommendations, feasibility scores, and suggestions to improve your ideas.',
              },
              {
                icon: Rocket,
                title: 'Build Projects',
                description:
                  'Transform ideas into projects with task management, milestones, and collaboration tools.',
              },
            ].map((feature, index) => (
              <div key={index} className="card-hover text-center">
                <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-7 h-7 text-primary-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '10K+', label: 'Ideas Shared' },
              { value: '5K+', label: 'Projects Created' },
              { value: '50K+', label: 'Active Users' },
              { value: '100+', label: 'Universities' },
            ].map((stat, index) => (
              <div key={index}>
                <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Ideas */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold">Trending Ideas</h2>
            <Link to="/ideas" className="text-primary-600 hover:text-primary-700 flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredIdeas.map((idea) => (
              <Link key={idea._id} to={`/ideas/${idea._id}`} className="card-hover">
                <div className="flex items-center gap-2 mb-3">
                  <span className="badge-primary">{idea.category}</span>
                  {idea.status === 'open' && <span className="badge-success">Open</span>}
                </div>
                <h3 className="font-semibold text-lg mb-2 line-clamp-2">{idea.title}</h3>
                <p className="text-gray-600 text-sm line-clamp-3 mb-4">{idea.description}</p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4" />
                    {idea.likes?.length || 0} likes
                  </div>
                  <span>by {idea.author?.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Start Your Innovation Journey?
          </h2>
          <p className="text-primary-100 mb-8 text-lg">
            Join thousands of innovators who are turning their ideas into reality.
          </p>
          <Link to="/register" className="btn-primary bg-white text-primary-600 hover:bg-gray-100">
            Create Your Free Account
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
