 import React, { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { BarChart } from "lucide-react";
import axios from "axios";

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

      // ✅ Backenddan qaytayotgan ma’lumotlarni log qilamiz
      console.log("Backenddan kelgan data:", response.data);

      // Agar `results` massiv bo‘lsa
      setResults(response.data.results || []);
    } catch (err) {
      setError(err.response?.data?.error || "Natijalarni olishda xatolik");
    } finally {
      setLoading(false);
    }
  };

  fetchResults();
}, [router]);

  

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
      doc.setFontSize(18);
      doc.text("Foydalanuvchilar natijalari", 14, 20);

      results.forEach((res, index) => {
        let startY = 30;
        if (index > 0) doc.addPage();

        doc.setFontSize(14);
        doc.text(`${index + 1}. ${res.username}`, 14, startY);
        doc.setFontSize(11);
        doc.text(
          `To'g'ri javoblar: ${res.correctAnswers}/${res.totalQuestions}  |  Foiz: ${res.scorePercentage}%`,
          14,
          startY + 6
        );

        if (res.answers && res.answers.length > 0) {
          const tableData = res.answers.map((a, i) => [
            i + 1,
            a.question,
            a.user_answer || "-",
            a.correct_answer,
            a.is_correct ? "✅" : "❌",
          ]);

          autoTable.default(doc, {
            head: [["#", "Savol", "Foydalanuvchi javobi", "To‘g‘ri javob", "Holat"]],
            body: tableData,
            startY: startY + 12,
            theme: "grid",
            styles: { fontSize: 9, cellPadding: 2 },
            headStyles: { fillColor: [41, 128, 185] },
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
        <meta name="description" content="Foydalanuvchi test natijalari" />
      </Head>

      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
            <BarChart size={24} />
            Foydalanuvchi Natijalari
          </h2>
          <div className="flex gap-4">
            <button
              onClick={handleDownloadPDF}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
            >
              PDF yuklab olish
            </button>
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition duration-200"
            >
              Orqaga
            </button>
          </div>
        </div>

        {loading && <p className="text-gray-600">Natijalar yuklanmoqda...</p>}

        {error && (
          <p className="text-red-500 bg-red-100 p-3 rounded-lg">{error}</p>
        )}

        {!loading && !error && results.length === 0 && (
          <p className="text-gray-600">Hech qanday natija topilmadi.</p>
        )}

        {!loading && !error && results.length > 0 && (
          <div className="bg-white shadow-md rounded-lg overflow-x-auto">
            <table className="min-w-full w-full divide-y divide-gray-200 text-sm text-center">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-gray-500 uppercase">Foydalanuvchi</th>
                  <th className="px-4 py-2 text-gray-500 uppercase">To‘g‘ri javoblar</th>
                  <th className="px-4 py-2 text-gray-500 uppercase">Umumiy savollar</th>
                  <th className="px-4 py-2 text-gray-500 uppercase">Foiz</th>
                  <th className="px-4 py-2 text-gray-500 uppercase">Savollar</th>
                  <th className="px-4 py-2 text-gray-500 uppercase">Amallar</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.map((result) => (
                  <tr key={result.resultId} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{result.username}</td>
                    <td className="px-4 py-3">{result.correctAnswers}</td>
                    <td className="px-4 py-3">{result.totalQuestions}</td>
                    <td className="px-4 py-3">{result.scorePercentage}%</td>
                    <td className="px-4 py-3">
                      {result.answers?.map((a, i) => (
                        <div key={i} className="text-left mb-1">
                          <p className="text-gray-700 font-medium">❓ {a.question}</p>
                          <p>
                            Sizning javobingiz:{" "}
                            <span
                              className={
                                a.is_correct
                                  ? "text-green-600 font-semibold"
                                  : "text-red-600 font-semibold"
                              }
                            >
                              {a.user_answer}
                            </span>
                          </p>
                          <p className="text-gray-600">
                            To‘g‘ri javob: {a.correct_answer}
                          </p>
                        </div>
                      ))}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(result.resultId)}
                        className="text-red-600 hover:text-red-800 transition duration-150"
                      >
                        O‘chirish
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserResults;
