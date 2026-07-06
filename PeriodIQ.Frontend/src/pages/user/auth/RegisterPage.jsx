import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { resendConfirmationCode, getCognitoErrorMessage } from '@/services/authService';
import { KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthIllustration from './AuthIllustration';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';
import { toast } from 'react-hot-toast';

export default function RegisterPage() {
  const { register, confirmOtp } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [step, setStep] = useState(1); // 1: form, 2: OTP
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '', fullName: '' });
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error(t('auth.pwd_mismatch'));
      return;
    }
    setLoading(true);
    try {
      await register(form.email, form.password, form.fullName);
      setStep(2);
    } catch (err) {
      toast.error(getCognitoErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await confirmOtp(form.email, otp);
      navigate('/login', { state: { message: t('auth.register_success') } });
    } catch (err) {
      toast.error(getCognitoErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await resendConfirmationCode(form.email);
      toast.success(t('auth.resend_success'));
    } catch (err) {
      toast.error(getCognitoErrorMessage(err));
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:block lg:w-1/2 relative">
        <AuthIllustration />
      </div>

      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 antialiased overflow-y-auto relative">
        <div className="absolute top-4 right-4">
          <LanguageSwitcher />
        </div>
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center lg:items-start mb-8">
            <div className="h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center text-white mb-4">
              <span className="font-black text-2xl">P</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              {step === 1 ? t('auth.register_title') : t('auth.verify_title')}
            </h1>
            <p className="text-sm text-muted-foreground mt-2 text-center lg:text-left">
              {step === 1 
                ? t('auth.register_subtitle')
                : `${t('auth.verify_subtitle')} ${form.email}. ${t('auth.verify_subtitle2')}`
              }
            </p>
          </div>

          {step === 1 ? (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullname">{t('auth.full_name')}</Label>
                <Input
                  id="fullname"
                  type="text"
                  placeholder="Nguyễn Văn A"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  required
                  className="h-11 bg-background text-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  className="h-11 bg-background text-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPwd ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    className="pr-10 h-11 bg-background text-foreground"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPwd(!showPwd)}
                  >
                    {showPwd ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2 pb-2">
                <Label htmlFor="confirmPassword">{t('auth.confirm_password')}</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    required
                    className="h-11 bg-background text-foreground"
                  />
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium">
                {loading ? t('common.loading') : t('auth.register_btn')}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="otp-code">{t('auth.otp_label')}</Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <Input
                    id="otp-code"
                    type="text"
                    placeholder="123456"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    required
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    className="pl-9 h-14 text-xl tracking-widest text-center font-mono bg-background text-foreground"
                  />
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium">
                {loading ? t('common.loading') : t('auth.verify_btn')}
              </Button>
              
              <p className="text-sm text-center text-muted-foreground mt-4">
                {t('auth.no_otp')}{' '}
                <button type="button" className="text-blue-600 font-medium hover:underline dark:text-blue-500" onClick={handleResend}>
                  {t('auth.resend_btn')}
                </button>
              </p>
            </form>
          )}

          {step === 1 && (
            <p className="mt-6 text-sm text-muted-foreground text-center lg:text-left">
              {t('auth.has_account')}{' '}
              <Link to="/login" className="text-blue-600 font-medium hover:underline dark:text-blue-500">
                {t('auth.login_btn')}
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
