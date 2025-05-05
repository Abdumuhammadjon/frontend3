import React from 'react';
import Head from 'next/head';
import Navbar from './Navbar';

const About = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>About - MyApp</title>
        <meta name="description" content="MyApp haqida ma’lumot" />
      </Head>
      <Navbar />
      <div className="px-6 py-12 max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-indigo-600 mb-6">Biz Haqimizda</h1>
        <p className="text-lg text-gray-700 mb-4">
          MyApp 2025-yilda xAI jamoasi tomonidan ishlab chiqilgan. Bizning maqsadimiz — foydalanuvchilarga oson, intuitiv va samarali vositalarni taqdim etish orqali ularning hayotini yengillashtirish.
        </p>
        <p className="text-lg text-gray-700 mb-4">
          Dasturimiz savollar bazasini boshqarish, hisobotlar tahlili va foydalanuvchi tajribasini yaxshilash kabi funksiyalarni o‘z ichiga oladi. Biz doimiy ravishda yangi imkoniyatlar qo‘shib, mahsulotimizni rivojlantiramiz.
        </p>
        <div className="mt-8 p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Bizning Vazifamiz</h2>
          <p className="text-gray-600">
            Har bir foydalanuvchiga o‘z ishlarini samarali boshqarish imkonini berish va texnologiya yordamida hayotni yaxshilash.
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;