import { MongoClient } from "mongodb";
import { NextResponse } from "next/server";

const uri = process.env.MONGODB_URI; // Load MongoDB URI from environment variables

// Define allowed fields and their expected types
const allowedFields = [
  "coPpmCount",
  "methanePercentage",
  "fireDistanceCm",
  "temperatureCelsius",
  "isFirePresent",
];
const fieldTypes = {
  coPpmCount: "number",
  methanePercentage: "number",
  fireDistanceCm: "number",
  temperatureCelsius: "number",
  isFirePresent: "boolean",
};

// Named export for POST method
export async function POST(request) {
  let client;
  try {
    // Parse the request body
    const data = await request.json();

    // Check if at least one allowed field is present
    const hasData = allowedFields.some((field) => field in data);
    if (!hasData) {
      return NextResponse.json({ error: "No data provided" }, { status: 400 });
    }

    // Validate the types of provided fields
    for (const field of allowedFields) {
      if (field in data && typeof data[field] !== fieldTypes[field]) {
        return NextResponse.json(
          { error: `Invalid type for ${field}` },
          { status: 400 }
        );
      }
    }

    // Connect to MongoDB
    client = new MongoClient(uri);
    await client.connect();
    const db = client.db("memory-piano");
    const collection = db.collection("environmentalData");

    // Create document with only allowed fields and a timestamp
    const document = { timestamp: new Date() };
    allowedFields.forEach((field) => {
      if (field in data) {
        document[field] = data[field];
      }
    });

    // Insert the document into the collection
    const result = await collection.insertOne(document);

    // Return success response
    return NextResponse.json({
      message: "Data saved successfully",
      id: result.insertedId,
    });
  } catch (error) {
    console.error("Error saving data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    // Ensure the MongoDB connection is closed
    if (client) {
      await client.close();
    }
  }
}
