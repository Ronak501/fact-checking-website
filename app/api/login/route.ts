import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // IMPORTANT
);

export async function POST(req: Request) {
    const { email, password } = await req.json();

    const { data, error } = await supabase
        .from("users")
        .select("id, email")
        .eq("email", email)
        .filter(
            "password_hash",
            "eq",
            supabase.rpc("crypt", {
                password,
            })
        );

    if (error || !data.length) {
        return NextResponse.json(
            { error: "Invalid credentials" },
            { status: 401 }
        );
    }

    return NextResponse.json({
        message: "Login successful",
        user: data[0],
    });
}
