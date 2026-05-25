import React from 'react';
import { motion } from 'framer-motion';
import { Building2, Pencil, Trash2, MapPin, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

function formatDate(d) {
  if (!d) return 'Present';
  try { return format(new Date(d), 'MMM yyyy'); } catch { return d; }
}

export default function CareerTimeline({ entries, onEdit, onDelete }) {
  if (!entries.length) return null;

  return (
    <div className="relative pl-6">
      {/* Vertical line */}
      <div className="absolute left-2 top-2 bottom-2 w-px bg-border" />

      <div className="space-y-5">
        {entries.map((entry, i) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            {/* Dot */}
            <div className={`absolute -left-4 top-4 w-3 h-3 rounded-full border-2 border-background ${entry.is_current ? 'bg-primary ring-2 ring-primary/30' : 'bg-muted-foreground/40'}`} />

            <div className="bg-card border border-border rounded-xl p-4 hover:border-primary/20 hover:shadow-md transition-all duration-200 ml-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground">{entry.company}</h3>
                      {entry.is_current && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-semibold border border-primary/20">
                          <Star className="w-2.5 h-2.5" /> Current
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{entry.role}{entry.level ? ` · ${entry.level}` : ''}</p>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="text-xs text-muted-foreground">{formatDate(entry.start_date)} — {formatDate(entry.end_date)}</span>
                      {entry.location && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3" />{entry.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2 flex-shrink-0">
                  <div className="text-right mr-1">
                    <p className="font-bold text-foreground">₹{entry.base_salary}L</p>
                    <p className="text-xs text-muted-foreground">base</p>
                    {entry.total_compensation > entry.base_salary && (
                      <p className="text-xs text-primary font-semibold">₹{entry.total_compensation}L total</p>
                    )}
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => onEdit(entry)} className="w-7 h-7 p-0 text-muted-foreground hover:text-foreground">
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => onDelete(entry.id)} className="w-7 h-7 p-0 text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {entry.notes && (
                <p className="mt-2.5 text-xs text-muted-foreground bg-secondary/40 rounded-lg px-3 py-2 italic">
                  {entry.notes}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}