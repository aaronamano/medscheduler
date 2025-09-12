import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("medscheduler");
    const medicineNames1 = await db.collection("medicines").distinct("Name");
    const medicineNames2 = await db.collection("medicines2").distinct("drug");
    const medicineNames = [...new Set([...medicineNames1, ...medicineNames2])].sort();
    return NextResponse.json(medicineNames);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Unable to fetch medicines" }, { status: 500 });
  }
}
