
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import clientPromise from '@/lib/mongodb';
import jwt from 'jsonwebtoken';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('medscheduler');
    const accounts = db.collection('accounts');

    const user = await accounts.findOne({ email });

    if (!user) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    // In a real application, you would generate a JWT here.
    let token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET as string, { expiresIn: '1h' });

    return NextResponse.json({ message: 'Login successful', token }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}