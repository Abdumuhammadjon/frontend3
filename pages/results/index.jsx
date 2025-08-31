import React, { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import { Menu, Home, Users, BarChart, Settings, LogOut, Trash2 } from "lucide-react";

const GroupedQuestions = ({ subjectId }) => {
  const [groupedQuestions, setGroupedQuestions] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const storedSubjectId = localStorage.getItem("subjectId");
    const idToUse = subjectId || storedSubjectId;

    if (!idToUse) {
      router.push("/Login");
    } else {
      setIsLoggedIn(true);
      fetchQuestions(idToUse);
    }
  }, [subjectId, router]);

  const fetchQuestions = async (idToUse) => {
    setLoading(true);
    try {
      const { data } = await axios.get(
        `https://backed1.onrender.com/api/subject/${idToUse}`,
        { headers: { "Content-Type": "application/json" } }
      );

      const grouped = data.reduce((acc, q) => {
        const date = new Date(q.created_at).toISOString().split("T")[0];
        (acc[date] ||= []).push(q);
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
      await axios.delete(`https://backed1.onrender.com/api/question/${questionId}`);
      setGroupedQuestions((prev) => {
        const copy = { ...prev };
        copy[date] = copy[date].filter((q) => q.id !== questionId);
        if (!copy[date].length) delete copy[date];
        return copy;
      });
    } catch (err) {
      setError(err.response?.data?.error || "Savolni o'chirishda xatolik");
    }
  };

  const handleSubjectClick = () => router.push("/questions");
  const handleResultClick = () => router.push("/results");
  const handleUserResultsClick = () => router.push("/UserResults");

  const handleLogout = () => {
    document.cookie.split(";").forEach((c) => {
      const name = c.split("=")[0].trim();
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    });
    localStorage.clear();
    sessionStorage.clear();
    setIsLoggedIn(false);
    router.push("/Login");
  };

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString("uz-UZ", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="h-screen bg-gray-100">
      {/* ====== HEADER (BUTUN EKRAN BO'YLAB) ====== */}
      <header className="fixed inset-x-0 top-0 z-50 h-16 bg-white shadow">
        <div
          className={`h-full flex items-center justify-between px-4 sm:px-6 
          ${isSidebarOpen ? "md:pl-64" : "md:pl-20"} md:pr-4`}
        >
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Savollar Bazasi</h1>
          <div className="flex items-center gap-3">
            {isLoggedIn && (
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1"
              >
                <LogOut size={16} /> Chiqish
              </button>
            )}
            <div className="w-9 h-9 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">SB</div>
          </div>
        </div>
      </header>

      {/* ====== SIDEBAR (HEADER OSTIDA) ====== */}
      <aside
        className={`fixed top-16 left-0 h-[calc(100vh-4rem)] bg-gray-900 text-white transition-all duration-300 
        ${isSidebarOpen ? "w-64" : "w-20"} overflow-y-auto`}
      >
        <div className="flex items-center justify-between px-4 h-14 border-b border-gray-700">
          <span className={`font-bold ${!isSidebarOpen && "hidden"}`}>Menyu</span>
          <button onClick={() => setIsSidebarOpen((s) => !s)} className="text-white">
            <Menu size={22} />
          </button>
        </div>

        <ul className="p-4 space-y-3">
          <li onClick={handleSubjectClick} className="flex items-center gap-3 hover:bg-gray-700 p-2 rounded-lg cursor-pointer">
            <Home size={22} /> {isSidebarOpen && "Bosh sahifa"}
          </li>
          <li onClick={handleResultClick} className="flex items-center gap-3 hover:bg-gray-700 p-2 rounded-lg cursor-pointer">
            <Users size={22} /> {isSidebarOpen && "Foydalanuvchilar"}
          </li>
          <li onClick={handleUserResultsClick} className="flex items-center gap-3 hover:bg-gray-700 p-2 rounded-lg cursor-pointer">
            <BarChart size={22} /> {isSidebarOpen && "Hisobotlar"}
          </li>
          <li className="flex items-center gap-3 hover:bg-gray-700 p-2 rounded-lg cursor-pointer">
            <Settings size={22} /> {isSidebarOpen && "Sozlamalar"}
          </li>
          {isLoggedIn && (
            <li onClick={handleLogout} className="flex items-center gap-3 hover:bg-gray-700 p-2 rounded-lg cursor-pointer text-red-400">
              <LogOut size={22} /> {isSidebarOpen && "Chiqish"}
            </li>
          )}
        </ul>
      </aside>

      {/* ====== MAIN CONTENT ====== */}
      <main
        className={`
          pt-16  /* header balandligi */
          ${isSidebarOpen ? "md:ml-64" : "md:ml-20"}  /* desktopda sidebar joyi */
          ml-0  /* mobilda to'liq kenglik */
        `}
      >
        <div className="p-4 sm:p-6">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
            </div>
          ) : error ? (
            <div className="text-center p-4 text-red-600 bg-red-100 rounded-lg shadow">Xatolik: {error}</div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-6">
              {Object.keys(groupedQuestions)
                .sort()
                .map((date) => (
                  <div key={date} className="mb-4 w-full">
                    <button
                      onClick={() => setSelectedDate(selectedDate === date ? null : date)}
                      className="w-full bg-blue-500 text-white px-6 py-3 rounded-lg shadow hover:bg-blue-600 transition"
                    >
                      {formatDate(date)}
                    </button>

                    {selectedDate === date && (
                      <div className="mt-2 p-4 bg-white rounded-lg shadow">
                        {groupedQuestions[date].map((q, i) => (
                          <div key={i} className="mb-4 border-b pb-2 last:border-b-0">
                            <div className="flex justify-between items-center mb-2">
                              <p className="text-gray-600 font-medium">Savol:</p>
                              <button
                                onClick={() => handleDeleteQuestion(q.id, date)}
                                className="text-red-600 hover:text-red-800"
                                title="Savolni o'chirish"
                              >
                                <Trash2 size={20} />
                              </button>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg">
                              <p className="font-bold text-gray-900">{q.question_text}</p>
                              <ul className="mt-2 space-y-2">
                                {q.options.map((opt) => (
                                  <li
                                    key={opt.id}
                                    className={`p-2 rounded-lg ${
                                      opt.is_correct ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-800"
                                    }`}
                                  >
                                    {opt.option_text}
                                    {opt.is_correct && <span className="ml-2 text-green-600 font-medium">✓</span>}
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
      </main>
    </div>
  );
};

export default GroupedQuestions;
