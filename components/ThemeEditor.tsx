import React, { useState, useEffect } from 'react';
import { Settings, Image as ImageIcon, Upload, X, RotateCcw, Package, Plus, Trash2, List, Award, Factory, Microscope, Download, Save, Loader2, CheckCircle2, Github, ExternalLink, ArrowRight, RefreshCw, AlertTriangle, FileJson, FileText, Layers, Database, Split, Zap } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useProducts } from '../context/ProductContext';
import { Button } from './Button';
import { Product, CertFile } from '../types';
import { dbRestoreLargeData, clearDatabase, dbGet } from '../utils/db'; 

export const ThemeEditor: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'visual' | 'certs' | 'about' | 'product' | 'manage' | 'github'>('visual');
  
  // Import State
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStatus, setProcessStatus] = useState('');
  const [progress, setProgress] = useState(0); 
  
  // Server Diag State
  const [serverStats, setServerStats] = useState<Record<string, {size: string, version: string, status: string, url: string}>>({});
  const [isCheckingServer, setIsCheckingServer] = useState(false);
  
  // Manual Cert Input State
  const [manualInputs, setManualInputs] = useState<Record<string, string>>({});

  const { 
      heroImage, setHeroImage, 
      logoImage, setLogoImage, 
      certImages, addBatchCertImages, addCertImage, removeCertImage,
      factoryImages, setFactoryImages,
      productionImages, setProductionImages,
      rohsImages, setRohsImages,
      equipmentImages, setEquipmentImages,
      aboutCertsImage, setAboutCertsImage,
      resetTheme,
      localVersion, remoteVersion,
      isLoaded: themeLoaded 
  } = useTheme();

  const { 
      products, categories, 
      addProduct, deleteProduct, 
      addCategory, deleteCategory, 
      resetProducts, 
      restoreProducts,
      isLoaded: productsLoaded 
  } = useProducts();

  // --- Product Form State ---
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('');
  const [newProdSubCategory, setNewProdSubCategory] = useState('');
  const [newProdImages, setNewProdImages] = useState<string[]>([]);
  
  // --- Category Form State ---
  const [newCatName, setNewCatName] = useState('');

  // --- GitHub Export State ---
  const DEFAULT_REPO = 'https://github.com/derryzhou-maker/Glamcable-Site';
  const [fileSizes, setFileSizes] = useState({ core: 0, about: 0, products: 0 });
  const [repoUrl, setRepoUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationSuccess, setGenerationSuccess] = useState(false);

  // --- FORCE LOAD CLEANUP ---
  useEffect(() => {
    if (localStorage.getItem('glam_force_local_load')) {
        const timer = setTimeout(() => {
            console.log("[Editor] Clearing Force Load flag.");
            localStorage.removeItem('glam_force_local_load');
        }, 10000); 
        return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (categories.length > 0 && !newProdCategory) {
        const firstCat = categories[0];
        setNewProdCategory(firstCat.name);
        if (firstCat.subs.length > 0) {
            setNewProdSubCategory(firstCat.subs[0]);
        }
    }
  }, [categories, newProdCategory]);

  useEffect(() => {
      const savedUrl = localStorage.getItem('glam_repo_url');
      setRepoUrl(savedUrl || DEFAULT_REPO);
  }, []);

  useEffect(() => {
    if (activeTab === 'github') {
        setGenerationSuccess(false);
        setFileSizes({ core: 0, about: 0, products: 0 });
        setServerStats({});
    }
  }, [activeTab]);

  const saveRepoUrl = (url: string) => {
      setRepoUrl(url);
      localStorage.setItem('glam_repo_url', url);
  }

  const certSlots = [
      { key: 'china', label: 'China (CCC)' },
      { key: 'na_eu', label: 'North America & Europe (UL/VDE)' },
      { key: 'asia', label: 'Asia (PSE/KC)' },
      { key: 'others', label: 'Others (SAA)' },
      { key: 'iso9001', label: 'ISO 9001 (PDF Only)' },
  ];

  const processImage = (file: File, maxWidth: number, quality: number = 0.6): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, width, height);
            // Default to JPEG 0.6 for good balance
            const dataUrl = canvas.toDataURL('image/jpeg', quality);
            console.log(`Compressed ${file.name}: ${Math.round(dataUrl.length / 1024)}KB`);
            resolve(dataUrl);
          } else {
            reject(new Error("Canvas context failed"));
          }
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  // --- SMART OPTIMIZER (RESIZES EXISTING DATA) ---
  const handleSmartOptimization = async () => {
      if (!confirm("This will scan ALL images (Products, About, Certs) and compress them to < 1000px resolution to significantly reduce file size.\n\nThis is the BEST way to fix Vercel deployment issues.\n\nProceed?")) {
          return;
      }

      setIsProcessing(true);
      setProcessStatus("Initializing Optimizer...");
      setProgress(0);

      const resizeBase64 = (base64: string, maxWidth: number): Promise<string> => {
          return new Promise((resolve) => {
              // If not image or too short, skip
              if (!base64 || !base64.startsWith('data:image')) {
                  resolve(base64);
                  return;
              }
              
              const img = new Image();
              img.src = base64;
              img.onload = () => {
                  if (img.width <= maxWidth) {
                      // Already small enough, just resolve original
                      resolve(base64); 
                      return;
                  }
                  
                  const canvas = document.createElement('canvas');
                  const scale = maxWidth / img.width;
                  canvas.width = maxWidth;
                  canvas.height = img.height * scale;
                  
                  const ctx = canvas.getContext('2d');
                  if (ctx) {
                       ctx.fillStyle = '#FFFFFF';
                       ctx.fillRect(0, 0, canvas.width, canvas.height);
                       ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                       // Aggressive compression for optimization
                       resolve(canvas.toDataURL('image/jpeg', 0.6));
                  } else {
                      resolve(base64);
                  }
              };
              img.onerror = () => resolve(base64);
          });
      };

      try {
          // 1. Optimize Products
          const totalProducts = products.length;
          const optimizedProducts = [...products];
          
          for (let i = 0; i < totalProducts; i++) {
              const p = optimizedProducts[i];
              setProcessStatus(`Optimizing Product ${i+1}/${totalProducts}: ${p.sku}`);
              setProgress(Math.round((i / totalProducts) * 50));
              
              const newImages = [];
              for (const img of p.images) {
                  // Max 1000px for products
                  const res = await resizeBase64(img, 1000); 
                  newImages.push(res);
              }
              p.images = newImages;
              // Yield to UI
              await new Promise(r => setTimeout(r, 10));
          }

          // 2. Optimize Theme Assets
          setProcessStatus("Optimizing Theme Assets...");
          setProgress(60);

          const optHero = await resizeBase64(heroImage, 1200);
          const optAboutCert = aboutCertsImage ? await resizeBase64(aboutCertsImage, 1000) : null;
          
          const optProdImgs = [];
          for (const img of productionImages) optProdImgs.push(await resizeBase64(img, 1000));
          
          const optRohsImgs = [];
          for (const img of rohsImages) optRohsImgs.push(await resizeBase64(img, 800)); // 800px enough for grid
          
          const optEquipImgs = [];
          for (const img of equipmentImages) optEquipImgs.push(await resizeBase64(img, 800));

          // 3. Save Everything
          setProcessStatus("Saving Optimized Data...");
          setProgress(90);

          // Update Product Context
          // Pass undefined as categories to avoid resetting them
          await restoreProducts(optimizedProducts, categories); 

          // Update Theme Context directly
          setHeroImage(optHero);
          if (optAboutCert) setAboutCertsImage(optAboutCert);
          setProductionImages(optProdImgs);
          setRohsImages(optRohsImgs);
          setEquipmentImages(optEquipImgs);

          setProcessStatus("Done!");
          setProgress(100);
          
          await new Promise(r => setTimeout(r, 500));
          setIsProcessing(false);
          alert("Optimization Complete!\n\nYour data size has been significantly reduced.\nYou can now generate the 3 files and upload to GitHub with much higher success rate.");

      } catch (e: any) {
          console.error(e);
          alert(`Optimization failed: ${e.message}`);
          setIsProcessing(false);
      }
  };


  const handleHeroUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setProcessStatus('Compressing Banner...');
      setIsProcessing(true);
      try {
        const base64 = await processImage(file, 1024, 0.5); 
        setHeroImage(base64);
      } catch (error) {
        alert("Image upload failed.");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setProcessStatus('Compressing Logo...');
      setIsProcessing(true);
      try {
        const base64 = await processImage(file, 250, 0.8); 
        setLogoImage(base64);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleCertUpload = async (key: string, event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        setProcessStatus('Processing PDFs...');
        setIsProcessing(true);
        const newBatch: CertFile[] = [];
        const fileArray: File[] = Array.from(files);

        try {
            for (const file of fileArray) {
                if (file.size > 2 * 1024 * 1024) {
                    alert(`File ${file.name} is too large (>2MB). Skipped.`);
                    continue;
                }
                if (file.type !== 'application/pdf') {
                    alert(`File ${file.name} is not a PDF. Skipped.`);
                    continue;
                }

                const base64 = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onload = () => resolve(reader.result as string);
                });
                newBatch.push({ url: base64, name: file.name });
            }

            if (newBatch.length > 0) {
                addBatchCertImages(key, newBatch);
            }
        } catch (error) {
            console.error(error);
            alert("Error processing some files.");
        } finally {
            setIsProcessing(false);
            event.target.value = ''; 
        }
      }
  }
  
  const handleManualCertAdd = (key: string) => {
      const val = manualInputs[key]?.trim();
      if (!val) return;
      addCertImage(key, "", val);
      setManualInputs(prev => ({ ...prev, [key]: '' }));
  }

  // --- NEW IMAGE HANDLERS ---
  const handleProductionUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files && files.length > 0) {
          setProcessStatus('Compressing...');
          setIsProcessing(true);
          try {
              // Production lines currently stays as single image replacement for simplicity of the split view
              const base64 = await processImage(files[0], 800, 0.5);
              setProductionImages([base64]); 
          } finally {
              setIsProcessing(false);
          }
      }
  };

  const handleRohsUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files && files.length > 0) {
          setProcessStatus('Compressing...');
          setIsProcessing(true);
          try {
              const fileArray = Array.from(files);
              const base64Promises = fileArray.map((file) => processImage(file as File, 800, 0.5));
              const newUrls = await Promise.all(base64Promises);
              // Append to existing array
              setRohsImages([...rohsImages, ...newUrls]); 
          } finally {
              setIsProcessing(false);
          }
      }
  };

  const removeRohsImage = (index: number) => {
      setRohsImages(rohsImages.filter((_, i) => i !== index));
  };

  const handleEquipmentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files) {
        setProcessStatus('Compressing...');
        setIsProcessing(true);
        try {
          const fileArray = Array.from(files);
          const base64Promises = fileArray.map((file) => processImage(file as File, 640, 0.5));
          const newUrls = await Promise.all(base64Promises);
          setEquipmentImages([...equipmentImages, ...newUrls]);
        } finally {
          setIsProcessing(false);
        }
      }
  };

  const removeEquipmentImage = (index: number) => {
      setEquipmentImages(equipmentImages.filter((_, i) => i !== index));
  };


  const handleAboutCertUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
          setProcessStatus('Compressing...');
          setIsProcessing(true);
          try {
              const base64 = await processImage(file, 800, 0.5);
              setAboutCertsImage(base64);
          } finally {
              setIsProcessing(false);
          }
      }
  }

  const handleProductImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setProcessStatus('Optimizing Product Img...');
      setIsProcessing(true);
      try {
        const fileArray = Array.from(files);
        // UPDATED: Use 1000px and 0.6 quality - strict balance for Vercel
        const base64Promises = fileArray.map((file) => processImage(file as File, 1000, 0.6));
        const newUrls = await Promise.all(base64Promises);
        setNewProdImages(prev => [...prev, ...newUrls]);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const removeProductImage = (index: number) => {
    setNewProdImages(prev => prev.filter((_, i) => i !== index));
  }

  // ... (Rest of existing handlers) ...

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedCatName = e.target.value;
      setNewProdCategory(selectedCatName);
      
      const selectedCat = categories.find(c => c.name === selectedCatName);
      if (selectedCat && selectedCat.subs.length > 0) {
          setNewProdSubCategory(selectedCat.subs[0]);
      } else {
          setNewProdSubCategory('');
      }
  };

  const currentSubCategories = categories.find(c => c.name === newProdCategory)?.subs || [];

  const handleAddProduct = () => {
    if (!newProdName || newProdImages.length === 0) {
      alert("Please provide at least a name and one image.");
      return;
    }
    const newProduct: Product = {
      id: `custom-${Date.now()}`,
      sku: `NEW-${Math.floor(Math.random() * 1000)}`,
      category: newProdCategory,
      subCategory: newProdSubCategory || 'General',
      nameEn: newProdName,
      nameZh: newProdName, 
      descriptionEn: 'Newly added product description.',
      descriptionZh: '新添加产品描述。',
      featuresEn: ['High Quality', 'New Model'],
      featuresZh: ['高品质', '新款'],
      params: [{ labelEn: 'Type', labelZh: '类型', valueEn: 'Standard', valueZh: '标准' }],
      images: newProdImages
    };
    addProduct(newProduct);
    setNewProdName('');
    setNewProdImages([]);
    alert("Product Added Successfully!");
  };

  const handleAddCategory = () => {
      if(!newCatName) return;
      addCategory(newCatName);
      setNewCatName('');
  }

  // --- STANDARD EXPORT FUNCTION (Backups still use single file for convenience) ---
  const handleExportData = () => {
    const newVersion = Date.now().toString();
    const backupData = {
        version: newVersion,
        theme: {
            heroImage,
            logoImage,
            certImages,
            factoryImages, // Keep legacy
            productionImages,
            rohsImages,
            equipmentImages,
            aboutCertsImage
        },
        products: products,
        categories: categories
    };
    const dataStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const exportFileDefaultName = `glamcable_backup_${new Date().toISOString().slice(0,10)}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', url);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  // --- OPTIMIZED IMPORT FUNCTION (Chunked Write) ---
  // This imports the SINGLE backup file
  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (file.size > 25 * 1024 * 1024) {
          if (!confirm(`Large file detected (${(file.size/1024/1024).toFixed(1)}MB). Continue?`)) {
              event.target.value = '';
              return;
          }
      }

      event.target.value = '';
      setIsProcessing(true);
      setProgress(0);
      setProcessStatus('Reading file (0%)...');

      setTimeout(() => {
          const reader = new FileReader();
          
          reader.onprogress = (e) => {
              if (e.lengthComputable) {
                  const percent = Math.round((e.loaded / e.total) * 20); 
                  setProgress(percent);
                  setProcessStatus(`Reading file (${percent}%)...`);
              }
          };

          reader.onload = async (e) => {
              try {
                  const content = e.target?.result as string;
                  if (!content) throw new Error("File is empty");
                  
                  setProgress(25);
                  setProcessStatus('Parsing JSON...');
                  await new Promise(r => setTimeout(r, 50)); 

                  let json: any;
                  try {
                      json = JSON.parse(content);
                  } catch (err) {
                       // Legacy cleanup...
                      let cleaned = content.replace(/^import\s+.*;\s*/gm, '')
                                           .replace(/export\s+const\s+INITIAL_DATA\s*=\s*/, '')
                                           .trim().replace(/;$/, '')
                                           .replace(/\/\/.*$/gm, '')
                                           .replace(/\/\/\s*@ts-nocheck/g, '');
                      
                      const firstBrace = cleaned.indexOf('{');
                      const lastBrace = cleaned.lastIndexOf('}');
                      if(firstBrace !== -1 && lastBrace !== -1) {
                          cleaned = cleaned.substring(firstBrace, lastBrace + 1);
                      }
                      json = JSON.parse(cleaned);
                  }

                  let themeData = json.theme;
                  let productsData = json.products;
                  let categoriesData = json.categories;
                  const version = json.version || Date.now().toString();

                  if (!productsData && json.content) {
                      productsData = json.content.products;
                      categoriesData = json.content.categories;
                  }

                  if (!themeData || !productsData || !categoriesData) {
                      throw new Error("Invalid structure.");
                  }

                  if (window.confirm(`Found ${productsData.length} products. Restore now? (This may take a moment)`)) {
                      
                      setProcessStatus('Preparing Database...');
                      
                      const ops: {key: string, value: any}[] = [];

                      ops.push({ key: 'glam_data_version', value: version });
                      ops.push({ key: 'glam_p_version', value: version });

                      if (themeData.heroImage) ops.push({ key: 'glam_hero_image', value: themeData.heroImage });
                      if (themeData.logoImage) ops.push({ key: 'glam_logo_image', value: themeData.logoImage });
                      if (themeData.certImages) ops.push({ key: 'glam_cert_images', value: themeData.certImages });
                      
                      // Restore all new fields
                      if (themeData.factoryImages) ops.push({ key: 'glam_factory_images', value: themeData.factoryImages });
                      if (themeData.productionImages) ops.push({ key: 'glam_prod_images', value: themeData.productionImages });
                      if (themeData.rohsImages) ops.push({ key: 'glam_rohs_images', value: themeData.rohsImages });
                      if (themeData.equipmentImages) ops.push({ key: 'glam_equip_images', value: themeData.equipmentImages });

                      if (themeData.aboutCertsImage) ops.push({ key: 'glam_about_certs_image', value: themeData.aboutCertsImage });

                      ops.push({ key: 'glam_categories', value: categoriesData });

                      const CHUNK_SIZE = 10;
                      const totalChunks = Math.ceil(productsData.length / CHUNK_SIZE);
                      ops.push({ key: 'glam_p_meta', value: { chunks: totalChunks, totalItems: productsData.length } });

                      for (let i = 0; i < totalChunks; i++) {
                          const chunk = productsData.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
                          ops.push({ key: `glam_p_chunk_${i}`, value: chunk });
                      }

                      const totalOps = ops.length;
                      await dbRestoreLargeData(ops, (current, total) => {
                          const percentage = 30 + Math.round((current / total) * 60);
                          setProgress(percentage);
                          setProcessStatus(`Restoring Data... ${percentage}%`);
                      });

                      setProcessStatus('Verifying Integrity...');
                      setProgress(95);
                      const checkVer = await dbGet('glam_p_version');
                      if (String(checkVer) === String(version)) {
                           setProcessStatus('Success! Reloading...');
                           setProgress(100);
                           localStorage.setItem('glam_force_local_load', 'true');
                           await new Promise(r => setTimeout(r, 800));
                           window.location.reload();
                      } else {
                          throw new Error("Verification failed. Please retry.");
                      }

                  } else {
                      setIsProcessing(false);
                  }
              } catch (err: any) {
                  console.error(err);
                  alert(`Import Failed: ${err.message}`);
                  setIsProcessing(false);
              }
          };
          reader.readAsText(file);
      }, 500);
  }

  const handleResetAll = () => {
    if(confirm("WARNING: This will reset all data to default.\n\nContinue?")) {
        resetTheme();
        resetProducts();
        setTimeout(() => window.location.reload(), 500);
    }
  }

  const handleHardReset = async () => {
      if(confirm("HARD RESET: This will delete ALL local data and force a reload from the server. Use this if your changes are on GitHub but not showing up here.\n\nContinue?")) {
          await clearDatabase();
          localStorage.clear();
          window.location.reload();
      }
  }

  // --- GITHUB JSON SPLIT GENERATION ---
  const handleGenerateAndDownload = () => {
    setIsGenerating(true);
    
    // Helper to download a file
    const downloadBlob = (filename: string, content: string) => {
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 100);
        return blob.size / (1024 * 1024);
    }

    setTimeout(() => {
        try {
            // CRITICAL OPTIMIZATION: Use strictly unified timestamp for all files
            const commonVersion = Date.now().toString();

            // 1. DATA CORE (Small: Settings, Banner, Logo, Certs)
            const coreData = {
                version: commonVersion,
                theme: {
                    heroImage,
                    logoImage,
                    certImages
                }
            };
            
            // 2. DATA ABOUT (Heavy: Factory, Lab, About Images)
            const aboutData = {
                version: commonVersion,
                theme: {
                    factoryImages, // Keep legacy
                    productionImages,
                    rohsImages,
                    equipmentImages,
                    aboutCertsImage
                }
            };

            // 3. DATA PRODUCTS (Heavy: Products, Categories)
            const productsData = {
                version: commonVersion,
                products,
                categories
            };
            
            // Sequential Download with delays to allow browser to handle multiple files
            // Increased delay to 1000ms to reduce likelihood of browser blocking
            const sizeCore = downloadBlob('data_core.json', JSON.stringify(coreData, null, 2));
            
            setTimeout(() => {
                const sizeAbout = downloadBlob('data_about.json', JSON.stringify(aboutData, null, 2));
                
                setTimeout(() => {
                    const sizeProd = downloadBlob('data_products.json', JSON.stringify(productsData, null, 2));
                    
                    setFileSizes({
                        core: sizeCore,
                        about: sizeAbout,
                        products: sizeProd
                    });
                    setGenerationSuccess(true);
                    setIsGenerating(false);
                    
                    // Alert user to check downloads
                    alert("Download complete.\n\nNOTE: If you only see 1 file, your browser blocked multiple downloads. Please allow popups or download permissions for this site.");

                }, 1000);
            }, 1000);
            
        } catch (e: any) {
            console.error(e);
            alert(`Error generating files: ${e.message}`);
            setIsGenerating(false);
        }
    }, 500);
  }

  // ... (Clean Repo & Diags) ...
  const cleanRepoUrl = (url: string) => {
    let clean = url.trim();
    if (clean.endsWith('.git')) clean = clean.slice(0, -4);
    if (clean.endsWith('/')) clean = clean.slice(0, -1);
    return clean;
  };

  const getGithubUploadUrl = () => {
      if (!repoUrl) return '';
      const clean = cleanRepoUrl(repoUrl);
      // DIRECT LINK TO PUBLIC FOLDER UPLOAD
      return `${clean}/upload/main/public`;
  }

  const checkSingleFile = async (filename: string) => {
      const timestamp = Date.now();
      const random = Math.random();
      const targetUrl = `./${filename}?t=${timestamp}&r=${random}`;
      
      try {
          const res = await fetch(targetUrl, { method: 'GET', cache: 'no-cache' });
          if (!res.ok) {
              return { size: 'N/A', version: 'Not Found', status: `HTTP ${res.status}`, url: targetUrl };
          }
          
          const text = await res.text();
          if (text.startsWith('version https://git-lfs')) {
              return { size: '1KB (LFS)', version: 'GIT LFS ERROR', status: 'LFS Pointer detected', url: targetUrl };
          }

          const blobSize = new Blob([text]).size;
          const sizeMB = (blobSize / (1024 * 1024)).toFixed(2);
          
          let ver = 'Unknown';
          try {
              const json = JSON.parse(text);
              ver = json.version || 'No Ver';
          } catch(e) {
              ver = 'Invalid JSON';
          }
          
          return { 
              size: `${sizeMB} MB`, 
              version: ver, 
              status: blobSize < 50000 ? 'Small' : 'Good',
              url: targetUrl 
          };
      } catch (e: any) {
          return { size: 'Error', version: 'Error', status: e.message, url: targetUrl };
      }
  }

  const checkServerStatus = async () => {
      setIsCheckingServer(true);
      setServerStats({});
      
      const core = await checkSingleFile('data_core.json');
      setServerStats(prev => ({ ...prev, core }));
      
      const about = await checkSingleFile('data_about.json');
      setServerStats(prev => ({ ...prev, about }));

      const prod = await checkSingleFile('data_products.json');
      setServerStats(prev => ({ ...prev, prod }));

      setIsCheckingServer(false);
  }

  const getDiagnostics = () => {
      const isSyncing = remoteVersion && localVersion && remoteVersion !== localVersion;
      return (
          <div className="text-[10px] text-gray-500 font-mono bg-gray-100 p-2 rounded mb-4 space-y-2">
              <div className="flex justify-between border-b pb-1">
                  <span>Local Ver:</span>
                  <span className="font-bold">{localVersion || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                  <span>App Remote Ver:</span>
                  <span className="font-bold">{remoteVersion || 'Fetching...'}</span>
              </div>
              
              <div className="bg-white p-2 rounded border border-blue-200">
                  <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-blue-800">Server Inspector</span>
                      <button onClick={checkServerStatus} className="text-blue-600 hover:text-blue-800" disabled={isCheckingServer}>
                          {isCheckingServer ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                      </button>
                  </div>
                  
                  {['core', 'about', 'prod'].map(key => {
                      const stats = serverStats[key];
                      const name = key === 'core' ? 'Core' : key === 'about' ? 'About' : 'Products';
                      const filename = key === 'core' ? 'data_core.json' : key === 'about' ? 'data_about.json' : 'data_products.json';
                      
                      if (!stats) return <div key={key} className="text-[9px] text-gray-400 italic border-t pt-1 mt-1">{filename}: Waiting...</div>

                      return (
                          <div key={key} className="border-t pt-1 mt-1">
                              <div className="flex justify-between font-bold text-gray-700"><span>{filename}</span> <span>{stats.size}</span></div>
                              <div className="flex justify-between text-[9px]"><span>Ver: {stats.version}</span> <span className={stats.version === 'GIT LFS ERROR' ? 'text-red-600 font-bold' : 'text-green-600'}>{stats.status}</span></div>
                          </div>
                      )
                  })}

                  {Object.keys(serverStats).length === 0 && (
                       <div className="text-[9px] text-gray-400 italic">Click refresh to inspect server files...</div>
                  )}
              </div>

              {isSyncing && (
                  <div className="text-amber-600 font-bold mt-1 text-center bg-amber-50 p-1 rounded">Mismatch - Try Force Clear</div>
              )}
          </div>
      )
  }

  if (!themeLoaded || !productsLoaded) {
      return null;
  }

  return (
    <>
      {isProcessing && (
        <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center backdrop-blur-sm">
           <div className="bg-white rounded-xl p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in duration-300">
               <div className="flex justify-center mb-4 relative">
                   {/* Progress Ring */}
                   <svg className="w-16 h-16 transform -rotate-90">
                       <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="none" className="text-gray-200" />
                       <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="none" className="text-green-500 transition-all duration-300 ease-out" strokeDasharray="176" strokeDashoffset={176 - (176 * progress) / 100} />
                   </svg>
                   <div className="absolute inset-0 flex items-center justify-center font-bold text-xs">
                       {progress}%
                   </div>
               </div>
               <h3 className="text-xl font-bold text-gray-900 mb-2">Processing</h3>
               <p className="text-gray-600 font-medium text-sm animate-pulse">{processStatus}</p>
           </div>
        </div>
      )}

      <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="bg-gray-900 text-white p-3 rounded-full shadow-lg hover:bg-gray-800 transition-all hover:rotate-90 duration-300"
          title="Site Builder"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Settings className="w-6 h-6" />}
        </button>

        {isOpen && (
          <div className="absolute bottom-16 right-0 w-96 bg-white rounded-xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
            
            <div className="bg-gray-50 border-b border-gray-200">
              <div className="flex justify-between items-center p-4 pb-2">
                  <h3 className="font-bold text-gray-900">Live Editor</h3>
                  <span className="text-[10px] uppercase tracking-wider bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-bold">Split Mode</span>
              </div>
              <div className="flex px-4 gap-4 overflow-x-auto">
                <button onClick={() => setActiveTab('visual')} className={`pb-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === 'visual' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Visuals</button>
                <button onClick={() => setActiveTab('certs')} className={`pb-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === 'certs' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Certs</button>
                <button onClick={() => setActiveTab('about')} className={`pb-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === 'about' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>About</button>
                <button onClick={() => setActiveTab('product')} className={`pb-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === 'product' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Products</button>
                <button onClick={() => setActiveTab('manage')} className={`pb-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === 'manage' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Manage</button>
                <button onClick={() => setActiveTab('github')} className={`pb-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === 'github' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-gray-700'}`}><Github className="w-4 h-4 inline"/></button>
              </div>
            </div>

            <div className="p-6 max-h-[500px] overflow-y-auto">
              
              {/* --- GITHUB TAB --- */}
              {activeTab === 'github' && (
                  <div className="space-y-4">
                      {/* Repo Settings */}
                      <div>
                          <label className="text-xs font-medium text-gray-700 block mb-1">GitHub Repository URL</label>
                          <input 
                            type="text" 
                            placeholder="https://github.com/your-username/glamcable-site" 
                            className={`w-full border rounded p-1.5 text-xs text-gray-600 mb-2 ${!repoUrl ? 'border-amber-400 bg-amber-50' : ''}`}
                            value={repoUrl}
                            onChange={(e) => saveRepoUrl(e.target.value)}
                          />
                          {!repoUrl && <p className="text-[10px] text-amber-600">Please enter repo URL to enable direct links.</p>}
                      </div>

                      {/* NEW: MIGRATION HELPER */}
                      <div className="bg-blue-50 p-3 rounded border border-blue-200 mb-4">
                          <div className="flex items-center mb-2">
                             <Split className="w-4 h-4 text-primary mr-2" />
                             <h4 className="font-bold text-xs text-gray-900">V1 to V2 Migration</h4>
                          </div>
                          <p className="text-[10px] text-gray-600 mb-2 leading-snug">
                            If you have an old, large <code>data.json</code> backup, import it here. The system will automatically prepare it for the new 3-file format.
                          </p>
                          <div className="relative">
                            <input type="file" accept=".json,.ts" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={handleImportData} disabled={isProcessing} />
                            <Button variant="white" className="w-full !py-2 text-xs border-blue-200 text-blue-700">
                                Import Old Large Backup
                            </Button>
                          </div>
                      </div>
                      
                      <div className="border-t my-4 border-gray-200"></div>

                      {/* Step 1 */}
                      <div className="bg-gray-50 p-3 rounded border border-gray-200">
                          <div className="flex items-center mb-2">
                             <div className="bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-2">1</div>
                             <h4 className="font-bold text-xs text-gray-900">Generate & Download (3 Files)</h4>
                          </div>
                          <p className="text-[10px] text-gray-500 mb-2 leading-snug">
                            This will download <strong>3 separate files</strong> based on your current local data. <br/>
                            <span className="text-amber-600 font-bold">Please allow multiple file downloads if prompted.</span>
                          </p>
                          <Button 
                            variant="primary" 
                            className="w-full !py-2 flex items-center justify-center text-xs" 
                            onClick={handleGenerateAndDownload} 
                            disabled={isGenerating}
                          >
                              {isGenerating ? (
                                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                              ) : generationSuccess ? (
                                  <><CheckCircle2 className="w-4 h-4 mr-2" /> Download Again</>
                              ) : (
                                  <><Layers className="w-4 h-4 mr-2" /> Download 3 Files</>
                              )}
                          </Button>
                          {generationSuccess && (
                              <div className="mt-2 space-y-1">
                                  <div className="flex justify-between text-[9px] text-gray-600"><span>data_core.json</span> <span>{fileSizes.core.toFixed(2)} MB</span></div>
                                  <div className="flex justify-between text-[9px] text-gray-600"><span>data_about.json</span> <span>{fileSizes.about.toFixed(2)} MB</span></div>
                                  <div className="flex justify-between text-[9px] text-gray-600"><span>data_products.json</span> <span>{fileSizes.products.toFixed(2)} MB</span></div>
                                  
                                  {(fileSizes.core > 20 || fileSizes.about > 20 || fileSizes.products > 20) && (
                                     <div className="mt-1 text-[9px] text-red-600 font-bold flex items-center bg-red-50 p-1.5 rounded border border-red-200">
                                          <AlertTriangle className="w-3 h-3 mr-1" />
                                          Warning: One file is still &gt; 20MB.
                                     </div>
                                  )}
                              </div>
                          )}
                      </div>

                      {/* Step 2 */}
                      <div className={`p-3 rounded border transition-colors ${generationSuccess ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200 opacity-60'}`}>
                           <div className="flex items-center mb-2">
                             <div className="bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-2">2</div>
                             <h4 className="font-bold text-xs text-gray-900">Upload ALL 3 Files</h4>
                          </div>
                          <p className="text-[10px] text-gray-600 mb-2 leading-snug">
                             Drag <strong>ALL 3 files</strong> you just downloaded into the GitHub <strong>public</strong> folder upload page.
                          </p>
                           {repoUrl ? (
                              <a 
                                href={getGithubUploadUrl()} 
                                target="_blank" 
                                rel="noreferrer"
                                className={`w-full block ${!generationSuccess ? 'pointer-events-none' : ''}`}
                              >
                                  <Button variant="secondary" className="w-full !py-2 text-xs" disabled={!generationSuccess}>
                                      <ExternalLink className="w-4 h-4 mr-2" /> Open Upload Page
                                  </Button>
                              </a>
                           ) : (
                               <Button disabled className="w-full !py-2 text-xs bg-gray-200 text-gray-400 cursor-not-allowed">
                                   Enter Repo URL First
                               </Button>
                           )}
                      </div>

                      {/* Step 3 */}
                      <div className="bg-amber-50 p-3 rounded border border-amber-200">
                          <div className="flex items-center mb-2">
                             <div className="bg-amber-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-2">3</div>
                             <h4 className="font-bold text-xs text-amber-900">Commit Changes</h4>
                          </div>
                          <p className="text-[10px] text-amber-800 leading-snug">
                            Vercel will only update when you <strong>Commit changes</strong> on GitHub. <br/>
                            <span className="font-bold">If you skip this, Vercel will show old/empty data.</span>
                          </p>
                      </div>

                      {/* DIAGNOSTICS */}
                      <div className="border-t pt-4">
                           <h4 className="font-bold text-xs mb-2">Deploy Diagnostics</h4>
                           {getDiagnostics()}
                           <Button 
                             onClick={handleHardReset}
                             className="w-full !text-xs !bg-red-50 text-red-600 border border-red-200 hover:!bg-red-100 flex items-center justify-center !py-2"
                            >
                                <Trash2 className="w-3 h-3 mr-1" /> Force Clear Local Cache
                            </Button>
                      </div>
                  </div>
              )}
              
              {/* --- VISUAL TAB --- */}
              {activeTab === 'visual' && (
                <div className="space-y-6">
                  {/* ... existing visual tab content ... */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">Brand Logo</label>
                    <div className="flex items-center gap-4 mb-2">
                      <div className="w-12 h-12 bg-gray-100 rounded border flex items-center justify-center overflow-hidden">
                        {logoImage ? <img src={logoImage} className="w-full h-full object-contain"/> : <span className="text-xs text-gray-400">Default</span>}
                      </div>
                      <div className="flex-1 relative">
                        <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleLogoUpload} disabled={isProcessing} />
                        <Button variant="outline" className="w-full !py-1.5 !text-xs">Upload New Logo</Button>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 flex items-center"><ImageIcon className="w-4 h-4 mr-2 text-primary" /> Home Banner</label>
                    <div className="aspect-video w-full rounded-lg overflow-hidden border border-gray-200 mb-3 relative group">
                      <img src={heroImage} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                    <div className="relative">
                      <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleHeroUpload} disabled={isProcessing} />
                      <Button variant="secondary" className="w-full !py-2 !text-xs flex items-center justify-center"><Upload className="w-3 h-3 mr-1" /> Change Banner</Button>
                    </div>
                  </div>
                </div>
              )}

              {/* ... existing Certs, About, Product, Manage tabs ... */}
              {/* --- CERTS TAB --- */}
              {activeTab === 'certs' && (
                  <div className="space-y-4">
                      {certSlots.map(slot => {
                              const currentCerts = certImages[slot.key] || [];
                              const isChina = slot.key === 'china';

                              return (
                                  <div key={slot.key} className="border rounded p-3 bg-gray-50">
                                      <div className="flex justify-between items-center mb-2">
                                          <span className="text-xs font-bold text-gray-700">{slot.label}</span>
                                          <span className="text-[10px] bg-white border px-1.5 rounded text-gray-500">{currentCerts.length} file{currentCerts.length !== 1 ? 's' : ''}</span>
                                      </div>
                                      {currentCerts.length > 0 && (
                                          <div className="mb-2 space-y-1">
                                              {currentCerts.map((cert, index) => (
                                                  <div key={index} className="flex justify-between items-center text-[10px] bg-white border p-1 rounded">
                                                      <div className="flex items-center gap-1 overflow-hidden"><FileText className="w-3 h-3 text-red-500 flex-shrink-0" /><span className="truncate max-w-[120px]">{cert.name}</span></div>
                                                      <button onClick={() => removeCertImage(slot.key, index)} className="text-red-400 hover:text-red-600 p-0.5"><X className="w-3 h-3" /></button>
                                                  </div>
                                              ))}
                                          </div>
                                      )}
                                      
                                      {/* Strict Separation: China = Text Only, Others = File Only (Batch) */}
                                      {isChina ? (
                                          <div className="relative">
                                              <p className="text-[9px] text-gray-500 mb-1">Enter Certificate Name (Text Only):</p>
                                              <div className="flex gap-1">
                                                  <input 
                                                      type="text" 
                                                      placeholder="e.g. CCC Certificate 2024" 
                                                      className="flex-1 border rounded p-1.5 text-xs"
                                                      value={manualInputs[slot.key] || ''}
                                                      onChange={(e) => setManualInputs({...manualInputs, [slot.key]: e.target.value})}
                                                  />
                                                  <Button 
                                                      variant="secondary" 
                                                      className="!py-1.5 !px-3 !text-xs"
                                                      onClick={() => handleManualCertAdd(slot.key)}
                                                      disabled={!manualInputs[slot.key]}
                                                  >
                                                      Add
                                                  </Button>
                                              </div>
                                          </div>
                                      ) : (
                                          <div className="relative">
                                              <input 
                                                  type="file" 
                                                  accept=".pdf" 
                                                  multiple 
                                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                                                  onChange={(e) => handleCertUpload(slot.key, e)} 
                                                  disabled={isProcessing} 
                                              />
                                              <Button variant="white" className="w-full !py-1.5 !text-xs border-gray-300 flex items-center justify-center">
                                                  <Plus className="w-3 h-3 mr-1" /> Add PDF(s) (Batch)
                                              </Button>
                                          </div>
                                      )}
                                  </div>
                              );
                          })}
                  </div>
              )}
              
              {/* --- ABOUT TAB (UPDATED) --- */}
              {activeTab === 'about' && (
                  <div className="space-y-6">
                      <div className="bg-gray-50 p-3 rounded border">
                          <h4 className="font-bold text-xs text-gray-800 mb-3 uppercase flex items-center"><Factory className="w-3 h-3 mr-1"/> Advanced Manufacturing</h4>
                          
                          <div className="mb-4">
                              <label className="text-xs font-medium text-gray-600 mb-1 block">Production Lines (Left Split)</label>
                              <div className="aspect-[3/2] w-full bg-gray-200 rounded overflow-hidden relative border">
                                  {productionImages[0] ? <img src={productionImages[0]} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-[10px] text-gray-500">No Image</div>}
                                  <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleProductionUpload} disabled={isProcessing} />
                              </div>
                              <Button variant="white" className="w-full !text-[10px] !py-1 mt-1">Change Production Photo</Button>
                          </div>

                          <div className="mb-4">
                              <label className="text-xs font-medium text-gray-600 mb-1 block">RoHS Lab Gallery (Right Split / Slideshow)</label>
                              <div className="grid grid-cols-3 gap-2 mb-2">
                                  {rohsImages.map((img, idx) => (
                                      <div key={idx} className="relative aspect-square rounded overflow-hidden border">
                                          <img src={img} className="w-full h-full object-cover" />
                                          <button onClick={() => removeRohsImage(idx)} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl hover:bg-red-600"><X className="w-3 h-3" /></button>
                                      </div>
                                  ))}
                                  <div className="aspect-square border-2 border-dashed border-gray-300 rounded hover:border-gray-400 relative flex items-center justify-center bg-gray-50">
                                      <Plus className="w-6 h-6 text-gray-300" />
                                      <input type="file" accept="image/*" multiple className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleRohsUpload} disabled={isProcessing} />
                                  </div>
                              </div>
                          </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 flex items-center"><Microscope className="w-4 h-4 mr-2" /> Lab Equipment Gallery</label>
                        <div className="grid grid-cols-3 gap-2 mb-2">
                              {equipmentImages.map((img, idx) => (
                                  <div key={idx} className="relative aspect-square rounded overflow-hidden border">
                                      <img src={img} className="w-full h-full object-cover" />
                                      <button onClick={() => removeEquipmentImage(idx)} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl hover:bg-red-600"><X className="w-3 h-3" /></button>
                                  </div>
                              ))}
                              <div className="aspect-square border-2 border-dashed border-gray-300 rounded hover:border-gray-400 relative flex items-center justify-center bg-gray-50">
                                  <Plus className="w-6 h-6 text-gray-300" />
                                  <input type="file" accept="image/*" multiple className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleEquipmentUpload} disabled={isProcessing} />
                              </div>
                          </div>
                      </div>

                      <div className="border-t pt-4">
                          <label className="text-sm font-medium text-gray-700 mb-2 flex items-center"><Award className="w-4 h-4 mr-2" /> Certifications Showcase (Image)</label>
                        <div className="aspect-[4/1] w-full bg-gray-100 rounded border mb-2 flex items-center justify-center overflow-hidden">
                            {aboutCertsImage ? <img src={aboutCertsImage} className="w-full h-full object-contain" /> : <span className="text-xs text-gray-400">No Image</span>}
                        </div>
                        <div className="relative">
                            <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleAboutCertUpload} disabled={isProcessing} />
                            <Button variant="secondary" className="w-full !py-1.5 !text-xs">{aboutCertsImage ? 'Replace Image' : 'Upload Image (PNG)'}</Button>
                        </div>
                      </div>
                  </div>
              )}

              {/* --- PRODUCT TAB --- */}
              {activeTab === 'product' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Product Name</label>
                    <input type="text" className="w-full border border-gray-300 rounded p-2 text-sm" placeholder="e.g., Heavy Duty Cord" value={newProdName} onChange={e => setNewProdName(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                    <select className="w-full border border-gray-300 rounded p-2 text-sm" value={newProdCategory} onChange={handleCategoryChange}>
                      {categories.map(c => (<option key={c.name} value={c.name}>{c.name}</option>))}
                    </select>
                  </div>
                  {currentSubCategories.length > 0 && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Sub Category</label>
                      <select className="w-full border border-gray-300 rounded p-2 text-sm" value={newProdSubCategory} onChange={e => setNewProdSubCategory(e.target.value)}>
                        {currentSubCategories.map(sub => (<option key={sub} value={sub}>{sub}</option>))}
                      </select>
                    </div>
                  )}
                  <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Product Images</label>
                      <div className="grid grid-cols-3 gap-2 mb-2">
                          {newProdImages.map((img, idx) => (
                              <div key={idx} className="relative aspect-square rounded overflow-hidden border">
                                  <img src={img} className="w-full h-full object-cover" />
                                  <button onClick={() => removeProductImage(idx)} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl"><X className="w-3 h-3" /></button>
                              </div>
                          ))}
                          <div className="aspect-square border-2 border-dashed border-gray-300 rounded hover:border-gray-400 relative flex items-center justify-center">
                              <Plus className="w-6 h-6 text-gray-300" />
                              <input type="file" accept="image/*" multiple className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleProductImageUpload} disabled={isProcessing} />
                          </div>
                      </div>
                  </div>
                  <Button variant="primary" className="w-full mt-2" onClick={handleAddProduct} disabled={isProcessing}><Plus className="w-4 h-4 mr-1" /> Add to Catalog</Button>
                </div>
              )}

              {/* --- MANAGE TAB --- */}
              {activeTab === 'manage' && (
                <div className="space-y-6">
                   <div className="bg-blue-50 border border-blue-100 rounded p-4">
                    <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center">
                          <Save className="w-4 h-4 mr-2 text-primary" /> Data Persistence
                    </h4>
                    <p className="text-[10px] text-gray-600 mb-3">
                      Browser storage can be wiped. <strong>Save a backup file</strong> to your computer to prevent data loss.
                    </p>
                    <div className="flex gap-2">
                        <Button variant="primary" className="!py-1.5 !px-3 !text-xs flex-1" onClick={handleExportData}>
                            <Download className="w-3 h-3 mr-1" /> Export Backup
                        </Button>
                        <div className="relative flex-1">
                            <input type="file" accept=".json,.ts" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={handleImportData} disabled={isProcessing} />
                            <Button variant="secondary" className="!py-1.5 !px-3 !text-xs w-full">
                                <Upload className="w-3 h-3 mr-1" /> Import Backup
                            </Button>
                        </div>
                    </div>
                  </div>

                  {/* NEW OPTIMIZATION TOOL */}
                  <div className="bg-green-50 border border-green-200 rounded p-4">
                      <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center">
                          <Zap className="w-4 h-4 mr-2 text-green-600" /> Smart Optimization
                      </h4>
                      <p className="text-[10px] text-gray-600 mb-3">
                          If Vercel or GitHub rejects your files, use this to automatically compress all images (Products, Factory, etc) to a safe size for web deployment.
                      </p>
                      <Button 
                          variant="white" 
                          className="w-full !py-2 text-xs border-green-200 text-green-700 hover:bg-green-100"
                          onClick={handleSmartOptimization}
                          disabled={isProcessing}
                      >
                          <Zap className="w-3 h-3 mr-2" /> Optimize All Images & Save
                      </Button>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center"><List className="w-4 h-4 mr-2" /> Categories</h4>
                    <div className="flex gap-2 mb-3">
                        <input type="text" placeholder="New Category..." className="flex-1 border rounded p-1.5 text-xs" value={newCatName} onChange={e => setNewCatName(e.target.value)} />
                        <Button variant="secondary" className="!py-1.5 !px-3 !text-xs" onClick={handleAddCategory}>Add</Button>
                    </div>
                    <div className="space-y-1 max-h-32 overflow-y-auto border rounded p-2">
                        {categories.map(c => (
                            <div key={c.name} className="flex justify-between items-center text-xs bg-gray-50 p-1.5 rounded">
                                <span>{c.name}</span>
                                <button onClick={() => deleteCategory(c.name)} className="text-red-500 hover:text-red-700"><Trash2 className="w-3 h-3" /></button>
                            </div>
                        ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center"><Package className="w-4 h-4 mr-2" /> Products ({products.length})</h4>
                    <div className="space-y-1 max-h-40 overflow-y-auto border rounded p-2">
                        {products.map(p => (
                            <div key={p.id} className="flex justify-between items-center text-xs bg-gray-50 p-1.5 rounded">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <img src={p.images[0]} className="w-6 h-6 rounded object-cover flex-shrink-0" />
                                    <span className="truncate">{p.nameEn}</span>
                                </div>
                                <button onClick={() => deleteProduct(p.id)} className="text-red-500 hover:text-red-700 ml-2"><Trash2 className="w-3 h-3" /></button>
                            </div>
                        ))}
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <Button variant="white" className="w-full !text-xs text-red-500 hover:bg-red-50" onClick={handleResetAll}>
                      <RotateCcw className="w-3 h-3 mr-1" /> Reset to Initial Data
                    </Button>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </div>
    </>
  );
};