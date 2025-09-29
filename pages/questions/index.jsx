import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from "next/router";
import axios from 'axios';
import { Menu, Home, Users, BarChart, Trash, CheckCircle, LogOut } from 'lucide-react';

export default function Admin() {
  const [questions, setQuestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [subjectId, setSubjectId] = useState(null);
  const [adminId, setAdminId] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const storedAdminId = localStorage.getItem("adminId");
    const storedSubjectId = localStorage.getItem("subjectId");
    
    if (!storedAdminId || !storedSubjectId) {
      alert("Subject ID yoki Admin ID yo‘q!");
      router.push('/Login');
    } else {
      setSubjectId(storedSubjectId);
      setAdminId(storedAdminId);
      setIsLoggedIn(true);
    }
  }, [router]);

  const handleSubjectClick = () => router.push("/results");
  const handleResultsClick = () => router.push("/UserResults");

  const handleLogout = () => {
    document.cookie.split(";").forEach(cookie => {
      const name = cookie.split("=")[0].trim();
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    });
    localStorage.clear();
    sessionStorage.clear();
    setIsLoggedIn(false);
    router.push('/Login');
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        questionText: '',
        options: [
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
        ],
      },
    ]);
  };

  const deleteQuestion = (index) => setQuestions(questions.filter((_, qIndex) => qIndex !== index));

 const handleQuestionChange = (index, value) => {
  const newQuestions = [...questions];
  newQuestions[index].questionText = cleanText(value);
  setQuestions(newQuestions);
};

const handleOptionChange = (qIndex, oIndex, value) => {
  const newQuestions = [...questions];
  newQuestions[qIndex].options[oIndex].text = cleanText(value);
  setQuestions(newQuestions);
};


  const setCorrectOption = (qIndex, oIndex) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options = newQuestions[qIndex].options.map((opt, idx) => ({
      ...opt,
      isCorrect: idx === oIndex,
    }));
    setQuestions(newQuestions);
  };

  // 🔹 PDF yoki Word’dan nusxa olingan matnni tozalash funksiyasi
 const cleanText = (rawText) => {
  if (!rawText) return '';

return rawText
    .replace(/\u00A0/g, ' ')        // Non-breaking space
    .replace(/\u200B/g, '')         // Zero-width space
    .replace(/[\u2000-\u200F]/g, '') // Boshqa invisible characters
    .replace(/[\uFEFF]/g, '')       // Byte Order Mark (BOM)
    .replace(/['"’‘“”]/g, '"')      // Har xil qo‘shtirnoq va tirnoqlarni oddiy qo‘shtirnoqqa aylantirish
    // .replace(/\s+/g, ' ')        // Bu qatorni olib tashlang yoki izohga oling
    .replace(/o[`'’"]/g, "o'")      
    .replace(/g[`'’"]/g, "g'")      
    .trim();                        
};



  const saveQuestions = async () => {
    const adminId = localStorage.getItem("adminId");
    const subjectId = localStorage.getItem("subjectId");

    if (!subjectId || !adminId) {
      alert('Subject ID yoki Admin ID topilmadi!');
      return;
    }

    try {
      setIsLoading(true);

      // 🔹 Backendga yuboriladigan matnni tozalash
      const cleanedQuestions = questions.map(q => ({
        questionText: cleanText(q.questionText),
        options: q.options.map(o => ({
          ...o,
          text: cleanText(o.text)
        }))
      }));

      const response = await axios.post('https://backed1.onrender.com/api/question', {
        subjectId,
        adminId,
        questions: cleanedQuestions,
      }, {
        headers: { 'Content-Type': 'application/json' },
      });

      alert(response.data.message || 'Savollar muvaffaqiyatli saqlandi!');
      setQuestions([]);
    } catch (error) {
      alert(error.response?.data?.message || 'Server bilan bog‘lanishda xatolik!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Head>
        <title>Admin Paneli</title>
        <meta name="description" content="Savollar va variantlar qo‘shish" />
      </Head>

      {/* 🔥 Loader Overlay */}
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[9999]">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      <div className="bg-white shadow-md h-16 flex items-center px-6 fixed w-full z-50 top-0">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
      </div>

      <div className="flex flex-1 pt-16">
        <div className={`bg-gray-900 text-white fixed h-[calc(100vh-4rem)] p-5 top-16 transition-all duration-300 ${isOpen ? "w-64" : "w-20"} z-40`}>
          <button className="text-white mb-6" onClick={() => setIsOpen(!isOpen)}>
            <Menu size={24} />
          </button>
          <ul className="space-y-4">
            <li className="flex items-center gap-3 hover:bg-gray-700 p-2 rounded-lg cursor-pointer">
              <Home size={24} /> {isOpen && "Bosh sahifa"}
            </li>
            <li className="flex items-center gap-3 hover:bg-gray-700 p-2 rounded-lg cursor-pointer" onClick={handleSubjectClick}>
              <Users size={24} /> {isOpen && "Foydalanuvchilar"}
            </li>
            <li className="flex items-center gap-3 hover:bg-gray-700 p-2 rounded-lg cursor-pointer" onClick={handleResultsClick}>
              <BarChart size={24} /> {isOpen && "Hisobotlar"}
            </li>
            <br /><br />
            {isLoggedIn && (
              <li className="flex items-center gap-3 hover:bg-gray-700 p-2 rounded-lg cursor-pointer" onClick={handleLogout}>
                <LogOut size={24} /> {isOpen && "Chiqish"}
              </li>
            )}
          </ul>
        </div>

        <div className={`flex-1 flex flex-col items-center py-8 transition-all duration-300 ${isOpen ? "ml-64" : "ml-20"} mr-0 overflow-y-auto`}>
          <h1 className="text-3xl font-bold text-gray-800 mb-8">Savollar Qo‘shish</h1>
          <button onClick={addQuestion} className="mb-6 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            Savol yaratish
          </button>
          <div className="w-full max-w-3xl space-y-8 max-h-[calc(100vh-16rem)] overflow-y-auto -webkit-overflow-scrolling-touch">
            {questions.map((question, qIndex) => (
              <div key={qIndex} className="bg-white p-6 rounded-lg shadow-md relative">
                <textarea
                  value={question.questionText}
                  onChange={(e) => handleQuestionChange(qIndex, e.target.value)}
                  placeholder={`Savol ${qIndex + 1}`}
                  className="w-full p-3 mb-4 border rounded-lg focus:ring-2 focus:ring-blue-500 resize-y"
                />
                <button
                  onClick={() => deleteQuestion(qIndex)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-lg hover:bg-red-600"
                >
                  <Trash size={24} />
                </button>
                <div className="space-y-2">
                  {question.options.map((option, oIndex) => (
                    <div key={oIndex} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={option.text}
                        onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                        placeholder={`Variant ${oIndex + 1}`}
                        className="flex-1 p-2 border rounded-lg"
                      />
                      <button
                        onClick={() => setCorrectOption(qIndex, oIndex)}
                        className={`p-2 rounded-lg ${option.isCorrect ? "bg-green-500 text-white" : "bg-gray-300 text-gray-700"}`}
                      >
                        <CheckCircle size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button onClick={saveQuestions} disabled={isLoading} className="mt-6 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50">
            {isLoading ? "Saqlanmoqda..." : "Saqlash"}
          </button>
        </div>
      </div>
    </div>
  );
}

