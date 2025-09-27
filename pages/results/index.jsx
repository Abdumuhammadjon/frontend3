// frontend/pages/GroupedQuestions.jsx
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Menu, Home, Users, BarChart, Settings, LogOut, Trash2 } from "lucide-react";
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import download from 'downloadjs';


const GroupedQuestions = ({ subjectId }) => {
  const [groupedQuestions, setGroupedQuestions] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const contentRef = useRef(null);

  const router = useRouter();

  // Matnni tozalash
  const sanitizeText = (text) => {
    if (!text) return text;
    return text
      .replace(/'/g, "ʼ")
      .replace(/"/g, "”")
      .replace(/`/g, "´");
  };

  // Boshlang‘ich yuklash
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
      const response = await axios.get(
        `https://backed1.onrender.com/api/subject/${idToUse}`,
        { headers: { "Content-Type": "application/json" } }
      );

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
        (err.response && err.response.data && err.response.data.error) ||
          "Savollarni yuklashda xatolik"
      );
    } finally {
      setLoading(false);
    }
  };

  // Savolni o‘chirish
  const handleDeleteQuestion = async (questionId, date) => {
    if (!window.confirm("Bu savolni o'chirishni xohlaysizmi?")) return;

    try {
      setLoading(true);
      await axios.delete(
        `https://backed1.onrender.com/api/question/${questionId}`,
        { headers: { "Content-Type": "application/json" } }
      );

      setGroupedQuestions((prev) => {
        const updated = { ...prev };
        updated[date] = updated[date].filter((q) => q.id !== questionId);
        if (updated[date].length === 0) delete updated[date];
        return updated;
      });
      setError(null);
    } catch (err) {
      setError(
        (err.response && err.response.data && err.response.data.error) ||
          "Savolni o'chirishda xatolik"
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
    document.cookie.split(";").forEach(function (cookie) {
      const name = cookie.split("=")[0].trim();
      document.cookie =
        name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
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

const handleDownloadPDFByDate = async (date, questions) => {
  if (!questions || questions.length === 0) return;

  const fontUrl = '/fonts/NotoSans-Regular.ttf';
  const fontBytes = await fetch(fontUrl).then(res => res.arrayBuffer());

  const pdfDoc = await PDFDocument.create();
  const notoFont = await pdfDoc.embedFont(fontBytes);
  let page = pdfDoc.addPage([842, 595]); // A4 landscape
  const { width, height } = page.getSize();

  const fontSize = 11;
  const lineHeight = 18;
  const margin = 40;
  let y = height - margin;

  const wrapText = (text, maxWidth) => {
    const words = text.split(" ");
    const lines = [];
    let line = "";
    for (let word of words) {
      const testLine = line + word + " ";
      const testWidth = notoFont.widthOfTextAtSize(testLine, fontSize);
      if (testWidth > maxWidth) {
        lines.push(line.trim());
        line = word + " ";
      } else {
        line = testLine;
      }
    }
    lines.push(line.trim());
    return lines;
  };

  // Header
  const title = `📘 Savollar to‘plami (${date})`;
  page.drawText(title, {
    x: width / 2 - notoFont.widthOfTextAtSize(title, fontSize + 2) / 2,
    y,
    size: fontSize + 2,
    font: notoFont,
    color: rgb(0.1, 0.1, 0.6),
  });
  y -= lineHeight;

  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    const questionText = sanitizeText(`${i + 1}. ${question.question_text}`);
    const wrapped = wrapText(questionText, width - margin * 2);

    if (y - wrapped.length * lineHeight < margin) {
      page = pdfDoc.addPage([842, 595]);
      y = height - margin;
    }

    wrapped.forEach((line) => {
      page.drawText(line, {
        x: margin,
        y,
        size: fontSize,
        font: notoFont,
        color: rgb(0, 0, 0),
      });
      y -= lineHeight;
    });

    question.options.forEach((opt, idx) => {
      const optText = sanitizeText(opt.option_text + (opt.is_correct ? " ✓" : ""));
      const wrappedOpt = wrapText(`${String.fromCharCode(65 + idx)}) ${optText}`, width - margin * 2);

      wrappedOpt.forEach((line) => {
        page.drawText(line, {
          x: margin + 10,
          y,
          size: fontSize - 1,
          font: notoFont,
          color: opt.is_correct ? rgb(0, 0.5, 0) : rgb(0.2, 0.2, 0.2),
        });
        y -= lineHeight;
      });
    });

    y -= 10;
  }

  const pdfBytes = await pdfDoc.save();
  download(pdfBytes, `savollar-${date}.pdf`, "application/pdf");
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
                      className="w-full text-left bg-blue-600 hover:bg-blue-700 rounded-md p-3 font-semibold text-white"
                    >
                      {formatDate(date)}
                    </button>

                    {selectedDate === date && (
                      <div className="p-4 bg-white rounded-md shadow-md mt-3 overflow-auto max-h-96">
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
                              className="mt-2 text-red-600 hover:underline"
                            >
                              <Trash2 size={16} /> Savolni o'chirish
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() =>
                            handleDownloadPDFByDate(date, groupedQuestions[date])
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
