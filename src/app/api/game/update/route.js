import { MongoClient, ObjectId } from "mongodb";

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

const VALID_FREQUENCIES = [262, 294, 330, 349, 392, 440, 494];

export async function POST(req) {
  try {
    const { id, espData } = await req.json();

    if (!id || (!Array.isArray(espData) && espData !== undefined)) {
      return new Response(JSON.stringify({ error: "Invalid data format" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validace frekvencí
    const invalidFrequencies = espData.filter(
      (freq) => !VALID_FREQUENCIES.includes(freq)
    );
    if (invalidFrequencies.length > 0) {
      return new Response(
        JSON.stringify({ error: "Invalid frequencies detected" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    await client.connect();
    const db = client.db("memory-piano");
    const collection = db.collection("games");

    const game = await collection.findOne({ _id: new ObjectId(id) });

    if (!game) {
      return new Response(JSON.stringify({ error: "Game not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (espData) {
      // Validace délky vstupu
      if (espData.length !== game.sequence.length) {
        return new Response(
          JSON.stringify({ error: "Invalid data length from ESP32" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Zpracování výsledků
      let correctCount = 0;
      let incorrectCount = 0;

      game.sequence.forEach((key, index) => {
        if (espData[index] === key) {
          correctCount++;
        } else {
          incorrectCount++;
        }
      });

      let lives = game.lives;
      let score = game.score;
      let gameState = game.gameState;

      if (incorrectCount > 0) {
        lives--;
      } else {
        score += correctCount * 10; // Přidání bodů za správné klávesy
      }

      if (lives <= 0) {
        gameState = "game_over";
      } else {
        gameState = "in_progress";
      }

      await collection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            espData,
            completed: true, // Nastavujeme completed na true
            lives,
            score,
            gameState,
          },
        }
      );

      return new Response(
        JSON.stringify({
          message: "Game updated successfully",
          lives,
          score,
          gameState,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } else {
      // Pokud ESP32 ještě neposlalo data, hra je stále ve stavu čekání
      return new Response(
        JSON.stringify({ message: "Game is waiting for ESP32 data" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error updating game:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  } finally {
    await client.close();
  }
}
