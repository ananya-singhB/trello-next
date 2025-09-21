"use client"
import { useState } from "react"
import { supabaseClient } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const router = useRouter()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    })
    if (error) {
      alert(error.message)
    } else {
      // Get the logged-in user's ID
      const { data, error: userError } = await supabaseClient.auth.getUser()
      if (userError) {
        alert(userError.message)
      } else {
        console.log("Login successful", data)
        const userId = data.user?.id
        console.log("User ID:", userId)
        // You can use userId for further actions, e.g., fetch boards
        localStorage.setItem("userId", userId)
        router.push("/board")
      }
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-10 text-center flex flex-col items-center rounded-lg shadow p-8 bg-white max-w-md mx-auto"
    >
      <h1 className="text-3xl font-bold mb-6">Login</h1>

      <input
        className="w-full px-4 py-2 mb-4 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        className="w-full px-4 py-2 mb-6 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button
        className="w-full py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition cursor-pointer"
        type="submit"
      >
        Login
      </button>
      <p className="mt-4 text-gray-600 text-sm">
        Don't have an account?{" "}
        <Link
          href="/register"
          className="text-blue-600 hover:underline font-medium"
        >
          Register here
        </Link>
      </p>
    </form>
  )
}
