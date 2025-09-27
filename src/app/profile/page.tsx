"use client"

import { useEffect, useState } from "react"
import { supabaseClient } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"

export default function Profile() {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function fetchUser() {
      const { data, error } = await supabaseClient.auth.getUser()
      if (error) {
        console.error("Error fetching user:", error)
        router.replace("/login")
        return
      }
      console.log("user data", data)
      setUserEmail(data.user?.email ?? null)
    }
    fetchUser()
  }, [])

  async function handleLogout() {
    const { error } = await supabaseClient.auth.signOut()
    if (error) {
      console.error("Logout error:", error)
      return
    }
    router.push("/login")
  }

  if (!userEmail) return <div>Loading user info...</div>

  return (
    <div className="max-w-md mx-auto mt-16 p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-4">User Profile</h1>
      <p className="mb-6">Email: <span className="font-mono">{userEmail}</span></p>
      <button
        onClick={handleLogout}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
      >
        Log Out
      </button>
    </div>
  )
}
