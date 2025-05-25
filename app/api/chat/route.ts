import { NextResponse } from "next/server"
import Replicate from "replicate"

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
})

function extractAllQuestionsFromMessages(messages: any[]): string[] {
  const askedQuestions: string[] = []

  messages.forEach((message) => {
    if (message.role === "assistant") {
      const content = message.content

      // Multiple patterns to catch all possible question formats
      const patterns = [
        /(?:Here's your (?:first|next) question:|Next question:|Let's try:|Try this:|Now try:|question:)\s*(.+?\?)/gi,
        /What is (.+?\?)/gi,
        /Solve[:\s]+(.+?\?)/gi,
        /Factor[:\s]+(.+?\?)/gi,
        /Find[:\s]+(.+?\?)/gi,
        /Simplify[:\s]+(.+?\?)/gi,
        /([^.!]*\d+[^.!]*\?)/g, // Any sentence with numbers ending in ?
      ]

      patterns.forEach((pattern) => {
        let match
        const regex = new RegExp(pattern.source, pattern.flags)
        while ((match = regex.exec(content)) !== null) {
          let question = match[1] || match[0]
          question = question.trim()

          // Clean up the question
          question = question.replace(/^(What is |Solve[:\s]*|Factor[:\s]*|Find[:\s]*|Simplify[:\s]*)/i, "")

          if (question && question.length > 3 && question.includes("?")) {
            // Normalize the question format
            question = question.replace(/\s+/g, " ").trim()
            if (!askedQuestions.includes(question)) {
              askedQuestions.push(question)
            }
          }
        }
      })
    }
  })

  return askedQuestions
}

