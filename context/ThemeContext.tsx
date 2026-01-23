import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { dbGet, dbSet, dbSetMany, dbDelete } from '../utils/db';
import { CertFile } from '../types';
import { INITIAL_DATA } from '../initialData';

interface ThemeContextType {
  heroImage: string;
  setHeroImage: (url: string) => void;
  logoImage: string | null;
  setLogoImage: (url: string) => void;
  certImages: Record<string, CertFile[]>; 
  addCertImage: (key: string, url: string, name: string) => void;
  addBatchCertImages: (key: string, newFiles: CertFile[]) => void;
  removeCertImage: (key: string, index: number) => void;
  factoryImages: string[]; // Deprecated
  setFactoryImages: (images: string[]) => void;
  
  // New Image Categories
  productionImages: string[];
  setProductionImages: (images: string[]) => void;
  rohsImages: string[];
  setRohsImages: (images: string[]) => void;
  equipmentImages: string[];
  setEquipmentImages: (images: string[]) => void;

  aboutCertsImage: string | null;
  setAboutCertsImage: (url: string) => void;
  resetTheme: () => void;
  restoreTheme: (data: any, version?: string) => Promise<void>; 
  isLoaded: boolean;
  remoteVersion: string | null;
  localVersion: string | null;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize with fallback skeleton
  const [heroImage, setHeroImageState] = useState<string>(INITIAL_DATA.theme.heroImage);
  const [logoImage, setLogoImageState] = useState<string | null>(INITIAL_DATA.theme.logoImage);
  const [certImages, setCertImagesState] = useState<Record<string, CertFile[]>>(INITIAL_DATA.theme.certImages);
  
  const [factoryImages, setFactoryImagesState] = useState<string[]>(INITIAL_DATA.theme.factoryImages);
  
  // New States
  const [productionImages, setProductionImagesState] = useState<string[]>(INITIAL_DATA.theme.productionImages);
  const [rohsImages, setRohsImagesState] = useState<string[]>(INITIAL_DATA.theme.rohsImages);
  const [equipmentImages, setEquipmentImagesState] = useState<string[]>(INITIAL_DATA.theme.equipmentImages);

  const [aboutCertsImage, setAboutCertsImageState] = useState<string | null>(INITIAL_DATA.theme.aboutCertsImage);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Debug info
  const [remoteVersion, setRemoteVersion] = useState<string | null>(null);
  const [localVersion, setLocalVersion] = useState<string | null>(null);

  const loadFromDB = async () => {
      console.log("[ThemeContext] Loading from Local DB...");
      const savedHero = await dbGet('glam_hero_image');
      const savedLogo = await dbGet('glam_logo_image');
      const savedCerts = await dbGet('glam_cert_images');
      const savedFactory = await dbGet('glam_factory_images');
      
      const savedProd = await dbGet('glam_prod_images');
      const savedRohs = await dbGet('glam_rohs_images');
      const savedEquip = await dbGet('glam_equip_images');

      const savedAboutCerts = await dbGet('glam_about_certs_image');

      if (savedHero !== undefined && savedHero !== null) setHeroImageState(savedHero);
      if (savedLogo) setLogoImageState(savedLogo);
      
      if (savedCerts) {
          const normalized: Record<string, CertFile[]> = {};
          if (typeof savedCerts === 'object' && savedCerts !== null) {
              Object.keys(savedCerts).forEach(key => {
                  const val = savedCerts[key];
                  if (Array.isArray(val)) {
                      normalized[key] = val.map((item: any, idx: number) => {
                          if (typeof item === 'string') {
                              return { url: item, name: `Certificate ${idx + 1}.pdf` };
                          }
                          return item && typeof item === 'object' ? item : { url: '', name: 'Unknown' }; 
                      });
                  } else if (typeof val === 'string') {
                      normalized[key] = [{ url: val, name: 'Certificate.pdf' }];
                  }
              });
          }
          setCertImagesState(normalized);
      }

      if (savedFactory && Array.isArray(savedFactory)) setFactoryImagesState(savedFactory);
      if (savedProd && Array.isArray(savedProd)) setProductionImagesState(savedProd);
      if (savedRohs && Array.isArray(savedRohs)) setRohsImagesState(savedRohs);
      if (savedEquip && Array.isArray(savedEquip)) setEquipmentImagesState(savedEquip);

      if (savedAboutCerts) setAboutCertsImageState(savedAboutCerts);
  }

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const forceLocalLoad = localStorage.getItem('glam_force_local_load') === 'true';

