import React, { useState } from 'react';
import { Building2, MapPin, Briefcase, CheckCircle, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ConfidenceBadge from './ConfidenceBadge';
import PercentileBar from './PercentileBar';

const sourceBadge = {
  AmbitionBox: 'bg-orange-50 text-orange-700 border-orange-200',
  Glassdoor: 'bg-green-50 text-green-700 border-green-200',
  Manual: 'bg-blue-50 text-blue-700 border-blue-200',
  LinkedIn: 'bg-sky-50 text-sky-700 border-sky-200',
};

export default function SalaryCard({ record, index = 0 }) {
  const [expanded, setExpanded] = useState(false);
  const {
    company, role, level_standardized, location,
    experience_years_min, experience_years_max,
    base_salary, bonus, stock, total_compensation,
    confidence_score, source_platform, is_verified,
    logo_url,
  } = record;

  const p50 = base_salary || 0;
  const p25 = Math.round(p50 * 0.88);
  const p75 = Math.round(p50 * 1.14);
  const barMax = Math.round(p75 * 1.3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.4), ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      className="bg-card border border-border rounded-xl p-5 hover:shadow-lg hover:border-primary/25 transition-shadow duration-200 cursor-default"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 overflow-hidden">
            {logo_url
              ? <img src={logo_url} alt={company} className="w-full h-full object-contain" />
              : <Building2 className="w-5 h-5 text-muted-foreground" />
            }
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground truncate">{company}</h3>
            <p className="text-sm text-muted-foreground truncate">{role}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          {is_verified && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
              <CheckCircle className="w-3 h-3" /> Verified
            </span>
          )}
          <ConfidenceBadge score={confidence_score} />
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {level_standardized && (
          <span className="px-2.5 py-1 bg-primary/10 text-primary rounded-md text-xs font-semibold border border-primary/20">
            {level_standardized}
          </span>
        )}
        {location && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-secondary text-secondary-foreground rounded-md text-xs font-medium">
            <MapPin className="w-3 h-3" /> {location}
          </span>
        )}
        {(experience_years_min !== undefined && experience_years_max !== undefined) && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-secondary text-secondary-foreground rounded-md text-xs font-medium">
            <Briefcase className="w-3 h-3" /> {experience_years_min}–{experience_years_max} yrs
          </span>
        )}
        {source_platform && (
          <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${sourceBadge[source_platform] || 'bg-secondary text-secondary-foreground border-border'}`}>
            {source_platform}
          </span>
        )}
      </div>

      {/* Total Comp — always visible */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted-foreground">Total Compensation</span>
        <span className="text-lg font-bold text-foreground">₹{total_compensation || base_salary}L/yr</span>
      </div>

      {/* Percentile Bar */}
      {base_salary > 0 && (
        <div className="mb-3">
          <PercentileBar p25={p25} p50={p50} p75={p75} min={0} max={barMax} />
        </div>
      )}

      {/* Expand toggle for breakdown */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between pt-3 border-t border-border text-xs text-muted-foreground hover:text-foreground transition-colors group"
      >
        <span className="font-medium">Comp breakdown</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-3 gap-3 mt-3 p-3 bg-secondary/40 rounded-lg">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-0.5">Base</p>
                <p className="font-bold text-sm text-foreground">₹{base_salary || '–'}L</p>
              </div>
              <div className="text-center border-x border-border">
                <p className="text-xs text-muted-foreground mb-0.5">Bonus</p>
                <p className="font-bold text-sm text-foreground">₹{bonus || '–'}L</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-0.5">Stock</p>
                <p className="font-bold text-sm text-foreground">₹{stock || '–'}L</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}