import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'vi' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <Button variant="outline" size="sm" onClick={toggleLanguage} className="font-bold">
      {i18n.language === 'en' ? '🇺🇸 EN' : '🇻🇳 VI'}
    </Button>
  );
}
