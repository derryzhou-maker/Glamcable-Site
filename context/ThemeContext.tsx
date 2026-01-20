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
  factoryImages: string[];
  setFactoryImages: (images: string[]) => void;
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
      const savedAboutCerts = await dbGet('glam_about_certs_image');

      if (savedHero) setHeroImageState(savedHero);
      if (savedLogo) setLogoImageState(savedLogo);
      
      if (savedCerts) {
          const normalized: Record<string, CertFile[]> = {};
          // Safety check: ensure savedCerts is an object
          if (typeof savedCerts === 'object' && savedCerts !== null) {
              Object.keys(savedCerts).forEach(key => {
                  const val = savedCerts[key];
                  if (Array.isArray(val)) {
                      normalized[key] = val.map((item: any, idx: number) => {
                          if (typeof item === 'string') {
                              return { url: item, name: `Certificate ${idx + 1}.pdf` };
                          }
                          // Ensure item is object
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
      if (savedAboutCerts) setAboutCertsImageState(savedAboutCerts);
  }

  useEffect(() => {
    const loadTheme = async () => {
      try {
        // 0. CHECK FORCE LOAD FLAG
        const forceLocalLoad = localStorage.getItem('glam_force_local_load') === 'true';

        // STRICT MODE: If forced, DO NOT even attempt to fetch from server.
        if (forceLocalLoad) {
            console.log(">>> [ThemeContext] FORCE LOAD ACTIVE. Skipping Network.");
            await loadFromDB();
            setIsLoaded(true);
            return;
        }

        const savedVersion = await dbGet('glam_data_version');
        const dbVersion = String(savedVersion || '0');
        setLocalVersion(dbVersion);
        
        let fetchedData = null;
        let fetchedVersion = '';

        // 1. Try to fetch the external data.json
        try {
            // FIX: Use relative path './data.json' instead of absolute '/data.json' to support GitHub Pages subpaths
            const res = await fetch('./data.json?t=' + Date.now() + '&r=' + Math.random(), { cache: 'no-store' }); 
            
            if (res.ok) {
                // Check content type to avoid parsing 404 HTML pages as JSON
                const contentType = res.headers.get("content-type");
                if (contentType && contentType.indexOf("application/json") === -1) {
                    console.warn("[ThemeContext] Server returned HTML instead of JSON. Likely 404 on subpath.");
                    throw new Error("Invalid Content-Type");
                }

                try {
                    fetchedData = await res.json();
                    fetchedVersion = String(fetchedData?.version || '');
                    setRemoteVersion(fetchedVersion);
                    console.log(`[ThemeContext] Remote data.json found. Version: ${fetchedVersion} | Local: ${dbVersion}`);
                } catch (jsonErr) {
                    console.warn("[ThemeContext] fetch success but JSON parse failed.", jsonErr);
                    fetchedData = null;
                }
            } else {
                console.warn(`[ThemeContext] data.json error (status ${res.status}). Using local data.`);
            }
        } catch (err) {
            console.warn("[ThemeContext] Failed to fetch data.json", err);
        }

        // 2. Logic: Should we overwrite local data?
        // Improved logic: Allow overwrite if remote is strictly newer
        const isLocalBackup = dbVersion.length > 10 && /^\d+$/.test(dbVersion);
        const isRemoteBackup = fetchedVersion.length > 10 && /^\d+$/.test(fetchedVersion);
        
        let shouldOverwrite = false;

        if (fetchedData && fetchedData.theme && fetchedVersion && fetchedVersion !== dbVersion) {
             if (!isLocalBackup) {
                 // Local is not a backup (e.g. fresh install or old version), accept anything different
                 shouldOverwrite = true;
             } else if (isRemoteBackup && Number(fetchedVersion) > Number(dbVersion)) {
                 // Both are timestamp backups, but Remote is NEWER. Allow update.
                 shouldOverwrite = true;
                 console.log(`[ThemeContext] Remote version (${fetchedVersion}) is newer than Local (${dbVersion}). Updating...`);
             } else {
                 console.log(`[ThemeContext] Local version (${dbVersion}) is newer or equal to Remote (${fetchedVersion}). Keeping local.`);
             }
        }

        if (shouldOverwrite && fetchedData) {
            console.log(">>> Theme Update Triggered: Remote Version != Local Version. Overwriting.");
            
            // Normalize theme data from JSON (Safety Checks)
            const theme = fetchedData.theme;
            const safeHero = theme.heroImage || INITIAL_DATA.theme.heroImage;
            const safeLogo = theme.logoImage || null;
            const safeCerts = theme.certImages || {}; // Ensure object
            const safeFactory = Array.isArray(theme.factoryImages) ? theme.factoryImages : [];
            const safeAbout = theme.aboutCertsImage || null;

            // Overwrite DB with new JSON data
            await dbSetMany([
                { key: 'glam_data_version', value: fetchedVersion },
                { key: 'glam_hero_image', value: safeHero },
                { key: 'glam_logo_image', value: safeLogo },
                { key: 'glam_cert_images', value: safeCerts },
                { key: 'glam_factory_images', value: safeFactory },
                { key: 'glam_about_certs_image', value: safeAbout }
            ]);

            // Set state to new data
            setHeroImageState(safeHero);
            setLogoImageState(safeLogo);
            setCertImagesState(safeCerts);
            setFactoryImagesState(safeFactory);
            setAboutCertsImageState(safeAbout);
        } else {
             // Load from DB
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

  const setAboutCertsImage = (url: string) => {
      setAboutCertsImageState(url);
      if (isLoaded) dbSet('glam_about_certs_image', url);
  };

  const resetTheme = () => {
    // Reset to initial data from CONSTANT
    setHeroImageState(INITIAL_DATA.theme.heroImage);
    setLogoImageState(INITIAL_DATA.theme.logoImage);
    setCertImagesState(INITIAL_DATA.theme.certImages);
    setFactoryImagesState(INITIAL_DATA.theme.factoryImages);
    setAboutCertsImageState(INITIAL_DATA.theme.aboutCertsImage);
    
    dbDelete('glam_data_version');
    dbDelete('glam_hero_image');
    dbDelete('glam_logo_image');
    dbDelete('glam_cert_images');
    dbDelete('glam_factory_images');
    dbDelete('glam_about_certs_image');
  };

  const restoreTheme = async (data: any, version?: string) => {
    if (!data) return;
    const batchOps = [];

    // Persist version if provided
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