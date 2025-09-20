import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

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

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ message: 'Authorization header missing' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return NextResponse.json({ message: 'Token missing' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db('medscheduler');
    const accounts = db.collection('accounts');

    const userId = new ObjectId(token);

    const medicationData = await req.json();

    const newMedication = {
      _id: new ObjectId(),
      medication: medicationData.name,
      dosage: medicationData.dosage,
      frequency: medicationData.frequency,
      duration: {
        startDate: new Date(medicationData.startDate),
        endDate: new Date(medicationData.endDate),
      },
      notes: medicationData.notes,
      imageUrl: medicationData.image,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await accounts.updateOne(
      { _id: userId },
      { $addToSet: { chart: newMedication } }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ message: "User not found or chart not updated" }, { status: 404 });
    }

    return NextResponse.json(newMedication, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ message: 'Authorization header missing' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return NextResponse.json({ message: 'Token missing' }, { status: 401 });
    }

    const medId = req.nextUrl.searchParams.get("id");
    if (!medId) {
        return NextResponse.json({ message: 'Medication ID missing' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('medscheduler');
    const accounts = db.collection('accounts');

    const userId = new ObjectId(token);

    const result = await accounts.updateOne(
      { _id: userId },
      { $unset: { chart: { _id: new ObjectId(medId) } } } // originally $pull
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ message: "User not found or medication not found in chart" }, { status: 404 });
    }

    return NextResponse.json({ message: "Medication deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ message: 'Authorization header missing' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return NextResponse.json({ message: 'Token missing' }, { status: 401 });
        }

        const client = await clientPromise;
        const db = client.db('medscheduler');
        const accounts = db.collection('accounts');

        const userId = new ObjectId(token);
        const medicationData = await req.json();
        const medId = ObjectId.createFromHexString(medicationData._id);

        const result = await accounts.updateOne(
            { _id: userId, "chart._id": medId },
            {
                $set: {
                    "chart.$.medication": medicationData.name,
                    "chart.$.dosage": medicationData.dosage,
                    "chart.$.frequency": medicationData.frequency,
                    "chart.$.duration.startDate": new Date(medicationData.startDate),
                    "chart.$.duration.endDate": new Date(medicationData.endDate),
                    "chart.$.notes": medicationData.notes,
                    "chart.$.imageUrl": medicationData.image,
                    "chart.$.updatedAt": new Date(),
                }
            }
        );

        if (result.modifiedCount === 0) {
            return NextResponse.json({ message: "User not found or medication not updated" }, { status: 404 });
        }

        return NextResponse.json({ message: "Medication updated successfully" }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
