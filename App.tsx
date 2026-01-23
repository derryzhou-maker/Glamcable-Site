import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { ProductsPage } from './pages/Products';
import { ProductDetailPage } from './pages/ProductDetail';
import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { Certifications } from './pages/Certifications';
import { Language } from './types';
import { ThemeProvider } from './context/ThemeContext';
import { ProductProvider } from './context/ProductContext';
import { ThemeEditor } from './components/ThemeEditor';

function App() {
  const [lang, setLang] = useState<Language>('en');
  // Simple State-based Router
  const [view, setView] = useState('home');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [inquirySku, setInquirySku] = useState<string>('');

  // DOMAIN CHECK: Determine if we are on the live site
  const [isProduction, setIsProduction] = useState(false);

  useEffect(() => {
    // Determine production environment based on hostname
    const hostname = window.location.hostname;
    const isLive = hostname === 'glamcable.com' || hostname === 'www.glamcable.com';
    setIsProduction(isLive);

    // Scroll to top on view change
    window.scrollTo(0, 0);
  }, [view, selectedProductId]);

  const navigateTo = (pageId: string) => {
    setView(pageId);
    setSelectedProductId(null);
    if (pageId !== 'contact') {
        setInquirySku(''); // Reset inquiry SKU if navigating away
    }
  };

  const handleViewDetail = (id: string) => {
    setSelectedProductId(id);
    setView('product-detail');
  };

  const handleInquiry = (sku: string) => {
    setInquirySku(sku);
    setView('contact');
  };

  const renderPage = () => {
    switch (view) {
      case 'home':
        return <Home lang={lang} navigate={navigateTo} onViewDetail={handleViewDetail} onInquiry={handleInquiry} />;
      case 'products':
        return <ProductsPage lang={lang} onViewDetail={handleViewDetail} onInquiry={handleInquiry} />;
      case 'product-detail':
        return selectedProductId 
          ? <ProductDetailPage 
              productId={selectedProductId} 
              lang={lang} 
              onBack={() => setView('products')} 
              onViewDetail={handleViewDetail}
              onInquiry={handleInquiry}
            />
          : <ProductsPage lang={lang} onViewDetail={handleViewDetail} onInquiry={handleInquiry} />;
      case 'about':
        return <About lang={lang} />;
      case 'certifications':
        return <Certifications lang={lang} />;
      case 'contact':
        return <Contact lang={lang} initialProduct={inquirySku} />;
      default:
        return <Home lang={lang} navigate={navigateTo} onViewDetail={handleViewDetail} onInquiry={handleInquiry} />;
    }
  };

  return (
    <ThemeProvider>
      <ProductProvider>
        <div className="min-h-screen flex flex-col font-sans text-gray-800 relative">
          <Header 
            lang={lang} 
            setLang={setLang} 
            activePage={view} 
            navigate={navigateTo} 
          />
          
          <main className="flex-grow">
            {renderPage()}
          </main>

          <Footer lang={lang} navigate={navigateTo} />
          
          {/* SECURITY: Only render the ThemeEditor if NOT on the live production domain */}
          {!isProduction && <ThemeEditor />}
        </div>
      </ProductProvider>
    </ThemeProvider>
  );
}

export default App;