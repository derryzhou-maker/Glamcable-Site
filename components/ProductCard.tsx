import React from 'react';
import { Product, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { Button } from './Button';
import { ImageOff } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  lang: Language;
  onViewDetail: (id: string) => void;
  onInquiry: (sku: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, lang, onViewDetail, onInquiry }) => {
  const hasImage = product.images && product.images.length > 0;
  const displayImage = hasImage ? product.images[0] : null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-lg transition-shadow duration-300 overflow-hidden flex flex-col h-full">
      {/* Image Container */}
      <div 
        className="h-56 w-full bg-white relative cursor-pointer group p-4 border-b border-gray-100 flex items-center justify-center"
        onClick={() => onViewDetail(product.id)}
      >
        {displayImage ? (
             <img 
               src={displayImage} 
               alt={lang === 'en' ? product.nameEn : product.nameZh}
               className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
             />
        ) : (
             <div className="flex flex-col items-center justify-center text-gray-300">
                 <ImageOff className="w-10 h-10 mb-2" />
                 <span className="text-xs">No Image</span>
             </div>
        )}
        
        {/* Subtle overlay on hover */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-5 transition-opacity" />
      </div>
      
      {/* Content Container */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="mb-2">
           <span className="text-[10px] font-bold text-secondary uppercase tracking-wider bg-orange-50 px-2 py-1 rounded border border-orange-100">
             {product.subCategory}
           </span>
        </div>
        <h3 
          className="text-lg font-bold text-gray-900 mb-2 cursor-pointer hover:text-primary transition-colors leading-tight"
          onClick={() => onViewDetail(product.id)}
        >
          {lang === 'en' ? product.nameEn : product.nameZh}
        </h3>
        <p className="text-sm text-gray-500 mb-4 line-clamp-2 flex-1">
          {lang === 'en' ? product.descriptionEn : product.descriptionZh}
        </p>
        
        <div className="flex gap-3 mt-auto pt-3 border-t border-gray-100">
           <Button variant="outline" className="flex-1 !py-2 !h-9 !text-xs" onClick={() => onViewDetail(product.id)}>
             {lang === 'en' ? 'Details' : '详情'}
           </Button>
           <Button variant="primary" className="flex-1 !py-2 !h-9 !text-xs" onClick={() => onInquiry(product.sku)}>
             {TRANSLATIONS.getQuote[lang]}
           </Button>
        </div>
      </div>
    </div>
  );
};