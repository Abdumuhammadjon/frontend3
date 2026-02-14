import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import axios from "axios";

const Question = ({ question, selectedOptions, handleOptionChange, disabled }) => {
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
                disabled={disabled} // ← Agar foydalanuvchi allaqachon javob bergan bo‘lsa bloklash
                className="mr-2"
              />
              <span className={`p-3 rounded-lg border w-full text-base font-medium transition-all duration-200 ${
                disabled ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-gray-100 border-gray-300 text-gray-800 hover:bg-gray-200'
              }`}>
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

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const groupQuestionsByDate = (questions) => {
  const grouped = {};
  questions.forEach((question) => {
    const date = new Date(question.created_at);
    const key = date.toISOString().slice(0, 10);
    if (!grouped[key]) grouped[key] = [];
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
  const [alreadyAnswered, setAlreadyAnswered] = useState(false); // ← Foydalanuvchi javob berganligini saqlash

  useEffect(() => {
    const fetchSubjects = async () => {
      setLoading(true);
      try {
        const response = await axios.get("https://backed1.onrender.com/api/subjects");
        setSubjects(response.data);
      } catch (error) {
        setError("Fanlarni yuklashda xatolik yuz berdi");
      } finally {
        setLoading(false);
      }
    };
    fetchSubjects();
  }, []);

  const fetchQuestions = async (subjectId) => {
    setLoading(true);
    setError(null);
    setSelectedOptions({});
    setSelectedDate(null);
    setAlreadyAnswered(false);

    try {
      const response = await axios.get(
        `https://backed1.onrender.com/api/subject/${subjectId}`
      );
      setSelectedSubject(subjectId);
      setGroupedQuestions(groupQuestionsByDate(response.data));

      // 🔹 Tekshirish: foydalanuvchi allaqachon javob berganmi
      const userId = localStorage.getItem("userId");
      if (userId) {
        const resCheck = await axios.get(
          `https://backed1.onrender.com/api/user-result?userId=${userId}&subjectId=${subjectId}`
        );
        if (resCheck.data.answers && resCheck.data.answers.length > 0) {
          setAlreadyAnswered(true);
          // Oldingi javoblarni load qilish (ixtiyoriy)
          const prevOptions = {};
          resCheck.data.answers.forEach(a => {
            prevOptions[a.question_id] = {
              questionId: a.question_id,
              variantId: a.user_answer_id || null, // agar ID saqlansa
              variantText: a.user_answer
            };
          });
          setSelectedOptions(prevOptions);
        }
      }

    } catch (error) {
      setError("Savollarni yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const handleOptionChange = (questionId, variantId, variantText) => {
    if (alreadyAnswered) return; // Agar javob berilgan bo‘lsa, bloklash
    setSelectedOptions((prev) => ({
      ...prev,
      [questionId]: { questionId, variantId, variantText },
    }));
  };

  const handleSaveAnswers = async () => {
    if (alreadyAnswered) {
      alert("Siz allaqachon javob bergansiz!");
      return;
    }

    const userId = localStorage.getItem("userId");
    if (!userId) return alert("Foydalanuvchi ID topilmadi!");

    if (!selectedSubject) return alert("Fanni tanlang!");

    const allQuestions =
      selectedDate && groupedQuestions[selectedDate]
        ? groupedQuestions[selectedDate]
        : [];

    const answers = Object.values(selectedOptions).map(({ questionId, variantId }) => ({
      questionId,
      variantId,
    }));

    if (answers.length < allQuestions.length) {
      alert("Iltimos, barcha savollarga javob belgilang!");
      return;
    }

    try {
      setLoading(true);
      await axios.post("https://backed1.onrender.com/api/save-answers", {
        answers,
        userId,
        subjectId: selectedSubject,
      });
      alert("Javoblar muvaffaqiyatli saqlandi!");
      setAlreadyAnswered(true); // Javob berildi, keyingi harakatlarni bloklash
      router.push({
        pathname: "/Natija",
        query: { subjectId: selectedSubject },
      });
    } catch (error) {
      alert("Javoblarni saqlashda xatolik yuz berdi");
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
            disabled={alreadyAnswered} // agar javob berilgan bo‘lsa bloklash
          >
            {subject.name}
          </button>
        ))}
      </div>

      {selectedSubject && selectedDate && groupedQuestions[selectedDate] && (
        <div className="mt-6 w-full max-w-4xl bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Savollar</h2>
          {groupedQuestions[selectedDate].map((question) => (
            <Question
              key={question.id}
              question={question}
              selectedOptions={selectedOptions}
              handleOptionChange={handleOptionChange}
              disabled={alreadyAnswered} // agar javob berilgan bo‘lsa, radio disabled
            />
          ))}
          <button
            onClick={handleSaveAnswers}
            className="mt-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-md hover:bg-green-600 transition"
            disabled={loading || alreadyAnswered} // bloklash
          >
            Javoblarni Saqlash
          </button>
          {alreadyAnswered && (
            <p className="mt-2 text-red-500 font-medium">
              Siz allaqachon bu testga javob bergansiz!
            </p>
          )}
        </div>
      )}
    </div>
  );
}
