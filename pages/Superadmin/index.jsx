import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import React, { useState, useRef, useEffect } from "react";
import { Home, Users, BarChart, Menu, LogOut } from "lucide-react";

const ChartComponent = dynamic(() => import("../../components/ChartComponent"), { ssr: false });

export default function Dashboard() {
  const [isOpen, setIsOpen] = useState(true);
  const router = useRouter();
  const contentRef = useRef(null); // Kontent maydoni uchun ref

  const handleUsersClick = () => {
    router.push("/adminlar");
  };
  const handleHisobotClick = () => {
    router.push("/Fanlar");
  };
  const handleLogout = () => {
    document.cookie.split(";").forEach(function(cookie) {
      const name = cookie.split("=")[0].trim();
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    });

    localStorage.clear();
    sessionStorage.clear();
    router.push('/Login');
  };

  const data = {
    labels: ["Yanvar", "Fevral", "Mart", "Aprel", "May"],
    datasets: [
      {
        label: "Foydalanuvchilar soni",
        data: [50, 70, 90, 60, 120],
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false, // Grafiklarning moslashuvchanligini oshirish
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Oylik Foydalanuvchilar Statistikasi" },
    },
  };

  // Scrollni majburlash uchun useEffect
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0; // Yangilanganda yuqoriga scroll qilish
    }
  }, []);

  return (
    <div className="flex flex-col h-auto bg-gray-100">
      {/* Navbar */}
      <div className="bg-white shadow-md h-16 flex items-center px-6 fixed w-full z-10 top-0">
        <h1 className="text-2xl font-bold text-gray-800">Navbar</h1>
      </div>

      <div className="flex flex-1 pt-16">
        {/* Sidebar */}
        <div className={`bg-gray-900 text-white fixed h-[calc(100vh-4rem)] p-5 top-16 transition-all duration-300 ${isOpen ? "w-64" : "w-20"} flex flex-col overflow-y-auto z-40`}>
          <button className="text-white mb-6 focus:outline-none self-end" onClick={() => setIsOpen(!isOpen)}>
            <Menu size={24} />
          </button>
          {isOpen && <h2 className="text-2xl font-bold mb-6">Dashboard</h2>}
          <ul className="space-y-4">
            <li className="flex items-center gap-3 cursor-pointer hover:bg-gray-700 p-2 rounded-lg">
              <Home size={24} /> {isOpen && "Bosh sahifa"}
            </li>
            <li
              className="flex items-center gap-3 cursor-pointer hover:bg-gray-700 p-2 rounded-lg"
              onClick={handleUsersClick}
            >
              <Users size={24} /> {isOpen && "Foydalanuvchilar"}
            </li>
            <li
              className="flex items-center gap-3 cursor-pointer hover:bg-gray-700 p-2 rounded-lg"
              onClick={handleHisobotClick}
            >
              <BarChart size={24} /> {isOpen && "Fan yaratish"}
            </li>
            <br />
            <br />
            <li
              className="flex items-center gap-3 hover:bg-gray-700 p-2 rounded-lg cursor-pointer"
              onClick={handleLogout}
            >
              <LogOut size={24} /> {isOpen && "Chiqish"}
            </li>
          </ul>
        </div>

        {/* Main Content */}
        <div
          ref={contentRef}
          className={`flex-1 transition-all p-8 pt-20 overflow-y-auto h-[calc(100vh-4rem)]`}
          style={{ marginLeft: isOpen ? "16rem" : "5rem" }}
        >
          <h1 className="text-4xl font-bold text-gray-800">Dashboard Paneli</h1>
          <p className="mt-4 text-gray-600">Bu yerda asosiy ma'lumotlar joylashadi.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10 max-h-[calc(100vh-16rem)] overflow-y-auto -webkit-overflow-scrolling-touch">
            <div className="w-full h-64"><ChartComponent type="line" data={data} options={options} /></div>
            <div className="w-full h-64"><ChartComponent type="bar" data={data} options={options} /></div>
            <div className="w-full h-64"><ChartComponent type="pie" data={data} options={options} /></div>
            <div className="w-full h-64"><ChartComponent type="doughnut" data={data} options={options} /></div>
          </div>
        </div>
      </div>
    </div>
  );
}
