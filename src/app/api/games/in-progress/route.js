import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export async function GET(req) {
  try {
    await client.connect();
    const db = client.db("memory-piano");
    const collection = db.collection("games");

    // Najít všechny hry ve stavu "in_progress"
    const inProgressGames = await collection
      .find({ gameState: "in_progress" })
      .project({
        _id: 1, // Vracíme ID hry
        nickname: 1, // Vracíme přezdívku hráče
        difficulty: 1, // Obtížnost hry
        sequence: 1, // Sekvenci kláves
        lives: 1, // Počet životů
        score: 1, // Aktuální skóre
      })
      .toArray();

    return new Response(JSON.stringify(inProgressGames), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching in-progress games:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  } finally {
    if (client) {
      await client.close();
    }
  }
}
