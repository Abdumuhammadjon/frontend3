import React, { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { BarChart, Calendar, Clock, ArrowLeft, Download } from "lucide-react";
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
        setError("Natijalarni yuklashda xatolik yuz berdi");
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [router]);
  console.log(results.date)

  // --- SANA BO'YICHA GURUHLASH (SODDA VA SAMARALI) ---
  const groupedResults = results.reduce((groups, result) => {
    const dateKey = result.date ? result.date.split('T')[0] : "Noma'lum sana";
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(result);
    return groups;
  }, {});

  const formatTime = (dateStr) => {
    if (!dateStr) return "--:--";
    return new Date(dateStr).toLocaleTimeString("uz-UZ", { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateLabel = (dateStr) => {
    if (!dateStr || dateStr === "Noma'lum sana") return dateStr;
    return new Date(dateStr).toLocaleDateString("uz-UZ");
  };

  const handleDelete = async (resultId) => {
    if (!confirm("Ushbu natijani o'chirmoqchimisiz?")) return;
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`https://backed1.onrender.com/api/userResult/${resultId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResults((prev) => prev.filter((r) => r.resultId !== resultId));
    } catch (err) {
      alert("O‘chirishda xatolik: " + (err.response?.data?.error || "Xatolik"));
    }
  };

  const handleDownloadPDF = async () => {
    try {
      if (!results.length) return alert("Natijalar yo'q");
      const [{ jsPDF }, autoTable] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
      const doc = new jsPDF();
      loadNotoSansFont(doc);
      doc.setFont('NotoSans-Regular', 'normal');
      doc.text("Test Natijalari", 14, 15);
      
      // PDF generatsiya mantiqi shu yerda davom etadi...
      doc.save("natijalar.pdf");
    } catch (err) {
      alert("PDF yuklashda xatolik");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 text-gray-800 font-sans">
      <Head>
        <title>Natijalar Guruhi</title>
      </Head>

      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <h2 className="text-2xl font-extrabold flex items-center gap-2 text-gray-900">
            <BarChart className="text-blue-600" /> Foydalanuvchi Natijalari
          </h2>
          <div className="flex gap-2">
            <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-md">
              <Download size={18} /> PDF
            </button>
            <button onClick={() => router.push("/questions")} className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition shadow-md">
              <ArrowLeft size={18} /> Orqaga
            </button>
          </div>
        </div>

        {loading && <div className="text-center py-20 text-gray-500 animate-pulse">Yuklanmoqda...</div>}
        {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">{error}</div>}

        {!loading && !error && Object.keys(groupedResults).length > 0 ? (
          Object.keys(groupedResults).sort((a, b) => b.localeCompare(a)).map((dateKey) => (
            <div key={dateKey} className="mb-10 overflow-hidden">
              
              {/* SANA SARLAVHASI */}
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-600 rounded-lg text-white">
                  <Calendar size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{formatDateLabel(dateKey)}</h3>
                  <p className="text-xs text-gray-500">{groupedResults[dateKey].length} ta natija mavjud</p>
                </div>
              </div>

              {/* JADVAL */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 text-center">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Vaqt</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-left">Foydalanuvchi</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">To'g'ri/Jami</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Foiz</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Amal</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {groupedResults[dateKey].map((res) => (
                      <tr key={res.resultId} className="hover:bg-blue-50/50 transition duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                            <Clock size={14} /> {formatTime(res.date)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-left">
                          <div className="text-sm font-bold text-gray-900">{res.username}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                          {res.correctAnswers} / {res.totalQuestions}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            res.scorePercentage >= 70 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {res.scorePercentage}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button onClick={() => handleDelete(res.resultId)} className="text-red-500 hover:text-red-700 font-semibold underline-offset-4 hover:underline">
                            O'chirish
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        ) : (
          !loading && <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300 text-gray-400">Natijalar mavjud emas.</div>
        )}
      </div>
    </div>
  );
};

export default UserResults;
