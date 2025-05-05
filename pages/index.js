import Image from "next/image";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Home() {
  return (
    <main className=" py-16 px-6 bg-gradient-to-b from-blue-50 to-white flex justify-center items-center">
  <div className="max-w-5xl w-full">
    {/* Sarlavha */}
    <div className="text-center mb-12">
      <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
        O‘qituvchi va O‘quvchilar Uchun Platforma
      </h1>
      <p className="mt-4 text-lg text-gray-600">
        Ta’limni qiziqarli va samarali qiling!
      </p>
    </div>

    {/* Asosiy qism */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* O‘qituvchilar uchun blok */}
      <div className="relative bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 group">
        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-md">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-4">O‘qituvchilar</h2>
        <p className="text-gray-600 mb-6">
          Darslarni rejalashtirish, o‘quvchilar bilan aloqa va yangi usullarni sinab ko‘rish uchun eng yaxshi vosita.
        </p>
        <button className="px-5 py-2 bg-blue-500 text-white rounded-full font-medium group-hover:bg-blue-600 transition duration-200">
          Boshlash
        </button>
      </div>

      {/* O‘quvchilar uchun blok */}
      <div className="relative bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 group">
        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-purple-500 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-md">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-4">O‘quvchilar</h2>
        <p className="text-gray-600 mb-6">
          Qiziqarli vazifalar, o‘yinlar va bilimlaringizni sinash uchun interaktiv platforma.
        </p>
        <button className="px-5 py-2 bg-purple-500 text-white rounded-full font-medium group-hover:bg-purple-600 transition duration-200">
          Sinab ko‘rish
        </button>
      </div>
    </div>
  </div>
</main>
  );
}
