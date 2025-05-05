import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { LogOut } from 'lucide-react';

const Navbar = () => {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, [router]);

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

  const handleHomeClick = () => {
    router.push('/');
  };

  const handleAboutClick = () => {
    router.push('/about');
  };

  const handleContactClick = () => {
    router.push('/contact');
  };

  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
      <h1 className="text-2xl font-bold tracking-wide cursor-pointer" onClick={handleHomeClick}>
        60-maktab test sayti
      </h1>
      <ul className="flex items-center gap-8">
        <li>
          <span
            onClick={handleHomeClick}
            className="text-white hover:text-indigo-200 transition-colors duration-200 cursor-pointer"
          >
            Home
          </span>
        </li>
       
        {isLoggedIn && (
          <li
            className="flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer bg-indigo-700 hover:bg-indigo-800 transition-colors duration-200"
            onClick={handleLogout}
          >
            <LogOut size={20} />
            <span className="hidden md:inline font-medium">Chiqish</span>
          </li>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;