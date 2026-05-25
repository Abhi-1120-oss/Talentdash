import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, TrendingUp, Shield, BarChart2, Zap, Building2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, useInView, useMotionValue, useSpring, animate } from 'framer-motion';
import PublicNavbar from '@/components/public/PublicNavbar';

const FEATURED_COMPANIES = ['Google', 'Amazon', 'Microsoft', 'Flipkart', 'PhonePe', 'Razorpay', 'Swiggy', 'Zepto'];

const STATS = [
  { label: 'Salary Records', value: 12400, suffix: '+' },
  { label: 'Companies', value: 480, suffix: '+' },
  { label: 'Cities', value: 18, suffix: '' },
  { label: 'Roles Tracked', value: 120, suffix: '+' },
];

const FEATURES = [
  { icon: BarChart2, title: 'P25/P50/P75 Bands', desc: 'Bloomberg-grade percentile bars showing exactly where your offer sits in the market distribution.', color: 'from-indigo-500/10 to-indigo-500/5', iconColor: 'text-indigo-600', border: 'hover:border-indigo-200' },
  { icon: TrendingUp, title: 'Salary Trends', desc: 'YoY compensation trends by role and level — know if salaries are rising before you negotiate.', color: 'from-emerald-500/10 to-emerald-500/5', iconColor: 'text-emerald-600', border: 'hover:border-emerald-200' },
  { icon: Shield, title: 'Confidence Scoring', desc: 'Every record has a data quality score. High-confidence records are verified by our analyst team.', color: 'from-amber-500/10 to-amber-500/5', iconColor: 'text-amber-600', border: 'hover:border-amber-200' },
  { icon: Zap, title: 'Level Intelligence', desc: 'Standardized levels across companies — compare L5 at Google vs SDE-III at Flipkart accurately.', color: 'from-purple-500/10 to-purple-500/5', iconColor: 'text-purple-600', border: 'hover:border-purple-200' },
];

// Animated counter component
function AnimatedCounter({ value, suffix }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration: 1.8,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return controls.stop;
  }, [inView, value]);

  return (
    <span ref={ref} className="tabular-nums">
      {display.toLocaleString('en-IN')}{suffix}
    </span>
  );
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.7 } },
};

export default function Home() {
  const featuresRef = useRef(null);
  const featuresInView = useInView(featuresRef, { once: true, margin: '-80px' });

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <PublicNavbar />

      {/* Hero */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-24 text-center">
        {/* Subtle grid background */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:48px_48px] opacity-40" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
        </div>

        <motion.div initial="hidden" animate="visible" variants={containerVariants}>
          <motion.div variants={fadeUp}>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-primary text-sm font-medium mb-6">
              <Zap className="w-3.5 h-3.5" />
              India's first structured compensation intelligence platform
            </span>
          </motion.div>

          <motion.h1 variants={fadeUp} className="text-5xl sm:text-6xl font-extrabold text-foreground tracking-tight leading-tight mb-6">
            Know your worth.
            <br />
            <span className="text-primary">Negotiate with data.</span>
          </motion.h1>

          <motion.p variants={fadeUp} className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            TalentDash aggregates and normalizes salary data from AmbitionBox, Glassdoor, and LinkedIn
            into decision-ready benchmarks for India's tech professionals.
          </motion.p>

          <motion.div variants={fadeUp} className="flex items-center justify-center gap-4 flex-wrap">
            <Link to="/explorer">
              <Button size="lg" className="gap-2 bg-primary hover:bg-primary/90 text-white px-8 h-12 text-base font-semibold rounded-xl shadow-lg shadow-primary/20 group transition-all duration-200">
                Explore Salaries
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link to="/compare">
              <Button size="lg" variant="outline" className="h-12 px-8 text-base font-semibold rounded-xl group gap-2 transition-all duration-200">
                Compare Roles
                <ChevronRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Button>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div variants={fadeUp} className="flex items-center justify-center gap-10 mt-16 flex-wrap">
            {STATS.map(({ label, value, suffix }) => (
              <div key={label} className="text-center">
                <p className="text-3xl font-extrabold text-foreground tracking-tight">
                  <AnimatedCounter value={value} suffix={suffix} />
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Companies ticker */}
      <section className="bg-secondary/40 border-y border-border py-7 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-widest text-center mb-5">
            Data from top Indian & global tech companies
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {FEATURED_COMPANIES.map((c, i) => (
              <motion.div
                key={c}
                initial={{ opacity: 0, scale: 0.88 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.06, duration: 0.35, ease: 'easeOut' }}
              >
                <Link
                  to={`/explorer?company=${encodeURIComponent(c)}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-card border border-border rounded-lg text-sm font-medium text-foreground hover:border-primary/50 hover:text-primary hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200"
                >
                  <Building2 className="w-3 h-3 text-muted-foreground" />
                  {c}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section ref={featuresRef} className="max-w-7xl mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={featuresInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl font-bold text-foreground mb-3">Built for serious research</h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm leading-relaxed">
            Every feature is designed to give you an analytical edge when evaluating offers and negotiating compensation.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
          initial="hidden"
          animate={featuresInView ? 'visible' : 'hidden'}
          variants={containerVariants}
        >
          {FEATURES.map(({ icon: Icon, title, desc, color, iconColor, border }) => (
            <motion.div
              key={title}
              variants={fadeUp}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className={`relative bg-card border border-border rounded-xl p-6 transition-all duration-200 cursor-default group ${border} hover:shadow-lg`}
            >
              <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              <div className="relative">
                <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 rounded-2xl p-12 text-center"
        >
          <div className="pointer-events-none absolute -top-10 -right-10 w-48 h-48 bg-primary/10 rounded-full blur-2xl" />
          <div className="pointer-events-none absolute -bottom-8 -left-8 w-36 h-36 bg-primary/10 rounded-full blur-2xl" />
          <h2 className="text-2xl font-bold text-foreground mb-3 relative">Ready to negotiate smarter?</h2>
          <p className="text-muted-foreground mb-7 relative">Real compensation data. Real decisions. No guesswork.</p>
          <Link to="/explorer">
            <Button className="bg-primary hover:bg-primary/90 text-white gap-2 px-8 h-11 font-semibold rounded-xl shadow-lg shadow-primary/20 group relative">
              Start Exploring
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-xs text-muted-foreground">
          <span>© 2026 TalentDash. India-first compensation intelligence.</span>
          <div className="flex gap-4">
            <Link to="/explorer" className="hover:text-foreground transition-colors">Explorer</Link>
            <Link to="/compare" className="hover:text-foreground transition-colors">Compare</Link>
            <Link to="/admin" className="hover:text-foreground transition-colors">Admin</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}