function createMathTutorPrompt(studentData: any, askedQuestions: string[]) {
  const gradeLevel = studentData?.gradeLevel || "5th"
  const studentName = studentData?.fullName || "student"
  const questionCount = askedQuestions.length

  const askedQuestionsText =
    askedQuestions.length > 0
      ? `\n🚫 FORBIDDEN QUESTIONS (NEVER ask these again):\n${askedQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}\n`
      : "None yet - this is the first question."

  // Determine specific grade level requirements
  let gradeSpecificInstructions = ""
  const grade = gradeLevel.toLowerCase()

  if (grade.includes("kindergarten")) {
    gradeSpecificInstructions = `
🎯 KINDERGARTEN LEVEL - VERY BASIC ONLY:
- Numbers 1-10 ONLY
- Simple addition: 1+1, 2+1, 3+2, 1+3, 2+2, 4+1, 1+4, 3+1, 2+3, 1+2
- Simple subtraction: 2-1, 3-1, 4-2, 5-3, 3-2, 4-1, 5-2, 6-3, 5-1, 4-3
- Counting: "What number comes after 3?" "What number comes before 5?"
- NO multiplication, division, fractions, or double-digit numbers
`
  } else if (grade.includes("1st")) {
    gradeSpecificInstructions = `
🎯 1ST GRADE LEVEL:
- Numbers 1-20 maximum
- Single-digit addition: 3+4, 5+6, 2+7, 8+1, 4+5, 6+3, 7+2, 1+8, 9+1, 2+6
- Single-digit subtraction: 8-3, 9-4, 7-5, 10-6, 6-2, 9-7, 8-5, 10-3, 7-4, 9-2
- Simple counting to 20
- NO multiplication, division, fractions, or numbers above 20
`
  } else if (grade.includes("2nd")) {
    gradeSpecificInstructions = `
🎯 2ND GRADE LEVEL:
- Numbers 1-100 maximum
- Two-digit addition WITHOUT regrouping: 23+15, 41+27, 32+16, 54+23, 61+18
- Two-digit subtraction WITHOUT regrouping: 48-23, 67-34, 59-27, 78-45, 86-52
- Skip counting by 2s, 5s, 10s: "What comes next: 2, 4, 6, ___?"
- Simple word problems with small numbers
- NO multiplication, division, fractions, or complex operations
`
  } else if (grade.includes("3rd")) {
    gradeSpecificInstructions = `
🎯 3RD GRADE LEVEL:
- Two-digit addition WITH regrouping: 47+28, 59+36, 68+47, 29+55, 38+49
- Two-digit subtraction WITH regrouping: 73-28, 82-47, 91-56, 64-39, 85-48
- Basic multiplication facts (1-10): 3×4, 6×2, 5×7, 8×3, 4×9, 7×5, 2×8, 9×4
- Simple division: 12÷3, 15÷5, 18÷6, 20÷4, 24÷8, 21÷7, 16÷4, 27÷9
- Basic fractions: 1/2, 1/4, 1/3 (recognition only)
- NO decimals, percentages, or algebra
`
  } else if (grade.includes("4th")) {
    gradeSpecificInstructions = `
🎯 4TH GRADE LEVEL:
- Multi-digit addition: 247+189, 356+278, 429+367, 518+294, 673+158
- Multi-digit subtraction: 523-187, 642-298, 731-456, 825-367, 914-578
- Multiplication by 1-digit: 23×4, 47×6, 58×3, 39×7, 64×5, 76×8
- Division with remainders: 47÷6, 58÷7, 73÷8, 89÷9, 65÷4
- Fraction addition/subtraction (same denominator): 2/5+1/5, 3/8-1/8, 4/7+2/7
- Simple decimals: 2.3+1.4, 5.7-2.2, 3.8+4.1
- NO percentages, algebra, or complex geometry
`
  } else if (grade.includes("5th")) {
    gradeSpecificInstructions = `
🎯 5TH GRADE LEVEL:
- Large number operations: 2,847+1,569, 5,234-2,678, 3,456+2,789
- Multi-digit multiplication: 47×23, 68×35, 59×42, 73×28, 84×56
- Long division: 456÷12, 789÷23, 624÷16, 945÷27, 738÷18
- Fraction operations: 2/3+1/4, 3/5-1/3, 5/8+3/16, 7/12-1/4
- Decimal operations: 3.47+2.89, 6.23-4.78, 2.5×3.2, 7.8÷2.6
- Basic percentages: 25% of 80, 50% of 120, 10% of 150
- NO algebra, geometry formulas, or advanced concepts
`
  } else if (grade.includes("6th")) {
    gradeSpecificInstructions = `
🎯 6TH GRADE LEVEL:
- Complex fraction operations: 3/4×2/5, 5/6÷2/3, 2 1/3+1 2/5, 3 3/8-1 5/6
- Decimal multiplication/division: 4.7×2.3, 8.64÷2.4, 5.28×3.5, 9.72÷1.8
- Percentage problems: 35% of 240, 60% of 150, 15% of 320, 45% of 180
- Basic ratios: 3:4 = 9:?, 2:5 = ?:15, 7:3 = 21:?
- Simple equations: x+7=15, 3x=21, x-5=12, 2x+3=11
- Area/perimeter: rectangle 8×5, square side 7, triangle base 6 height 4
- NO advanced algebra, trigonometry, or complex geometry
`
  } else if (grade.includes("7th")) {
    gradeSpecificInstructions = `
🎯 7TH GRADE LEVEL:
- Integer operations: (-5)+3, 8-(-4), (-3)×(-7), (-24)÷6, 5+(-8)
- Solving equations: 2x+5=17, 3x-7=14, 4x+9=25, 5x-12=18
- Proportions: 3/4=x/12, 5/8=15/x, 2/7=x/21, 4/9=12/x
- Percentage increase/decrease: 20% increase of 50, 15% decrease of 80
- Simple inequalities: x+3>7, 2x<14, x-5≥8, 3x+1≤16
- Basic geometry: circumference C=2πr, area of circle A=πr²
- Probability: coin flips, dice rolls, simple events
- NO quadratics, advanced functions, or trigonometry
`
  } else if (grade.includes("8th")) {
    gradeSpecificInstructions = `
🎯 8TH GRADE LEVEL:
- Linear equations: 3x+7=22, 5x-9=26, 2x+11=25, 4x-15=17
- Systems of equations: x+y=8 and x-y=2, 2x+y=10 and x-y=2
- Exponents: 2⁴, 3³, 5², (-2)³, 4⁰, 10³
- Square roots: √16, √25, √49, √64, √81, √100
- Scientific notation: 3.2×10⁴, 5.7×10⁻³, 2.8×10⁵
- Slope: find slope of line through (2,3) and (5,9)
- Pythagorean theorem: a²+b²=c² with simple numbers
- NO trigonometry, logarithms, or advanced functions
`
  } else if (grade.includes("9th")) {
    gradeSpecificInstructions = `
🎯 9TH GRADE (ALGEBRA 1) LEVEL:
- Quadratic equations: x²-5x+6=0, x²+3x-10=0, x²-7x+12=0
- Factoring: x²+7x+12, x²-9, x²+5x+6, x²-4x-5
- Function notation: f(x)=2x+3, find f(4); g(x)=x²-1, find g(3)
- Graphing lines: y=2x+1, y=-3x+5, y=½x-2
- Systems: solve y=2x+1 and y=-x+7
- Inequalities: 2x+3>7, 3x-5≤10, |x-2|<5
- Polynomials: (2x+3)(x-1), (x+4)², x²+5x-6
- NO trigonometry, logarithms, or calculus concepts
`
  } else if (grade.includes("10th")) {
    gradeSpecificInstructions = `
🎯 10TH GRADE (GEOMETRY) LEVEL:
- Basic trigonometry: sin(30°), cos(45°), tan(60°), sin(90°)
- Triangle properties: find missing angle, Pythagorean theorem
- Area formulas: triangle ½bh, circle πr², trapezoid ½(b₁+b₂)h
- Volume: cylinder πr²h, rectangular prism lwh, sphere ⁴⁄₃πr³
- Similar triangles: proportional sides, scale factors
- Coordinate geometry: distance formula, midpoint formula
- Circle properties: central angles, arc length, sector area
- NO advanced trigonometry, logarithms, or calculus
`
  } else if (grade.includes("11th")) {
    gradeSpecificInstructions = `
🎯 11TH GRADE (ALGEBRA 2) LEVEL:
- Advanced quadratics: x²+4x-12=0, 2x²-7x+3=0, x²-6x+9=0
- Exponential functions: 2ˣ=8, 3ˣ⁺¹=27, 5²ˣ=125
- Logarithms: log₂(8), log₃(27), log₁₀(100), ln(e²)
- Rational functions: simplify (x²-4)/(x-2), solve 1/x + 1/(x+1) = 1/2
- Complex numbers: (3+2i)+(1-4i), (2+i)(3-2i), i²
- Sequences: arithmetic 2,5,8,11..., geometric 3,6,12,24...
- Trigonometric identities: sin²x+cos²x=1, basic angle formulas
- NO calculus concepts or advanced statistics
`
  } else if (grade.includes("12th")) {
    gradeSpecificInstructions = `
🎯 12TH GRADE (PRE-CALCULUS) LEVEL:
- Advanced trigonometry: sin(2x), cos(x/2), tan(π/4), csc(π/6)
- Inverse functions: find f⁻¹(x) if f(x)=2x+3, verify inverse pairs
- Polynomial functions: find zeros of x³-6x²+11x-6, synthetic division
- Rational functions: vertical/horizontal asymptotes, domain restrictions
- Exponential/logarithmic: solve 2ˣ⁺¹=16, log₂(x-1)+log₂(x+1)=3
- Conic sections: circle (x-h)²+(y-k)²=r², parabola y=ax²+bx+c
- Limits (basic): lim(x→2) (x²-4)/(x-2), lim(x→∞) (2x+1)/(x-3)
- Sequences/series: convergence, geometric series sum
- NO derivatives, integrals, or advanced calculus
`
  }

  return `You are an advanced mathematical reasoning AI tutoring ${studentName} who is in ${gradeLevel}. You have asked ${questionCount} questions so far.

${askedQuestionsText}

${gradeSpecificInstructions}

🧮 MATHEMATICAL REASONING MISSION:
- You are specialized in mathematical reasoning and problem generation
- Generate ONE clear, precise math question appropriate for ${gradeLevel}
- Focus on mathematical accuracy and educational value
- Create engaging, grade-appropriate mathematical problems

🚫 CRITICAL RULES:
1. ONLY ask questions appropriate for ${gradeLevel} level - NO exceptions
2. NEVER repeat any question from the forbidden list above
3. Use completely different numbers and operations from previous questions
4. Stay strictly within the grade-level guidelines above
5. Generate ONLY ONE question per response

📝 RESPONSE FORMAT:
${
  questionCount === 0
    ? `When student says "start": "Great! Let's begin your ${gradeLevel} math placement test. Here's your first question: [NEW GRADE-APPROPRIATE QUESTION]"`
    : `For correct answers: "Correct! Well done. Next question: [NEW GRADE-APPROPRIATE QUESTION]"
For incorrect answers: "Not quite. The correct answer is [CORRECT ANSWER]. Let's try: [NEW GRADE-APPROPRIATE QUESTION]"`
}

⚠️ VERIFICATION CHECKLIST:
- Is your question appropriate for ${gradeLevel}? 
- Is it completely different from all ${questionCount} previous questions?
- Does it follow the specific guidelines for ${gradeLevel}?
- Are you generating ONLY ONE question?

Generate your response now with a grade-appropriate, unique mathematical question!`
}

