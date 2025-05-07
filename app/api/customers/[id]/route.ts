/* eslint-disable */
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/mongodb";
import { ObjectId } from "mongodb";
import { getAuth } from "firebase-admin/auth";

async function verifyAuthToken(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }
    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error("Error verifying auth token:", error);
    return null;
  }
}

type Params = { params: { id: string } };

export async function GET(
  request: NextRequest,
  { params }: Params
): Promise<NextResponse> {
  try {
    const decodedToken = await verifyAuthToken(request);
    if (!decodedToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const customerId = params.id;

    if (!ObjectId.isValid(customerId)) {
      return NextResponse.json({ error: "Invalid customer ID" }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const customer = await db.collection("customers").findOne({ _id: new ObjectId(customerId) });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    if (decodedToken.role === "client" && customer.userId !== decodedToken.uid) {
      return NextResponse.json({ error: "Unauthorized to access this customer" }, { status: 403 });
    }

    const transformedCustomer = {
      id: customer._id.toString(),
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      userId: customer.userId,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    };

    return NextResponse.json({ customer: transformedCustomer });
  } catch (error) {
    console.error("Error fetching customer:", error);
    return NextResponse.json({ error: "Failed to fetch customer" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: Params
): Promise<NextResponse> {
  try {
    const decodedToken = await verifyAuthToken(request);
    if (!decodedToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (decodedToken.role !== "admin" && decodedToken.role !== "worker") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const customerId = params.id;

    if (!ObjectId.isValid(customerId)) {
      return NextResponse.json({ error: "Invalid customer ID" }, { status: 400 });
    }

    const body = await request.json();
    const { name, email, phone, address } = body;

    if (!name || !email || !phone) {
      return NextResponse.json({ error: "Name, email, and phone are required" }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const existingCustomer = await db.collection("customers").findOne({ _id: new ObjectId(customerId) });

    if (!existingCustomer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const updatedCustomer = {
      name,
      email,
      phone,
      address,
      updatedAt: new Date(),
    };

    await db.collection("customers").updateOne(
      { _id: new ObjectId(customerId) },
      { $set: updatedCustomer }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating customer:", error);
    return NextResponse.json({ error: "Failed to update customer" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: Params
): Promise<NextResponse> {
  try {
    const decodedToken = await verifyAuthToken(request);
    if (!decodedToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (decodedToken.role !== "admin" && decodedToken.role !== "worker") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const customerId = params.id;

    if (!ObjectId.isValid(customerId)) {
      return NextResponse.json({ error: "Invalid customer ID" }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const existingCustomer = await db.collection("customers").findOne({ _id: new ObjectId(customerId) });

    if (!existingCustomer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    await db.collection("customers").deleteOne({ _id: new ObjectId(customerId) });
    await db.collection("vehicles").deleteMany({ customerId });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting customer:", error);
    return NextResponse.json({ error: "Failed to delete customer" }, { status: 500 });
  }
}