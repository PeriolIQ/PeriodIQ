import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/axiosConfig';

const FITNESS_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const GOALS = ['Strength', 'Hypertrophy', 'Endurance', 'Weight Loss', 'General Fitness'];
const TIER_BADGE = { Free: '🆓 Free', Pro: '⭐ Pro', Premium: '💎 Premium' };
const TIER_COLOR = { Free: 'tier-free', Pro: 'tier-pro', Premium: 'tier-premium' };

export default function ProfilePage() {
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    fullName: '', gender: '', bodyWeightKg: '', fitnessLevel: 'Beginner',
    primaryGoal: 'Strength', availableDaysPerWeek: 3,
  });
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [isNew, setIsNew]       = useState(false);

  const setField = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  // Load profile khi mount
  useEffect(() => {
    api.get('/api/userprofiles/me')
      .then(({ data }) => {
        setProfile(data);
        setForm({
          fullName: data.fullName ?? '',
          gender: data.gender ?? '',
          bodyWeightKg: data.bodyWeightKg ?? '',
          fitnessLevel: data.fitnessLevel ?? 'Beginner',
          primaryGoal: data.primaryGoal ?? 'Strength',
          availableDaysPerWeek: data.availableDaysPerWeek ?? 3,
        });
      })
      .catch((err) => {
        if (err.response?.status === 404) {
          setIsNew(true);
          setForm((f) => ({
            ...f,
            fullName: user?.name ?? '',
          }));
        } else {
          setError('Không thể tải hồ sơ. Vui lòng thử lại.');
        }
      })
      .finally(() => setLoading(false));
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        ...form,
        bodyWeightKg: parseFloat(form.bodyWeightKg) || 0,
        availableDaysPerWeek: parseInt(form.availableDaysPerWeek),
      };

      if (isNew) {
        const { data } = await api.post('/api/userprofiles/me', payload);
        setProfile(data);
        setIsNew(false);
      } else {
        const { data } = await api.put('/api/userprofiles/me', payload);
        setProfile(data);
      }
      setSuccess('✅ Hồ sơ đã được lưu thành công!');
    } catch {
      setError('Lưu thất bại. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* Header */}
      <div className="profile-header">
        <div className="profile-avatar">
          {(form.fullName || user?.name || 'U')[0].toUpperCase()}
        </div>
        <div>
          <h1 className="profile-name">{form.fullName || user?.name || 'Người dùng'}</h1>
          <p className="profile-email">{profile?.email || user?.email}</p>
          {profile?.subscriptionTier && (
            <span className={`tier-badge ${TIER_COLOR[profile.subscriptionTier] || 'tier-free'}`}>
              {TIER_BADGE[profile.subscriptionTier] || profile.subscriptionTier}
            </span>
          )}
        </div>
      </div>

      {isNew && (
        <div className="profile-notice">
          👋 Hãy điền thông tin để hệ thống tạo giáo án phù hợp với bạn!
        </div>
      )}

      {error   && <div className="auth-error"><span>⚠</span> {error}</div>}
      {success && <div className="profile-success">{success}</div>}

      <form onSubmit={handleSubmit} className="profile-form">
        <div className="profile-section-title">Thông tin cá nhân</div>
        <div className="profile-grid">
          <div className="form-group">
            <label htmlFor="pf-name" className="form-label">Họ và tên</label>
            <input id="pf-name" type="text" className="form-input"
              value={form.fullName} onChange={setField('fullName')} required />
          </div>

          <div className="form-group">
            <label htmlFor="pf-gender" className="form-label">Giới tính</label>
            <select id="pf-gender" className="form-input form-select"
              value={form.gender} onChange={setField('gender')}>
              <option value="">-- Chọn --</option>
              <option value="Male">Nam</option>
              <option value="Female">Nữ</option>
              <option value="Other">Khác</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="pf-weight" className="form-label">Cân nặng (kg)</label>
            <input id="pf-weight" type="number" className="form-input"
              min="30" max="300" step="0.1" placeholder="70.5"
              value={form.bodyWeightKg} onChange={setField('bodyWeightKg')} />
          </div>

          <div className="form-group">
            <label htmlFor="pf-days" className="form-label">Số ngày tập / tuần</label>
            <input id="pf-days" type="number" className="form-input"
              min="1" max="7"
              value={form.availableDaysPerWeek} onChange={setField('availableDaysPerWeek')} />
          </div>
        </div>

        <div className="profile-section-title">Mục tiêu tập luyện</div>
        <div className="profile-grid">
          <div className="form-group">
            <label htmlFor="pf-level" className="form-label">Trình độ hiện tại</label>
            <select id="pf-level" className="form-input form-select"
              value={form.fitnessLevel} onChange={setField('fitnessLevel')}>
              {FITNESS_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="pf-goal" className="form-label">Mục tiêu chính</label>
            <select id="pf-goal" className="form-input form-select"
              value={form.primaryGoal} onChange={setField('primaryGoal')}>
              {GOALS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </div>

        <button id="pf-save" type="submit" className="auth-btn profile-save-btn" disabled={saving}>
          {saving ? <span className="btn-spinner" /> : (isNew ? '🚀 Tạo hồ sơ' : '💾 Lưu thay đổi')}
        </button>
      </form>
    </div>
  );
}
