import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import profileService from '@/services/profileService';
import { Loader2, ShieldCheck, CheckCircle2, Zap, Star, Crown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PersonalInfoCard from './components/PersonalInfoCard';
import TrainingProfileCard from './components/TrainingProfileCard';
import SubscriptionCard from './components/SubscriptionCard';

const AVATAR_COLORS = [
  'bg-violet-600',
  'bg-blue-600',
  'bg-emerald-600',
  'bg-rose-600',
  'bg-orange-600',
];
const getAvatarColor = (name) =>
  AVATAR_COLORS[(name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];

const TIER_CONFIG = {
  Free:    { label: 'Free',      icon: <Zap className="w-3 h-3" />,   cls: 'text-slate-400 bg-slate-400/10 border-slate-400/30' },
  Pro:     { label: 'Pro',       icon: <Star className="w-3 h-3" />,  cls: 'text-violet-400 bg-violet-400/10 border-violet-400/30' },
  Premium: { label: 'Pro Elite', icon: <Crown className="w-3 h-3" />, cls: 'text-amber-400 bg-amber-400/10 border-amber-400/30' },
};

export default function ProfilePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    fullName: '', email: '', gender: '', bodyWeightKg: '',
    fitnessLevel: 'Beginner', primaryGoal: 'Strength', availableDaysPerWeek: 3,
  });
  const [original, setOriginal] = useState(null);
  const [loading, setLoading]= useState(true);
  const [saving, setSaving] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);

  const setField = (field, val) =>
    setForm((f) => {
      const next = { ...f, [field]: val };
      setDirty(JSON.stringify(next) !== JSON.stringify(original));
      return next;
    });

  useEffect(() => {
    profileService.getMyProfile()
      .then((data) => {
        const loaded = {
          fullName: data.fullName ?? '',
          email: data.email ?? '',
          gender: data.gender ?? '',
          bodyWeightKg: data.bodyWeightKg ?? '',
          fitnessLevel: data.fitnessLevel ?? 'Beginner',
          primaryGoal: data.primaryGoal ?? 'Strength',
          availableDaysPerWeek: data.availableDaysPerWeek ?? 3,
        };
        setProfile(data);
        setForm(loaded);
        setOriginal(loaded);
      })
      .catch((err) => {
        if (err.response?.status === 404) {
          const d = {
            fullName: user?.name ?? '', email: '', gender: '',
            bodyWeightKg: '', fitnessLevel: 'Beginner',
            primaryGoal: 'Strength', availableDaysPerWeek: 3,
          };
          setIsNew(true);
          setForm(d);
          setOriginal(d);
        }
      })
      .finally(() => setLoading(false));
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        bodyWeightKg: parseFloat(form.bodyWeightKg) || 0,
        availableDaysPerWeek: parseInt(form.availableDaysPerWeek),
      };
      const data = isNew
        ? await profileService.createProfile(payload)
        : await profileService.updateProfile(payload);
      setProfile(data);
      setOriginal(form);
      setDirty(false);
      if (isNew) setIsNew(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {/* silent */} finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => { setForm(original); setDirty(false); };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  const displayName = form.fullName || user?.name || 'Người dùng';
  const tier = profile?.subscriptionTier ?? 'Free';
  const tierCfg = TIER_CONFIG[tier] ?? TIER_CONFIG.Free;
  const avatarGradient = getAvatarColor(displayName);

  return (
    <div className="max-w-6xl mx-auto w-full space-y-8 pb-12">

      {/* ���� Page Header (same pattern as HomePage) ���� */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        {/* Left: Avatar + title */}
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-2xl ${avatarGradient} flex items-center justify-center shadow-lg flex-shrink-0`}>
            <span className="text-2xl font-black text-white select-none">
              {displayName[0]?.toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="text-4xl font-black text-blue-500 tracking-tight">{t('profile.title')}</h1>
            <p className="text-muted-foreground font-medium uppercase tracking-wider text-sm mt-1">
              {displayName}
              {(profile?.email || user?.email) && (
                <> · {profile?.email || user?.email}</>
              )}
            </p>
          </div>
        </div>

        {/* Right: tier badge + save status (same pattern as streak/XP card) */}
        <div className="flex gap-3 bg-card p-3 rounded-lg border border-border shadow-sm items-center">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${tierCfg.cls}`}>
            {tierCfg.icon} {tierCfg.label}
          </span>
          {saved && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" /> {t('common.saved')}
            </span>
          )}
        </div>
      </div>

      {/* ���� Bento Grid (same pattern as HomePage) ���� */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <PersonalInfoCard form={form} setField={setField} />
        <TrainingProfileCard form={form} setField={setField} />
        <SubscriptionCard tier={tier} />

        {/* Save / Discard � last row, full width */}
        <div className="col-span-1 md:col-span-12 flex items-center justify-between gap-4
          bg-card border border-border rounded-xl px-6 py-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <ShieldCheck className="w-3.5 h-3.5" />
            {t('profile.encrypted')}
          </div>
          <div className="flex gap-3">
            <button onClick={handleDiscard} disabled={!dirty || saving}
              className="px-5 py-2.5 border border-border text-foreground font-bold rounded-lg
                hover:bg-muted transition-all text-xs font-mono uppercase tracking-wider disabled:opacity-40">
                {t('common.discard')}
            </button>
            <button id="pf-save" onClick={handleSave}
              disabled={(!dirty && !isNew) || saving}
              className="px-6 py-2.5 bg-blue-400 text-black font-bold rounded-lg
                hover:bg-blue-300 active:scale-95 transition-all text-xs font-mono uppercase tracking-wider
                disabled:opacity-40 flex items-center gap-2 shadow-lg shadow-blue-400/25 min-w-[140px] justify-center">
              {saving
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <><ShieldCheck className="w-3.5 h-3.5" /> {t('common.save')}</>
              }
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}

