import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Product } from '../types';
import { dbGet, dbSet, dbSetMany, dbDelete } from '../utils/db';
import { INITIAL_DATA } from '../initialData';

interface Category {
  name: string;
  subs: string[];
}

interface ProductContextType {
  products: Product[];
  categories: Category[];
  addProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  addCategory: (name: string) => void;
  deleteCategory: (name: string) => void;
  resetProducts: () => void;
  restoreProducts: (products: Product[], categories: Category[], version?: string) => Promise<void>;
  isLoaded: boolean;
  debugStatus: string;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

const CHUNK_SIZE = 10;

export const ProductProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(INITIAL_DATA.products);
  const [categories, setCategories] = useState<Category[]>(INITIAL_DATA.categories);
  const [isLoaded, setIsLoaded] = useState(false);
  const [debugStatus, setDebugStatus] = useState("Init");

  // --- Helper: Data Sanitization (Prevents White Screens) ---
  const sanitizeProduct = (p: any): Product => {
      if (!p || typeof p !== 'object') {
        return {
            id: `fallback-${Date.now()}-${Math.random()}`,
            sku: 'ERR',
            category: 'Uncategorized',
            subCategory: 'General',
            nameEn: 'Invalid Product Data',
            nameZh: '无效产品数据',
            descriptionEn: '',
            descriptionZh: '',
            featuresEn: [],
            featuresZh: [],
            params: [],
            images: []
        };
      }
      return {
          id: p.id || `fallback-${Date.now()}-${Math.random()}`,
          sku: p.sku || 'UNKNOWN',
          category: p.category || 'Uncategorized',
          subCategory: p.subCategory || 'General',
          nameEn: p.nameEn || 'Unnamed Product',
          nameZh: p.nameZh || '未命名产品',
          descriptionEn: p.descriptionEn || '',
          descriptionZh: p.descriptionZh || '',
          featuresEn: Array.isArray(p.featuresEn) ? p.featuresEn : [],
          featuresZh: Array.isArray(p.featuresZh) ? p.featuresZh : [],
          params: Array.isArray(p.params) ? p.params : [],
          images: Array.isArray(p.images) ? p.images.filter((img: any) => typeof img === 'string') : []
      };
  };

  const sanitizeCategories = (cats: any[]): Category[] => {
      if (!Array.isArray(cats)) return INITIAL_DATA.categories;
      return cats.map(c => ({
          name: c.name || 'Unknown',
          subs: Array.isArray(c.subs) ? c.subs : []
      }));
  };

  // --- Core Loading Function ---
  const loadFromDB = async () => {
      // console.log("[ProductContext] Loading from Local DB...");
      const savedCategories = await dbGet('glam_categories');
      if (savedCategories) setCategories(sanitizeCategories(savedCategories));

      const meta = await dbGet('glam_p_meta');
      
      if (meta && typeof meta.chunks === 'number') {
          // console.log(`[ProductContext] Loading ${meta.chunks} chunks...`);
          let allProducts: Product[] = [];
          
          for (let i = 0; i < meta.chunks; i++) {
              const chunk = await dbGet(`glam_p_chunk_${i}`);
              if (Array.isArray(chunk)) {
                  allProducts = allProducts.concat(chunk);
              }
          }
          if (allProducts.length > 0) setProducts(allProducts.map(sanitizeProduct));
      } else {
          const savedProducts = await dbGet('glam_products');
          if (savedProducts && Array.isArray(savedProducts)) {
              setProducts(savedProducts.map(sanitizeProduct));
          }
      }
  };

