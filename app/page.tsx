import { createClient } from "@/utils/supabase/server";
import HomeClient from "./HomeClient";

export default async function Page() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <HomeClient user={user} />;
}
