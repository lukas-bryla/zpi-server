"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

export default function Home() {
  const [difficulty, setDifficulty] = useState("easy");
  const [nickname, setNickname] = useState(""); // Nový stav pro přezdívku
  const router = useRouter();

  const startNewGame = async () => {
    try {
      const response = await fetch("/api/save-sequence", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ difficulty, nickname }), // Posíláme pouze obtížnost
      });

      if (!response.ok) {
        throw new Error("Failed to create new game");
      }

      const { id } = await response.json(); // Server vrátí ID nové hry
      router.push(`/game/${id}`); // Přesměruj uživatele na herní stránku
    } catch (error) {
      console.error("Error starting new game:", error);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Paměťové Piáno</h1>
        <p>Procvičte si paměť a rytmus!</p>
      </header>

      <main className={styles.main}>
        <section className={styles.section}>
          <div>
            <label htmlFor="nickname">Zadej přezdívku:</label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Přezdívka"
            />
          </div>
          <div>
            <label htmlFor="difficulty">Zvolte obtížnost:</label>
            <select
              id="difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option value="easy">Lehká (2 tóny)</option>
              <option value="medium">Střední (4 tóny)</option>
              <option value="hard">Těžká (7 tónů)</option>
              <option value="deathwish">Deathwish (11 tónů)</option>
            </select>
          </div>
          <button className={styles.button} onClick={startNewGame}>
            Vytvořit hru
          </button>
        </section>
      </main>

      <footer className={styles.footer}>
        <p>ZPI 2024 Paměťové Piáno - Lukáš Brýla</p>
      </footer>
    </div>
  );
}
