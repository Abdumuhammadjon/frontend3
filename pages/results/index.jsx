// frontend/pages/GroupedQuestions.jsx
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import font from "@/fonts/NotoSans-Regular.js"; // Base64 font string import
import { Menu, Home, Users, BarChart, Settings, LogOut, Trash2 } from "lucide-react";

const GroupedQuestions = ({ subjectId }) => {
  const [groupedQuestions, setGroupedQuestions] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const contentRef = useRef(null);

  const router = useRouter();

  // Matnni tozalash (null/undefined uchun ham)
  const sanitizeText = (text) => {
    if (!text) return "";
    return text.replace(/'/g, "ʼ").replace(/"/g, "”").replace(/`/g, "´");
  };

  // Boshlang‘ich yuklash
  useEffect(() => {
    const storedSubjectId = typeof window !== "undefined" ? localStorage.getItem("subjectId") : null;
    const idToUse = subjectId || storedSubjectId;

    if (!idToUse) {
      router.push("/Login");
    } else {
      setIsLoggedIn(true);
      fetchQuestions(idToUse);
    }
  }, [subjectId]);

  // Scrollni tepasiga qaytarish
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [groupedQuestions, selectedDate]);

  // Savollarni olish
  const fetchQuestions = async (idToUse) => {
    setLoading(true);
    try {
      const response = await axios.get(`https://backed1.onrender.com/api/subject/${idToUse}`, {
        headers: { "Content-Type": "application/json" },
      });
      const data = response.data;

      const grouped = data.reduce((acc, question) => {
        const date = new Date(question.created_at).toISOString().split("T")[0];
        if (!acc[date]) acc[date] = [];
        acc[date].push(question);
        return acc;
      }, {});

      setGroupedQuestions(grouped);
      setError(null);
    } catch (err) {
      setError(
        (err.response && err.response.data && err.response.data.error) || "Savollarni yuklashda xatolik"
      );
    } finally {
      setLoading(false);
    }
  };

  // Savolni o‘chirish
  const handleDeleteQuestion = async (questionId, date) => {
    if (!window.confirm("Bu savolni o'chirishni xohlaysizmi?")) return;

    setLoading(true);
    try {
      await axios.delete(`https://backed1.onrender.com/api/question/${questionId}`, {
        headers: { "Content-Type": "application/json" },
      });

      setGroupedQuestions((prev) => {
        const updated = { ...prev };
        updated[date] = updated[date].filter((q) => q.id !== questionId);
        if (updated[date].length === 0) delete updated[date];
        return updated;
      });
      setError(null);
    } catch (err) {
      setError(
        (err.response && err.response.data && err.response.data.error) || "Savolni o'chirishda xatolik"
      );
    } finally {
      setLoading(false);
    }
  };

  // Sahifalararo o‘tish
  const handleSubjectClick = () => router.push("/questions");
  const handleResultClick = () => router.push("/results");
  const handleUserResultsClick = () => router.push("/UserResults");

  // Chiqish
  const handleLogout = () => {
    document.cookie.split(";").forEach((cookie) => {
      const name = cookie.split("=")[0].trim();
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    });

    localStorage.clear();
    sessionStorage.clear();
    setIsLoggedIn(false);
    router.push("/Login");
  };

  // Sanani formatlash
  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString("uz-UZ", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  // Font qo'shish
  const addCustomFont = (doc) => {
    doc.addFileToVFS("NotoSans.ttf", font);
    doc.addFont("NotoSans.ttf", "NotoSans", "normal");
    doc.setFont("NotoSans");
  };

  // PDF yuklab olish
  const handleDownloadPDFByDate = (date, questions) => {
    if (!questions || questions.length === 0) return;

    const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 15;
    let y = margin + 10;

    // Font ulash
    addCustomFont(doc);

    // Sarlavha
    doc.setFontSize(10);
    doc.setTextColor(40, 60, 120);
    doc.text(`📘 Savollar to‘plami (${date})`, pageWidth / 2, margin, { align: "center" });
    y += 10;

    // Har bir savolni yozish
    questions.forEach((q, index) => {
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);

      const questionText = sanitizeText(`${index + 1}. ${q.question_text}`);
      const splitText = doc.splitTextToSize(questionText, pageWidth - margin * 2);

      const neededHeight = splitText.length * 6;

      if (y + neededHeight > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }

      doc.text(splitText, margin, y);
      y += neededHeight + 3;

      // Variantlarni jadvalda chiqarish
      const rows = q.options.map((opt) => [
        sanitizeText(opt.option_text) + (opt.is_correct ? "  ✓" : ""),
      ]);

      autoTable(doc, {
        startY: y,
        body: rows,
        styles: { font: "NotoSans", fontSize: 10 },
        theme: "grid",
        margin: { left: margin, right: margin },
        tableWidth: "wrap",
      });

      if (doc.lastAutoTable && doc.lastAutoTable.finalY) {
        y = doc.lastAutoTable.finalY + 8;
      }
    });

    // Sahifa raqamlari
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Sahifa ${i} / ${pageCount}`, pageWidth - 15, pageHeight - 5, {
        align: "right",
      });
    }

    doc.save(`savollar-${date}.pdf`);
  };

  return (
    <div className="flex flex-col h-auto bg-gray-100">
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[9999]">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-md h-16 flex items-center px-6 fixed w-full z-50 top-0">
        <h1 className="text-2xl font-bold text-gray-800">Savollar Bazasi</h1>
      </div>

      {/* Main content */}
      <div className="flex flex-1 pt-16">
        {/* Sidebar */}
        <div
          className={`bg-gray-900 text-white fixed h-[calc(100vh-4rem)] p-5 top-16 transition-all duration-300 ${
            isSidebarOpen ? "w-64" : "w-20"
          } z-40 overflow-y-auto`}
        >
          <button
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

        {/* Content */}
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
            <div className="max-w-4xl mx-auto space-y-6 h-[calc(100vh-16rem)] overflow-y-auto -webkit-overflow-scrolling-touch">
              {Object.keys(groupedQuestions)
                .sort()
                .map((date) => (
                  <div key={date} className="mb-4 w-full">
                    <button
                      onClick={() =>
                        setSelectedDate(selectedDate === date ? null : date)
                      }
                      className="w-full bg-blue-500 text-white px-6 py-3 rounded-lg shadow-md hover:bg-blue-600 transition-colors duration-200"
                    >
                      {formatDate(date)}
                    </button>
                    {selectedDate === date && (
                      <div className="mt-2 p-4 bg-white rounded-lg shadow-md">
                        <button
                          onClick={() =>
                            handleDownloadPDFByDate(date, groupedQuestions[date])
                          }
                          className="mb-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-green-600 transition-colors duration-200"
                        >
                          📄 Ushbu to‘plamni PDF’da yuklab olish
                        </button>

                        {groupedQuestions[date].map((question, index) => (
                          <div
                            key={index}
                            className="mb-4 border-b pb-2 last:border-b-0"
                          >
                            <div className="flex justify-between items-center mb-2">
                              <p className="text-gray-600 font-medium">Savol:</p>
                              <button
                                onClick={() =>
                                  handleDeleteQuestion(question.id, date)
                                }
                                className="text-red-600 hover:text-red-800 transition-colors duration-200"
                                title="Savolni o'chirish"
                              >
                                <Trash2 size={20} />
                              </button>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg">
                              <p className="font-bold text-gray-900">
                                {sanitizeText(question.question_text)}
                              </p>
                              <ul className="mt-2 space-y-2">
                                {question.options.map((option) => (
                                  <li
                                    key={option.id}
                                    className={`p-2 rounded-lg ${
                                      option.is_correct
                                        ? "bg-green-100 text-green-800"
                                        : "bg-gray-200 text-gray-800"
                                    }`}
                                  >
                                    {sanitizeText(option.option_text)}
                                    {option.is_correct && (
                                      <span className="ml-2 text-green-600 font-medium">
                                        ✓
                                      </span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        ))}
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
