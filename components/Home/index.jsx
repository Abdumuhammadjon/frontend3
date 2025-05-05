import React from 'react';
import Head from 'next/head';
import Navbar from './Navbar';

const Home = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>Home - MyApp</title>
        <meta name="description" content="MyApp bosh sahifasi" />
      </Head>
      <Navbar />
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-6 py-12 bg-gradient-to-b from-indigo-50 to-gray-100">
        <h1 className="text-5xl font-bold text-indigo-600 mb-4 animate-fade-in">Xush kelibsiz MyApp’ga!</h1>
        <p className="text-lg text-gray-700 max-w-2xl text-center mb-8">
          MyApp — bu sizning kundalik vazifalaringizni boshqarish, ma’lumotlarni tahlil qilish va samaradorlikni oshirish uchun yaratilgan zamonaviy veb dastur. Biz bilan vaqtingizni tejang va ishlaringizni tartibga soling!
        </p>
        <button className="px-6 py-3 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition-colors duration-200">
          Boshlash
        </button>
      </div>
    </div>
  );
};

export default Home;