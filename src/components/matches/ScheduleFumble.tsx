import { useState } from "react";
import { motion } from "framer-motion";
import { CalendarHeart, Clock, MapPin, Download, X } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { generateICS, downloadICS } from "@/utils/calendar";
import type { ResonanceProfile } from "@/data/resonance-profile";

interface ScheduleFumbleProps {
  profile: ResonanceProfile;
  onClose: () => void;
}

const timeSlots = ["10:00 AM", "12:00 PM", "2:00 PM", "5:00 PM", "7:00 PM", "8:30 PM"];

const ScheduleFumble = ({ profile, onClose }: ScheduleFumbleProps) => {
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState<string>();
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);

  const handleExport = () => {
    if (!date || !time) return;

    // Parse time
    const [hourStr, period] = time.split(" ");
    const [h, m] = hourStr.split(":").map(Number);
    let hour = h;
    if (period === "PM" && hour !== 12) hour += 12;
    if (period === "AM" && hour === 12) hour = 0;

    const eventDate = new Date(date);
    eventDate.setHours(hour, m, 0, 0);

    const ics = generateICS({
      title: `Fumble with ${profile.name}`,
      description: note || `A date with ${profile.name} (${profile.handle})`,
      date: eventDate,
      durationMinutes: 90,
    });

    downloadICS(ics, `fumble-${profile.name.toLowerCase()}.ics`);
    setSaved(true);
    setTimeout(() => onClose(), 1200);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="rounded-2xl bg-card border border-border p-4 shadow-card"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarHeart className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-bold text-foreground">
            Schedule a Fumble with {profile.name}
          </h4>
        </div>
        <button onClick={onClose} className="rounded-full bg-secondary p-1.5">
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      {saved ? (
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="text-center py-6"
        >
          <p className="text-2xl mb-2">📅</p>
          <p className="text-sm font-semibold text-foreground">Added to calendar!</p>
          <p className="text-xs text-muted-foreground mt-1">Don't be late 😏</p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {/* Date picker */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Pick a day</p>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    "w-full rounded-xl border border-border px-3 py-2.5 text-sm text-left transition-colors hover:bg-secondary/50",
                    date ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  <CalendarHeart className="inline h-3.5 w-3.5 mr-2 text-primary" />
                  {date ? format(date, "EEEE, MMMM d") : "Choose a date..."}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(d) => d < new Date()}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time slots */}
          {date && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <p className="text-xs font-medium text-muted-foreground mb-2">
                <Clock className="inline h-3 w-3 mr-1" />
                Pick a time
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                {timeSlots.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setTime(slot)}
                    className={cn(
                      "rounded-xl px-2 py-2 text-xs font-medium transition-all",
                      time === slot
                        ? "gradient-warm text-primary-foreground"
                        : "bg-secondary text-foreground hover:bg-secondary/70"
                    )}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Optional note */}
          {time && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note... (optional)"
                className="w-full rounded-xl bg-secondary/50 border border-border px-3 py-2.5 text-xs text-foreground placeholder:text-muted-foreground outline-none"
              />
            </motion.div>
          )}

          {/* Export */}
          {date && time && (
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={handleExport}
              className="w-full rounded-xl gradient-warm py-3 text-sm font-bold text-primary-foreground flex items-center justify-center gap-2"
            >
              <Download className="h-4 w-4" />
              Add to Calendar
            </motion.button>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default ScheduleFumble;
