import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { useTheme } from '../context/ThemeContext';
import { Download, FileText, ImageOff } from 'lucide-react';

interface AboutProps {
  lang: Language;
}

export const About: React.FC<AboutProps> = ({ lang }) => {
  const { aboutCertsImage, productionImages, rohsImages, equipmentImages } = useTheme();

  const prodImg = productionImages.length > 0 ? productionImages[0] : null;
  const effectiveRohsImages = rohsImages.length > 0 ? rohsImages : [];

  const [rohsIndex, setRohsIndex] = useState(0);

  useEffect(() => {
    if (effectiveRohsImages.length > 1) {
      const interval = setInterval(() => {
        setRohsIndex((prev) => (prev + 1) % effectiveRohsImages.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [effectiveRohsImages.length]);

  return (
    <div className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Intro */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-primary mb-6">{TRANSLATIONS.about[lang]}</h1>
          <p className="max-w-3xl mx-auto text-lg text-gray-600 leading-relaxed">
            {lang === 'en' 
              ? "Founded in 2000, Shenzhen Xinruitai Electronics Co., Ltd. (GlamCable) is a leading manufacturer specializing in power cords, swivel cords, and cable assemblies. We operate dual factories in Shenzhen and Dongguan, serving the global beauty, household appliance, medical, and communication industries."
              : "深圳市欣瑞泰电子有限公司（GlamCable）成立于2000年，是专业从事电源线、转尾线及电线组件的领先制造商。我们在深圳和东莞拥有双工厂，服务于全球美容美发、家用电器、医疗及通讯行业。"}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
          <div className="text-center p-6 bg-blue-50 rounded-lg">
            <div className="text-4xl font-bold text-primary mb-2">2000</div>
            <div className="text-sm text-gray-600">{lang === 'en' ? "Year Established" : "成立年份"}</div>
          </div>
          <div className="text-center p-6 bg-blue-50 rounded-lg">
            <div className="text-4xl font-bold text-primary mb-2">8000㎡</div>
            <div className="text-sm text-gray-600">{lang === 'en' ? "Factory Area" : "厂房面积"}</div>
          </div>
          <div className="text-center p-6 bg-blue-50 rounded-lg">
            <div className="text-4xl font-bold text-primary mb-2">200+</div>
            <div className="text-sm text-gray-600">{lang === 'en' ? "Employees" : "员工人数"}</div>
          </div>
           <div className="text-center p-6 bg-blue-50 rounded-lg">
            <div className="text-4xl font-bold text-primary mb-2">20M+</div>
            <div className="text-sm text-gray-600">{lang === 'en' ? "Annual Cords" : "年产电源线"}</div>
          </div>
        </div>

        {/* Factory Image & Text */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20">
           {/* Split View: Production Line (Top) & RoHS Lab (Bottom) */}
           <div className="rounded-xl overflow-hidden shadow-lg grid grid-rows-2 gap-2 h-96">
                <div className="relative group overflow-hidden bg-gray-100 flex items-center justify-center">
                    {prodImg ? (
                        <img src={prodImg} alt="Production Line" className="w-full h-full object-cover" />
                    ) : (
                        <div className="text-gray-400 text-xs text-center">
                            <ImageOff className="w-8 h-8 mx-auto mb-2 opacity-50"/>
                            <p>Production Line</p>
                            <p className="text-[10px]">(Upload in Editor)</p>
                        </div>
                    )}
                    <div className="absolute bottom-0 left-0 bg-black/60 text-white text-xs px-2 py-1">Production Lines</div>
                </div>
                <div className="relative group overflow-hidden bg-gray-100 flex items-center justify-center">
                    {effectiveRohsImages.length > 0 ? (
                        effectiveRohsImages.map((img, idx) => (
                            <img 
                              key={idx} 
                              src={img} 
                              alt={`RoHS Lab ${idx}`} 
                              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${idx === rohsIndex ? 'opacity-100' : 'opacity-0'}`} 
                            />
                        ))
                    ) : (
                        <div className="text-gray-400 text-xs text-center">
                            <ImageOff className="w-8 h-8 mx-auto mb-2 opacity-50"/>
                            <p>RoHS Lab</p>
                            <p className="text-[10px]">(Upload in Editor)</p>
                        </div>
                    )}
                    <div className="absolute bottom-0 left-0 bg-black/60 text-white text-xs px-2 py-1 z-10">RoHS Lab</div>
                </div>
           </div>

           <div>
             <h2 className="text-2xl font-bold text-gray-900 mb-4">
               {lang === 'en' ? "Advanced Manufacturing" : "先进制造能力"}
             </h2>
             <p className="text-gray-600 mb-4 leading-relaxed">
               {lang === 'en'
                 ? "Our facilities utilize over 100 sets of advanced production machinery and 40+ precision testing instruments. With an annual output of 80,000 km of wire and 20 million power cords, we ensure large-scale capacity with strict consistency."
                 : "我们的工厂配备了100多套先进生产设备和40多台精密检测仪器。年产电线80,000千米，电源线2000万条，确保在大规模产能下保持严格的一致性。"}
             </p>
             <ul className="list-disc list-inside text-gray-600 space-y-2">
               <li>{lang === 'en' ? "ISO9001 Quality Management" : "ISO9001 质量管理体系"}</li>
               <li>{lang === 'en' ? "RoHS 2.0 Compliant Labs" : "符合 RoHS 2.0 标准的实验室"}</li>
             </ul>
           </div>
        </div>
        
        {/* Lab Equipment Gallery (Replaces general Factory Gallery) */}
        <div className="mb-20">
            <div className="text-center mb-10">
                <h2 className="text-2xl font-bold text-gray-900">
                    {lang === 'en' ? "Lab Equipment" : "实验室设备"}
                </h2>
                <div className="w-16 h-1 bg-secondary mx-auto mt-4"></div>
            </div>
            {equipmentImages.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {equipmentImages.map((img, idx) => (
                        <div key={idx} className="group relative aspect-[4/3] rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all border border-gray-100">
                            <img src={img} alt={`Lab Equipment ${idx}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="w-full h-48 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center text-gray-400">
                    <ImageOff className="w-10 h-10 mb-2 opacity-50"/>
                    <p>{lang === 'en' ? "No Equipment Photos Uploaded" : "暂无设备照片"}</p>
                    <p className="text-xs mt-1">{lang === 'en' ? "Please upload in Editor > About" : "请在 编辑器 > About 中上传"}</p>
                </div>
            )}
        </div>

        {/* Certs Image Section */}
        <div className="bg-neutral-50 p-12 rounded-xl text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">{TRANSLATIONS.globalCerts[lang]}</h2>
          <div className="flex justify-center">
             {aboutCertsImage ? (
                <img 
                  src={aboutCertsImage} 
                  alt="Global Certifications" 
                  className="w-full max-w-5xl h-auto object-contain shadow-md rounded bg-white" 
                />
             ) : (
                <div className="w-full max-w-3xl h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 bg-white">
                    <span>{lang === 'en' ? "Certification Image (Upload in Editor > About)" : "认证图片展示位 (请在编辑器 > About 中上传)"}</span>
                </div>
             )}
          </div>
        </div>

      </div>
    </div>
  );
};