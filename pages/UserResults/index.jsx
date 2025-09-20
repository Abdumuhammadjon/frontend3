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

// Shu funksiyani sizning hozirgi handleDownloadPDF o'rniga qo'ying
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

    // ---- parser: DD/MM/YYYY, HH:mm:ss va ba'zi boshqa formatlar ----
    const parseDateString = (s) => {
      if (!s) return null;
      if (s instanceof Date) return s;
      const str = String(s).trim();

      // 1) DD/MM/YYYY, HH:MM:SS  (masalan: "19/05/2025, 03:46:26")
      const m1 = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4}),\s*(\d{1,2}):(\d{2}):(\d{2})$/);
      if (m1) {
        const day = parseInt(m1[1], 10);
        const month = parseInt(m1[2], 10) - 1;
        const year = parseInt(m1[3], 10);
        const hh = parseInt(m1[4], 10);
        const mm = parseInt(m1[5], 10);
        const ss = parseInt(m1[6], 10);
        return new Date(year, month, day, hh, mm, ss);
      }

      // 2) DD/MM/YYYY, HH:MM (no seconds)
      const m2 = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4}),\s*(\d{1,2}):(\d{2})$/);
      if (m2) {
        const day = parseInt(m2[1], 10);
        const month = parseInt(m2[2], 10) - 1;
        const year = parseInt(m2[3], 10);
        const hh = parseInt(m2[4], 10);
        const mm = parseInt(m2[5], 10);
        return new Date(year, month, day, hh, mm, 0);
      }

      // 3) ISO yoki boshqa JS qabul qiladigan formatlarga harakat
      const iso = new Date(str);
      if (!isNaN(iso.getTime())) return iso;

      return null;
    };

    // fallback function: agar date yo'q bo'lsa boshqa maydonlardan vaqt izlash
    const asDate = (v) => {
      if (!v) return null;
      if (v instanceof Date) return v;
      return parseDateString(v) || (isNaN(new Date(v).getTime()) ? null : new Date(v));
    };

    const pickAttemptTime = (r) => {
      // 1) eng avvalo r.date (sizning holat)
      const d0 = parseDateString(r.date);
      if (d0) return d0;

      // 2) boshqa result-level maydonlar
      const cand = [r.submittedAt, r.finishedAt, r.completedAt, r.created_at, r.createdAt]
        .map(asDate)
        .filter(Boolean);
      if (cand.length) return cand[0];

      // 3) answers[] ichidan eng erta javob vaqti
      if (Array.isArray(r.answers) && r.answers.length) {
        const ans = r.answers
          .map((a) =>
            asDate(a.answeredAt || a.created_at || a.createdAt || a.time || a.timestamp)
          )
          .filter(Boolean)
          .sort((a, b) => a - b);
        if (ans.length) return ans[0];
      }

      return null;
    };

    // --- items tayyorlash ---
    const items = results
      .map((r) => ({ ...r, _attemptAt: pickAttemptTime(r) }))
      .filter((r) => r._attemptAt) // faqat vaqti aniqlanganlar
      .sort((a, b) => a._attemptAt - b._attemptAt);

    if (items.length === 0) {
      alert("Natijalarda to‘g‘ri date topilmadi (kutilgan format: DD/MM/YYYY, HH:mm:ss yoki ISO).");
      return;
    }

    // --- sessionlarga bo'lish: 90 minut (1.5 soat) oraliq ---
    const GAP = 90 * 60 * 1000;
    const sessions = [];
    let current = [];

    for (let i = 0; i < items.length; i++) {
      const cur = items[i];
      if (current.length === 0) {
        current.push(cur);
        continue;
      }
      const prev = current[current.length - 1];
      const diff = cur._attemptAt - prev._attemptAt;
      if (diff > GAP) {
        sessions.push(current);
        current = [cur];
      } else {
        current.push(cur);
      }
    }
    if (current.length) sessions.push(current);

    // --- PDF tuzish ---
    const doc = new jsPDF();

    sessions.forEach((group, idx) => {
      if (idx !== 0) doc.addPage();

      // Header
      doc.setFontSize(16);
      doc.setTextColor(40, 60, 120);
      doc.text("📊 Foydalanuvchi Natijalari", 105, 15, { align: "center" });

      const first = group[0]._attemptAt;
      const last = group[group.length - 1]._attemptAt;

      const dateLabel = first.toLocaleDateString("uz-UZ", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      const timeWindow = `${first.toLocaleTimeString("uz-UZ", {
        hour: "2-digit",
        minute: "2-digit",
      })} – ${last.toLocaleTimeString("uz-UZ", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;

      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`📅 Sana: ${dateLabel}   🕒 Oralig'i: ${timeWindow}`, 14, 25);

      // Jadval: foydalanuvchi natijalari
      autoTable.default(doc, {
        startY: 35,
        head: [["Foydalanuvchi", "To‘g‘ri", "Jami", "Foiz", "Vaqt"]],
        body: group.map((r) => [
          r.username ?? "",
          String(r.correctAnswers ?? ""),
          String(r.totalQuestions ?? ""),
          r.scorePercentage != null ? `${r.scorePercentage}%` : "",
          r._attemptAt.toLocaleTimeString("uz-UZ", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
        ]),
        theme: "striped",
        styles: { fontSize: 10, halign: "center", cellPadding: 3 },
        headStyles: { fillColor: [40, 60, 120], textColor: 255 },
        columnStyles: { 0: { halign: "left" } },
        margin: { left: 14, right: 14 },
        tableWidth: "auto",
      });
    });

    // Footer: sahifa raqamlari
    const pageCount = doc.internal.getNumberOfPages();
    for (let p = 1; p <= pageCount; p++) {
      doc.setPage(p);
      doc.setFontSize(10);
      doc.setTextColor(120);
      doc.text(`Sahifa ${p} / ${pageCount}`, 200, 290, { align: "right" });
    }

    doc.save("foydalanuvchi_natijalari_guruhlangan.pdf");
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 flex items-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
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
                  <th className="px-4 py-2 text-gray-500 uppercase">Sana</th>
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
                    <td className="px-4 py-3">{result.date}</td>
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


