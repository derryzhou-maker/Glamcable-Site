import React from 'react';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS, CONTACT_INFO } from '../constants';
import { ContactForm } from '../components/ContactForm';

interface ContactProps {
  lang: Language;
  initialProduct?: string;
}

export const Contact: React.FC<ContactProps> = ({ lang, initialProduct }) => {
  return (
    <div className="bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-primary mb-4">{TRANSLATIONS.contact[lang]}</h1>
          <p className="text-gray-600">
            {lang === 'en' ? "Get in touch with our sales team for quotes and support." : "联系我们的销售团队获取报价和支持。"}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Contact Info */}
          <div className="space-y-8">
            {/* Card 1: Shenzhen */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-6 border-b pb-4">
                {lang === 'en' ? "Headquarters (Shenzhen)" : "深圳总部"}
              </h3>
              <ul className="space-y-4">
                 <li className="flex items-start">
                   <MapPin className="w-6 h-6 text-secondary mt-1 mr-3 flex-shrink-0" />
                   <div>
                     <span className="block text-sm font-bold text-gray-900">{lang === 'en' ? "Address" : "地址"}</span>
                     <span className="text-gray-600 block mb-1">
                       {lang === 'en' ? CONTACT_INFO.addressSzEn : CONTACT_INFO.addressSzZh}
                     </span>
                     <span className="text-xs text-gray-400">
                       Xinruitai Electronics Co., Ltd.
                     </span>
                   </div>
                 </li>
                 <li className="flex items-start">
                   <Phone className="w-6 h-6 text-secondary mt-1 mr-3 flex-shrink-0" />
                   <div>
                     <span className="block text-sm font-bold text-gray-900">{lang === 'en' ? "Phone" : "电话"}</span>
                     <span className="text-gray-600">{CONTACT_INFO.phoneSz}</span>
                   </div>
                 </li>
              </ul>
            </div>

            {/* Card 2: Dongguan */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-6 border-b pb-4">
                {lang === 'en' ? "Factory (Dongguan)" : "东莞工厂"}
              </h3>
               <ul className="space-y-4">
                 <li className="flex items-start">
                   <MapPin className="w-6 h-6 text-secondary mt-1 mr-3 flex-shrink-0" />
                   <div>
                     <span className="block text-sm font-bold text-gray-900">{lang === 'en' ? "Address" : "地址"}</span>
                     <span className="text-gray-600 block mb-1">
                       {lang === 'en' ? CONTACT_INFO.addressDgEn : CONTACT_INFO.addressDgZh}
                     </span>
                     <span className="text-xs text-gray-400">
                        Dongguan Xinruitai Electric Appliance Co., Ltd.
                     </span>
                   </div>
                 </li>
                 <li className="flex items-start">
                   <Phone className="w-6 h-6 text-secondary mt-1 mr-3 flex-shrink-0" />
                   <div>
                     <span className="block text-sm font-bold text-gray-900">{lang === 'en' ? "Phone" : "电话"}</span>
                     <span className="text-gray-600">{CONTACT_INFO.phoneDg}</span>
                   </div>
                 </li>
              </ul>
            </div>

            {/* General Info */}
             <div className="bg-primary text-white p-8 rounded-xl shadow-sm">
                <h3 className="text-xl font-bold mb-6 border-b border-blue-400 pb-4">
                  {lang === 'en' ? "Contact" : "联系方式"}
                </h3>
                <div className="flex items-start mb-4">
                   <Clock className="w-6 h-6 mr-3 mt-1" />
                   <div>
                     <p>Mon - Fri: 9:00 AM - 6:00 PM</p>
                     <p className="text-blue-200 text-sm">UTC+8</p>
                   </div>
                </div>
                 <div className="flex items-start">
                   <Mail className="w-6 h-6 mr-3 mt-1" />
                   <div>
                     <p>{CONTACT_INFO.emailSales}</p>
                     <p>{CONTACT_INFO.emailService}</p>
                   </div>
                </div>
             </div>
          </div>

          {/* Form */}
          <div>
            <ContactForm lang={lang} initialProduct={initialProduct} />
          </div>

        </div>
      </div>
    </div>
  );
};