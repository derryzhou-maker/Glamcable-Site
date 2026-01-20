import React, { useState } from 'react';
import { ArrowLeft, ImageOff } from 'lucide-react';
import { Language } from '../types';
import { useProducts } from '../context/ProductContext';
import { ContactForm } from '../components/ContactForm';
import { ProductCard } from '../components/ProductCard';

interface ProductDetailPageProps {
  productId: string;
  lang: Language;
  onBack: () => void;
  onViewDetail: (id: string) => void;
  onInquiry: (sku: string) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ productId, lang, onBack, onViewDetail, onInquiry }) => {
  const { products } = useProducts();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  const product = products.find(p => p.id === productId);

  if (!product) return <div>Not Found</div>;

  // Safe Image Handling
  const hasImages = Array.isArray(product.images) && product.images.length > 0;
  const currentImage = hasImages ? (product.images[selectedImageIndex] || product.images[0]) : null;

  // Logic to find related products (Same category, excluding current)
  const relatedProducts = products
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4); // Limit to 4 items

  return (
    <div className="bg-white min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button 
          onClick={onBack}
          className="flex items-center text-gray-500 hover:text-primary mb-8 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          {lang === 'en' ? "Back to Products" : "返回产品列表"}
        </button>

        {/* Product Title Section - Centered at top */}
        <div className="text-center mb-8">
            <span className="text-secondary font-bold text-sm tracking-wider uppercase mb-2 block">
                {product.subCategory}
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                {lang === 'en' ? product.nameEn : product.nameZh}
            </h1>
        </div>

        {/* Large Image View - Occupies most of the screen width */}
        <div className="max-w-6xl mx-auto mb-16">
            <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm p-4">
               {/* Main Image Container - tall enough to show specs */}
               <div className="w-full h-[600px] md:h-[800px] flex items-center justify-center bg-white">
                  {currentImage ? (
                      <img 
                        src={currentImage} 
                        alt="Product Detail" 
                        className="w-full h-full object-contain" 
                      />
                  ) : (
                      <div className="flex flex-col items-center justify-center text-gray-300">
                          <ImageOff className="w-20 h-20 mb-4" />
                          <span className="text-xl">No Image Available</span>
                      </div>
                  )}
               </div>
            </div>
            
            {/* Thumbnails - Centered below */}
            {hasImages && product.images.length > 1 && (
                <div className="flex justify-center gap-4 mt-6 flex-wrap">
                    {product.images.map((img, idx) => (
                        <div 
                            key={idx} 
                            className={`w-20 h-20 rounded-md overflow-hidden cursor-pointer border p-1 bg-white transition-all ${selectedImageIndex === idx ? 'border-primary ring-2 ring-primary ring-offset-2' : 'border-gray-200 hover:border-gray-300'}`}
                            onClick={() => setSelectedImageIndex(idx)}
                        >
                            <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-contain" />
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* Inquiry Section */}
        <div className="bg-neutral-50 rounded-2xl p-6 lg:p-12 border border-neutral-100 mb-16 shadow-inner">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
             <div className="lg:col-span-1">
               <h3 className="text-2xl font-bold text-primary mb-4">
                 {lang === 'en' ? "Interested in this product?" : "对该产品感兴趣？"}
               </h3>
               <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                 {lang === 'en' 
                   ? "Our engineering team is ready to provide custom specifications and competitive quotes." 
                   : "我们的工程团队随时准备为您提供定制规格和极具竞争力的报价。"}
               </p>
               <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center gap-4">
                 <div className="w-16 h-16 bg-gray-50 rounded border flex items-center justify-center p-1 overflow-hidden">
                     {currentImage ? (
                        <img src={currentImage} className="w-full h-full object-contain" />
                     ) : (
                        <ImageOff className="w-6 h-6 text-gray-300" />
                     )}
                 </div>
                 <div>
                    <p className="font-bold text-gray-900 mb-1 text-sm">{lang === 'en' ? product.nameEn : product.nameZh}</p>
                    <p className="text-xs text-gray-500 font-mono">SKU: {product.sku}</p>
                 </div>
               </div>
             </div>
             <div className="lg:col-span-2">
                <ContactForm lang={lang} initialProduct={`${product.sku} - ${lang === 'en' ? product.nameEn : product.nameZh}`} />
             </div>
          </div>
        </div>

        {/* RELATED PRODUCTS SECTION */}
        {relatedProducts.length > 0 && (
          <div className="border-t border-gray-200 pt-16">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-gray-900">
                {lang === 'en' ? `Other ${product.category} Products` : `更多 ${product.category} 系列产品`}
              </h2>
              <div className="w-16 h-1 bg-secondary mx-auto mt-4 rounded-full"></div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map(rp => (
                <ProductCard 
                  key={rp.id} 
                  product={rp} 
                  lang={lang} 
                  onViewDetail={onViewDetail}
                  onInquiry={onInquiry}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};