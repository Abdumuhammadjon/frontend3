import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";

const ResultsPage = () => {
  const router = useRouter();
  const { subjectId } = router.query;

  const [resultSummary, setResultSummary] = useState(null);
  const [subjectName, setSubjectName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchResults = async () => {
      const userId = localStorage.getItem("userId");
      if (!userId || !subjectId) return;

      try {
        const res = await axios.get(
          `https://backed1.onrender.com/api/userResults?userId=${userId}&subjectId=${subjectId}`
        );
        setResultSummary(res.data.resultSummary);
        setSubjectName(res.data.subjectName);
      } catch (err) {
        setError("Natijalarni yuklashda xatolik yuz berdi");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [subjectId]);

  if (loading) return <p className="p-4">Yuklanmoqda...</p>;
  if (error) return <p className="p-4 text-red-500">{error}</p>;
  if (!resultSummary) return <p className="p-4">Natijalar topilmadi</p>;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md mt-6">
      <h1 className="text-2xl font-bold mb-4">{subjectName} bo‘yicha yakuniy natija</h1>
      <ul className="space-y-2 text-gray-800">
        <li>To‘g‘ri javoblar: <strong>{resultSummary.correct_answers}</strong></li>
        <li>Jami savollar: <strong>{resultSummary.total_questions}</strong></li>
        <li>Foiz: <strong>{resultSummary.score_percentage}%</strong></li>
        <li>Sana: <strong>{new Date(resultSummary.created_at).toLocaleString()}</strong></li>
      </ul>
    </div>
  );
};

export default ResultsPage;
