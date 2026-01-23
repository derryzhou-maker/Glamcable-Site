import { Product } from './types';

// Fallback data used when data.json is missing or network fails.
export const INITIAL_DATA = {
  version: "1.3.1",
  theme: {
    heroImage: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=2000",
    logoImage: null,
    certImages: {
        "china": [
            { "name": "CCC二插证书-XRT-001/002/003/004/005（中文）", "url": "" },
            { "name": "CCC证书- 梅花尾组件", "url": "" },
            { "name": "CCC证书- 品字尾组件", "url": "" },
            { "name": "CCC证书-八字尾组件", "url": "" },
            { "name": "CCC证书-假接地XRT-305", "url": "" },
            { "name": "CCC证书-三插", "url": "" }
        ]
    },
    factoryImages: [], 
    productionImages: [], 
    rohsImages: [],
    equipmentImages: [],
    aboutCertsImage: null
  },
  products: [] as Product[],
  categories: [
    {
      "name": "Plugs",
      "subs": ["America", "Europe", "Asia", "Others"]
    },
    {
      "name": "Power Cords",
      "subs": ["UL Standard", "VDE Standard", "IEC Standard", "JIS Standard"]
    },
    {
      "name": "Swivel Cords",
      "subs": ["General"]
    }
  ]
};