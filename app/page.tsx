import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import HomeClient from './home-client'

export default async function Page() {
  const cookieStore = cookies()

  // IMPORTANT: await this
  const supabase = await createClient(cookieStore)

  const { data: todos, error } = await supabase
    .from('todos')
    .select()

  if (error) {
    console.log("Supabase error:", JSON.stringify(error))
  }

  return <HomeClient todos={todos ?? []} />
}
