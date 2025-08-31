import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import axios from 'axios';
import { Menu, Home, Users, BarChart, Settings, Trash, CheckCircle, LogOut } from 'lucide-react';

export default function Admin() {
  const [questions, setQuestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [subjectId, setSubjectId] = useState(null);
  const [adminId, setAdminId] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true); // Added loading state
  const router = useRouter();

  useEffect(() => {
    const storedAdminId = localStorage.getItem('adminId');
    const storedSubjectId = localStorage.getItem('subjectId');

    console.log('Admin ID:', storedAdminId);
    console.log('Subject ID:', storedSubjectId);

    if (!storedAdminId || !storedSubjectId) {
      alert("Subject ID yoki Admin ID yo‘q!");
      router.push('/Login');
    } else {
      setSubjectId(storedSubjectId);
      setAdminId(storedAdminId);
      setIsLoggedIn(true);
      setLoading(false); // Set loading to false after checks
    }
  }, [router]);

  const handleSubjectClick = () => {
    router.push('/results');
  };

  const handleResultsClick = () => {
    router.push('/UserResults');
  };

  const handleHomeClick = () => {
    router.push('/'); // Added handler for homepage
  };

  const handleLogout = () => {
    document.cookie.split(';').forEach(function (cookie) {
      const name = cookie.split('=')[0].trim();
      document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
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

  const deleteQuestion = async (index) => {
    const question = questions[index];
    if (question.id) {
      // Assuming questions have an ID if saved to the backend
      try {
        await axios.delete(`https://backed1.onrender.com/api/question/${question.id}`, {
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (error) {
        alert(error.response?.data?.message || 'Savolni o‘chirishda xatolik!');
        return;
      }
    }
    setQuestions(questions.filter((_, qIndex) => qIndex !== index));
  };

  const handleQuestionChange = (index, value) => {
    const newQuestions = [...questions];
    newQuestions[index].questionText = value;
    setQuestions(newQuestions);
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[oIndex].text = value;
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

  const saveQuestions = async () => {
    if (!subjectId || !adminId) {
      alert('Subject ID yoki Admin ID topilmadi!');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(
        'https://backed1.onrender.com/api/question',
        {
          subjectId,
          adminId,
          questions,
        },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
      alert(response.data.message || 'Savollar muvaffaqiyatli saqlandi!');
      setQuestions([]);
    } catch (error) {
      alert(error.response?.data?.message || 'Server bilan bog‘lanishda xatolik!');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Head>
        <title>Admin Paneli</title>
        <meta name="description" content="Savollar va variantlar qo‘shish" />
      </Head>

      {/* Navbar */}
      <div className="bg-white shadow-md h-16 flex items-center fixed top-0 left-0 right-0 z-50">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        </div>
      </div>

      <div className="flex flex-1 pt-16">
        {/* Sidebar */}
        <div
          className={`sidebar bg-gray-900 text-white fixed h-full p-5 top-16 transition-all duration-300 ${
            isOpen ? 'w-64' : 'w-20'
          } z-40`}
        >
          <button className="text-white mb-6" onClick={() => setIsOpen(!isOpen)}>
            <Menu size={24} />
          </button>
          <ul className="space-y-4">
            <li
              className="flex items-center gap-3 hover:bg-gray-700 p-2 rounded-lg cursor-pointer"
              onClick={handleHomeClick}
            >
              <Home size={24} /> {isOpen && 'Bosh sahifa'}
            </li>
            <li
              className="flex items-center gap-3 hover:bg-gray-700 p-2 rounded-lg cursor-pointer"
              onClick={handleSubjectClick}
            >
              <Users size={24} /> {isOpen && 'Foydalanuvchilar'}
            </li>
            <li
              className="flex items-center gap-3 hover:bg-gray-700 p-2 rounded-lg cursor-pointer"
              onClick={handleResultsClick}
            >
              <BarChart size={24} /> {isOpen && 'Hisobotlar'}
            </li>
            <li className="flex items-center gap-3 hover:bg-gray-700 p-2 rounded-lg cursor-pointer">
              <Settings size={24} /> {isOpen && 'Sozlamalar'}
            </li>
            <br />
            <br />
            {isLoggedIn && (
              <li
                className="flex items-center gap-3 hover:bg-gray-700 p-2 rounded-lg cursor-pointer"
                onClick={handleLogout}
              >
                <LogOut size={24} /> {isOpen && 'Chiqish'}
              </li>
            )}
          </ul>
        </div>

        {/* Main Content */}
        <div
          className={`content-area flex-1 flex flex-col items-center py-8 transition-all duration-300 ${
            isOpen ? 'ml-64' : 'ml-20'
          } overflow-auto`}
        >
          <h1 className="text-3xl font-bold text-gray-800 mb-8">Savollar Qo‘shish</h1>
          <button
            onClick={addQuestion}
            className="mb-6 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            disabled={loading}
          >
            Savol yaratish
          </button>
          <div className="w-full max-w-3xl space-y-8">
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
                        className={`p-2 rounded-lg ${
                          option.isCorrect ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-700'
                        }`}
                      >
                        <CheckCircle size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={saveQuestions}
            className="mt-6 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600"
            disabled={loading}
          >
            {loading ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </div>
      </div>

      {/* Inline CSS for mobile responsiveness */}
      <style jsx>{`
        @media (max-width: 640px) {
          .content-area {
            height: calc(100vh - 64px);
            margin-left: 0 !important;
          }
          .sidebar {
            width: 0 !important;
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