        if (forceLocalLoad) {
            console.log(">>> [ThemeContext] FORCE LOAD ACTIVE. Skipping Network.");
            await loadFromDB();
            setIsLoaded(true);
            return;
        }

        const savedVersion = await dbGet('glam_data_version');
        const dbVersion = String(savedVersion || '0');
        setLocalVersion(dbVersion);
        
        let fetchedDataCore: any = null;
        let fetchedDataAbout: any = null;
        let fetchedVersion = '';

        // FIX FOR MOBILE: Removed complex headers. 
        // Simple cache: 'no-store' + URL params is safest for mobile Safari/Chrome.
        const fetchConfig: RequestInit = {
             cache: 'no-store'
        };

        const ts = Date.now();
        const rnd = Math.floor(Math.random() * 1000000); 

        try {
            // OPTIMIZATION: Fetch separate files in parallel with random params
            const [coreRes, aboutRes] = await Promise.allSettled([
                fetch(`./data_core.json?t=${ts}&r=${rnd}`, fetchConfig),
                fetch(`./data_about.json?t=${ts}&r=${rnd}`, fetchConfig)
            ]);
            
            // Process Core Data (Settings, Hero, Logo, Certs)
            if (coreRes.status === 'fulfilled' && coreRes.value.ok) {
                 const text = await coreRes.value.text();
                 if (!text.startsWith('version https://git-lfs')) {
                    try {
                        fetchedDataCore = JSON.parse(text);
                        // Core version dictates the main version
                        fetchedVersion = String(fetchedDataCore?.version || '');
                        setRemoteVersion(fetchedVersion);
                        console.log(`[ThemeContext] Remote data_core.json found. Version: ${fetchedVersion}`);
                    } catch (e) { console.warn("Failed parsing data_core.json", e); }
                 }
            } else {
                 console.warn("[ThemeContext] data_core.json missing or failed. Trying legacy data.json...");
                 // Try legacy data.json if core missing (backward compatibility)
                 const legacyRes = await fetch(`./data.json?t=${ts}&r=${rnd}`, fetchConfig);
                 if(legacyRes.ok) {
                     const text = await legacyRes.text();
                     try {
                         const json = JSON.parse(text);
                         fetchedDataCore = json;
                         fetchedDataAbout = json; // Legacy has everything in one
                         fetchedVersion = String(json.version || '');
                         console.log("Using legacy data.json");
                     } catch(e) {}
                 }
            }

            // Process About Data (Factory images etc)
            // It is OPTIONAL. If it fails (e.g. 404 or network timeout), we proceed with null.
            if (aboutRes.status === 'fulfilled' && aboutRes.value.ok) {
                const text = await aboutRes.value.text();
                 if (!text.startsWith('version https://git-lfs')) {
                    try {
                        fetchedDataAbout = JSON.parse(text);
                    } catch (e) { console.warn("Failed parsing data_about.json", e); }
                 }
            }

        } catch (err) {
            console.warn("[ThemeContext] Failed to fetch data files", err);
        }

        const isLocalBackup = dbVersion.length > 10 && /^\d+$/.test(dbVersion);
        const isRemoteBackup = fetchedVersion.length > 10 && /^\d+$/.test(fetchedVersion);
        
        let shouldOverwrite = false;

        // Force overwrite if local is '0' (fresh device) or remote is newer
        if (fetchedVersion) {
             if (dbVersion === '0' || !dbVersion) {
                 shouldOverwrite = true;
             } else if (fetchedVersion !== dbVersion) {
                 if (!isLocalBackup) {
                     shouldOverwrite = true;
                 } else if (isRemoteBackup && Number(fetchedVersion) > Number(dbVersion)) {
                     shouldOverwrite = true;
                     console.log(`[ThemeContext] Remote version (${fetchedVersion}) is newer than Local (${dbVersion}). Updating...`);
                 }
             }
        }

