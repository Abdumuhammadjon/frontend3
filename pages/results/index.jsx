import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import jsPDF from 'jspdf';
import { loadNotoSansFont } from '../../NotoSansFont';

const GroupedQuestions = ({ subjectId }) => {
  const [groupedQuestions, setGroupedQuestions] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

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

  async function handleDownloadPDFByDate(date) {
    const questions = groupedQuestions[date];
    if (!questions || questions.length === 0) return;

    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'pt',
        format: 'a4'
      });

      // Fontni yuklash
      loadNotoSansFont(doc);
      doc.setFont('NotoSans-Regular', 'normal');

      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 40;
      const maxWidth = pageWidth - 2 * margin;
      let y = 40;

      // Sarlavha
      doc.setFontSize(18);
      const titleLines = doc.splitTextToSize("Savollar ro'yxati", maxWidth);
      titleLines.forEach(line => {
        if (y > doc.internal.pageSize.height - 40) {
          doc.addPage();
          y = 40;
        }
        doc.text(line, margin, y);
        y += 20;
      });
      y += 15;

      // Savollarni yozish
      questions.forEach((q, i) => {
        const questionText = `${i + 1}. ${q.question_text || ''}`;
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        const questionLines = doc.splitTextToSize(questionText, maxWidth);
        questionLines.forEach(line => {
          if (y > doc.internal.pageSize.height - 40) {
            doc.addPage();
            y = 40;
          }
          doc.text(line, margin, y);
          y += 16;
        });
        y += 10;

        if (q.options) {
          q.options.forEach((opt, idx) => {
            const optionText = `${String.fromCharCode(97 + idx)}) ${opt.option_text}${opt.is_correct ? " ✓" : ""}`;
            doc.setFontSize(12);
            if (opt.is_correct) {
              doc.setTextColor(0, 128, 0);
            } else {
              doc.setTextColor(50, 50, 50);
            }
            const optionLines = doc.splitTextToSize(optionText, maxWidth - 20);
            optionLines.forEach(line => {
              if (y > doc.internal.pageSize.height - 40) {
                doc.addPage();
                y = 40;
              }
              doc.text(line, margin + 20, y);
              y += 14;
            });
            y += 5;
          });
        }

        y += 10;

        if (y > doc.internal.pageSize.height - 40) {
          doc.addPage();
          y = 40;
        }
      });

      doc.setTextColor(0, 0, 0);
      doc.save(`savollar-${date}.pdf`);
    } catch (err) {
      setError("PDF yaratishda xatolik: " + err.message);
    }
  }

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

      {/* === LOADER === */}
      {loading && (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm z-50">
          <div className="w-16 h-16 border-4 border-t-transparent border-blue-500 rounded-full animate-spin"></div>
          <p className="text-white text-lg mt-4 font-semibold">Yuklanmoqda...</p>
        </div>
      )}
      {/* === /LOADER === */}

      <div className="flex-1 p-6">
        <div className="p-6">
  <button
    onClick={() => router.back()}
    className="group inline-flex items-center gap-2 px-5 py-2.5 
               bg-gradient-to-r from-blue-500 to-indigo-600 
               text-white font-medium rounded-xl 
               shadow-md hover:shadow-xl 
               hover:from-indigo-600 hover:to-blue-500
               active:scale-95 
               transition-all duration-300 ease-in-out"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-1"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
    Orqaga qaytish
  </button>
</div>
        {Object.keys(groupedQuestions).length === 0 ? (
          <p>Savollar yo‘q</p>
        ) : (
          Object.keys(groupedQuestions).sort().reverse().map((date) => (
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
                    <div key={question.id} className="mb-6 border-b pb-4 last:border-b-0">
                      <p className="font-bold mb-2">{question.question_text}</p>
                      {question.options && question.options.length > 0 && (
                        <ul className="list-none pl-4">
                          {question.options.map((opt, idx) => (
                            <li
                              key={idx}
                              className={`mb-1 ${opt.is_correct ? 'text-green-600' : 'text-gray-700'}`}
                            >
                              {`${String.fromCharCode(97 + idx)}) ${opt.option_text}`}
                              {opt.is_correct && ' +'}
                            </li>
                          ))}
                        </ul>
                      )}
                      <button
                        onClick={() => handleDeleteQuestion(question.id, date)}
                        className="ml-4 mt-2 text-red-500 hover:text-red-700"
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
