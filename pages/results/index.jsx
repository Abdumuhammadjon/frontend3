 // Bu fayl: components/GroupedQuestions.jsx (yoki pages/grouped-questions.js)
// jsPDF bilan client-side PDF yaratish. Custom font uchun fontconverter orqali tayyorlangan js faylini qo'shing.
// 1. https://rawgit.com/MrRio/jsPDF/master/fontconverter/fontconverter.html saytiga kiring, NotoSans-Regular.ttf ni yuklang, "normal" ni tanlang.
// 2. Chiqqan kodni public/fonts/NotoSans-Regular.js fayliga saqlang (masalan):
// var callAddFont = function () {
//   this.addFileToVFS('NotoSans-Regular-normal.ttf', 'base64_string_here');
//   this.addFont('NotoSans-Regular-normal.ttf', 'NotoSans-Regular', 'normal');
// };
// jsPDF.callAddFont = callAddFont;  // jsPDF ni import qilgan joyda bu funksiyani chaqiring.
// 3. Komponentda import qiling: import './fonts/NotoSans-Regular.js';  // public emas, src/fonts papkasida bo'lsa.

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import jsPDF from 'jspdf';

// Custom font js faylini import qiling (loyihangizda yarating)
import '../fonts/NotoSans-Regular.js';  // Yo'lni to'g'rilan

const GroupedQuestions = ({ subjectId }) => {
  const [groupedQuestions, setGroupedQuestions] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  // Savollarni olish
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

  // API dan savollarni olish
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

  // PDF yuklash funksiyasi (client-side jspdf bilan, custom font bilan)
  async function handleDownloadPDFByDate(date) {
    const questions = groupedQuestions[date];
    if (!questions || questions.length === 0) return;

    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'pt',
        format: 'a4'
      });

      // Custom fontni qo'llash (fontconverter orqali tayyorlangan)
      doc.setFont('NotoSans-Regular');  // Font nomi fontconverter'da ko'rsatilganicha

      let y = 50;

      // Sarlavha
      doc.setFontSize(18);
      doc.text("Savollar ro'yxati", 50, y);
      y += 40;

      // Savollarni yozish
      questions.forEach((q, i) => {
        const questionText = `${i + 1}. ${q.question_text || ''}`;
        doc.setFontSize(14);
        doc.text(questionText, 50, y);
        y += 25;

        // Variantlar
        if (q.options) {
          q.options.forEach((opt, idx) => {
            const optionText = `   ${String.fromCharCode(97 + idx)}) ${opt.option_text}${opt.is_correct ? " ✓" : ""}`;
            doc.setFontSize(12);
            // Ranglarni to'g'ri berish: sonlar, string emas
            if (opt.is_correct) {
              doc.setTextColor(0, 128, 0);  // Yashil
            } else {
              doc.setTextColor(51, 51, 51);  // Kulrang
            }
            doc.text(optionText, 70, y);
            y += 20;
          });
        }

        y += 10;

        // Agar sahifa to'lsa, yangi sahifa qo'shish
        if (y > doc.internal.pageSize.height - 50) {
          doc.addPage();
          y = 50;
        }
      });

      // Rangni orqaga qaytarish (ixtiyoriy)
      doc.setTextColor(0, 0, 0);

      // PDF saqlash
      doc.save(`savollar-${date}.pdf`);
    } catch (err) {
      setError("PDF yaratishda xatolik: " + err.message);
    }
  }

  // Savolni o'chirish
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
    <div className="flex flex-col min-h-screen bg-gray-100">
      {error && (
        <div className="text-center p-4 text-red-600 bg-red-100 rounded-lg shadow-md">
          Xatolik: {error}
        </div>
      )}

      {loading && <p className="text-center p-4">Yuklanmoqda...</p>}

      <div className="flex-1 p-6">
        {Object.keys(groupedQuestions).length === 0 ? (
          <p>Savollar yo‘q</p>
        ) : (
          Object.keys(groupedQuestions).sort().reverse().map((date) => (  // Eng yangisini yuqoriga
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
                    <div key={question.id} className="mb-4 border-b pb-2 last:border-b-0 flex justify-between items-start">
                      <p className="font-bold flex-1">{question.question_text}</p>
                      <button
                        onClick={() => handleDeleteQuestion(question.id, date)}
                        className="ml-4 text-red-500 hover:text-red-700"
                      >
                        O'chirish
                      </button>
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