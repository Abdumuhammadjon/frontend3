import React from 'react';
import Head from 'next/head';
import Navbar from './Navbar';

const Contact = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>Contact - MyApp</title>
        <meta name="description" content="MyApp bilan aloqa" />
      </Head>
      <Navbar />
      <div className="px-6 py-12 max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-indigo-600 mb-6">Biz bilan Aloqa</h1>
        <p className="text-lg text-gray-700 mb-8">
          Savollaringiz yoki takliflaringiz bo‘lsa, biz bilan bog‘laning. Sizning fikringiz biz uchun muhim!
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Bizning Manzil</h2>
            <p className="text-gray-600">Toshkent sh., Chilanzar tumani, 45-uy</p>
            <p className="text-gray-600">Email: support@myapp.com</p>
            <p className="text-gray-600">Telefon: +998 90 123 45 67</p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Xabar Yuborish</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Ismingiz"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="email"
                placeholder="Email"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <textarea
                placeholder="Xabaringiz"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 resize-y"
                rows="4"
              />
              <button className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200">
                Yuborish
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;