import React, { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { BarChart, Calendar, Clock } from "lucide-react"; // Clock ikonkasi qo'shildi
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
      if (!userId) {
        setError("Foydalanuvchi ID topilmadi");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const url = subjectId
          ? `https://backed1.onrender.com/api/userResults/${userId}?subjectId=${subjectId}`
          : `https://backed1.onrender.com/api/userResults/${userId}`;

        const response = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        setResults(response.data.results || []);
      } catch (err) {
        setError(err.response?.data?.error || "Foydalanuvchi natijalari topilmadi");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [router]);

  // --- VAQTNI VA SANANI FORMATLASH ---
  const formatTime = (dateStr) => {
    if (!dateStr) return "--:--";
    const date = new Date(dateStr);
    return date.toLocaleTimeString("uz-UZ", { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateLabel = (dateStr) => {
    if (!dateStr || dateStr === "Noma'lum sana") return dateStr;
    const date = new Date(dateStr);
    return date.toLocaleDateString("uz-UZ"); // 19.04.2026 ko'rinishida
  };

  // --- NATIJALARNI SANA BO'YICHA GURUHLASH ---
  const groupResultsByDate = (data) => {
    return data.reduce((groups, result) => {
      // Backenddan kelgan 'date' yoki 'createdAt' dan foydalanamiz
      const dateKey = result.date ? result.date.split('T')[0] : "Noma'lum sana";
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(result);
      return groups;
    }, {});
  };

  const groupedResults = groupResultsByDate(results);

  const handleBack = () => {
    router.push("/questions");
  };

  const handleDelete = async (resultId) => {
    const token = localStorage.getItem("token");
    try {
      await axios.delete(
        `https://backed1.onrender.com/api/userResult/${resultId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
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
        doc.text(`${index + 1}. ${res.username} (${formatTime(res.date)})`, 14, startY);
        doc.setFontSize(11);
        doc.text(`Sana: ${formatDateLabel(res.date)} | To'g'ri: ${res.correctAnswers}/${res.totalQuestions}`, 14, startY + 6);
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
      alert("PDF yaratishda xatolik: " + (err?.message || "Noma'lum xatolik"));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
      <Head>
        <title>Foydalanuvchi Natijalari</title>
      </Head>

      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
            <BarChart size={24} />
            Foydalanuvchi Natijalari
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

        {loading && <p className="text-gray-600 text-center py-10">Natijalar yuklanmoqda...</p>}
        {error && <p className="text-red-500 bg-red-100 p-3 rounded-lg text-center">{error}</p>}

        {!loading && !error && results.length === 0 && (
          <p className="text-gray-600 text-center py-10">Hech qanday natija topilmadi.</p>
        )}

        {/* --- GURUHLANGAN NATIJALAR --- */}
        {!loading && !error && Object.keys(groupedResults).length > 0 && (
          Object.keys(groupedResults).sort((a, b) => b.localeCompare(a)).map((dateKey) => (
            <div key={dateKey} className="mb-10">
              {/* Sana sarlavhasi */}
              <div className="flex items-center gap-2 mb-4 bg-white p-3 rounded-lg shadow-sm w-fit border-l-4 border-blue-600">
                <Calendar size={20} className="text-blue-600" />
                <h3 className="text-lg font-bold text-gray-700">{formatDateLabel(dateKey)} kungi natijalar</h3>
              </div>

              <div className="bg-white shadow-md rounded-lg overflow-x-auto border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200 text-sm text-center">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-gray-500 uppercase font-semibold">Vaqt</th>
                      <th className="px-4 py-3 text-gray-500 uppercase font-semibold">Foydalanuvchi</th>
                      <th className="px-4 py-3 text-gray-500 uppercase font-semibold">Natija</th>
                      <th className="px-4 py-3 text-gray-500 uppercase font-semibold">Foiz</th>
                      <th className="px-4 py-3 text-gray-500 uppercase font-semibold">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {groupedResults[dateKey].map((result) => (
                      <tr key={result.resultId} className="hover:bg-blue-50/30 transition">
                        {/* Aniq javob bergan vaqti */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="flex items-center justify-center gap-1 text-gray-500 font-medium">
                            <Clock size={14} />
                            {formatTime(result.date)}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-900">{result.username}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {result.correctAnswers} / {result.totalQuestions}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${result.scorePercentage > 70 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {result.scorePercentage}%
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleDelete(result.resultId)}
                            className="text-red-500 hover:text-red-700 font-medium hover:underline"
                          >
                            O‘chirish
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
