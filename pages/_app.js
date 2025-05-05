import "@/styles/globals.css";
import Head from "next/head";
import Layout from "../components/Layout";
import Axios from "axios";
import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/router";

export default function App({ Component, pageProps }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const publicRoutes = ["/Login", "/register"];

    if (!token) {
      if (!publicRoutes.includes(router.pathname)) {
        router.replace("/Login");
      }
      setLoading(false);
      return;
    }

    Axios.post(
      "https://backed1.onrender.com/auth/verify-token",
      { token },
      { withCredentials: true }
    )
      .then((res) => {
        setUser(res.data.user);
      })
      .catch((err) => {
        console.error("❌ Token noto‘g‘ri yoki eskirgan:", err.response?.data);
        Cookies.remove("token");
        router.replace("/Login");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router.pathname]);

  if (
    loading ||
    (!user && !["/Login", "/register"].includes(router.pathname))
  ) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Mening Saytim</title>
        <link
          rel="icon"
          type="image/jpeg" sizes="128x128"
          href ="https://media.istockphoto.com/id/2164938957/vector/clock-keep-track-of-time-measure-timer-timepiece-timekeeper-chronometer-alarm-clock-second.jpg?s=612x612&w=0&k=20&c=npQKoQRh78PUGdFZQCaM8cSwh92jNZ_F_1RYuXxx4J8="
        />
      </Head>
      <Layout>
        <Component {...pageProps} user={user} />
      </Layout>
    </>
  );
}
