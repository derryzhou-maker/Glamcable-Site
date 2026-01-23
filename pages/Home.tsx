import React from 'react';
import { ShieldCheck, Settings, Award, Truck } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { Button } from '../components/Button';
import { ProductCard } from '../components/ProductCard';
import { useTheme } from '../context/ThemeContext';
import { useProducts } from '../context/ProductContext';

interface HomeProps {
  lang: Language;
  navigate: (page: string) => void;
  onViewDetail: (id: string) => void;
  onInquiry: (sku: string) => void;
}

export const Home: React.FC<HomeProps> = ({ lang, navigate, onViewDetail, onInquiry }) => {
  const { products } = useProducts();
  const { heroImage } = useTheme();
  
  // Show first 3 products
  const featuredProducts = products.slice(0, 3);

  const hasHeroImage = !!heroImage && heroImage.length > 0;

  const advantages = [
    { icon: Award, titleEn: "Global Certifications", titleZh: "全球安规认证", descEn: "UL, VDE, CCC, PSE, KC, SAA", descZh: "UL, VDE, CCC, PSE, KC, SAA" },
    { icon: Settings, titleEn: "Custom Solutions", titleZh: "定制化方案", descEn: "Tailored specs for voltage & length", descZh: "按需定制电压、配线及长度" },
    { icon: ShieldCheck, titleEn: "Strict Quality Control", titleZh: "严格品控", descEn: "ISO9001 + 10 testing steps", descZh: "ISO9001体系 + 10道检测工序" },
    { icon: Truck, titleEn: "Fast Delivery", titleZh: "快速交付", descEn: "Efficient production & logistics", descZh: "高效生产与物流响应" }
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center bg-white">
        {/* Background Image Container */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          {hasHeroImage ? (
            <>
              <img 
                src={heroImage}
                alt="Xinruitai Factory" 
                className="w-full h-full object-cover transition-opacity duration-500"
              />
              {/* Light Overlay (White/30%) - Preserves pale yellow brightness while helping text readability */}
              <div className="absolute inset-0 bg-white/30"></div>
            </>
          ) : (
            <div className="w-full h-full bg-white" />
          )}
        </div>

        {/* Hero Content */}
        {/* Text is forced to Dark (Gray-900/Black) to contrast with Pale Yellow background */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-900">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
            Glam<span className="text-secondary">Cable</span>
          </h1>
          
          {/* Slogan: Pure Black + Font Medium for Maximum Contrast against Yellow */}
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto font-medium leading-relaxed text-black drop-shadow-sm">
            {TRANSLATIONS.brandSlogan[lang]}
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            {/* Buttons: Blue (Primary) contrasts excellently with Yellow */}
            <Button variant="primary" onClick={() => navigate('products')}>
              {TRANSLATIONS.viewProducts[lang]}
            </Button>
            <Button variant="outline" onClick={() => navigate('contact')}>
              {TRANSLATIONS.getQuote[lang]}
            </Button>
          </div>
        </div>
      </section>

      {/* Advantages */}
      <section className="py-20 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">{TRANSLATIONS.coreAdvantages[lang]}</h2>
            <div className="w-20 h-1 bg-secondary mx-auto mt-4"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {advantages.map((adv, idx) => (
              <div key={idx} className="bg-white p-8 rounded-lg shadow-sm border-t-4 border-primary text-center hover:-translate-y-2 transition-transform duration-300">
                <adv.icon className="w-12 h-12 text-primary mx-auto mb-6" />
                <h3 className="text-xl font-bold mb-3 text-gray-800">{lang === 'en' ? adv.titleEn : adv.titleZh}</h3>
                <p className="text-gray-600">{lang === 'en' ? adv.descEn : adv.descZh}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="flex justify-between items-end mb-12">
             <div>
               <h2 className="text-3xl font-bold text-gray-900">{TRANSLATIONS.products[lang]}</h2>
               <div className="w-20 h-1 bg-secondary mt-4"></div>
             </div>
             <button 
               onClick={() => navigate('products')} 
               className="text-primary font-medium hover:text-secondary hidden sm:block"
             >
               {TRANSLATIONS.viewProducts[lang]} &rarr;
             </button>
           </div>
           
           {featuredProducts.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 {featuredProducts.map((p, index) => (
                   <ProductCard 
                     key={p.id || index} 
                     product={p} 
                     lang={lang} 
                     onViewDetail={onViewDetail}
                     onInquiry={onInquiry}
                   />
                 ))}
               </div>
           ) : (
               <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                   <p className="text-gray-500">{lang === 'en' ? "Product catalog loading or empty." : "产品目录加载中或为空。"}</p>
               </div>
           )}
           
           <div className="mt-12 text-center sm:hidden">
              <Button variant="outline" onClick={() => navigate('products')}>
                 {TRANSLATIONS.viewProducts[lang]}
              </Button>
           </div>
        </div>
      </section>

      {/* Factory Preview CTA */}
      <section className="py-20 bg-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between">
           <div className="mb-8 md:mb-0 md:w-2/3">
             <h2 className="text-3xl font-bold mb-4">
               {lang === 'en' ? "20+ Years Manufacturing Excellence" : "20年+ 卓越制造经验"}
             </h2>
             <p className="text-blue-100 text-lg">
               {lang === 'en' 
                 ? "Two factories in Shenzhen and Dongguan, covering 5,000+ sqm with advanced testing equipment." 
                 : "深圳东莞双工厂，占地5000+平方米，配备先进检测设备。"}
             </p>
           </div>
           <div>
             <Button variant="secondary" onClick={() => navigate('about')}>
               {TRANSLATIONS.readMore[lang]}
             </Button>
           </div>
        </div>
      </section>
    </div>
  );
};