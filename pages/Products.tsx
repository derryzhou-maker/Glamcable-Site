import React, { useState } from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { useProducts } from '../context/ProductContext';
import { ProductCard } from '../components/ProductCard';
import { ChevronRight } from 'lucide-react';

interface ProductsPageProps {
  lang: Language;
  onViewDetail: (id: string) => void;
  onInquiry: (sku: string) => void;
}

export const ProductsPage: React.FC<ProductsPageProps> = ({ lang, onViewDetail, onInquiry }) => {
  const { products, categories } = useProducts();
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [activeSubCategory, setActiveSubCategory] = useState<string>('All');

  // Load categories from Context
  const categoryStructure = categories;

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    setActiveSubCategory('All');
  };

  // Filter Logic
  const filteredProducts = products.filter(p => {
    if (activeCategory === 'All') return true;
    if (p.category !== activeCategory) return false;
    if (activeSubCategory !== 'All' && p.subCategory !== activeSubCategory) return false;
    return true;
  });

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{TRANSLATIONS.products[lang]}</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {lang === 'en' 
              ? "Professional B2B selection of certified power cords, swivel cords, and wire products." 
              : "专业的B2B认证电源线、转尾线及电线产品系列。"}
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Filters */}
          <div className="w-full md:w-64 flex-shrink-0 space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
               <h3 className="font-bold text-lg mb-4 text-gray-900">{TRANSLATIONS.productCategories[lang]}</h3>
               <ul className="space-y-2">
                 <li>
                   <button 
                     onClick={() => handleCategoryChange('All')}
                     className={`w-full text-left px-3 py-2 rounded-md transition-colors ${activeCategory === 'All' ? 'bg-blue-50 text-primary font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                   >
                     {lang === 'en' ? 'All Products' : '全部产品'}
                   </button>
                 </li>
                 {categoryStructure.map(cat => (
                   <li key={cat.name}>
                     <button 
                       onClick={() => handleCategoryChange(cat.name)}
                       className={`w-full text-left px-3 py-2 rounded-md flex justify-between items-center transition-colors ${activeCategory === cat.name ? 'bg-blue-50 text-primary font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                     >
                       <span>{cat.name}</span>
                       <ChevronRight className={`w-4 h-4 transition-transform ${activeCategory === cat.name ? 'rotate-90' : ''}`} />
                     </button>
                     
                     {/* Subcategories (only if parent active) */}
                     {activeCategory === cat.name && (
                       <ul className="pl-4 mt-1 space-y-1 border-l-2 border-blue-100 ml-3">
                          <li>
                            <button
                              onClick={() => setActiveSubCategory('All')}
                              className={`w-full text-left px-3 py-1.5 text-sm rounded-md ${activeSubCategory === 'All' ? 'text-secondary font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                              {lang === 'en' ? 'All' : '全部'}
                            </button>
                          </li>
                          {cat.subs.map(sub => (
                             <li key={sub}>
                               <button
                                 onClick={() => setActiveSubCategory(sub)}
                                 className={`w-full text-left px-3 py-1.5 text-sm rounded-md ${activeSubCategory === sub ? 'text-secondary font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                               >
                                 {sub}
                               </button>
                             </li>
                          ))}
                       </ul>
                     )}
                   </li>
                 ))}
               </ul>
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1">
             <div className="mb-4 text-sm text-gray-500 flex items-center">
               <span className="font-medium text-gray-900">{filteredProducts.length}</span> 
               {lang === 'en' ? " products found" : " 个产品"}
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map(product => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    lang={lang} 
                    onViewDetail={onViewDetail}
                    onInquiry={onInquiry}
                  />
                ))}
             </div>

             {filteredProducts.length === 0 && (
              <div className="text-center py-20 bg-white rounded-lg border border-gray-200 border-dashed">
                <p className="text-gray-500">
                  {lang === 'en' ? "No products found in this category." : "该分类下暂无产品。"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};