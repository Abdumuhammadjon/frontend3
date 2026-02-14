import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import axios from "axios";

// Savol komponenti
const Question = ({ question, selectedOptions, handleOptionChange }) => {
  return (
    <div className="p-4 border-b">
      <p className="font-bold text-lg text-gray-900">{question.question_text}</p>
      {question.options && question.options.length > 0 ? (
        <ul className="mt-2 space-y-2">
          {question.options.map((option) => (
            <li key={option.id} className="ml-4 flex items-center">
              <input
                type="radio"
                name={`question-${question.id}`}
                value={option.id}
                checked={selectedOptions[question.id]?.variantId === option.id}
                onChange={() =>
                  handleOptionChange(question.id, option.id, option.option_text)
                }
                className="mr-2"
              />
              <span className="p-3 rounded-lg bg-gray-100 border border-gray-300 w-full text-gray-800 text-base font-medium hover:bg-gray-200 transition-all duration-200">
                {option.option_text}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-600 mt-2">Javob variantlari mavjud emas</p>
      )}
    </div>
  );
};

// Sana formatlash
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

// Savollarni sanasi bo‘yicha guruhlash
const groupQuestionsByDate = (questions) => {
  const grouped = {};
  questions.forEach((question) => {
    const date = new Date(question.created_at);
    const key = date.toISOString().slice(0, 10); // YYYY-MM-DD
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(question);
  });
  return grouped;
};

export default function Home() {
  const router = useRouter();
  const [subjects, setSubjects] = useState([]);
  const [groupedQuestions, setGroupedQuestions] = useState({});
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fanlarni olish
  useEffect(() => {
    const fetchSubjects = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          "https://backed1.onrender.com/api/subjects"
        );
        setSubjects(response.data);
      } catch (error) {
        setError("Fanlarni yuklashda xatolik yuz berdi");
      } finally {
        setLoading(false);
      }
    };
    fetchSubjects();
  }, []);

  // Tanlangan fanga savollarni olish
  const fetchQuestions = async (subjectId) => {
    setLoading(true);
    setError(null);
    setSelectedOptions({});
    setSelectedDate(null);
    try {
      const response = await axios.get(
        `https://backed1.onrender.com/api/subject/${subjectId}`
      );
      setSelectedSubject(subjectId);
      setGroupedQuestions(groupQuestionsByDate(response.data));
    } catch (error) {
      setError("Savollarni yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  // Javob tanlash
  const handleOptionChange = (questionId, variantId, variantText) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [questionId]: { questionId, variantId, variantText },
    }));
  };

  // Javoblarni saqlash
  const handleSaveAnswers = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      alert("Foydalanuvchi ID topilmadi. Iltimos, tizimga kiring!");
      return;
    }

    if (!selectedSubject) {
      alert("Fanni tanlang!");
      return;
    }

    if (!selectedDate) {
      alert("Iltimos, savollar sanasini tanlang!");
      return;
    }

    const allQuestions = groupedQuestions[selectedDate] || [];

    const answers = Object.values(selectedOptions).map(
      ({ questionId, variantId }) => ({
        questionId,
        variantId,
      })
    );

    if (answers.length === 0) {
      alert("Iltimos, hech bo‘lmaganda bitta javob belgilang!");
      return;
    }

    if (answers.length < allQuestions.length) {
      alert("Iltimos, barcha savollarga javob belgilang!");
      return;
    }

    try {
      setLoading(true);

      // 🔥 testDate ISO formatda yuboriladi
      const testDate = new Date(selectedDate).toISOString().slice(0, 10);

      await axios.post("https://backed1.onrender.com/api/save-answers", {
        answers,
        userId,
        subjectId: selectedSubject,
        testDate,
      });

      alert("Javoblar muvaffaqiyatli saqlandi!");
      router.push({
        pathname: "/Natija",
        query: { subjectId: selectedSubject },
      });
    } catch (error) {
      if (error.response?.data?.error) {
        alert(error.response.data.error);
      } else {
        alert("Javoblarni saqlashda xatolik yuz berdi");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6 relative">
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-50 z-50">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid"></div>
        </div>
      )}

      <h1 className="text-3xl font-bold text-blue-700 mb-6">Fanlar ro‘yxati</h1>

      {error && <p className="text-red-500 mb-4">Xatolik: {error}</p>}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full max-w-4xl">
        {subjects.map((subject) => (
          <button
            key={subject.id}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg shadow-md hover:bg-blue-600 transition"
            onClick={() => fetchQuestions(subject.id)}
          >
            {subject.name}
          </button>
        ))}
      </div>

      {selectedSubject && (
        <div className="mt-6 w-full max-w-4xl bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Savollar sanasi bo‘yicha
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.keys(groupedQuestions)
              .sort()
              .map((date) => (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={`p-3 rounded-lg shadow-md transition ${
                    selectedDate === date
                      ? "bg-green-400 text-white"
                      : "bg-gray-200 hover:bg-gray-300"
                  }`}
                >
                  {formatDate(date)}
                </button>
              ))}
          </div>
        </div>
      )}

      {selectedDate && groupedQuestions[selectedDate] && (
        <div className="mt-6 w-full max-w-4xl bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Savollar</h2>
          {groupedQuestions[selectedDate].map((question) => (
            <Question
              key={question.id}
              question={question}
              selectedOptions={selectedOptions}
              handleOptionChange={handleOptionChange}
            />
          ))}
          <button
            onClick={handleSaveAnswers}
            className="mt-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-md hover:bg-green-600 transition"
            disabled={loading}
          >
            Javoblarni Saqlash
          </button>
        </div>
      )}
    </div>
  );
}
