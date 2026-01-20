
import { Translation, NavItem } from './types';

export const CONTACT_INFO = {
  emailSales: 'sales@glamcable.com',
  emailService: 'service@glamcable.com',
  phoneSz: '+86 181 2981 0239', // Mobile
  phoneDg: '+86-769-81357188',
  addressSzEn: "B7 Duoca Industrial Area, Fuyong, Bao'an District, Shenzhen",
  addressSzZh: "深圳市宝安区福永多加工业区B7",
  addressDgEn: "Opposite Commercial Bank, Xiasha Road, Shipai Town, Dongguan",
  addressDgZh: "东莞市石排镇下沙路商业银行对面"
};

export const TRANSLATIONS: Translation = {
  brandSlogan: {
    en: "Global Professional Power Cord, Plug & Swivel Cord Solutions",
    zh: "全球专业电源线、各国认证插头及转尾线解决方案"
  },
  home: { en: "Home", zh: "首页" },
  products: { en: "Products", zh: "产品中心" },
  about: { en: "About Us", zh: "关于我们" },
  certifications: { en: "Certifications", zh: "资质认证" },
  contact: { en: "Contact Us", zh: "联系我们" },
  getQuote: { en: "Get Quote", zh: "立即询价" },
  readMore: { en: "Read More", zh: "了解更多" },
  viewProducts: { en: "View Products", zh: "查看产品" },
  productCategories: { en: "Product Categories", zh: "产品分类" },
  coreAdvantages: { en: "Core Advantages", zh: "核心优势" },
  globalCerts: { en: "Global Certifications", zh: "全球安规认证" },
  customSolutions: { en: "Custom Solutions", zh: "定制化方案" },
  strictQuality: { en: "Strict Quality Control", zh: "严格品控" },
  fastDelivery: { en: "Fast Delivery", zh: "快速交付" },
  factoryScale: { en: "Factory Scale", zh: "工厂规模" },
  productionLines: { en: "Production Lines", zh: "生产线" },
  employees: { en: "Employees", zh: "员工人数" },
  annualOutput: { en: "Annual Output", zh: "年产量" },
  specifications: { en: "Specifications", zh: "规格参数" },
  features: { en: "Features", zh: "产品特点" },
  relatedProducts: { en: "Related Products", zh: "相关产品" },
  inquiryName: { en: "Your Name", zh: "您的姓名" },
  inquiryEmail: { en: "Email Address", zh: "电子邮箱" },
  inquiryPhone: { en: "Phone Number", zh: "电话号码" },
  inquiryProduct: { en: "Product Model", zh: "产品型号" },
  inquiryMessage: { en: "Message", zh: "留言内容" },
  submit: { en: "Submit Inquiry", zh: "提交询价" },
  sending: { en: "Sending...", zh: "发送中..." },
  sentSuccess: { en: "Inquiry Sent Successfully!", zh: "询价发送成功！" },
  copyright: { en: "© 2024 GlamCable. All Rights Reserved.", zh: "© 2024 欣瑞泰电子 版权所有" }
};

export const NAV_ITEMS: NavItem[] = [
  { id: 'home', labelEn: 'Home', labelZh: '首页' },
  { id: 'products', labelEn: 'Products', labelZh: '产品中心' },
  { id: 'about', labelEn: 'About Us', labelZh: '关于我们' },
  { id: 'certifications', labelEn: 'Certifications', labelZh: '资质认证' },
  { id: 'contact', labelEn: 'Contact Us', labelZh: '联系我们' },
];

export const DEFAULT_CATEGORIES = [
  {
    name: 'Plugs',
    subs: ['America', 'Europe', 'Asia', 'Others']
  },
  { 
    name: 'Power Cords', 
    subs: ['UL Standard', 'VDE Standard', 'IEC Standard', 'JIS Standard'] 
  },
  { 
    name: 'Swivel Cords', 
    subs: ['General'] 
  }
];