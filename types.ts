
export type Language = 'en' | 'zh';

export interface CertFile {
  url: string;
  name: string;
}

export interface ProductParam {
  labelEn: string;
  labelZh: string;
  valueEn: string;
  valueZh: string;
}

export interface Product {
  id: string;
  sku: string;
  category: string;
  subCategory: string;
  nameEn: string;
  nameZh: string;
  descriptionEn: string;
  descriptionZh: string;
  featuresEn: string[];
  featuresZh: string[];
  params: ProductParam[];
  images: string[];
}

export interface NavItem {
  id: string;
  labelEn: string;
  labelZh: string;
}

export interface Translation {
  [key: string]: {
    en: string;
    zh: string;
  }
}
