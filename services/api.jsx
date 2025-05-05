import axios from "axios";

const API_URL = "https://backed1.onrender.com/api"; // Backend server manzili

export const getAdmins = async () => {
  const response = await axios.get(`${API_URL}/admins`);
  return response.data.admins;
};

export const getSubjects = async () => {
  const response = await axios.get(`${API_URL}/subjects`);
  return response.data;
};

export const createSubject = async (subjectData) => {
  try {
    const response = await axios.post(`${API_URL}/subjects`, subjectData);
    return response.data;
  } catch (error) {
    console.error("Fan qo‘shishda xatolik:", error.response ? error.response.data : error.message);
    throw error;
  }
};


export const updateSubject = async (id, updatedData) => {
  const response = await axios.put(`${API_URL}/subjects/${id}`, updatedData);
  return response.data;
};

export const deleteSubject = async (id) => {
  const response = await axios.delete(`${API_URL}/subjects/${id}`);
  return response.data;
};
