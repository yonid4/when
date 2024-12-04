"use client";

import Image from "next/image";
import styles from "./page.module.css";
import React, { useState, useEffect } from "react";

export default function Home() {

  const [data, setData] = useState({
    name: "",
    age: 0,
    date: "",
    programming:"",
  });

  useEffect(() => {
    console.log("Backend URL:", process.env.NEXT_PUBLIC_BACKEND_URL);
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/data`).then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      console.log(response);
      response.json().then((data) => {
        
        console.log(data);
        setData({
          name: data.Name,
          age: data.Age,
          date: data.Date,
          programming: data.programming,
        });  
      })
      .catch((error) => console.error("Error fetching data:", error));});
  }, []);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className="App">
            <header className="App-header">
                <h1>React and flask data</h1>
                <p>{data.name}</p>
                <p>{data.age}</p>
                <p>{data.date}</p>
                <p>{data.programming}</p>

            </header>
        </div>
      </main>
    </div>
  );
}
