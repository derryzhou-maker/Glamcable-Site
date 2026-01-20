import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { Button } from './Button';

interface ContactFormProps {
  lang: Language;
  initialProduct?: string;
}

export const ContactForm: React.FC<ContactFormProps> = ({ lang, initialProduct = '' }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    product: initialProduct,
    message: ''
  });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success'>('idle');

  // Sync prop changes to state (important for when navigating from ProductCard to Contact)
  useEffect(() => {
    if (initialProduct) {
        setFormData(prev => ({ ...prev, product: initialProduct }));
    }
  }, [initialProduct]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    // Simulate API call
    setTimeout(() => {
      setStatus('success');
      setFormData({ name: '', email: '', phone: '', product: '', message: '' });
      setTimeout(() => setStatus('idle'), 3000);
    }, 1500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">
        {TRANSLATIONS.getQuote[lang]}
      </h3>
      {status === 'success' ? (
        <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-md text-center">
          {TRANSLATIONS.sentSuccess[lang]}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{TRANSLATIONS.inquiryName[lang]}</label>
              <input
                required
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary border p-3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{TRANSLATIONS.inquiryEmail[lang]}</label>
              <input
                required
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary border p-3"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{TRANSLATIONS.inquiryPhone[lang]}</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary border p-3"
              />
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{TRANSLATIONS.inquiryProduct[lang]}</label>
              <input
                type="text"
                name="product"
                value={formData.product}
                onChange={handleChange}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary border p-3"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{TRANSLATIONS.inquiryMessage[lang]}</label>
            <textarea
              required
              rows={4}
              name="message"
              value={formData.message}
              onChange={handleChange}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary border p-3"
            ></textarea>
          </div>
          <Button type="submit" variant="secondary" className="w-full" disabled={status === 'sending'}>
            {status === 'sending' ? TRANSLATIONS.sending[lang] : TRANSLATIONS.submit[lang]}
          </Button>
        </form>
      )}
    </div>
  );
};