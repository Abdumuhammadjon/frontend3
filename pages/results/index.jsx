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

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [groupedQuestions, selectedDate]);

  const fetchQuestions = async (idToUse) => {
    setLoading(true);
    try {
      const response = await axios.get(`https://backed1.onrender.com/api/subject/${idToUse}`, {
        headers: { 'Content-Type': 'application/json' },
      });
      const data = response.data;

      const grouped = data.reduce((acc, question) => {
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

  const handleDeleteQuestion = async (questionId, date) => {
    if (!window.confirm("Bu savolni o'chirishni xohlaysizmi?")) return;

    try {
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
    }
  };

  const handleSubjectClick = () => {
    router.push("/questions");
  };

  const handleResultClick = () => {
    router.push("/results");
  };

  const handleUserResultsClick = () => {
    router.push("/UserResults");
  };

  const handleLogout = () => {
    document.cookie.split(";").forEach(function(cookie) {
      const name = cookie.split("=")[0].trim();
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    });

    localStorage.clear();
    sessionStorage.clear();
    setIsLoggedIn(false);
    router.push('/Login');
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // ✅ To‘g‘rilangan PDF yuklash funksiyasi
  const handleDownloadPDFByDate = (date) => {
    const questions = groupedQuestions[date];
    if (!questions || questions.length === 0) return;

    Promise.all([
      import("jspdf"),
      import("jspdf-autotable")
    ]).then(([{ jsPDF }, autoTable]) => {
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const pageHeight = doc.internal.pageSize.height;
      const margin = 15;
      let y = margin + 10;

      // Sarlavha
      doc.setFontSize(18);
      doc.setTextColor(40, 60, 120);
      doc.text(`📘 Savollar to'plami (${formatDate(date)})`, 105, margin, { align: "center" });
      y += 10;

      questions.forEach((q, index) => {
        doc.setFontSize(13);
        doc.setTextColor(0, 0, 0);

        // Savol matni
        const questionText = `${index + 1}. ${q.question_text}`;
        const splitText = doc.splitTextToSize(questionText, 180);
        const neededHeight = splitText.length * 7;

        if (y + neededHeight > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }

        doc.text(splitText, margin, y);
        y += neededHeight + 3;

        // Variantlar
        const rows = q.options.map((opt) => [
          opt.option_text + (opt.is_correct ? "  ✓" : "")
        ]);

        autoTable.default(doc, {
          startY: y,
          body: rows,
          styles: { fontSize: 11, halign: "left" },
          theme: "grid",
          margin: { left: margin, right: margin },
          pageBreak: "auto",
          didDrawPage: (data) => {
            y = data.cursor.y;
          },
          didParseCell: (data) => {
            if (data.section === "body") {
              const r = data.row.index;
              if (q.options[r]?.is_correct) {
                data.cell.styles.fillColor = [220, 255, 220];
                data.cell.styles.textColor = [0, 100, 0];
              }
            }
          }
        });

        if (doc.lastAutoTable?.finalY) {
          y = doc.lastAutoTable.finalY + 10;
        }
      });

      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Sahifa ${i} / ${pageCount}`, 200, pageHeight - 5, { align: "right" });
      }

      doc.save(`savollar-${date}.pdf`);
    });
  };

  return (
    <div className="flex flex-col h-auto bg-gray-100">
      {/* Navbar */}
      <div className="bg-white shadow-md h-16 flex items-center px-6 fixed w-full z-50 top-0">
        <h1 className="text-2xl font-bold text-gray-800">Savollar Bazasi</h1>
      </div>

      <div className="flex flex-1 pt-16">
        {/* Sidebar */}
        <div className={`bg-gray-900 text-white fixed h-[calc(100vh-4rem)] p-5 top-16 transition-all duration-300 ${isSidebarOpen ? "w-64" : "w-20"} z-40 overflow-y-auto`}>
          <button className="text-white mb-6" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            <Menu size={24} />
          </button>
          <ul className="space-y-4">
            <li className="flex items-center gap-3 hover:bg-gray-700 p-2 rounded-lg cursor-pointer" onClick={handleSubjectClick}>
              <Home size={24} /> {isSidebarOpen && "Bosh sahifa"}
            </li>
            <li className="flex items-center gap-3 hover:bg-gray-700 p-2 rounded-lg cursor-pointer" onClick={handleResultClick}>
              <Users size={24} /> {isSidebarOpen && "Foydalanuvchilar"}
            </li>
            <li className="flex items-center gap-3 hover:bg-gray-700 p-2 rounded-lg cursor-pointer" onClick={handleUserResultsClick}>
              <BarChart size={24} /> {isSidebarOpen && "Hisobotlar"}
            </li>
            <li className="flex items-center gap-3 hover:bg-gray-700 p-2 rounded-lg cursor-pointer">
              <Settings size={24} /> {isSidebarOpen && "Sozlamalar"}
            </li>
            <br /><br />
            {isLoggedIn && (
              <li className="flex items-center gap-3 hover:bg-gray-700 p-2 rounded-lg cursor-pointer" onClick={handleLogout}>
                <LogOut size={24} /> {isSidebarOpen && "Chiqish"}
              </li>
            )}
          </ul>
        </div>

        {/* Main Content */}
        <div ref={contentRef} className={`flex-1 p-6 transition-all duration-300 ${isSidebarOpen ? "ml-64" : "ml-20"} overflow-y-auto h-[calc(100vh-4rem)]`}>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="text-center p-4 text-red-600 bg-red-100 rounded-lg shadow-md">
              Xatolik: {error}
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-6 h-[calc(100vh-16rem)] overflow-y-auto -webkit-overflow-scrolling-touch">
              {Object.keys(groupedQuestions).sort().map((date) => (
                <div key={date} className="mb-4 w-full">
                  <button
                    onClick={() => setSelectedDate(selectedDate === date ? null : date)}
                    className="w-full bg-blue-500 text-white px-6 py-3 rounded-lg shadow-md hover:bg-blue-600 transition-colors duration-200"
                  >
                    {formatDate(date)}
                  </button>
                  {selectedDate === date && (
                    <div className="mt-2 p-4 bg-white rounded-lg shadow-md">
                      <button
                        onClick={() => handleDownloadPDFByDate(date)}
                        className="mb-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-green-600 transition-colors duration-200"
                      >
                        📄 Ushbu to‘plamni PDF’da yuklab olish
                      </button>

                      {groupedQuestions[date].map((question, index) => (
                        <div key={index} className="mb-4 border-b pb-2 last:border-b-0">
                          <div className="flex justify-between items-center mb-2">
                            <p className="text-gray-600 font-medium">Savol:</p>
                            <button
                              onClick={() => handleDeleteQuestion(question.id, date)}
                              className="text-red-600 hover:text-red-800 transition-colors duration-200"
                              title="Savolni o'chirish"
                            >
                              <Trash2 size={20} />
                            </button>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="font-bold text-gray-900">{question.question_text}</p>
                            <ul className="mt-2 space-y-2">
                              {question.options.map((option) => (
                                <li
                                  key={option.id}
                                  className={`p-2 rounded-lg ${option.is_correct ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'}`}
                                >
                                  {option.option_text}
                                  {option.is_correct && (
                                    <span className="ml-2 text-green-600 font-medium">✓</span>
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
