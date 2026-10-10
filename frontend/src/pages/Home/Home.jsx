import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Lightbulb, Users, Rocket, ArrowRight, Lightning, Shield, Globe } from '@phosphor-icons/react';
import { MagneticButton } from '../../components/cinematic/MagneticButton';
import { HorizontalMarquee } from '../../components/cinematic/HorizontalMarquee';
import { HorizontalPan } from '../../components/cinematic/HorizontalPan';
import { ScrollRevealStagger } from '../../components/cinematic/ScrollRevealStagger';
import { GlassCard } from '../../components/cinematic/GlassCard';
import { Badge } from '../../components/primitives';
import { Star as StarIcon } from '@phosphor-icons/react';
import { motion } from 'motion/react';

import ideaApi from '../../api/idea.api';

const Home = () => {
  const { data: ideasData } = useQuery({
    queryKey: ['ideas', 'featured'],
    queryFn: () => ideaApi.getAll({ limit: 6, sort: 'trending' }),
  });

  const featuredIdeas = ideasData?.data?.data || [];

  // Social proof logos (using placeholder tech company logos)
  const logos = [
    'https://cdn.simpleicons.org/github/ffffff',
    'https://cdn.simpleicons.org/vercel/ffffff',
    'https://cdn.simpleicons.org/stripe/ffffff',
    'https://cdn.simpleicons.org/notion/ffffff',
    'https://cdn.simpleicons.org/figma/ffffff',
    'https://cdn.simpleicons.org/linear/ffffff',
    'https://cdn.simpleicons.org/github/ffffff',
    'https://cdn.simpleicons.org/vercel/ffffff',
    'https://cdn.simpleicons.org/stripe/ffffff',
    'https://cdn.simpleicons.org/notion/ffffff',
    'https://cdn.simpleicons.org/figma/ffffff',
    'https://cdn.simpleicons.org/linear/ffffff',
  ];

  // Testimonials for HorizontalPan
  const testimonials = [
    {
      quote: "IdeaConnect transformed how our team collaborates on innovative projects. The AI recommendations saved us weeks of research.",
      author: "Sarah Chen",
      role: "VP Engineering at TechStart",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    },
    {
      quote: "The mentor matching feature connected me with an industry expert who helped us pivot our idea into a funded startup.",
      author: "Marcus Johnson",
      role: "Founder at GreenTech",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus",
    },
    {
      quote: "Best platform for turning ideas into reality. The mentor network and project tools are unmatched.",
      author: "Priya Sharma",
      role: "Product Manager at InnovateCo",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Priya",
    },
  ];

  const features = [
    {
      icon: Lightbulb,
      title: 'Share Ideas',
      description: 'Post your innovative ideas and get feedback from the community. Refine your concepts with smart suggestions.',
    },
    {
      icon: Users,
      title: 'Find Teammates',
      description: 'Connect with skilled individuals who share your passion. Skill-based matching finds the right collaborators.',
    },
    {
      icon: Lightning,
      title: 'Smart Assistance',
      description: 'Get intelligent recommendations, feasibility scores, and suggestions to improve your ideas.',
    },
    {
      icon: Rocket,
      title: 'Build Projects',
      description: 'Transform ideas into projects with task management, milestones, and collaboration tools.',
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Enterprise-grade security with end-to-end encryption. Your ideas stay yours until you share them.',
    },
    {
      icon: Globe,
      title: 'Global Community',
      description: 'Connect with innovators worldwide. 10K+ members across 100+ universities and companies.',
    },
  ];

  const stats = [
    { value: '10K+', label: 'Ideas Shared' },
    { value: '5K+', label: 'Projects Created' },
    { value: '50K+', label: 'Active Users' },
    { value: '100+', label: 'Universities & Companies' },
  ];

  return (
    <div>
      {/* Hero Section - StickyStack with Editorial Split */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-purple-700 text-white overflow-hidden">
        {/* Animated gradient orbs background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          {/* StickyStack Hero - pins at top, next section scrubs it */}
          <div className="sticky top-0 min-h-[100dvh] flex items-center justify-center">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
              <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                {/* Left: Typography */}
                <div className="text-center lg:text-left">
                  <motion.span
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                    className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-white/90 text-sm font-medium mb-6"
                  >
                    <Lightning className="w-4 h-4 inline mr-2" /> New: AI-Powered Feasibility Scores
                  </motion.span>
                  <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                    Transform Your Ideas Into
                    <span className="block bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent">
                      Reality
                    </span>
                  </h1>
                  <p className="text-lg md:text-xl text-primary-100 max-w-2xl mx-auto lg:mx-0 mb-8 leading-relaxed">
                    A collaborative innovation platform where ideas evolve into successful projects.
                    Connect with like-minded innovators, get smart recommendations, and build amazing things together.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                    <MagneticButton
                      trailingIcon={<ArrowRight className="w-5 h-5" />}
                      className="bg-white text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      Get Started Free
                    </MagneticButton>
                    <Link to="/ideas" className="btn-outline border-white text-white hover:bg-white/10 flex items-center gap-2 justify-center px-6 py-3">
                      <span>Explore Ideas</span>
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  </div>
                </div>

                {/* Right: Interactive Demo Preview */}
                <div className="relative">
                  <div className="glass-card rounded-2xl p-2 max-w-md mx-auto lg:mx-0">
                    <div className="bg-zinc-900/50 dark:bg-zinc-900/50 rounded-2xl p-8">
                      <div className="flex items-center gap-2 mb-4 text-zinc-400 text-sm">
                        <div className="flex gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-red-500" />
                          <div className="w-3 h-3 rounded-full bg-yellow-500" />
                          <div className="w-3 h-3 rounded-full bg-green-500" />
                        </div>
                        <span className="text-xs">idea-connect.demo</span>
                      </div>
                      <div className="space-y-3 text-left">
                        <div className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-xl">
                          <Lightbulb className="w-6 h-6 text-yellow-400" />
                          <div>
                            <p className="text-white font-medium">AI Feasibility Score</p>
                            <p className="text-xs text-zinc-400">Analyzing market fit...</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-xl">
                          <Lightning className="w-6 h-6 text-cyan-400" />
                          <div>
                            <p className="text-white font-medium">Innovation Score</p>
                            <p className="text-xs text-zinc-400">78/100 - High Potential</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-xl">
                          <Rocket className="w-6 h-6 text-emerald-400" />
                          <div>
                            <p className="text-white font-medium">Build Project</p>
                            <p className="text-xs text-zinc-400">Generate milestones & tasks</p>
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-white/10">
                          <button className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 rounded-xl transition-colors">
                            Generate Full Analysis →
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By - HorizontalMarquee */}
      <section className="py-12 bg-white dark:bg-zinc-950 border-y border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-8">
            Trusted by innovators at leading companies
          </p>
          <HorizontalMarquee items={logos.map((logo, i) => (
            <img key={i} src={logo} alt="" className="h-8 w-auto opacity-60 hover:opacity-100 transition-opacity filter grayscale" />
          ))} duration={30} pauseOnHover />
        </div>
      </section>

      {/* Features Section - Asymmetric Bento Grid with ScrollRevealStagger */}
      <section className="py-24 bg-white dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="inline-block px-4 py-1.5 rounded-full bg-primary-100 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300 text-xs font-medium uppercase tracking-wider mb-4"
            >
              Why IdeaConnect
            </motion.span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Everything you need to transform ideas into reality
            </h2>
            <p className="text-gray-600 dark:text-zinc-400 max-w-2xl mx-auto text-lg">
              From ideation to launch — every tool you need in one platform.
            </p>
          </div>

          <ScrollRevealStagger duration={800} delay={100} stagger={80}>
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="card-premium group"
              >
                <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-7 h-7 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-gray-600 dark:text-zinc-400 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </ScrollRevealStagger>
        </div>
      </section>

      {/* Stats Section with Animated Counters */}
      <section className="py-16 bg-gray-50 dark:bg-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary-600 to-cyan-500 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600 dark:text-zinc-400 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Ideas - Bento Grid with ScrollRevealStagger */}
      <section className="py-20 bg-white dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold">Trending Ideas</h2>
            <Link to="/ideas" className="text-primary-600 hover:text-primary-700 flex items-center gap-1 text-sm font-medium">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <ScrollRevealStagger duration={600} delay={100} stagger={80}>
            {featuredIdeas.length > 0 ? (
              featuredIdeas.map((idea) => (
                <Link key={idea._id} to={`/ideas/${idea._id}`} className="card-hover group">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="primary" className="text-xs">{idea.category}</Badge>
                    {idea.status === 'open' && <Badge variant="success" className="text-xs">Open</Badge>}
                  </div>
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">{idea.title}</h3>
                  <p className="text-gray-600 dark:text-zinc-400 text-sm line-clamp-3 mb-4">{idea.description}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-zinc-500">
                    <div className="flex items-center gap-1">
                      <StarIcon className="w-4 h-4" />
                      {idea.likes?.length || 0} likes
                    </div>
                    <span>by {idea.author?.name}</span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full card text-center py-12">
                <Lightbulb className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No ideas yet. Be the first to share one!</p>
              </div>
            )}
          </ScrollRevealStagger>

          <div className="mt-8 text-center">
            <Link to="/ideas" className="btn-outline">
              View All Ideas <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials - HorizontalPan Scroll Hijack */}
      <section className="py-24 bg-white dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="inline-block px-4 py-1.5 rounded-full bg-primary-100 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300 text-xs font-medium uppercase tracking-wider mb-4"
            >
              Testimonials
            </motion.span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Loved by Innovators Worldwide</h2>
            <p className="text-gray-600 dark:text-zinc-400 max-w-2xl mx-auto">
              See what our community of innovators has to say about IdeaConnect.
            </p>
          </div>

          <HorizontalPan>
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                className="flex-shrink-0 w-[calc(100%-2rem)] md:w-[calc(50%-1rem)] lg:w-[calc(33.33%-1.33rem)]"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="glass-card h-full p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <img src={testimonial.avatar} alt={testimonial.author} className="w-12 h-12 rounded-full" />
                    <div>
                      <p className="font-semibold text-zinc-900 dark:text-white">{testimonial.author}</p>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">{testimonial.role}</p>
                    </div>
                  </div>
                  <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed mb-6">"{testimonial.quote}"</p>
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map((star) => (
                      <StarIcon key={star} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </HorizontalPan>
        </div>
      </section>

      {/* Social Proof - Logos already in marquee, adding stats here */}
      <section className="py-16 bg-gray-50 dark:bg-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary-600 to-cyan-500 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600 dark:text-zinc-400 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - GlassCard with MagneticButton */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-purple-600 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10">
          <GlassCard className="max-w-4xl mx-auto px-8 py-16 md:py-24 text-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
              Ready to Start Your Innovation Journey?
            </h2>
            <p className="text-primary-100 mb-8 text-lg max-w-2xl mx-auto">
              Join thousands of innovators who are turning their ideas into reality.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <MagneticButton
                trailingIcon={<ArrowRight className="w-5 h-5" />}
                className="bg-white text-primary-600 hover:bg-gray-100"
              >
                Create Your Free Account
              </MagneticButton>
              <Link to="/ideas" className="btn-outline border-white text-white hover:bg-white/10 flex items-center gap-2 justify-center px-6 py-3">
                Explore Ideas First <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </GlassCard>
        </div>
      </section>
    </div>
  );
};

export default Home;