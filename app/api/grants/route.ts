import { NextResponse } from "next/server";

const SHEET_ID = process.env.SHEET_ID;
const API_KEY = process.env.API_KEY;
const RANGE = process.env.RANGE;

export async function GET() {
  if (!SHEET_ID || !API_KEY) {
    console.error("Missing environment variables");
    return NextResponse.json(
      { error: "Missing environment variables" },
      { status: 500 }
    );
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google Sheets API error:", errorText);
      return NextResponse.json(
        { error: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch data from Google Sheets:", error);
    return NextResponse.json(
      { error: "Failed to fetch data from Google Sheets" },
      { status: 500 }
    );
  }
}
