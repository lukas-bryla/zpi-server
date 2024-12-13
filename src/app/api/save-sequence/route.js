import { MongoClient, ObjectId } from "mongodb";

const uri = process.env.MONGODB_URI; // Načti MongoDB URI z prostředí

export async function POST(req) {
  let client; // Deklarace klienta na vyšší úrovni
  try {
    const { id, difficulty, nickname } = await req.json();

    if (!difficulty || typeof difficulty !== "string") {
      return new Response(
        JSON.stringify({
          error: "Invalid data format. 'difficulty' is required.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const difficultyLevels = {
      easy: 2,
      medium: 4,
      hard: 7,
      deathwish: 11,
    };

    if (!difficultyLevels[difficulty]) {
      return new Response(
        JSON.stringify({
          error:
            "Invalid difficulty level. Must be 'easy', 'medium', 'hard', or 'deathwish'.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const VALID_FREQUENCIES = [262, 294, 330, 349, 392, 440, 494];
    const sequence = Array.from(
      { length: difficultyLevels[difficulty] },
      () =>
        VALID_FREQUENCIES[Math.floor(Math.random() * VALID_FREQUENCIES.length)]
    );

    client = new MongoClient(uri); // Inicializace MongoDB klienta
    await client.connect(); // Připojení k MongoDB
    const db = client.db("memory-piano");
    const collection = db.collection("games");

    if (id) {
      // Aktualizace existující hry
      const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            sequence,
            completed: false,
            espData: null,
          },
        }
      );

      if (result.matchedCount === 0) {
        return new Response(JSON.stringify({ error: "Game not found." }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({ message: "Sequence updated successfully." }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } else {
      // Vytvoření nové hry
      const result = await collection.insertOne({
        nickname: nickname || "Anonym", // Uloží přezdívku nebo "Anonym", pokud není vyplněna
        difficulty,
        sequence,
        lives: 3, // Startovní životy
        score: 0, // Startovní skóre
        gameState: "in_progress", // Výchozí stav hry
        completed: false, // Hra zatím není dokončena
        espData: null, // Čekáme na data od ESP32
        createdAt: new Date(),
      });

      return new Response(JSON.stringify({ id: result.insertedId }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Error saving sequence:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  } finally {
    if (client) {
      await client.close(); // Zavření připojení k MongoDB
    }
  }
}
