export interface ArtistProfileDraft {
  name: string;
  type: string;
  subtype: string;
  location: string;
  bio: string;
  styles: string;
  tags: string;
}

interface Props {
  value: ArtistProfileDraft;
  onChange: (value: ArtistProfileDraft) => void;
  disabled?: boolean;
  idPrefix?: string;
}

const inputClass = "w-full rounded-xl bg-card px-3 py-2.5 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary placeholder:text-muted-foreground";

const ArtistProfileFields = ({ value, onChange, disabled = false, idPrefix = "artist" }: Props) => {
  const update = (patch: Partial<ArtistProfileDraft>) => onChange({ ...value, ...patch });

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor={`${idPrefix}-name`} className="mb-1 block text-xs font-medium text-muted-foreground">Artist or project name</label>
        <input id={`${idPrefix}-name`} required value={value.name} disabled={disabled} onChange={(e) => update({ name: e.target.value })} maxLength={100} placeholder="Name people should recognize" className={inputClass} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={`${idPrefix}-type`} className="mb-1 block text-xs font-medium text-muted-foreground">Practice</label>
          <select id={`${idPrefix}-type`} value={value.type} disabled={disabled} onChange={(e) => update({ type: e.target.value })} className={inputClass}>
            <option value="musician">Music</option>
            <option value="visual_artist">Visual art</option>
            <option value="multidisciplinary">Multidisciplinary</option>
            <option value="other">Other creative work</option>
          </select>
        </div>
        <div>
          <label htmlFor={`${idPrefix}-subtype`} className="mb-1 block text-xs font-medium text-muted-foreground">Role or medium</label>
          <input id={`${idPrefix}-subtype`} value={value.subtype} disabled={disabled} onChange={(e) => update({ subtype: e.target.value })} maxLength={80} placeholder="Producer, painter…" className={inputClass} />
        </div>
      </div>
      <div>
        <label htmlFor={`${idPrefix}-location`} className="mb-1 block text-xs font-medium text-muted-foreground">Location <span className="opacity-60">(optional)</span></label>
        <input id={`${idPrefix}-location`} value={value.location} disabled={disabled} onChange={(e) => update({ location: e.target.value })} maxLength={100} placeholder="City, region, or internet-based" className={inputClass} />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-bio`} className="mb-1 block text-xs font-medium text-muted-foreground">Short intro <span className="opacity-60">(optional)</span></label>
        <textarea id={`${idPrefix}-bio`} value={value.bio} disabled={disabled} onChange={(e) => update({ bio: e.target.value })} maxLength={300} rows={3} placeholder="What do you make, and what should someone notice?" className={`${inputClass} resize-none`} />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-styles`} className="mb-1 block text-xs font-medium text-muted-foreground">Styles <span className="opacity-60">(comma-separated)</span></label>
        <input id={`${idPrefix}-styles`} value={value.styles} disabled={disabled} onChange={(e) => update({ styles: e.target.value })} maxLength={240} placeholder="Ambient, dream pop, field recording" className={inputClass} />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-tags`} className="mb-1 block text-xs font-medium text-muted-foreground">Search tags <span className="opacity-60">(comma-separated)</span></label>
        <input id={`${idPrefix}-tags`} value={value.tags} disabled={disabled} onChange={(e) => update({ tags: e.target.value })} maxLength={240} placeholder="Synths, ceramics, live visuals" className={inputClass} />
      </div>
    </div>
  );
};

export default ArtistProfileFields;
