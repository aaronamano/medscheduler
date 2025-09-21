import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import jwt from 'jsonwebtoken';

async function shortenUrl(longUrl: string): Promise<string | null> {
  try {
    const apiUrl = `https://api.shrtco.de/v2/shorten?url=${encodeURIComponent(longUrl)}`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`shrtco.de API error: ${response.status} - ${errorData.error}`);
      return null;
    }

    const data = await response.json();
    return data.result.full_short_link;
  } catch (error) {
    console.error('Error shortening URL:', error);
    return null;
  }
}

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

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    } catch (error) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    if (typeof decoded === 'string' || !decoded.userId) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db('medscheduler');
    const accounts = db.collection('accounts');

    const userId = new ObjectId(decoded.userId);

    const medicationData = await req.json();

    let imageUrl = medicationData.image;
    if (imageUrl) {
      const shortUrl = await shortenUrl(imageUrl);
      if (shortUrl) {
        imageUrl = shortUrl;
      }
    }

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
      imageUrl: imageUrl,
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

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    } catch (error) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    if (typeof decoded === 'string' || !decoded.userId) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const medId = req.nextUrl.searchParams.get("id");
    if (!medId) {
        return NextResponse.json({ message: 'Medication ID missing' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('medscheduler');
    const accounts = db.collection('accounts');

    const userId = new ObjectId(decoded.userId);

    const result = await accounts.updateOne(
      { _id: userId },
      { $pull: { chart: { _id: new ObjectId(medId) } } }
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

        let decoded;
        try {
          decoded = jwt.verify(token, process.env.JWT_SECRET as string);
        } catch (error) {
          return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
        }
    
        if (typeof decoded === 'string' || !decoded.userId) {
          return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
        }

        const client = await clientPromise;
        const db = client.db('medscheduler');
        const accounts = db.collection('accounts');

        const userId = new ObjectId(decoded.userId);
        const medicationData = await req.json();
        const medId = ObjectId.createFromHexString(medicationData._id);

        let imageUrl = medicationData.image;
        if (imageUrl) {
            const shortUrl = await shortenUrl(imageUrl);
            if (shortUrl) {
                imageUrl = shortUrl;
            }
        }

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
                    "chart.$.imageUrl": imageUrl,
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