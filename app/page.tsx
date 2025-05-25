"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookOpen, Calculator } from "lucide-react"

export default function LandingPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    fullName: "",
    age: "",
    gradeLevel: "",
    school: "",
    email: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Store student data in localStorage for the test session
    localStorage.setItem("studentData", JSON.stringify(formData))

    // Simulate form processing
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Redirect to the main testing interface
    router.push("/test")
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const isFormValid = formData.fullName && formData.age && formData.gradeLevel && formData.email

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Calculator className="h-8 w-8 text-blue-600" />
            <BookOpen className="h-8 w-8 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Math Placement Test</h1>
          <p className="text-gray-600">Let's find your perfect math level!</p>
        </div>

        {/* Registration Form */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-center">Student Registration</CardTitle>
            <CardDescription className="text-center">
              Please fill out your information to begin the placement test
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange("fullName", e.target.value)}
                  required
                />
              </div>

              {/* Age */}
              <div className="space-y-2">
                <Label htmlFor="age">Age *</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="Enter your age"
                  min="5"
                  max="18"
                  value={formData.age}
                  onChange={(e) => handleInputChange("age", e.target.value)}
                  required
                />
              </div>

              {/* Grade Level */}
              <div className="space-y-2">
                <Label htmlFor="gradeLevel">Grade Level *</Label>
                <Select onValueChange={(value) => handleInputChange("gradeLevel", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your grade level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kindergarten">Kindergarten</SelectItem>
                    <SelectItem value="1st">1st Grade</SelectItem>
                    <SelectItem value="2nd">2nd Grade</SelectItem>
                    <SelectItem value="3rd">3rd Grade</SelectItem>
                    <SelectItem value="4th">4th Grade</SelectItem>
                    <SelectItem value="5th">5th Grade</SelectItem>
                    <SelectItem value="6th">6th Grade</SelectItem>
                    <SelectItem value="7th">7th Grade</SelectItem>
                    <SelectItem value="8th">8th Grade</SelectItem>
                    <SelectItem value="9th">9th Grade</SelectItem>
                    <SelectItem value="10th">10th Grade</SelectItem>
                    <SelectItem value="11th">11th Grade</SelectItem>
                    <SelectItem value="12th">12th Grade</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* School (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="school">School (Optional)</Label>
                <Input
                  id="school"
                  type="text"
                  placeholder="Enter your school name"
                  value={formData.school}
                  onChange={(e) => handleInputChange("school", e.target.value)}
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                />
              </div>

              {/* Submit Button */}
              <Button type="submit" className="w-full mt-6" disabled={!isFormValid || isSubmitting}>
                {isSubmitting ? "Starting Test..." : "Begin Placement Test"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          The test will adapt to your skill level as you progress
        </p>
      </div>
    </div>
  )
}
