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
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

const CHUNK_SIZE = 10;

export const ProductProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(INITIAL_DATA.products);
  const [categories, setCategories] = useState<Category[]>(INITIAL_DATA.categories);
  const [isLoaded, setIsLoaded] = useState(false);

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
      console.log("[ProductContext] Loading from Local DB...");
      const savedCategories = await dbGet('glam_categories');
      if (savedCategories) setCategories(sanitizeCategories(savedCategories));

      const meta = await dbGet('glam_p_meta');
      
      if (meta && typeof meta.chunks === 'number') {
          console.log(`[ProductContext] Loading ${meta.chunks} chunks...`);
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

        if (forceLocalLoad) {
            console.log(">>> [ProductContext] FORCE LOAD ACTIVE. Skipping Network.");
            await loadFromDB();
            setIsLoaded(true);
            return;
        }

        const savedVersion = await dbGet('glam_p_version');
        const dbVersion = String(savedVersion || '0');
        
        let fetchedData: any = null;
        let fetchedVersion = '';

        // Strict Anti-Caching Fetch Config for BOTH Desktop and Mobile
        const fetchConfig: RequestInit = {
             cache: 'no-store',
             headers: {
                 'Pragma': 'no-cache',
                 'Cache-Control': 'no-cache, no-store, must-revalidate'
             }
        };

        const ts = Date.now();
        // Aggressive random number to bust ISP/Browser/PC caches
        const rnd = Math.floor(Math.random() * 1000000); 

        try {
            // OPTIMIZATION: Fetch specific products file with random string
            const res = await fetch(`./data_products.json?t=${ts}&r=${rnd}`, fetchConfig); 
            
            if (res.ok) {
                 const contentType = res.headers.get("content-type");
                 if (contentType && contentType.indexOf("application/json") === -1) {
                     console.warn("[ProductContext] Server returned HTML instead of JSON.");
                     throw new Error("Invalid Content-Type");
                 }
                 
                const text = await res.text();
                if (text.startsWith('version https://git-lfs')) {
                     console.error("CRITICAL: Git LFS Pointer detected.");
                     throw new Error("Git LFS Pointer detected");
                }

                try {
                    fetchedData = JSON.parse(text);
                    fetchedVersion = String(fetchedData?.version || '');
                    console.log(`[ProductContext] Remote data_products.json found. Version: ${fetchedVersion} | Local: ${dbVersion}`);
                } catch (jsonErr) {
                    fetchedData = null;
                }
            } else {
                 // Fallback to legacy data.json
                 const legacyRes = await fetch(`./data.json?t=${ts}&r=${rnd}`, fetchConfig);
                 if(legacyRes.ok) {
                     const text = await legacyRes.text();
                     try {
                        const json = JSON.parse(text);
                        // Legacy structure has products at root or inside content
                        fetchedData = json;
                        fetchedVersion = String(json.version || '');
                        console.log("Using legacy data.json for products");
                     } catch(e) {}
                 }
            }
        } catch (err) {
            console.warn("[ProductContext] Network error fetching product data", err);
        }

        const isLocalBackup = dbVersion.length > 10 && /^\d+$/.test(dbVersion);
        const isRemoteBackup = fetchedVersion.length > 10 && /^\d+$/.test(fetchedVersion);

        let shouldOverwrite = false;

        if (fetchedData && fetchedVersion && fetchedVersion !== dbVersion) {
             if (!isLocalBackup) {
                 shouldOverwrite = true;
             } else if (isRemoteBackup && Number(fetchedVersion) > Number(dbVersion)) {
                 shouldOverwrite = true;
                 console.log(`[ProductContext] Remote version (${fetchedVersion}) is newer than Local (${dbVersion}). Updating...`);
             }
        }

        if (shouldOverwrite) {
            console.log(`>>> Product Update Triggered: Remote (${fetchedVersion}) != Local (${dbVersion}). Overwriting local DB.`);
            
            // Handle both legacy (root.products) and new format
            const rawProducts = Array.isArray(fetchedData.products) ? fetchedData.products : (fetchedData.content?.products || []);
            const rawCategories = Array.isArray(fetchedData.categories) ? fetchedData.categories : (fetchedData.content?.categories || []);

            const newProducts = rawProducts.map(sanitizeProduct);
            const newCategories = sanitizeCategories(rawCategories);

            await dbDelete('glam_products');
            await dbDelete('glam_p_meta');
            for(let i=0; i<50; i++) {
                await dbDelete(`glam_p_chunk_${i}`);
            }

            setProducts(newProducts);
            setCategories(newCategories);

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

        } else {
            await loadFromDB();
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
      isLoaded
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