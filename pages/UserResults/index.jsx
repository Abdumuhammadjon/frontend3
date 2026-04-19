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

  // --- SANA BO'YICHA GURUHLASH (BACKEND FORMATIGA MOSLANGAN) ---
  const groupResultsByDate = (data) => {
    const groups = {};
    data.forEach((result) => {
      // Backend: "19/04/2026, 15:18:48" -> split qilib "19/04/2026" ni olamiz
      const dateKey = result.date ? result.date.split(',')[0].trim() : "Noma'lum sana";
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(result);
    });
    return groups;
  };

  const groupedResults = groupResultsByDate(results);

  // --- VAQTNI FORMATLASH (BACKEND FORMATIGA MOSLANGAN) ---
  const formatTime = (dateStr) => {
    if (!dateStr) return "--:--";
    // "19/04/2026, 15:18:48" -> "15:18:48" qismini olib, sekundni olib tashlaymiz
    const timePart = dateStr.split(',')[1]?.trim(); 
    if (!timePart) return "--:--";
    const [hour, minute] = timePart.split(':');
    return `${hour}:${minute}`;
  };

  const handleBack = () => {
    router.push("/questions");
  };

  const handleDelete = async (resultId) => {
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
      if (!results || results.length === 0) {
        alert("PDF uchun natijalar topilmadi.");
        return;
      }
      const [{ jsPDF }, autoTable] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);
      const doc = new jsPDF();
      loadNotoSansFont(doc);
      doc.setFont('NotoSans-Regular', 'normal');
      doc.setFontSize(18);
      doc.text("Foydalanuvchilar natijalari", 14, 20);

      results.forEach((res, index) => {
        let startY = 30;
        if (index > 0) doc.addPage();
        doc.setFontSize(14);
        doc.text(`${index + 1}. ${res.username}`, 14, startY);
        doc.setFontSize(11);
        doc.text(`Sana: ${res.date} | To'g'ri: ${res.correctAnswers}/${res.totalQuestions}`, 14, startY + 6);
        if (res.answers && res.answers.length > 0) {
          const tableData = res.answers.map((a, i) => [i + 1, a.question_text, a.user_answer || "-", a.correct_answer, a.is_correct ? "✅" : "❓"]);
          autoTable.default(doc, {
            head: [["#", "Savol", "Foydalanuvchi javobi", "To‘g‘ri javob", "Holat"]],
            body: tableData,
            startY: startY + 12,
            theme: "grid",
            styles: { font: 'NotoSans-Regular', fontSize: 8.5 },
          });
        }
      });
      doc.save("natijalar.pdf");
    } catch (err) {
      alert("PDF yaratishda xatolik");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 text-gray-800">
      <Head>
        <title>Foydalanuvchi Natijalari</title>
      </Head>

      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
            <BarChart size={24} className="text-blue-600" /> Foydalanuvchi Natijalari
          </h2>
          <div className="flex gap-4">
            <button onClick={handleDownloadPDF} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200">
              PDF yuklab olish
            </button>
            <button onClick={handleBack} className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition duration-200">
              Orqaga
            </button>
          </div>
        </div>

        {loading && <p className="text-center py-10">Yuklanmoqda...</p>}
        {error && <p className="text-red-500 bg-red-100 p-3 rounded-lg text-center">{error}</p>}

        {!loading && !error && results.length === 0 && (
          <p className="text-center py-10 text-gray-500">Hech qanday natija topilmadi.</p>
        )}

        {/* --- GURUHLANGAN NATIJALAR --- */}
        {!loading && !error && Object.keys(groupedResults).length > 0 && (
          Object.keys(groupedResults).sort((a, b) => {
            // Sanalarni teskari tartibda saralash (eng yangi kun tepada)
            const dateA = a.split('/').reverse().join('-');
            const dateB = b.split('/').reverse().join('-');
            return dateB.localeCompare(dateA);
          }).map((dateKey) => (
            <div key={dateKey} className="mb-10 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              
              {/* SANA SARLAVHASI - Sanasi bir xillar uchun faqat bir marta chiqadi */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar size={20} className="text-blue-500" />
                  <span className="text-lg font-bold text-gray-700">{dateKey} kungi natijalar</span>
                </div>
                <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full">
                  {groupedResults[dateKey].length} ta urinish
                </span>
              </div>

              {/* JADVAL - Shu kungi hamma foydalanuvchilar bitta joyda */}
              <div className="overflow-x-auto">
                <table className="min-w-full text-center divide-y divide-gray-200">
                  <thead className="bg-white">
                    <tr>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Vaqt</th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Foydalanuvchi</th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">To'g'ri/Jami</th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Foiz</th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {groupedResults[dateKey].map((res) => (
                      <tr key={res.resultId} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center justify-center gap-1">
                            <Clock size={14} className="text-gray-400" />
                            {formatTime(res.date)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900">
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleDelete(res.resultId)}
                            className="text-red-500 hover:text-red-700 font-semibold"
                          >
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
        )}
      </div>
    </div>
  );
};

export default UserResults;
