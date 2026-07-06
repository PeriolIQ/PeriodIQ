export default function Metric({ icon: Icon, label, value, tone }) {
  const tones = {
    lime: 'bg-blue-500/10 text-blue-700',
    sky: 'bg-sky-500/10 text-sky-700',
    violet: 'bg-violet-500/10 text-violet-700',
    amber: 'bg-amber-500/10 text-amber-700',
  };
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <p className="text-xs font-bold uppercase text-muted-foreground">{label}</p>
      <div className="flex items-center justify-between mt-2">
        <p className="text-2xl font-black">{value}</p>
        <div className={`p-2 rounded-lg ${tones[tone]}`}><Icon className="h-5 w-5" /></div>
      </div>
    </div>
  );
}

