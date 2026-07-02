import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { forgotPassword, confirmForgotPassword, getCognitoErrorMessage } from '@/services/authService';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep]     = useState(1);
  const [email, setEmail]   = useState('');
  const [code, setCode]     = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  // Bước 1: Gửi code
  const handleSendCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await forgotPassword(email);
      setStep(2);
    } catch (err) {
      setError(getCognitoErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Bước 2: Đặt lại mật khẩu
  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    if (newPwd !== confirmPwd) { setError('Mật khẩu xác nhận không khớp.'); return; }
    setLoading(true);
    try {
      await confirmForgotPassword(email, code, newPwd);
      navigate('/login', { state: { message: 'Đổi mật khẩu thành công! Hãy đăng nhập lại.' } });
    } catch (err) {
      setError(getCognitoErrorMessage(err));
    } finally {
      setLoading(false);
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
            <h2 className="auth-title">Quên mật khẩu</h2>
            <p className="auth-subtitle">Nhập email để nhận mã xác nhận đặt lại mật khẩu.</p>
            {error && <div className="auth-error"><span>⚠</span> {error}</div>}
            <form onSubmit={handleSendCode} className="auth-form">
              <div className="form-group">
                <label htmlFor="fp-email" className="form-label">Email tài khoản</label>
                <input id="fp-email" type="email" className="form-input" placeholder="name@example.com"
                  value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <button id="fp-send" type="submit" className="auth-btn" disabled={loading}>
                {loading ? <span className="btn-spinner" /> : 'Gửi mã xác nhận'}
              </button>
            </form>
          </>
        ) : (
          <>
            <h2 className="auth-title">Đặt lại mật khẩu</h2>
            <p className="auth-subtitle">Mã đã gửi đến <strong>{email}</strong>.</p>
            {error && <div className="auth-error"><span>⚠</span> {error}</div>}
            <form onSubmit={handleReset} className="auth-form">
              <div className="form-group">
                <label htmlFor="fp-code" className="form-label">Mã xác nhận</label>
                <input id="fp-code" type="text" className="form-input otp-input"
                  placeholder="123456" maxLength={6}
                  value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  required inputMode="numeric" />
              </div>
              <div className="form-group">
                <label htmlFor="fp-newpwd" className="form-label">Mật khẩu mới</label>
                <input id="fp-newpwd" type="password" className="form-input"
                  placeholder="Ít nhất 8 ký tự, chữ hoa, số"
                  value={newPwd} onChange={(e) => setNewPwd(e.target.value)} required />
              </div>
              <div className="form-group">
                <label htmlFor="fp-confirm" className="form-label">Xác nhận mật khẩu mới</label>
                <input id="fp-confirm" type="password" className="form-input" placeholder="••••••••"
                  value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} required />
              </div>
              <button id="fp-reset" type="submit" className="auth-btn" disabled={loading}>
                {loading ? <span className="btn-spinner" /> : 'Đặt lại mật khẩu'}
              </button>
            </form>
          </>
        )}

        <p className="auth-footer">
          <Link to="/login" className="form-link">← Quay lại đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}
