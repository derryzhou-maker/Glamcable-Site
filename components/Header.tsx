import React, { useState } from 'react';
import { Menu, X, Globe, Phone, Mail } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS, NAV_ITEMS, CONTACT_INFO } from '../constants';
import { Button } from './Button';
import { Logo } from './Logo';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  lang: Language;
  setLang: (l: Language) => void;
  activePage: string;
  navigate: (page: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ lang, setLang, activePage, navigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { logoImage } = useTheme();

  const toggleLang = () => {
    setLang(lang === 'en' ? 'zh' : 'en');
  };

  const handleNav = (id: string) => {
    navigate(id);
    setIsOpen(false);
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      {/* Top Bar */}
      <div className="bg-neutral-800 text-white text-xs py-2 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex space-x-6">
            <span className="flex items-center"><Mail className="w-3 h-3 mr-2" /> {CONTACT_INFO.emailSales}</span>
            <span className="flex items-center"><Phone className="w-3 h-3 mr-2" /> {CONTACT_INFO.phoneSz}</span>
          </div>
          <div className="flex items-center space-x-4">
             <button onClick={toggleLang} className="flex items-center hover:text-secondary transition-colors">
               <Globe className="w-3 h-3 mr-1" />
               {lang === 'en' ? 'English' : '中文'}
             </button>
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-24">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center cursor-pointer group" onClick={() => handleNav('home')}>
             {logoImage ? (
               <img src={logoImage} alt="Logo" className="h-14 w-auto mr-3 object-contain" />
             ) : (
               <Logo className="h-14 w-14 mr-3 group-hover:scale-105 transition-transform" />
             )}
             
             <div className="flex flex-col">
               <div className="text-2xl font-bold text-primary tracking-tight leading-none">
                 Glam<span className="text-secondary">Cable</span>
               </div>
               <span className="text-xs text-gray-500 mt-1">
                 {lang === 'en' ? 'Xinruitai Electronics' : '欣瑞泰电子'}
               </span>
             </div>
             {/* Slogan - Only visible on Large screens (Desktop) to save space on Tablet */}
             <div className="ml-4 hidden lg:block border-l border-gray-300 pl-4 h-10 flex items-center">
               <p className="text-xs text-gray-400 uppercase tracking-widest leading-snug w-72">
                 {lang === 'en' ? 'Global Professional Power Cord, Plug & Swivel Cord Solutions' : '全球专业电源线、插头及转尾线解决方案'}
               </p>
             </div>
          </div>

          {/* Desktop Menu - Changed from md:flex to lg:flex to support iPad Portrait */}
          <div className="hidden lg:flex items-center space-x-8">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`text-sm font-medium transition-colors duration-200 ${
                  activePage === item.id ? 'text-primary font-bold' : 'text-gray-600 hover:text-primary'
                }`}
              >
                {lang === 'en' ? item.labelEn : item.labelZh}
              </button>
            ))}
            <Button variant="primary" onClick={() => handleNav('contact')} className="!py-2 !px-4 !text-sm !bg-[#0066CC] hover:!bg-[#0055BB]">
              {TRANSLATIONS.getQuote[lang]}
            </Button>
            <button onClick={toggleLang} className="hidden lg:flex items-center text-gray-600 hover:text-primary">
               {lang === 'en' ? 'CN' : 'EN'}
            </button>
          </div>

          {/* Mobile/Tablet Menu Button - Visible up to lg breakpoint */}
          <div className="lg:hidden flex items-center">
             <button onClick={toggleLang} className="mr-4 text-gray-600 font-medium border border-gray-200 px-2 py-1 rounded text-xs">
               {lang === 'en' ? 'CN' : 'EN'}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-600 hover:text-primary focus:outline-none p-2"
            >
              {isOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile/Tablet Dropdown Menu */}
      {isOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 shadow-xl absolute w-full left-0 z-50">
          <div className="px-4 pt-4 pb-6 space-y-2">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`block w-full text-left px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                  activePage === item.id ? 'text-primary bg-blue-50' : 'text-gray-700 hover:text-primary hover:bg-gray-50'
                }`}
              >
                {lang === 'en' ? item.labelEn : item.labelZh}
              </button>
            ))}
             <div className="mt-6 pt-4 border-t border-gray-100">
               <Button variant="primary" className="w-full py-3 text-lg" onClick={() => handleNav('contact')}>
                 {TRANSLATIONS.getQuote[lang]}
               </Button>
             </div>
             
             {/* Mobile Contact Info Quick View */}
             <div className="mt-6 flex flex-col gap-2 text-xs text-gray-500 px-2">
                 <div className="flex items-center"><Phone className="w-3 h-3 mr-2"/> {CONTACT_INFO.phoneSz}</div>
                 <div className="flex items-center"><Mail className="w-3 h-3 mr-2"/> {CONTACT_INFO.emailSales}</div>
             </div>
          </div>
        </div>
      )}
    </header>
  );
};