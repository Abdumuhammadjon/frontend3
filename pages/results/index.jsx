import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import { Menu, Home, Users, BarChart, Settings, LogOut, Trash2 } from 'lucide-react';

const GroupedQuestions = ({ subjectId }) => {
  const [groupedQuestions, setGroupedQuestions] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const contentRef = useRef(null);

  const router = useRouter();

  // 🔹 Savollarni olish
  useEffect(() => {
    const storedSubjectId = localStorage.getItem("subjectId");
    const idToUse = subjectId || storedSubjectId;

    if (!idToUse) {
      router.push('/Login');
    } else {
      setIsLoggedIn(true);
      fetchQuestions(idToUse);
    }
  }, [subjectId, router]);

  // 🔹 API dan savollarni olish
  const fetchQuestions = async (idToUse) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `https://backed1.onrender.com/api/subject/${idToUse}`,
        { headers: { 'Content-Type': 'application/json' } }
      );

      const datas = response.data || [];

      const grouped = datas.reduce((acc, question) => {
        const date = new Date(question.created_at).toISOString().split('T')[0];
        if (!acc[date]) acc[date] = [];
        acc[date].push(question);
        return acc;
      }, {});

      setGroupedQuestions(grouped);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || "Savollarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 PDF yaratish funksiyasi
  async function handleDownloadPDFByDate(date) {
    const questions = groupedQuestions[date];
    if (!questions || questions.length === 0) return;

    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    // ✅ Fontni to‘g‘ri yuklash (public papkadan)
    const fontBytes = await fetch("/NotoSans-Regular.ttf").then(res => res.arrayBuffer());
    const customFont = await pdfDoc.embedFont(fontBytes);

    const page = pdfDoc.addPage([842, 595]); // A4 landscape
    const { height } = page.getSize();
    let y = height - 50;

    // Sarlavha
    page.drawText("Savollar ro'yxati", {
      x: 50,
      y,
      size: 18,
      font: customFont,
      color: rgb(0, 0, 0),
    });

    y -= 40;

    // Savollarni yozish
    questions.forEach((q, i) => {
      const safeText = String(q.question_text || "").replace(/[^\x00-\x7F]/g, ""); // emoji -> bo‘sh
      page.drawText(`${i + 1}. ${safeText}`, {
        x: 50,
        y,
        size: 14,
        font: customFont,
        color: rgb(0, 0, 0),
      });
      y -= 25;

      // Variantlar
      q.options?.forEach((opt, idx) => {
        page.drawText(`   ${String.fromCharCode(97 + idx)}) ${opt.option_text}${opt.is_correct ? " ✓" : ""}`, {
          x: 70,
          y,
          size: 12,
          font: customFont,
          color: opt.is_correct ? rgb(0, 0.5, 0) : rgb(0.2, 0.2, 0.2),
        });
        y -= 20;
      });

      y -= 10;
    });

    // PDF saqlash
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `savollar-${date}.pdf`;
    link.click();
  }

  // 🔹 Savolni o‘chirish
  const handleDeleteQuestion = async (questionId, date) => {
    if (!window.confirm("Bu savolni o'chirishni xohlaysizmi?")) return;

    try {
      setLoading(true);
      await axios.delete(`https://backed1.onrender.com/api/question/${questionId}`, {
        headers: { 'Content-Type': 'application/json' },
      });

      setGroupedQuestions((prev) => {
        const updated = { ...prev };
        updated[date] = updated[date].filter((q) => q.id !== questionId);
        if (updated[date].length === 0) delete updated[date];
        return updated;
      });
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || "Savolni o'chirishda xatolik");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-auto bg-gray-100">
      {error && (
        <div className="text-center p-4 text-red-600 bg-red-100 rounded-lg shadow-md">
          Xatolik: {error}
        </div>
      )}

      <div className="flex-1 p-6">
        {Object.keys(groupedQuestions || {}).length === 0 ? (
          <p>Savollar yo‘q</p>
        ) : (
          Object.keys(groupedQuestions).sort().map((date) => (
            <div key={date} className="mb-4 w-full">
              <button
                onClick={() => setSelectedDate(selectedDate === date ? null : date)}
                className="w-full bg-blue-500 text-white px-6 py-3 rounded-lg shadow-md hover:bg-blue-600 transition-colors duration-200"
              >
                {date}
              </button>
              {selectedDate === date && (
                <div className="mt-2 p-4 bg-white rounded-lg shadow-md">
                  <button
                    onClick={() => handleDownloadPDFByDate(date)}
                    className="mb-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-green-600 transition-colors duration-200"
                  >
                    Ushbu to‘plamni PDF’da yuklab olish
                  </button>

                  {groupedQuestions[date].map((question) => (
                    <div key={question.id} className="mb-4 border-b pb-2 last:border-b-0">
                      <p className="font-bold">{question.question_text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default GroupedQuestions;
