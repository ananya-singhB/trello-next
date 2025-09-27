"use client"
import { useState } from "react"
import { supabaseClient } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function Register() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const router = useRouter()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await supabaseClient.auth.signUp({ email, password })
    if (error) alert(error.message)
    else router.push("/login")
  }

  return (
    <form
      onSubmit={onSubmit}
      className="max-w-md mx-auto mt-10 p-8 bg-white rounded-lg shadow flex flex-col items-center"
    >
      <h1 className="text-3xl font-bold mb-6">Register</h1>
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
        type="submit"
        className="w-full py-2 bg-blue-500 text-white font-semibold rounded hover:bg-blue-700 transition cursor-pointer"
      >
        Register
      </button>

      <p className="mt-4 text-gray-600 text-sm">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-blue-500 hover:underline font-medium"
        >
          Login here
        </Link>
      </p>
    </form>
  )
}
