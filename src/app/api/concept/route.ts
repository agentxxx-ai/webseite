import { NextResponse } from "next/server";

export const runtime = "nodejs";

const recipient = "kontakt@agentxxx.ai";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Einfacher Spam-Schutz
    if (typeof body.website === "string" && body.website.trim() !== "") {
      return NextResponse.json({ success: true });
    }

    const {
      name,
      age,
      appearance,
      interests,
      boundaries,
      time,
      email,
      consent,
      lang,
    } = body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      name.length > 100 ||
      !Number.isInteger(age) ||
      age < 18 ||
      age > 100 ||
      typeof appearance !== "string" ||
      !appearance.trim() ||
      appearance.length > 100 ||
      typeof time !== "string" ||
      !time.trim() ||
      time.length > 100 ||
      typeof email !== "string" ||
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      typeof interests !== "string" ||
      interests.length > 2000 ||
      typeof boundaries !== "string" ||
      boundaries.length > 2000 ||
      consent !== true ||
      !["de", "en"].includes(lang)
    ) {
      return NextResponse.json(
        { error: "Invalid form data" },
        { status: 400 },
      );
    }

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL;

    if (!apiKey || !from) {
      console.error("Resend environment variables are missing.");

      return NextResponse.json(
        { error: "Email service is not configured." },
        { status: 500 },
      );
    }

    const german = lang === "de";

    const subject = german
      ? `Neue Konzeptanfrage von ${name}`
      : `New concept request from ${name}`;

    const entries = [
      ["Name", name],
      ["Age / Alter", String(age)],
      ["Appearance / Erscheinungsbild", appearance],
      ["Interests / Interessen", interests || "Keine Angabe"],
      ["Boundaries / Grenzen", boundaries || "Keine Angabe"],
      ["Time / Zeitaufwand", time],
      ["Email", email],
    ];

    const html = `
      <h2>${german ? "Neue Konzeptanfrage" : "New concept request"}</h2>
      <table cellpadding="8" cellspacing="0" border="1"
        style="border-collapse:collapse;border-color:#ddd;">
        ${entries
          .map(
            ([label, value]) => `
              <tr>
                <th align="left">${escapeHtml(label)}</th>
                <td>${escapeHtml(value).replace(/\n/g, "<br>")}</td>
              </tr>
            `,
          )
          .join("")}
      </table>
      <p>${german ? "Datenschutzzustimmung wurde erteilt." : "Privacy consent was given."}</p>
    `;

    const text = entries
      .map(([label, value]) => `${label}: ${value}`)
      .join("\n");

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [recipient],
        reply_to: email,
        subject,
        html,
        text,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Resend error:", error);

      return NextResponse.json(
        { error: "Email could not be sent." },
        { status: 502 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Concept form error:", error);

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
