import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { resendConfirmationCode, getCognitoErrorMessage } from '@/services/authService';

export default function RegisterPage() {
  const { register, confirmOtp } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: form, 2: OTP
  const [form, setForm] = useState({ email: '', password: '', confirmPwd: '', fullName: '' });
  const [otp, setOtp]   = useState('');
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const setField = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  // Bước 1: Đăng ký
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPwd) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
    setLoading(true);
    try {
      await register(form.email, form.password, form.fullName);
      setStep(2);
    } catch (err) {
      setError(getCognitoErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Bước 2: Xác nhận OTP
  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await confirmOtp(form.email, otp);
      navigate('/login', { state: { message: 'Đăng ký thành công! Hãy đăng nhập.' } });
    } catch (err) {
      setError(getCognitoErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await resendConfirmationCode(form.email);
      setError('');
      alert('Đã gửi lại mã OTP về email của bạn.');
    } catch (err) {
      setError(getCognitoErrorMessage(err));
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">⚡</div>
          <h1 className="auth-logo-text">PeriodIQ</h1>
        </div>

        {step === 1 ? (
          <>
            <h2 className="auth-title">Tạo tài khoản</h2>
            <p className="auth-subtitle">Bắt đầu hành trình tập luyện thông minh của bạn.</p>

            {error && <div className="auth-error"><span>⚠</span> {error}</div>}

            <form onSubmit={handleRegister} className="auth-form">
              <div className="form-group">
                <label htmlFor="reg-name" className="form-label">Họ và tên</label>
                <input id="reg-name" type="text" className="form-input" placeholder="Nguyễn Văn A"
                  value={form.fullName} onChange={setField('fullName')} required />
              </div>

              <div className="form-group">
                <label htmlFor="reg-email" className="form-label">Email</label>
                <input id="reg-email" type="email" className="form-input" placeholder="name@example.com"
                  value={form.email} onChange={setField('email')} required autoComplete="email" />
              </div>

              <div className="form-group">
                <label htmlFor="reg-password" className="form-label">Mật khẩu</label>
                <div className="input-wrapper">
                  <input id="reg-password" type={showPwd ? 'text' : 'password'} className="form-input"
                    placeholder="Ít nhất 8 ký tự, gồm chữ hoa và số"
                    value={form.password} onChange={setField('password')} required />
                  <button type="button" className="input-eye" onClick={() => setShowPwd(!showPwd)}>
                    {showPwd ? '🙈' : '👁'}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="reg-confirm" className="form-label">Xác nhận mật khẩu</label>
                <input id="reg-confirm" type="password" className="form-input" placeholder="••••••••"
                  value={form.confirmPwd} onChange={setField('confirmPwd')} required />
              </div>

              <button id="reg-submit" type="submit" className="auth-btn" disabled={loading}>
                {loading ? <span className="btn-spinner" /> : 'Đăng ký'}
              </button>
            </form>

            <p className="auth-footer">
              Đã có tài khoản? <Link to="/login" className="form-link">Đăng nhập</Link>
            </p>
          </>
        ) : (
          <>
            <h2 className="auth-title">Xác nhận email</h2>
            <p className="auth-subtitle">
              Mã OTP đã gửi đến <strong>{form.email}</strong>. Vui lòng kiểm tra hộp thư.
            </p>

            {error && <div className="auth-error"><span>⚠</span> {error}</div>}

            <form onSubmit={handleVerify} className="auth-form">
              <div className="form-group">
                <label htmlFor="otp-code" className="form-label">Mã xác nhận (6 chữ số)</label>
                <input id="otp-code" type="text" className="form-input otp-input"
                  placeholder="123456" maxLength={6}
                  value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  required autoComplete="one-time-code" inputMode="numeric" />
              </div>

              <button id="otp-submit" type="submit" className="auth-btn" disabled={loading}>
                {loading ? <span className="btn-spinner" /> : 'Xác nhận'}
              </button>
            </form>

            <p className="auth-footer">
              Không nhận được mã?{' '}
              <button type="button" className="form-link" onClick={handleResend}>Gửi lại</button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
