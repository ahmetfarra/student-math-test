"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, Bot, User, ArrowLeft } from "lucide-react"

interface StudentData {
  fullName: string
  age: string
  gradeLevel: string
  school: string
  email: string
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

export default function TestPage() {
  const router = useRouter()
  const [studentData, setStudentData] = useState<StudentData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isChatLoading, setIsChatLoading] = useState(false)

  useEffect(() => {
    // Get student data from localStorage
    const storedData = localStorage.getItem("studentData")
    if (storedData) {
      const data = JSON.parse(storedData)
      setStudentData(data)
      setIsLoading(false)
    } else {
      // Redirect back to registration if no data found
      router.push("/")
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isChatLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsChatLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          studentData,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const assistantMessage = await response.json()
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error sending message:", error)
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: "I'm sorry, I encountered an error. Let's try a simple question: What is 2 + 2?",
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsChatLoading(false)
    }
  }

  const handleBackToRegistration = () => {
    localStorage.removeItem("studentData")
    router.push("/")
  }

  const handleStartTest = () => {
    const startMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: "start",
    }
    setMessages([startMessage])
    setIsChatLoading(true)

    // Trigger the API call
    fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [startMessage],
        studentData,
      }),
    })
      .then((response) => response.json())
      .then((assistantMessage) => {
        setMessages((prev) => [...prev, assistantMessage])
      })
      .catch((error) => {
        console.error("Error:", error)
        const errorMessage: Message = {
          id: Date.now().toString(),
          role: "assistant",
          content: `Hi ${studentData?.fullName}! Let's start your ${studentData?.gradeLevel} math test. What is 3 + 4?`,
        }
        setMessages((prev) => [...prev, errorMessage])
      })
      .finally(() => {
        setIsChatLoading(false)
      })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your test...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleBackToRegistration} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Math Placement Test</h1>
              <p className="text-sm text-gray-600">Welcome, {studentData?.fullName}!</p>
            </div>
          </div>
          <div className="text-sm text-gray-500">Grade: {studentData?.gradeLevel}</div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="max-w-4xl mx-auto p-4">
        <Card className="h-[calc(100vh-200px)] flex flex-col shadow-lg border-0">
          <CardHeader className="pb-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Your Virtual Math Tutor
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col bg-gray-50">
            {/* Messages Area */}
            <div className="flex-1 pr-4 mb-4 overflow-y-auto py-4">
              <div className="space-y-6">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center gap-6">
                    <div className="flex items-start gap-3 w-full">
                      <Avatar className="h-10 w-10 border-2 border-blue-200">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                          <Bot className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-white rounded-2xl rounded-tl-md p-4 max-w-[85%] shadow-md border border-gray-100">
                        <p className="text-gray-800 leading-relaxed">
                          Hi {studentData?.fullName}! I'm your virtual math tutor. I'm here to help assess your current
                          math level with questions designed for {studentData?.gradeLevel} students. Don't worry - there
                          are no wrong answers, just learning opportunities!
                        </p>
                        <p className="text-gray-700 mt-3 text-sm">Click the button below when you're ready to begin!</p>
                      </div>
                    </div>
                    <Button
                      onClick={handleStartTest}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-full shadow-lg transform hover:scale-105 transition-all duration-200"
                    >
                      Start Math Test
                    </Button>
                  </div>
                )}

                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-start gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                  >
                    <Avatar className="h-10 w-10 border-2 border-gray-200">
                      <AvatarFallback
                        className={
                          message.role === "user"
                            ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white"
                            : "bg-gradient-to-br from-blue-500 to-indigo-600 text-white"
                        }
                      >
                        {message.role === "user" ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`rounded-2xl p-4 max-w-[85%] shadow-md ${
                        message.role === "user"
                          ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-tr-md"
                          : "bg-white text-gray-800 border border-gray-100 rounded-tl-md"
                      }`}
                    >
                      <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                ))}

                {isChatLoading && (
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 border-2 border-gray-200">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                        <Bot className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-white rounded-2xl rounded-tl-md p-4 shadow-md border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                          <div
                            className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-500">Tutor is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Input Area */}
            <div className="bg-white rounded-lg p-4 shadow-md border border-gray-200">
              <form onSubmit={handleSubmit} className="flex gap-3">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your answer here..."
                  disabled={isChatLoading}
                  className="flex-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                />
                <Button
                  type="submit"
                  disabled={isChatLoading || !input.trim()}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 rounded-lg shadow-md transform hover:scale-105 transition-all duration-200"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
