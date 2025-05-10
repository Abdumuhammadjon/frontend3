"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { create } from "zustand";
import { Home, Users, BarChart,  LogOut, Menu } from "lucide-react";
import axios from 'axios';

const ChartComponent = dynamic(() => import("../../components/ChartComponent"), { ssr: false });

// Zustand store (holatni boshqarish)
const useUserStore = create((set) => ({
  users: [],
  addUser: (user) => set((state) => ({ users: [...state.users, user] })),
  updateUser: (id, updatedUser) =>
    set((state) => ({
      users: state.users.map((usr) => (usr.id === id ? updatedUser : usr)),
    })),
  deleteUser: (id) =>
    set((state) => ({
      users: state.users.filter((usr) => usr.id !== id),
    })),
}));

export default function Dashboard() {
  const [isOpen, setIsOpen] = useState(true);
  const router = useRouter();
  const { register, handleSubmit, reset, setValue } = useForm();
  const { users, addUser, updateUser, deleteUser } = useUserStore();
  const [editingUser, setEditingUser] = useState(null);

  const handleUsersClick = () => {
    router.push("/Superadmin");
  };
  const handleSubjectClick = () => {
    router.push("/Fanlar");
  };
  const onSubmit = async (data) => {
    console.log(data);
    
    try {
      const userData = { 
        username: data.username, 
        email: data.email, 
        password: data.password, 
        role: data.role 
      };

      const response = await axios.post("https://backed1.onrender.com/auth/register", userData);
      console.log(response.data);

      if (editingUser) {
        updateUser(editingUser.id, { ...userData, id: editingUser.id });
        setEditingUser(null);
      } else {
        addUser({ ...userData, id: Date.now().toString() });
      }
      reset();
      
    } catch (error) {
      console.log("Xatolik:", error);
    }
  };

  const handleLogout = () => {
    document.cookie.split(";").forEach(function(cookie) {
      const name = cookie.split("=")[0].trim();
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    });

    localStorage.clear();
    sessionStorage.clear();
   // Logout holatini yangilash
    router.push('/Login');
  };

  return (
    <div className="flex -ml-5 flex-col h-screen bg-gray-100">
      <div className="bg-white shadow-md h-16 flex items-center px-10  fixed w-full z-10 top-0">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
      </div>

      <div className="flex flex-1 pt-16">
        <div className={`bg-gray-900 text-white fixed h-full p-5 top-16 transition-all duration-300 ${isOpen ? "w-64" : "w-20"} flex flex-col`}>
          <button className="text-white mb-6 focus:outline-none self-end" onClick={() => setIsOpen(!isOpen)}>
            <Menu size={24} />
          </button>
          {isOpen && <h2 className="text-2xl font-bold mb-6">Dashboard</h2>}
          <ul className="space-y-4">
            <li className="flex items-center gap-3 cursor-pointer hover:bg-gray-700 p-2 rounded-lg" onClick={handleUsersClick}>
              <Home size={24} /> {isOpen && "Bosh sahifa"}
            </li>
            <li className="flex items-center gap-3 cursor-pointer hover:bg-gray-700 p-2 rounded-lg">
              <Users size={24} /> {isOpen && "Foydalanuvchilar"}
            </li>
            <li className="flex items-center gap-3 cursor-pointer hover:bg-gray-700 p-2 rounded-lg" onClick={handleSubjectClick}>
              <Users size={24} /> {isOpen && "Fan yaratish"}
            </li>
           
            <br />
            <br />
            <li
              className="flex items-center gap-3 hover:bg-gray-700 p-2 rounded-lg cursor-pointer"
              onClick={handleLogout} // handleLogout funksiyasini ishlatamiz
            >
              <LogOut size={24} /> {isOpen && "Chiqish"} {/* isSidebarOpen o‘rniga isOpen */}
            </li>
          </ul>
        </div>

        <div className={`flex-1 transition-all p-8 pt-20`} style={{ marginLeft: isOpen ? "16rem" : "5rem" }}>
          <div className="mt-10 p-6 max-w-2xl border rounded">
            <h2 className="text-2xl font-bold mb-4">Foydalanuvchilarni boshqarish</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <input {...register("username", { required: true })} placeholder="Foydalanuvchi nomi" className="border p-2 w-full" />
              <input {...register("email", { required: true })} type="email" placeholder="Email" className="border p-2 w-full" />
              <input {...register("password", { required: true })} type="password" placeholder="Parol" className="border p-2 w-full" />
              
              <select {...register("role", { required: true })} className="border p-2 w-full">
                <option value="user">Oddiy foydalanuvchi</option>
                <option value="admin">Admin</option>
              </select>

              <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
                {editingUser ? "Tahrirlash" : "Qo‘shish"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
