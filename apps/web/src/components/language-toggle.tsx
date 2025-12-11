/**
 * 语言切换组件
 */

import { Languages } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  useLanguage,
  LANGUAGE_NAMES,
  type SupportedLanguage,
} from '../lib/i18n';

export function LanguageToggle() {
  const { language, changeLanguage, supportedLanguages } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" title={LANGUAGE_NAMES[language]}>
          <Languages className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">切换语言</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {supportedLanguages.map((lang) => (
          <DropdownMenuItem
            key={lang}
            onClick={() => changeLanguage(lang as SupportedLanguage)}
            className={language === lang ? 'bg-accent' : ''}
          >
            {LANGUAGE_NAMES[lang as SupportedLanguage]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
