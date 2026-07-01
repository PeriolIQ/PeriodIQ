import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import progressService from '@/services/progressService';

export default function Settings() {
  const { user } = useAuth();
  const [emailReminders, setEmailReminders] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    progressService.getProgress().then(res => {
      setEmailReminders(res.emailRemindersEnabled);
    }).catch(err => console.error("Failed to fetch settings", err));
  }, []);

  const handleToggle = async (e) => {
    const newValue = e.target.checked;
    setEmailReminders(newValue);
    setLoading(true);
    
    try {
      await progressService.updateNotificationSettings(newValue);
    } catch (error) {
      console.error("Failed to update settings", error);
      setEmailReminders(!newValue); // Revert on failure
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 w-full">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Cài đặt</h2>
        <p className="text-muted-foreground">Quản lý tùy chọn thông báo và tài khoản.</p>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Thông báo</h3>
        
        <div className="flex items-center justify-between py-4 border-b">
          <div className="space-y-0.5">
            <h4 className="text-base font-medium">Email Nhắc Nhở Lịch Tập</h4>
            <p className="text-sm text-muted-foreground">
              Nhận email nhắc nhở nếu bạn chưa tập luyện sau vài ngày (Worker AWS SES).
            </p>
          </div>
          <div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={emailReminders} 
                onChange={handleToggle}
                disabled={loading}
              />
              <div className="w-11 h-6 bg-muted rounded-full peer peer-focus:ring-4 peer-focus:ring-violet-300 dark:peer-focus:ring-violet-800 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-violet-600"></div>
            </label>
          </div>
        </div>
      </Card>
    </div>
  );
}
