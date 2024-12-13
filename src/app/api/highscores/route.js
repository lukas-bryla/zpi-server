import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export async function GET(req) {
  try {
    await client.connect(); // Připojení k MongoDB
    const db = client.db("memory-piano");
    const collection = db.collection("games");

    // Načti hráče a jejich skóre, seřazené od nejvyššího
    const highscores = await collection
      .find({ score: { $gt: 0 } }) // Pouze hráči se skóre větším než 0
      .project({ nickname: 1, score: 1, _id: 0 }) // Vyber pouze přezdívku a skóre
      .sort({ score: -1 }) // Seřaď podle skóre od nejvyššího
      .toArray();

    return new Response(JSON.stringify(highscores), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching highscores:", error);
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
