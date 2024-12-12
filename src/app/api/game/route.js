import { MongoClient, ObjectId } from "mongodb";

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return new Response(JSON.stringify({ error: "Missing game ID" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
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

    // Výpočet výsledků
    const correctKeys = [];
    const incorrectKeys = [];
    let totalCorrect = 0;
    let totalIncorrect = 0;

    if (game.espData) {
      game.sequence.forEach((key, index) => {
        if (game.espData[index] === key) {
          correctKeys.push(key);
          totalCorrect++;
        } else {
          incorrectKeys.push(game.espData[index]);
          totalIncorrect++;
        }
      });
    }

    return new Response(
      JSON.stringify({
        ...game,
        correctKeys,
        incorrectKeys,
        totalCorrect,
        totalIncorrect,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching game:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  } finally {
    await client.close();
  }
}