  // --- Load Logic with Chunk Support ---
  useEffect(() => {
    const loadData = async () => {
      try {
        const forceLocalLoad = localStorage.getItem('glam_force_local_load') === 'true';

        // 1. Always Load DB first (Optimistic)
        await loadFromDB();

        if (forceLocalLoad) {
            console.log(">>> [ProductContext] FORCE LOAD ACTIVE. Skipping Network.");
            setDebugStatus("Force Local");
            setIsLoaded(true);
            return;
        }
        
        setDebugStatus("Fetching...");

        let fetchedData: any = null;
        let fetchedVersion = '';

        // 2. Fetch Network - ABSOLUTE PATH
        const fetchConfig: RequestInit = { cache: 'no-store' };
        const ts = Date.now();
        const rnd = Math.floor(Math.random() * 1000000); 

        try {
            const res = await fetch(`/data_products.json?t=${ts}&r=${rnd}`, fetchConfig); 
            
            if (res.ok) {
                 const contentType = res.headers.get("content-type");
                 if (contentType && contentType.indexOf("application/json") === -1) {
                     setDebugStatus("HTML Err");
                     throw new Error("Invalid Content-Type");
                 }
                 
                const text = await res.text();
                if (text.startsWith('version https://git-lfs')) {
                     setDebugStatus("LFS Err");
                     throw new Error("Git LFS Pointer detected");
                }

                try {
                    fetchedData = JSON.parse(text);
                    fetchedVersion = String(fetchedData?.version || '');
                    setDebugStatus("Prod OK");
                } catch (jsonErr) {
                    setDebugStatus("Parse Err");
                    fetchedData = null;
                }
            } else {
                 // Fallback to legacy
                 const legacyRes = await fetch(`/data.json?t=${ts}&r=${rnd}`, fetchConfig);
                 if(legacyRes.ok) {
                     const text = await legacyRes.text();
                     try {
                        const json = JSON.parse(text);
                        fetchedData = json;
                        fetchedVersion = String(json.version || '');
                        setDebugStatus("Legacy OK");
                     } catch(e) {}
                 } else {
                     setDebugStatus(`Net Fail ${res.status}`);
                 }
            }
        } catch (err: any) {
            setDebugStatus(`Fetch Ex: ${err.message}`);
        }

        // 3. NETWORK WINS STRATEGY
        // If we fetched valid data, we use it immediately to update the UI.
        // We override local DB logic to prevent "stuck on old empty DB" issues.
        if (fetchedData) {
            const rawProducts = Array.isArray(fetchedData.products) ? fetchedData.products : (fetchedData.content?.products || []);
            const rawCategories = Array.isArray(fetchedData.categories) ? fetchedData.categories : (fetchedData.content?.categories || []);

            const newProducts = rawProducts.map(sanitizeProduct);
            const newCategories = sanitizeCategories(rawCategories);

            // UPDATE STATE IMMEDIATELY
            setProducts(newProducts);
            setCategories(newCategories);

            // Background DB Sync
            (async () => {
                await dbDelete('glam_products'); // clear legacy
                await dbDelete('glam_p_meta');
                for(let i=0; i<50; i++) {
                    await dbDelete(`glam_p_chunk_${i}`);
                }
                await dbSet('glam_p_version', fetchedVersion);

                const totalChunks = Math.ceil(newProducts.length / CHUNK_SIZE);
                const batchOps: {key: string, value: any}[] = [];
                batchOps.push({ key: 'glam_categories', value: newCategories });
                batchOps.push({ key: 'glam_p_meta', value: { chunks: totalChunks, totalItems: newProducts.length } });
                
                for (let i = 0; i < totalChunks; i++) {
                    const chunk = newProducts.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
                    batchOps.push({ key: `glam_p_chunk_${i}`, value: chunk });
                }
                await dbSetMany(batchOps);
            })().catch(e => console.error("BG Product Save Failed", e));
        }

      } catch (e) {
        console.error("Error loading data", e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadData();
  }, []);

  // --- Save Logic with Batching ---
  useEffect(() => {
    if (!isLoaded) return;

    const saveToDB = async () => {
        const batchOps: {key: string, value: any}[] = [];
        batchOps.push({ key: 'glam_categories', value: categories });

        const totalChunks = Math.ceil(products.length / CHUNK_SIZE);
        batchOps.push({ key: 'glam_p_meta', value: { chunks: totalChunks, totalItems: products.length } });

        for (let i = 0; i < totalChunks; i++) {
            const chunk = products.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
            batchOps.push({ key: `glam_p_chunk_${i}`, value: chunk });
        }
        await dbSetMany(batchOps);
        await dbDelete('glam_products'); 
    };

    const timer = setTimeout(saveToDB, 1500);
    return () => clearTimeout(timer);

  }, [products, categories, isLoaded]);


  const addProduct = (newProduct: Product) => {
    setProducts(prev => [sanitizeProduct(newProduct), ...prev]);
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const addCategory = (name: string) => {
    if (categories.some(c => c.name === name)) return;
    setCategories(prev => [...prev, { name, subs: ['General'] }]);
  };

  const deleteCategory = (name: string) => {
    setCategories(prev => prev.filter(c => c.name !== name));
  };

  const resetProducts = async () => {
    setProducts(INITIAL_DATA.products);
    setCategories(INITIAL_DATA.categories);
    
    await dbDelete('glam_categories');
    await dbDelete('glam_products');
    await dbDelete('glam_p_meta');
    await dbDelete('glam_p_version');
    for(let i=0; i<100; i++) {
        await dbDelete(`glam_p_chunk_${i}`);
    }
  };

  const restoreProducts = async (newProducts: Product[], newCategories: Category[], version?: string) => {
      const BATCH_SIZE = 5;
      
      const safeCategories = sanitizeCategories(newCategories);
      const safeProducts = Array.isArray(newProducts) ? newProducts.map(sanitizeProduct) : [];

      if (safeCategories) {
          setCategories(safeCategories);
          await dbSet('glam_categories', safeCategories);
      }

      if (safeProducts.length > 0) {
          setProducts(safeProducts);
          const totalChunks = Math.ceil(safeProducts.length / CHUNK_SIZE);
          await dbSet('glam_p_meta', { chunks: totalChunks, totalItems: safeProducts.length });

          let currentBatch: {key: string, value: any}[] = [];

          if (version) {
             currentBatch.push({ key: 'glam_p_version', value: version });
          }

          for (let i = 0; i < totalChunks; i++) {
              const chunk = safeProducts.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
              currentBatch.push({ key: `glam_p_chunk_${i}`, value: chunk });

              if (currentBatch.length >= BATCH_SIZE) {
                  await dbSetMany(currentBatch);
                  currentBatch = [];
              }
          }
          if (currentBatch.length > 0) {
              await dbSetMany(currentBatch);
          }
          await dbDelete('glam_products');
      }
  }

  return (
    <ProductContext.Provider value={{ 
      products, 
      categories, 
      addProduct, 
      deleteProduct, 
      addCategory, 
      deleteCategory, 
      resetProducts,
      restoreProducts,
      isLoaded,
      debugStatus
    }}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};