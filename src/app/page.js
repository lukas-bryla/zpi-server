"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css"; // Assuming you’ll reuse or create similar styles

export default function Home() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data when the component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/data/get");
        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Environmental Data</h1>
        <p>View all recorded environmental measurements</p>
      </header>

      <main className={styles.main}>
        <section className={styles.section}>
          {loading ? (
            <p>Loading data...</p>
          ) : error ? (
            <p className={styles.error}>Error: {error}</p>
          ) : data.length === 0 ? (
            <p>No data available.</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>CO (ppm)</th>
                  <th>Methane (%)</th>
                  <th>Fire Distance (cm)</th>
                  <th>Temperature (°C)</th>
                  <th>Fire Present</th>
                </tr>
              </thead>
              <tbody>
                {data.map((entry) => (
                  <tr key={entry._id}>
                    <td>{new Date(entry.timestamp).toLocaleString()}</td>
                    <td>{entry.coPpmCount ?? "N/A"}</td>
                    <td>{entry.methanePercentage ?? "N/A"}</td>
                    <td>{entry.fireDistanceCm ?? "N/A"}</td>
                    <td>{entry.temperatureCelsius ?? "N/A"}</td>
                    <td>
                      {entry.isFirePresent !== undefined
                        ? entry.isFirePresent
                          ? "Yes"
                          : "No"
                        : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>

      <footer className={styles.footer}>
        <p>
          Robotický pes detekující přítomnost plamene, měřící teplotu a
          koncentraci hořlavých plynů <br /> Tento skupinový projekt vznikl v
          rámci předmětu ZPP (Základy programátorské praxe) na Fakultě
          aplikovaných věd ZČU
        </p>
      </footer>
    </div>
  );
}
