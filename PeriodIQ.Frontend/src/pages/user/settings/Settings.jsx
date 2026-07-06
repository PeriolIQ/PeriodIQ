import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import progressService from '@/services/progressService';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/components/common/ThemeProvider';
import { Moon, Sun, Monitor } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [emailReminders, setEmailReminders] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    progressService.getProgress().then(res => {
      setEmailReminders(res.emailRemindersEnabled);
    }).catch(err => console.error("Failed to fetch settings", err));
  }, []);

  const handleToggle = async (e) => {
    const newValue = e.target.checked;

    if (newValue && !user?.email) {
      toast.error(
        (t_toast) => (
          <div className="flex flex-col gap-3">
            <span className="font-medium">Bạn chưa cập nhật địa chỉ Email!</span>
            <button 
              onClick={() => { toast.dismiss(t_toast.id); navigate('/profile'); }}
              className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              Chuyển sang Hồ sơ
            </button>
          </div>
        ),
        { duration: 5000 }
      );
      return;
    }

    setEmailReminders(newValue);
    setLoading(true);
    
    try {
      await progressService.updateNotificationSettings(newValue);
      toast.success(newValue ? 'Đã BẬT thông báo qua email' : 'Đã TẮT thông báo qua email');
    } catch (error) {
      console.error("Failed to update settings", error);
      toast.error('Có lỗi xảy ra khi lưu cài đặt!');
      setEmailReminders(!newValue); // Revert on failure
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 w-full p-4 sm:p-6">
      <div>
        <h2 className="text-3xl font-black text-foreground uppercase tracking-tighter mb-2">{t('settings_page.title')}</h2>
        <p className="text-muted-foreground font-medium">{t('settings_page.subtitle')}</p>
      </div>

      <Card className="p-6 bg-card border-border shadow-xl rounded-2xl">
        <h3 className="text-lg font-bold text-blue-500 mb-6 uppercase tracking-wider">{t('settings_page.appearance')}</h3>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between py-5 border-b border-border gap-4">
          <div className="space-y-1.5 flex-1">
            <h4 className="text-base font-bold text-foreground">{t('settings_page.theme')}</h4>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
              {t('settings_page.theme_desc')}
            </p>
          </div>
          <div className="sm:ml-4 flex items-center bg-muted/50 p-1 rounded-xl border border-border">
            <button
              onClick={() => setTheme('light')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                theme === 'light' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Sun className="w-4 h-4" />
              {t('settings_page.light')}
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                theme === 'dark' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Moon className="w-4 h-4" />
              {t('settings_page.dark')}
            </button>
            <button
              onClick={() => setTheme('system')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                theme === 'system' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Monitor className="w-4 h-4" />
              {t('settings_page.system')}
            </button>
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-card border-border shadow-xl rounded-2xl">
        <h3 className="text-lg font-bold text-blue-500 mb-6 uppercase tracking-wider">{t('settings_page.notifications')}</h3>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between py-5 border-b border-border gap-4">
          <div className="space-y-1.5 flex-1">
            <h4 className="text-base font-bold text-foreground">{t('settings_page.email_reminder')}</h4>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
              {t('settings_page.email_reminder_desc')}
            </p>
          </div>
          <div className="sm:ml-4 flex items-center">
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={emailReminders} 
                onChange={handleToggle}
                disabled={loading}
              />
              <div className="w-12 h-6 bg-slate-200 dark:bg-slate-800 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-500/50 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-slate-300 after:border-transparent after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-checked:after:bg-white shadow-inner"></div>
            </label>
          </div>
        </div>
      </Card>
    </div>
  );
}