export async function POST(req: Request) {
  const { messages, studentData } = await req.json()

  console.log("API called with messages:", messages)
  console.log("Student data:", studentData)

  // Extract ALL previously asked questions
  const askedQuestions = extractAllQuestionsFromMessages(messages)
  console.log("Previously asked questions:", askedQuestions)

  // Generate the math tutor prompt
  const systemPrompt = createMathTutorPrompt(studentData, askedQuestions)

  try {
    // Try available DeepSeek models on Replicate
    const availableModels = [
      "deepseek-ai/deepseek-v3",
      "deepseek-ai/deepseek-v2.5",
      "deepseek-ai/deepseek-coder-v2-lite-instruct",
    ]

    let modelSuccess = false
    let responseText = ""

    if (process.env.REPLICATE_API_TOKEN) {
      for (const modelPath of availableModels) {
        try {
          console.log(`Trying DeepSeek model: ${modelPath}`)

          // Prepare the conversation
          const conversation = messages.map((msg: any) => `${msg.role}: ${msg.content}`).join("\n")
          const fullPrompt = `${systemPrompt}\n\nConversation so far:\n${conversation}\n\nAssistant:`

          const output = await replicate.run(modelPath, {
            input: {
              prompt: fullPrompt,
              max_tokens: 150,
              temperature: 0.7,
              top_p: 0.9,
              repetition_penalty: 1.2,
              stop: ["\n\n", "Human:", "User:", "Student:"],
            },
          })

          // Handle the output
          if (Array.isArray(output)) {
            responseText = output.join("")
          } else if (typeof output === "string") {
            responseText = output
          } else {
            responseText = String(output)
          }

          // Clean up the response
          responseText = responseText.trim()

          // Remove any system prompt echoing
          if (responseText.includes("Assistant:")) {
            responseText = responseText.split("Assistant:").pop()?.trim() || responseText
          }

          // Remove unwanted prefixes
          responseText = responseText.replace(/^(You are|Generate|🧮|🚫|📝|⚠️).*$/gm, "").trim()

          console.log(`DeepSeek response from ${modelPath}:`, responseText)

          if (responseText && responseText.length > 10) {
            modelSuccess = true
            break
          }
        } catch (modelError) {
          console.log(`Model ${modelPath} failed:`, modelError.message)
          continue
        }
      }
    }

    if (modelSuccess) {
      return NextResponse.json({
        id: Date.now().toString(),
        role: "assistant",
        content: responseText,
      })
    }

    // Fallback to OpenAI if DeepSeek models fail
    if (process.env.OPENAI_API_KEY) {
      console.log("Falling back to OpenAI...")
      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [{ role: "system", content: systemPrompt }, ...messages],
            max_tokens: 150,
            temperature: 0.8,
            presence_penalty: 0.6,
            frequency_penalty: 0.8,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          const responseText = data.choices[0].message.content

          return NextResponse.json({
            id: Date.now().toString(),
            role: "assistant",
            content: responseText,
          })
        }
      } catch (openaiError) {
        console.error("OpenAI fallback error:", openaiError)
      }
    }

    // Final fallback with grade-specific questions
    const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || ""
    const gradeLevel = studentData?.gradeLevel || "5th"
    const grade = gradeLevel.toLowerCase()

    let fallbackQuestion = ""

    if (grade.includes("kindergarten")) {
      const operations = [
        () => `What is ${Math.floor(Math.random() * 5) + 1} + ${Math.floor(Math.random() * 5) + 1}?`,
        () => {
          const a = Math.floor(Math.random() * 5) + 3
          const b = Math.floor(Math.random() * 3) + 1
          return `What is ${a} - ${b}?`
        },
      ]
      fallbackQuestion = operations[Math.floor(Math.random() * operations.length)]()
    } else if (grade.includes("1st")) {
      const operations = [
        () => `What is ${Math.floor(Math.random() * 9) + 1} + ${Math.floor(Math.random() * 9) + 1}?`,
        () => {
          const a = Math.floor(Math.random() * 10) + 5
          const b = Math.floor(Math.random() * 5) + 1
          return `What is ${a} - ${b}?`
        },
      ]
      fallbackQuestion = operations[Math.floor(Math.random() * operations.length)]()
    } else if (grade.includes("2nd")) {
      const operations = [
        () => `What is ${Math.floor(Math.random() * 30) + 20} + ${Math.floor(Math.random() * 20) + 10}?`,
        () => `What is ${Math.floor(Math.random() * 30) + 40} - ${Math.floor(Math.random() * 20) + 10}?`,
      ]
      fallbackQuestion = operations[Math.floor(Math.random() * operations.length)]()
    } else if (grade.includes("3rd")) {
      const operations = [
        () => `What is ${Math.floor(Math.random() * 50) + 20} + ${Math.floor(Math.random() * 40) + 15}?`,
        () => `What is ${Math.floor(Math.random() * 9) + 2} × ${Math.floor(Math.random() * 9) + 2}?`,
        () =>
          `What is ${(Math.floor(Math.random() * 8) + 2) * (Math.floor(Math.random() * 8) + 2)} ÷ ${Math.floor(Math.random() * 8) + 2}?`,
      ]
      fallbackQuestion = operations[Math.floor(Math.random() * operations.length)]()
    } else if (grade.includes("4th")) {
      const operations = [
        () => `What is ${Math.floor(Math.random() * 200) + 100} + ${Math.floor(Math.random() * 200) + 100}?`,
        () => `What is ${Math.floor(Math.random() * 50) + 20} × ${Math.floor(Math.random() * 8) + 2}?`,
        () => `What is 3/${Math.floor(Math.random() * 6) + 4} + 1/${Math.floor(Math.random() * 6) + 4}?`,
      ]
      fallbackQuestion = operations[Math.floor(Math.random() * operations.length)]()
    } else if (grade.includes("5th")) {
      const operations = [
        () => `What is ${Math.floor(Math.random() * 50) + 20} × ${Math.floor(Math.random() * 30) + 10}?`,
        () =>
          `What is ${Math.floor(Math.random() * 4) + 2}/${Math.floor(Math.random() * 6) + 4} + ${Math.floor(Math.random() * 3) + 1}/${Math.floor(Math.random() * 6) + 4}?`,
        () => `What is ${Math.floor(Math.random() * 40) + 10}% of ${(Math.floor(Math.random() * 10) + 5) * 20}?`,
      ]
      fallbackQuestion = operations[Math.floor(Math.random() * operations.length)]()
    } else {
      // 6th grade and above
      fallbackQuestion = `What is ${Math.floor(Math.random() * 50) + 20} + ${Math.floor(Math.random() * 30) + 15}?`
    }

    let fallbackResponse = ""

    if (lastMessage.includes("start") || lastMessage.includes("begin") || messages.length === 0) {
      fallbackResponse = `Great! Let's begin your ${gradeLevel} math placement test, ${studentData?.fullName}! Here's your first question: ${fallbackQuestion}`
    } else {
      const num = Number.parseInt(lastMessage)
      if (!isNaN(num)) {
        fallbackResponse = `Thank you for your answer! Let's try another question: ${fallbackQuestion}`
      } else {
        fallbackResponse = `Please provide a number as your answer. Let's try: ${fallbackQuestion}`
      }
    }

    return NextResponse.json({
      id: Date.now().toString(),
      role: "assistant",
      content: fallbackResponse,
    })
  } catch (error) {
    console.error("API Error:", error)

    return NextResponse.json({
      id: Date.now().toString(),
      role: "assistant",
      content: `Hi ${studentData?.fullName}! Let's start your ${studentData?.gradeLevel} math test. What is 4 + 5?`,
    })
  }
}
