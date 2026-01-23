import React from 'react';
import { MapPin, Phone, Mail, Linkedin, Youtube, RefreshCw, Trash2, Database } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS, CONTACT_INFO, NAV_ITEMS } from '../constants';
import { useTheme } from '../context/ThemeContext';
import { useProducts } from '../context/ProductContext';
import { Logo } from './Logo';
import { clearDatabase } from '../utils/db';

interface FooterProps {
  lang: Language;
  navigate: (page: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ lang, navigate }) => {
  const { logoImage, localVersion, remoteVersion, debugStatus: themeStatus } = useTheme();
  const { debugStatus: productStatus } = useProducts();
  
  const handleForceUpdate = async () => {
    if (window.confirm("CRITICAL RESET: This will delete all local cache and force-download the latest content from the server.\n\nUse this if you don't see your latest updates.\n\nProceed?")) {
        console.log("Nuclearing cache...");
        try {
            await clearDatabase();
            localStorage.clear();
            alert("Cache cleared. The page will now reload.");
            window.location.reload();
        } catch (e) {
            alert("Failed to clear database. Please manually clear browser data.");
        }
    }
  };
  
  return (
    <footer className="bg-neutral-100 pt-16 pb-8 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          
          {/* Column 1: Company Info */}
          <div className="space-y-4">
            <div className="flex items-center mb-4">
               {logoImage ? (
                  <img src={logoImage} alt="Logo" className="h-10 w-auto mr-2" />
               ) : (
                  <Logo className="h-10 w-10 mr-2" />
               )}
               <div className="text-2xl font-bold text-primary">
                  Glam<span className="text-secondary">Cable</span>
               </div>
            </div>
            
            <p className="text-gray-600 text-sm leading-relaxed">
              {lang === 'en' 
                ? "Shenzhen Xinruitai Electronics Co., Ltd. is a professional manufacturer of power cords and swivel cords with over 20 years of experience."
                : "深圳市欣瑞泰电子有限公司是一家拥有20多年经验的专业电源线及转尾产品制造商。"}
            </p>
            <div className="flex space-x-4 pt-2">
              <a href="#" className="text-gray-400 hover:text-primary"><Linkedin className="w-5 h-5" /></a>
              <a href="#" className="text-gray-400 hover:text-red-600"><Youtube className="w-5 h-5" /></a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
              {lang === 'en' ? "Quick Links" : "快速链接"}
            </h3>
            <ul className="space-y-3">
              {NAV_ITEMS.map((item) => (
                <li key={item.id}>
                  <button 
                    onClick={() => navigate(item.id)}
                    className="text-gray-600 hover:text-primary transition-colors text-sm"
                  >
                    {lang === 'en' ? item.labelEn : item.labelZh}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Contact */}
          <div>
             <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
              {TRANSLATIONS.contact[lang]}
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <MapPin className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                <span className="ml-3 text-sm text-gray-600">
                  {lang === 'en' ? CONTACT_INFO.addressSzEn : CONTACT_INFO.addressSzZh}
                </span>
              </li>
              <li className="flex items-center">
                <Phone className="w-5 h-5 text-secondary flex-shrink-0" />
                <span className="ml-3 text-sm text-gray-600">{CONTACT_INFO.phoneSz}</span>
              </li>
              <li className="flex items-center">
                <Mail className="w-5 h-5 text-secondary flex-shrink-0" />
                <span className="ml-3 text-sm text-gray-600">{CONTACT_INFO.emailSales}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 text-center text-sm text-gray-500 flex flex-col items-center gap-2">
          <span>{TRANSLATIONS.copyright[lang]}</span>
          <div className="flex flex-col items-center gap-1 mt-2">
             <div className="flex items-center gap-3 text-[10px] text-gray-400 font-mono">
                 <span title="Version of data currently displayed">Ver: {remoteVersion?.slice(-6) || localVersion?.slice(-6) || 'N/A'}</span>
                 <span>|</span>
                 <span title="Debug Status" className="text-blue-400">Status: {themeStatus} / {productStatus}</span>
             </div>
             
             <button 
                onClick={handleForceUpdate}
                className="flex items-center text-[10px] bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded transition-colors border border-red-200 mt-1"
                title="Completely wipe local data and reload from server"
             >
                <Database className="w-3 h-3 mr-1" />
                {lang === 'en' ? "Force Reload Data" : "强制重新加载数据"}
             </button>
          </div>
        </div>
      </div>
    </footer>
  );
};