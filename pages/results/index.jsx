// frontend/pages/GroupedQuestions.jsx

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Menu,
  Home,
  Users,
  BarChart,
  Settings,
  LogOut,
  Trash2,
} from "lucide-react";

const GroupedQuestions = ({ subjectId }) => {
  const [groupedQuestions, setGroupedQuestions] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const contentRef = useRef(null);
  const router = useRouter();

  // === UTILITIES ===

  const sanitizeText = (text) =>
    text
      ?.replace(/'/g, "ʼ")
      .replace(/"/g, "”")
      .replace(/`/g, "´") || "";

  const splitTextByWords = (text, maxWords = 6) => {
    const words = text.split(" ");
    const lines = [];
    for (let i = 0; i < words.length; i += maxWords) {
      lines.push(words.slice(i, i + maxWords).join(" "));
    }
    return lines;
  };

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString("uz-UZ", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const groupByDate = (data) =>
    data.reduce((acc, question) => {
      const date = new Date(question.created_at).toISOString().split("T")[0];
      acc[date] = acc[date] || [];
      acc[date].push(question);
      return acc;
    }, {});

const generateQuestionPDF = (date, questions) => {
  if (!questions?.length) return;

  const doc = new jsPDF({
    unit: "mm",
    format: "a4",
    orientation: "portrait",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let y = margin;

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(33, 33, 33);
  doc.text(`📘 Savollar to‘plami (${date})`, pageWidth / 2, y, {
    align: "center",
  });
  y += 10;

  questions.forEach((q, index) => {
    const questionLines = splitTextByWords(
      sanitizeText(`${index + 1}. ${q.question_text}`),
      10
    );
    const lineHeight = 7;
    const questionHeight = questionLines.length * lineHeight + 5;

    // Yangi sahifa kerak bo‘lsa
    if (y + questionHeight + 30 > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }

    // 🔹 Savol matni
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    questionLines.forEach((line) => {
      doc.text(line, margin, y);
      y += lineHeight;
    });

    y += 2;

    // 🔸 Variantlar (ichkariga surilgan, ajratilgan)
    q.options.forEach((opt, idx) => {
      const prefix = String.fromCharCode(65 + idx); // A, B, C...
      const isCorrect = opt.is_correct ? " ✓" : "";
      const optionText = `${prefix}) ${sanitizeText(opt.option_text)}${isCorrect}`;

      doc.setFont("helvetica", opt.is_correct ? "bold" : "normal");
      doc.setFontSize(11);
      doc.setTextColor(opt.is_correct ? "green" : "#333");

      doc.text(optionText, margin + 8, y);
      y += 6;
    });

    // 🔻 Savollarni ajratish uchun chiziq yoki bo‘sh joy
    y += 4;
    doc.setDrawColor(180);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y); // chiziq
    y += 6;
  });

  // Footer: sahifa raqami
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Sahifa ${i} / ${pageCount}`, pageWidth - margin, pageHeight - 10, {
      align: "right",
    });
  }

  doc.save(`savollar-${date}.pdf`);
};


  // === LIFECYCLE ===

  useEffect(() => {
    const storedSubjectId =
      typeof window !== "undefined" ? localStorage.getItem("subjectId") : null;
    const idToUse = subjectId || storedSubjectId;

    if (!idToUse) {
      router.push("/Login");
    } else {
      setIsLoggedIn(true);
      fetchQuestions(idToUse);
    }
  }, [subjectId]);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [groupedQuestions, selectedDate]);

  // === API ===

  const fetchQuestions = async (idToUse) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `https://backed1.onrender.com/api/subject/${idToUse}`
      );
      setGroupedQuestions(groupByDate(response.data));
      setError(null);
    } catch (err) {
      setError("Savollarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuestion = async (questionId, date) => {
    if (!window.confirm("Bu savolni o'chirishni xohlaysizmi?")) return;
    setLoading(true);
    try {
      await axios.delete(
        `https://backed1.onrender.com/api/question/${questionId}`
      );
      setGroupedQuestions((prev) => {
        const updated = { ...prev };
        updated[date] = updated[date].filter((q) => q.id !== questionId);
        if (updated[date].length === 0) delete updated[date];
        return updated;
      });
    } catch (err) {
      setError("Savolni o'chirishda xatolik");
    } finally {
      setLoading(false);
    }
  };

  // === NAVIGATION ===

  const handleSubjectClick = () => router.push("/questions");
  const handleResultClick = () => router.push("/results");
  const handleUserResultsClick = () => router.push("/UserResults");

  const handleLogout = () => {
    document.cookie.split(";").forEach((cookie) => {
      const name = cookie.split("=")[0].trim();
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    });
    localStorage.clear();
    sessionStorage.clear();
    setIsLoggedIn(false);
    router.push("/Login");
  };

  // === UI ===

  return (
    <div className="flex flex-col h-auto bg-gray-100">
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[9999]">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* HEADER */}
      <div className="bg-white shadow-md h-16 flex items-center px-6 fixed w-full z-50 top-0">
        <h1 className="text-2xl font-bold text-gray-800">Savollar Bazasi</h1>
      </div>

      <div className="flex flex-1 pt-16">
        {/* SIDEBAR */}
        <div
          className={`bg-gray-900 text-white fixed h-[calc(100vh-4rem)] p-5 top-16 transition-all duration-300 ${
            isSidebarOpen ? "w-64" : "w-20"
          } z-40 overflow-y-auto`}
        >
          <button
            type="button"
            aria-label="Menyuni ochish"
            className="text-white mb-6"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <Menu size={24} />
          </button>
          <ul className="space-y-4">
            <li
              onClick={handleSubjectClick}
              className="flex items-center gap-3 hover:bg-gray-700 p-2 rounded-lg cursor-pointer"
            >
              <Home size={24} /> {isSidebarOpen && "Bosh sahifa"}
            </li>
            <li
              onClick={handleResultClick}
              className="flex items-center gap-3 hover:bg-gray-700 p-2 rounded-lg cursor-pointer"
            >
              <Users size={24} /> {isSidebarOpen && "Foydalanuvchilar"}
            </li>
            <li
              onClick={handleUserResultsClick}
              className="flex items-center gap-3 hover:bg-gray-700 p-2 rounded-lg cursor-pointer"
            >
              <BarChart size={24} /> {isSidebarOpen && "Hisobotlar"}
            </li>
            <li className="flex items-center gap-3 hover:bg-gray-700 p-2 rounded-lg cursor-pointer">
              <Settings size={24} /> {isSidebarOpen && "Sozlamalar"}
            </li>
            <br />
            <br />
            {isLoggedIn && (
              <li
                onClick={handleLogout}
                className="flex items-center gap-3 hover:bg-gray-700 p-2 rounded-lg cursor-pointer"
              >
                <LogOut size={24} /> {isSidebarOpen && "Chiqish"}
              </li>
            )}
          </ul>
        </div>

        {/* CONTENT */}
        <div
          ref={contentRef}
          className={`flex-1 p-6 transition-all duration-300 ${
            isSidebarOpen ? "ml-64" : "ml-20"
          } overflow-y-auto h-[calc(100vh-4rem)]`}
        >
          {error ? (
            <div className="text-center p-4 text-red-600 bg-red-100 rounded-lg shadow-md">
              Xatolik: {error}
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-6 overflow-y-auto">
              {Object.keys(groupedQuestions)
                .sort()
                .map((date) => (
                  <div key={date} className="mb-4 w-full">
                    <button
                      onClick={() =>
                        setSelectedDate(selectedDate === date ? null : date)
                      }
                      className="w-full text-left bg-blue-600 hover:bg-blue-700 rounded-md p-3 font-semibold text-white"
                    >
                      {formatDate(date)}
                    </button>

                    {selectedDate === date && (
                      <div className="p-4 bg-white rounded-md shadow-md mt-3 max-h-[60vh] overflow-auto">
                        {groupedQuestions[date].map((question) => (
                          <div
                            key={question.id}
                            className="mb-4 border-b border-gray-300 pb-2"
                          >
                            <p className="font-semibold">
                              {sanitizeText(question.question_text)}
                            </p>
                            <ul className="list-disc ml-5 mt-1">
                              {question.options.map((option, idx) => (
                                <li
                                  key={idx}
                                  className={`${
                                    option.is_correct ? "text-green-600" : ""
                                  }`}
                                >
                                  {sanitizeText(option.option_text)}
                                </li>
                              ))}
                            </ul>
                            <button
                              onClick={() =>
                                handleDeleteQuestion(question.id, date)
                              }
                              className="mt-2 text-red-600 hover:underline flex gap-1 items-center"
                            >
                              <Trash2 size={16} /> Savolni o'chirish
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() =>
                            generateQuestionPDF(date, groupedQuestions[date])
                          }
                          className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                        >
                          PDF yuklab olish
                        </button>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupedQuestions;
