import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { forgotPassword, confirmForgotPassword, getCognitoErrorMessage } from '@/services/authService';
import { Mail, Lock, Eye, EyeOff, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthIllustration from './AuthIllustration';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';
import { toast } from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [step, setStep]     = useState(1);
  const [email, setEmail]   = useState('');
  const [code, setCode]     = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  // Bước 1: Gửi code
  const handleSendCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email);
      setStep(2);
    } catch (err) {
      toast.error(getCognitoErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Bước 2: Đặt lại mật khẩu
  const handleReset = async (e) => {
    e.preventDefault();
    if (newPwd !== confirmPwd) { toast.error(t('auth.pwd_mismatch')); return; }
    setLoading(true);
    try {
      await confirmForgotPassword(email, code, newPwd);
      toast.success(t('auth.reset_success_msg'));
      navigate('/login');
    } catch (err) {
      toast.error(getCognitoErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Cột trái: Hình ảnh minh họa (AuthIllustration) */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <AuthIllustration />
      </div>

      {/* Cột phải: Form */}
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
              {step === 1 ? t('auth.forgot_title') : t('auth.reset_pwd')}
            </h1>
            <p className="text-sm text-muted-foreground mt-2 text-center lg:text-left">
              {step === 1 
                ? t('auth.reset_subtitle1')
                : `${t('auth.reset_subtitle2')} ${email}.`
              }
            </p>
          </div>

          {step === 1 ? (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fp-email">{t('auth.email')}</Label>
                <div className="relative">
                  <Input
                    id="fp-email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11 bg-background text-foreground"
                  />
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium">
                {loading ? t('common.loading') : t('auth.send_code_btn')}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fp-code">{t('auth.otp_label')}</Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <Input
                    id="fp-code"
                    type="text"
                    placeholder="123456"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    required
                    inputMode="numeric"
                    className="pl-9 h-14 text-xl tracking-widest text-center font-mono bg-background text-foreground"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fp-newpwd">{t('auth.new_pwd')}</Label>
                <div className="relative">
                  <Input
                    id="fp-newpwd"
                    type={showPwd ? 'text' : 'password'}
                    placeholder={t('auth.pwd_hint')}
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    required
                    className="pr-10 h-11 bg-background text-foreground"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPwd(!showPwd)}
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2 pb-2">
                <Label htmlFor="fp-confirm">{t('auth.confirm_new_pwd')}</Label>
                <div className="relative">
                  <Input
                    id="fp-confirm"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    required
                    className="h-11 bg-background text-foreground"
                  />
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium">
                {loading ? t('common.loading') : t('auth.reset_pwd_btn')}
              </Button>
            </form>
          )}

          <p className="mt-6 text-sm text-muted-foreground text-center lg:text-left">
            <Link to="/login" className="text-blue-600 font-medium hover:underline dark:text-blue-500">
              ← {t('auth.back_to_login')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
