import React, { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { BarChart, Calendar, Clock } from "lucide-react";
import axios from "axios";
import { loadNotoSansFont } from '../../NotoSansFont';

const UserResults = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    const subjectId = localStorage.getItem("subjectId");

    if (!token) {
      router.push("/Login");
      return;
    }

    const fetchResults = async () => {
      try {
        setLoading(true);
        const url = subjectId
          ? `https://backed1.onrender.com/api/userResults/${userId}?subjectId=${subjectId}`
          : `https://backed1.onrender.com/api/userResults/${userId}`;

        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setResults(response.data.results || []);
      } catch (err) {
        setError("Natijalarni yuklashda xatolik");
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [router]);

  // --- ASOSIY GURUHLASH MANTIQI ---
  const groupResultsByDate = (data) => {
    const groups = {};
    
    data.forEach((result) => {
      // result.date dan faqat yil-oy-kun qismini olamiz (masalan: "2026-04-19")
      const dateKey = result.date ? result.date.split('T')[0] : "Noma'lum sana";
      
      // Agar bu sana hali guruhda bo'lmasa, yangi massiv ochamiz
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      
      // Shu sanaga tegishli natijani massivga qo'shamiz
      groups[dateKey].push(result);
    });
    
    return groups;
  };

  const groupedResults = groupResultsByDate(results);

  // Vaqtni formatlash (Soat:Daqiqa)
  const formatTime = (dateStr) => {
    if (!dateStr) return "--:--";
    return new Date(dateStr).toLocaleTimeString("uz-UZ", { hour: '2-digit', minute: '2-digit' });
  };

  // Sanani formatlash (Kun.Oy.Yil)
  const formatDateLabel = (dateStr) => {
    if (!dateStr || dateStr === "Noma'lum sana") return dateStr;
    return new Date(dateStr).toLocaleDateString("uz-UZ");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 text-gray-800">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <BarChart size={24} className="text-blue-600" /> Foydalanuvchi Natijalari
        </h2>

        {loading && <p className="text-center py-10">Yuklanmoqda...</p>}

        {!loading && Object.keys(groupedResults).length > 0 ? (
          // Sanalar bo'yicha aylanamiz (eng yangi sana birinchi chiqadi)
          Object.keys(groupedResults).sort((a, b) => b.localeCompare(a)).map((dateKey) => (
            <div key={dateKey} className="mb-10 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              
              {/* GURUH SARLAVHASI - Faqat bir marta chiqadi */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar size={20} className="text-blue-500" />
                  <span className="text-lg font-bold text-gray-700">
                    {formatDateLabel(dateKey)} kungi natijalar
                  </span>
                </div>
                <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                  {groupedResults[dateKey].length} ta urinish
                </span>
              </div>

              {/* JADVAL - Shu kungi barcha foydalanuvchilar bitta jadvalda */}
              <div className="overflow-x-auto">
                <table className="min-w-full text-center divide-y divide-gray-200">
                  <thead className="bg-white">
                    <tr>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Vaqt</th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Foydalanuvchi</th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">To'g'ri/Jami</th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Foiz</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {groupedResults[dateKey].map((res) => (
                      <tr key={res.resultId} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center justify-center gap-1">
                            <Clock size={14} /> {formatTime(res.date)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                          {res.username}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {res.correctAnswers} / {res.totalQuestions}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            res.scorePercentage >= 70 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {res.scorePercentage}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        ) : (
          !loading && <p className="text-center text-gray-500 py-10">Natijalar topilmadi.</p>
        )}
      </div>
    </div>
  );
};

export default UserResults;
