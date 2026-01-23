import React from 'react';
import { Download, FileText, Info } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { useTheme } from '../context/ThemeContext';

interface CertProps {
  lang: Language;
}

export const Certifications: React.FC<CertProps> = ({ lang }) => {
  const { certImages } = useTheme();

  const certGroups = [
    {
      key: "china",
      regionEn: "China",
      regionZh: "中国",
      certs: ["CCC"]
    },
    {
      key: "na_eu",
      regionEn: "North America & Europe",
      regionZh: "北美 & 欧洲",
      certs: ["UL", "cUL", "VDE", "IMQ", "NF", "ASTA", "KEMA"]
    },
    {
      key: "asia",
      regionEn: "Asia",
      regionZh: "亚洲",
      certs: ["PSE (Japan)", "KC (Korea)", "CNS (Taiwan)"]
    },
    {
      key: "others",
      regionEn: "Others",
      regionZh: "其他",
      certs: ["SAA (Australia)", "INMETRO (Brazil)", "IRAM (Argentina)"]
    }
  ];

  return (
    <div className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
         <div className="text-center mb-16">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{TRANSLATIONS.globalCerts[lang]}</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {lang === 'en' 
              ? "We adhere to strict quality standards and hold safety certifications for major global markets." 
              : "我们坚持严格的质量标准，并拥有主要全球市场的安全认证。"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {certGroups.map((group, idx) => {
             const certs = certImages[group.key] || [];
             const isChina = group.key === 'china';
             return (
               <div key={idx} className="bg-neutral-50 rounded-xl p-8 border border-neutral-100 hover:shadow-md transition-shadow flex flex-col h-full">
                 <h3 className="text-xl font-bold text-primary mb-4 border-b border-gray-200 pb-2">
                   {lang === 'en' ? group.regionEn : group.regionZh}
                 </h3>
                 <div className="flex flex-wrap gap-3 mb-6">
                   {group.certs.map(cert => (
                     <span key={cert} className="px-3 py-1 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700">
                       {cert}
                     </span>
                   ))}
                 </div>
                 
                 {/* Certificate List */}
                 <div className="mt-6 space-y-3">
                   {certs.length > 0 ? (
                       certs.map((cert, i) => {
                           // If URL is present, it's a file download. If not, it's a text-only record (like CCC request).
                           if (cert.url) {
                               return (
                                   <a 
                                     key={i}
                                     href={cert.url} 
                                     download={cert.name}
                                     className="w-full flex items-center justify-between p-4 bg-white border border-blue-100 rounded-lg hover:bg-blue-50 transition-colors group cursor-pointer"
                                   >
                                      <div className="flex items-center overflow-hidden">
                                          <FileText className="w-6 h-6 text-red-500 mr-3 flex-shrink-0" />
                                          <div className="text-left overflow-hidden">
                                              <span className="text-sm font-bold text-gray-900 block truncate max-w-[180px]" title={cert.name}>
                                                  {cert.name}
                                              </span>
                                              <span className="text-xs text-gray-400 block">
                                                  {lang === 'en' ? 'Click to Download' : '点击下载'}
                                              </span>
                                          </div>
                                      </div>
                                      <Download className="w-4 h-4 text-primary flex-shrink-0" />
                                   </a>
                               );
                           } else {
                               return (
                                   <div key={i} className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                                       <div className="flex items-center">
                                            <FileText className="w-6 h-6 text-gray-400 mr-3 flex-shrink-0" />
                                            <span className="text-sm font-bold text-gray-700">{cert.name}</span>
                                       </div>
                                       <span className="text-[10px] text-gray-400 border border-gray-200 px-2 py-0.5 rounded bg-gray-50">
                                           {lang === 'en' ? 'Listed' : '已列名'}
                                       </span>
                                   </div>
                               );
                           }
                       })
                   ) : (
                       <div className="w-full bg-white rounded border border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-sm flex-col p-6 text-center h-24">
                           <span className="font-medium mb-1">{lang === 'en' ? "No Certificate" : "暂无证书"}</span>
                           <span className="text-xs">{lang === 'en' ? "Available upon request" : "如有需要请联系我们"}</span>
                       </div>
                   )}
                 </div>

                 {/* Special Footer for China CCC */}
                 {isChina && (
                     <div className="mt-4 p-3 bg-yellow-50 border border-yellow-100 rounded text-xs text-yellow-800 flex items-start leading-snug">
                        <Info className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                        <div>
                            {lang === 'en' 
                                ? "Please contact us for a copy of the CCC certificate." 
                                : "如需要CCC证书复印件请联系我们。"}
                        </div>
                     </div>
                 )}
               </div>
             );
           })}
        </div>

        <div className="mt-16 bg-blue-50 p-8 rounded-lg flex flex-col md:flex-row items-center justify-between">
           <div className="mb-6 md:mb-0">
             <h3 className="text-xl font-bold text-gray-900 mb-2">
               {lang === 'en' ? "ISO Management System" : "ISO 管理体系"}
             </h3>
             <p className="text-gray-600">
               ISO 9001:2015 (Quality)
             </p>
           </div>
           <div className="flex gap-4">
             {/* ISO 9001 */}
             {certImages['iso9001'] && certImages['iso9001'].length > 0 ? (
                 certImages['iso9001'].map((cert, i) => (
                    <div key={i} className="w-32 h-32 bg-white shadow-sm border rounded-lg overflow-hidden">
                         <a 
                            href={cert.url} 
                            download={cert.name}
                            className="w-full h-full flex flex-col items-center justify-center hover:bg-gray-50 transition-colors"
                          >
                             <FileText className="w-10 h-10 text-red-500 mb-2" />
                             <span className="text-xs font-bold text-gray-700 px-2 text-center truncate w-full">{cert.name}</span>
                             <span className="text-[10px] text-primary flex items-center mt-1">Download <Download className="w-3 h-3 ml-1"/></span>
                          </a>
                    </div>
                 ))
             ) : (
                <div className="w-32 h-32 bg-white shadow-sm border rounded-lg overflow-hidden flex items-center justify-center text-xs text-center text-gray-400 p-2">
                    ISO 9001<br/>Not Uploaded
                </div>
             )}
           </div>
        </div>

      </div>
    </div>
  );
};