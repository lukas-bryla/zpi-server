"use client";

import { useEffect, useState } from "react";
import { use } from "react"; // Přidání React.use() pro rozbalení params
import styles from "./game.module.css";

export default function GamePage({ params: paramsPromise }) {
  const params = use(paramsPromise); // Rozbalení params
  const id = params.id; // Získání ID z rozbalených params
  const [gameData, setGameData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [waiting, setWaiting] = useState(false);

  // Načtení dat hry z API
  useEffect(() => {
    const fetchGameData = async () => {
      try {
        const response = await fetch(`/api/game?id=${id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch game data");
        }
        const data = await response.json();
        setGameData(data);
        setWaiting(data.gameState === "in_progress" && !data.completed);
      } catch (error) {
        console.error("Error fetching game data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGameData();
  }, [id]);

  // Kontrola, zda ESP32 odeslalo data
  useEffect(() => {
    if (!waiting) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/game?id=${id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch game data");
        }
        const updatedData = await response.json();

        if (updatedData.completed) {
          setGameData(updatedData);
          setWaiting(false);
        }
      } catch (error) {
        console.error("Error checking game status:", error);
      }
    }, 5000); // Kontrola každých 5 sekund

    return () => clearInterval(interval);
  }, [waiting, id]);

  // Funkce pro začátek nového kola
  const handleNewRound = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/save-sequence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: gameData._id,
          difficulty: gameData.difficulty,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to update sequence");
      }

      const updatedGame = await response.json();
      setWaiting(true); // Přepne stav na čekání na ESP32
    } catch (error) {
      console.error("Error starting new round:", error);
    } finally {
      setLoading(false);
    }
  };

  // Funkce pro generování srdíček
  const renderLives = (lives) => {
    return Array.from({ length: lives }, (_, index) => (
      <span key={index}>&#10084;</span> // HTML entita pro srdíčko
    ));
  };

  if (loading) {
    return <div className={styles.loading}>Načítání...</div>;
  }

  if (!gameData) {
    return <div className={styles.error}>Hra nebyla nalezena.</div>;
  }

  if (gameData.gameState === "game_over") {
    return (
      <div className={styles.gameOver}>
        <h1>Hra skončila!</h1>
        <p>Vaše skóre: {gameData.score}</p>
        <button onClick={() => (window.location.href = "/")}>
          Zpět na hlavní stránku
        </button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Paměťové Piáno</h1>
        <div className={styles.lives}>{renderLives(gameData.lives)}</div>
        <p>Skóre: {gameData.score}</p>
      </header>

      <main className={styles.main}>
        {waiting ? (
          <div className={styles.loading}>
            <p>Čekáme na zadání kláves od ESP32...</p>
          </div>
        ) : (
          <>
            {gameData.completed && (
              <section className={styles.results}>
                <h2>Výsledky</h2>
                <p>Správné klávesy: {gameData.correctKeys?.length || 0}</p>
                <p>Špatné klávesy: {gameData.incorrectKeys?.length || 0}</p>
              </section>
            )}
            <button className={styles.button} onClick={handleNewRound}>
              Nové kolo
            </button>
          </>
        )}
      </main>

      <footer className={styles.footer}>
        <p>ZPI 2024 Paměťové Piáno - Lukáš Brýla</p>
      </footer>
    </div>
  );
}