        if (shouldOverwrite) {
            console.log(">>> Theme Update Triggered: Remote Version != Local Version. Overwriting.");
            
            // Merge Data from Core and About
            const themeCore = fetchedDataCore?.theme || {};
            const themeAbout = fetchedDataAbout?.theme || {};

            const safeHero = themeCore.heroImage !== undefined ? themeCore.heroImage : INITIAL_DATA.theme.heroImage;
            const safeLogo = themeCore.logoImage || null;
            const safeCerts = themeCore.certImages || {}; 
            
            const safeFactory = Array.isArray(themeAbout.factoryImages) ? themeAbout.factoryImages : [];
            const safeProd = Array.isArray(themeAbout.productionImages) ? themeAbout.productionImages : INITIAL_DATA.theme.productionImages;
            const safeRohs = Array.isArray(themeAbout.rohsImages) ? themeAbout.rohsImages : INITIAL_DATA.theme.rohsImages;
            const safeEquip = Array.isArray(themeAbout.equipmentImages) ? themeAbout.equipmentImages : INITIAL_DATA.theme.equipmentImages;
            const safeAbout = themeAbout.aboutCertsImage || null;

            // CRITICAL FIX: Update State IMMEDIATELY, don't wait for DB
            // This ensures the user sees the new data instantly, even if DB write is slow.
            setHeroImageState(safeHero);
            setLogoImageState(safeLogo);
            setCertImagesState(safeCerts);
            setFactoryImagesState(safeFactory);
            setProductionImagesState(safeProd);
            setRohsImagesState(safeRohs);
            setEquipmentImagesState(safeEquip);
            setAboutCertsImageState(safeAbout);

            await dbSetMany([
                { key: 'glam_data_version', value: fetchedVersion },
                { key: 'glam_hero_image', value: safeHero },
                { key: 'glam_logo_image', value: safeLogo },
                { key: 'glam_cert_images', value: safeCerts },
                { key: 'glam_factory_images', value: safeFactory },
                { key: 'glam_prod_images', value: safeProd },
                { key: 'glam_rohs_images', value: safeRohs },
                { key: 'glam_equip_images', value: safeEquip },
                { key: 'glam_about_certs_image', value: safeAbout }
            ]);

        } else {
            await loadFromDB();
        }

      } catch (e) {
        console.error("Error loading theme", e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadTheme();
  }, []);

  const setHeroImage = (url: string) => {
    setHeroImageState(url);
    if (isLoaded) dbSet('glam_hero_image', url);
  };

  const setLogoImage = (url: string) => {
    setLogoImageState(url);
    if (isLoaded) dbSet('glam_logo_image', url);
  };

  const addCertImage = (key: string, url: string, name: string) => {
      setCertImagesState(prev => {
          const currentList = prev[key] || [];
          const newCerts = { ...prev, [key]: [...currentList, { url, name }] };
          if (isLoaded) dbSet('glam_cert_images', newCerts);
          return newCerts;
      });
  };

  const addBatchCertImages = (key: string, newFiles: CertFile[]) => {
      setCertImagesState(prev => {
          const currentList = prev[key] || [];
          const newCerts = { ...prev, [key]: [...currentList, ...newFiles] };
          if (isLoaded) dbSet('glam_cert_images', newCerts);
          return newCerts;
      });
  };

  const removeCertImage = (key: string, index: number) => {
      setCertImagesState(prev => {
          const currentList = prev[key] || [];
          const newList = currentList.filter((_, i) => i !== index);
          const newCerts = { ...prev, [key]: newList };
          if (isLoaded) dbSet('glam_cert_images', newCerts);
          return newCerts;
      });
  };

  const setFactoryImages = (images: string[]) => {
      setFactoryImagesState(images);
      if (isLoaded) dbSet('glam_factory_images', images);
  };

  const setProductionImages = (images: string[]) => {
      setProductionImagesState(images);
      if (isLoaded) dbSet('glam_prod_images', images);
  }

  const setRohsImages = (images: string[]) => {
      setRohsImagesState(images);
      if (isLoaded) dbSet('glam_rohs_images', images);
  }

  const setEquipmentImages = (images: string[]) => {
      setEquipmentImagesState(images);
      if (isLoaded) dbSet('glam_equip_images', images);
  }

  const setAboutCertsImage = (url: string) => {
      setAboutCertsImageState(url);
      if (isLoaded) dbSet('glam_about_certs_image', url);
  };

  const resetTheme = () => {
    setHeroImageState(INITIAL_DATA.theme.heroImage);
    setLogoImageState(INITIAL_DATA.theme.logoImage);
    setCertImagesState(INITIAL_DATA.theme.certImages);
    setFactoryImagesState(INITIAL_DATA.theme.factoryImages);
    
    setProductionImagesState(INITIAL_DATA.theme.productionImages);
    setRohsImagesState(INITIAL_DATA.theme.rohsImages);
    setEquipmentImagesState(INITIAL_DATA.theme.equipmentImages);

    setAboutCertsImageState(INITIAL_DATA.theme.aboutCertsImage);
    
    dbDelete('glam_data_version');
    dbDelete('glam_hero_image');
    dbDelete('glam_logo_image');
    dbDelete('glam_cert_images');
    dbDelete('glam_factory_images');
    dbDelete('glam_prod_images');
    dbDelete('glam_rohs_images');
    dbDelete('glam_equip_images');
    dbDelete('glam_about_certs_image');
  };

  const restoreTheme = async (data: any, version?: string) => {
    if (!data) return;
    const batchOps = [];

    if (version) {
        batchOps.push({ key: 'glam_data_version', value: version });
    }

    if (data.heroImage) {
        setHeroImageState(data.heroImage);
        batchOps.push({ key: 'glam_hero_image', value: data.heroImage });
    }
    if (data.logoImage) {
        setLogoImageState(data.logoImage);
        batchOps.push({ key: 'glam_logo_image', value: data.logoImage });
    }
    if (data.certImages) {
        const normalized: Record<string, CertFile[]> = {};
        Object.keys(data.certImages).forEach(key => {
            const val = data.certImages[key];
             if (Array.isArray(val)) {
                normalized[key] = val.map((item: any, idx: number) => {
                    if (typeof item === 'string') {
                        return { url: item, name: `Certificate ${idx + 1}.pdf` };
                    }
                    return item;
                });
            }
        });
        setCertImagesState(normalized);
        batchOps.push({ key: 'glam_cert_images', value: normalized });
    }
    if (data.factoryImages) {
        setFactoryImagesState(data.factoryImages);
        batchOps.push({ key: 'glam_factory_images', value: data.factoryImages });
    }

    // Restore new fields if present
    if (data.productionImages) {
        setProductionImagesState(data.productionImages);
        batchOps.push({ key: 'glam_prod_images', value: data.productionImages });
    }
    if (data.rohsImages) {
        setRohsImagesState(data.rohsImages);
        batchOps.push({ key: 'glam_rohs_images', value: data.rohsImages });
    }
    if (data.equipmentImages) {
        setEquipmentImagesState(data.equipmentImages);
        batchOps.push({ key: 'glam_equip_images', value: data.equipmentImages });
    }

    if (data.aboutCertsImage) {
        setAboutCertsImageState(data.aboutCertsImage);
        batchOps.push({ key: 'glam_about_certs_image', value: data.aboutCertsImage });
    }

    if (batchOps.length > 0) {
        await dbSetMany(batchOps);
    }
  };

  return (
    <ThemeContext.Provider value={{ 
        heroImage, setHeroImage, 
        logoImage, setLogoImage, 
        certImages, addCertImage, addBatchCertImages, removeCertImage,
        factoryImages, setFactoryImages,
        productionImages, setProductionImages,
        rohsImages, setRohsImages,
        equipmentImages, setEquipmentImages,
        aboutCertsImage, setAboutCertsImage,
        resetTheme, restoreTheme, isLoaded,
        localVersion, remoteVersion
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};