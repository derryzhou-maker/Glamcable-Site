import React, { useState, useEffect } from 'react';
import { Settings, Image as ImageIcon, Upload, X, RotateCcw, Package, Plus, Trash2, List, Award, FlaskConical, FileText, Download, Save, Loader2, CheckCircle2, Github, ExternalLink, HelpCircle, AlertTriangle, FileJson, ArrowRight, RefreshCw, AlertOctagon, Server, Search } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useProducts } from '../context/ProductContext';
import { Button } from './Button';
import { Product, CertFile } from '../types';
import { dbGet, dbRestoreLargeData, clearDatabase } from '../utils/db'; 

export const ThemeEditor: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'visual' | 'certs' | 'about' | 'product' | 'manage' | 'github'>('visual');
  
  // Import State
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStatus, setProcessStatus] = useState('');
  const [progress, setProgress] = useState(0); 
  
  // Server Diag State
  const [serverStats, setServerStats] = useState<{size: string, version: string, status: string, url: string} | null>(null);
  const [isCheckingServer, setIsCheckingServer] = useState(false);
  
  const { 
      heroImage, setHeroImage, 
      logoImage, setLogoImage, 
      certImages, addBatchCertImages, removeCertImage,
      factoryImages, setFactoryImages,
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
  const [fileSizeMB, setFileSizeMB] = useState(0);
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
        setFileSizeMB(0);
        setServerStats(null);
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

  const processImage = (file: File, maxWidth: number, quality: number = 0.3): Promise<string> => {
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

  const handleHeroUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setProcessStatus('Compressing Banner...');
      setIsProcessing(true);
      try {
        const base64 = await processImage(file, 1024, 0.4); 
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

  const handleFactoryUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setProcessStatus('Compressing Images...');
      setIsProcessing(true);
      try {
        const fileArray = Array.from(files);
        const base64Promises = fileArray.map((file) => processImage(file as File, 640, 0.3));
        const newUrls = await Promise.all(base64Promises);
        setFactoryImages([...factoryImages, ...newUrls]);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const removeFactoryImage = (index: number) => {
    setFactoryImages(factoryImages.filter((_, i) => i !== index));
  };

  const handleAboutCertUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
          setProcessStatus('Compressing...');
          setIsProcessing(true);
          try {
              const base64 = await processImage(file, 800, 0.3);
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
        const base64Promises = fileArray.map((file) => processImage(file as File, 500, 0.3));
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

  // --- STANDARD EXPORT FUNCTION ---
  const handleExportData = () => {
    const newVersion = Date.now().toString();
    const backupData = {
        version: newVersion,
        theme: {
            heroImage,
            logoImage,
            certImages,
            factoryImages,
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
                      // Legacy cleanup
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
                      if (themeData.factoryImages) ops.push({ key: 'glam_factory_images', value: themeData.factoryImages });
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

  // --- GITHUB JSON GENERATION ---
  const handleGenerateAndDownload = () => {
    setIsGenerating(true);
    
    setTimeout(() => {
        try {
            const newVersion = Date.now().toString();

            const fullData = {
                version: newVersion,
                theme: {
                    heroImage,
                    logoImage,
                    certImages,
                    factoryImages,
                    aboutCertsImage
                },
                products,
                categories
            };

            const jsonString = JSON.stringify(fullData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'data.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            setTimeout(() => URL.revokeObjectURL(url), 100);

            setFileSizeMB(blob.size / (1024 * 1024));
            setGenerationSuccess(true);
            
        } catch (e: any) {
            console.error(e);
            alert(`Error generating file: ${e.message}\n\nTry removing some images.`);
        } finally {
            setIsGenerating(false);
        }
    }, 100);
  }

  const cleanRepoUrl = (url: string) => {
    let clean = url.trim();
    if (clean.endsWith('.git')) clean = clean.slice(0, -4);
    if (clean.endsWith('/')) clean = clean.slice(0, -1);
    return clean;
  };

  const getGithubUploadUrl = () => {
      if (!repoUrl) return '';
      const clean = cleanRepoUrl(repoUrl);
      // Direct link to the public folder upload interface for 'main' branch
      return `${clean}/upload/main/public`;
  }

  // --- NEW: SERVER DIAGNOSTICS ---
  const checkServerStatus = async () => {
      setIsCheckingServer(true);
      setServerStats(null);
      try {
          const timestamp = Date.now();
          const random = Math.random();
          // Fix: Use relative path './data.json'
          const targetUrl = `./data.json?t=${timestamp}&r=${random}`;
          
          // Use fetch to get headers only first
          const res = await fetch(targetUrl, { 
              method: 'GET',
              cache: 'no-store'
          });
          
          const finalUrl = res.url; // See what URL the browser actually used
          
          if (!res.ok) {
              setServerStats({ 
                  size: 'N/A', 
                  version: 'Not Found', 
                  status: `HTTP ${res.status}`,
                  url: finalUrl
              });
              return;
          }

          // Check for HTML masquerading as JSON
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.indexOf("application/json") === -1) {
              setServerStats({
                  size: 'N/A',
                  version: 'Invalid Type',
                  status: `Server returned ${contentType} (likely 404 HTML)`,
                  url: finalUrl
              });
              return;
          }

          const blob = await res.blob();
          const sizeBytes = blob.size;
          const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(2);
          
          const text = await blob.text();
          let ver = 'Unknown';
          try {
              const json = JSON.parse(text);
              ver = json.version || 'No Version Tag';
          } catch(e) {
              ver = 'Invalid JSON';
          }

          setServerStats({ 
              size: `${sizeMB} MB`, 
              version: ver,
              status: sizeBytes < 50000 ? 'Warning: File is very small' : 'Good Size',
              url: finalUrl
          });

      } catch (e: any) {
          setServerStats({ size: 'Error', version: 'Error', status: e.message, url: 'Failed' });
      } finally {
          setIsCheckingServer(false);
      }
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
                  {serverStats ? (
                      <div className="space-y-1">
                          <div className="flex justify-between"><span>Real Size:</span> <span className={serverStats.size.includes('0.0') ? 'text-red-500 font-bold' : 'text-green-600 font-bold'}>{serverStats.size}</span></div>
                          <div className="flex justify-between"><span>Real Ver:</span> <span>{serverStats.version}</span></div>
                          <div className="break-all text-[9px] text-gray-400 mt-1 border-t pt-1">Fetched: {serverStats.url}</div>
                          <div className="text-[9px] text-amber-600 mt-1 font-bold">{serverStats.status}</div>
                      </div>
                  ) : (
                      <div className="text-[9px] text-gray-400 italic">Click refresh to inspect actual server file...</div>
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
                  <span className="text-[10px] uppercase tracking-wider bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-bold">Ultra Compress: ACTIVE</span>
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
              
              {/* --- GITHUB TAB (UPDATED INSTRUCTIONS) --- */}
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

                      <div className="bg-gray-50 p-3 rounded border">
                          <h4 className="font-bold text-xs mb-2">Step 1: Get Data</h4>
                          <Button 
                            variant="primary" 
                            className="w-full !py-2 flex items-center justify-center text-xs" 
                            onClick={handleGenerateAndDownload} 
                            disabled={isGenerating}
                          >
                              {isGenerating ? (
                                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                              ) : generationSuccess ? (
                                  <><CheckCircle2 className="w-4 h-4 mr-2" /> Download Again ({fileSizeMB.toFixed(1)} MB)</>
                              ) : (
                                  <><Download className="w-4 h-4 mr-2" /> Download data.json</>
                              )}
                          </Button>
                      </div>

                      <div className="flex justify-center">
                          <ArrowRight className="text-gray-300" />
                      </div>

                      <div className="bg-gray-50 p-3 rounded border">
                           <h4 className="font-bold text-xs mb-2">Step 2: Upload to GitHub</h4>
                           <p className="text-[10px] text-gray-600 mb-2">
                               The app cannot save directly to GitHub. You must upload the file manually to the <strong>public</strong> folder.
                           </p>

                           {repoUrl ? (
                              <a 
                                href={getGithubUploadUrl()} 
                                target="_blank" 
                                rel="noreferrer"
                                className="w-full"
                              >
                                  <Button variant="secondary" className="w-full !py-2 text-xs">
                                      <ExternalLink className="w-4 h-4 mr-2" /> Open 'public' Upload Page
                                  </Button>
                              </a>
                           ) : (
                               <Button disabled className="w-full !py-2 text-xs bg-gray-200 text-gray-400 cursor-not-allowed">
                                   Enter Repo URL First
                               </Button>
                           )}
                           
                           <div className="mt-2 text-[10px] bg-red-50 p-2 rounded border border-red-200 text-red-800">
                                <strong className="flex items-center gap-1"><AlertOctagon className="w-3 h-3"/> CRITICAL CHECK:</strong>
                                1. If the green button says <strong>"Propose changes"</strong>, the file WILL NOT update immediately. You created a Pull Request.<br/>
                                2. You MUST select <strong>"Commit directly to the main branch"</strong>.<br/>
                                3. If file > 25MB, GitHub Web Upload will fail silently.
                           </div>
                           
                           <div className="mt-2 text-[10px] bg-amber-50 p-2 rounded border border-amber-200 text-amber-800">
                                <strong>Troubleshooting:</strong><br/>
                                1. Go to public folder on GitHub.<br/>
                                2. <strong>DELETE</strong> the old data.json (Trash icon) & Commit.<br/>
                                3. Upload new file & Ensure "Commit directly" is checked.
                           </div>
                      </div>

                      {/* DIAGNOSTICS */}
                      <div className="border-t pt-4">
                           <h4 className="font-bold text-xs mb-2">Diagnostics</h4>
                           {getDiagnostics()}
                           <Button 
                             onClick={handleHardReset}
                             className="w-full !text-xs !bg-red-50 text-red-600 border border-red-200 hover:!bg-red-100 flex items-center justify-center !py-2"
                            >
                                <Trash2 className="w-3 h-3 mr-1" /> Force Clear Local Cache
                            </Button>
                      </div>

                      {/* Size Warning */}
                      {fileSizeMB > 24 && (
                          <div className="bg-red-50 text-red-800 p-2 rounded text-[10px] flex items-start border border-red-200">
                              <AlertTriangle className="w-4 h-4 mr-1 flex-shrink-0" />
                              <div className="flex-1">
                                  <strong>File > 25MB ({fileSizeMB.toFixed(1)}MB)</strong><br/>
                                  GitHub Web Upload will likely FAIL. Please remove some images or use GitHub Desktop.
                              </div>
                          </div>
                      )}
                  </div>
              )}
              
              {activeTab === 'visual' && (
                <div className="space-y-6">
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

              {activeTab === 'certs' && (
                  <div className="space-y-4">
                      {certSlots.map(slot => {
                              const currentCerts = certImages[slot.key] || [];
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
                                      <div className="relative">
                                          <input type="file" accept=".pdf" multiple className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => handleCertUpload(slot.key, e)} disabled={isProcessing} />
                                          <Button variant="white" className="w-full !py-1.5 !text-xs border-gray-300 flex items-center justify-center"><Plus className="w-3 h-3 mr-1" /> Add PDF(s)</Button>
                                      </div>
                                  </div>
                              );
                          })}
                  </div>
              )}
              
              {activeTab === 'about' && (
                  <div className="space-y-6">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 flex items-center"><FlaskConical className="w-4 h-4 mr-2" /> Factory Images</label>
                        <div className="grid grid-cols-3 gap-2 mb-2">
                              {factoryImages.map((img, idx) => (
                                  <div key={idx} className="relative aspect-square rounded overflow-hidden border">
                                      <img src={img} className="w-full h-full object-cover" />
                                      <button onClick={() => removeFactoryImage(idx)} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl hover:bg-red-600"><X className="w-3 h-3" /></button>
                                  </div>
                              ))}
                              <div className="aspect-square border-2 border-dashed border-gray-300 rounded hover:border-gray-400 relative flex items-center justify-center bg-gray-50">
                                  <Plus className="w-6 h-6 text-gray-300" />
                                  <input type="file" accept="image/*" multiple className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFactoryUpload} disabled={isProcessing} />
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