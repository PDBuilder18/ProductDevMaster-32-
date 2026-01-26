import { useState } from "react";
import { useWorkflow } from "@/hooks/use-workflow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Lightbulb, BookOpen, Clock } from "lucide-react";

export function Sidebar() {
  const { completedSteps, currentStep } = useWorkflow();
  const [resourceDialog, setResourceDialog] = useState<string | null>(null);

  const timeSpent = Math.floor(Math.random() * 15) + 5; // Mock time tracking

  const resources = {
    mindset: {
      title: "How to Think Like a Product Developer",
      content: (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">A Beginner's Guide to the Product Mindset</h2>
            <h3 className="font-semibold text-gray-900 mb-3">What Is a Product Developer?</h3>
            <p className="text-gray-700 mb-2">
              A product developer is someone who figures out what to build, why to build it, and how to make it useful for real people. They don't just build features or write code — they solve problems in a thoughtful, organized way.
            </p>
            <p className="text-gray-700">
              Good product developers think ahead, ask smart questions, and learn from mistakes.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">The Core Idea</h3>
            <p className="text-gray-700 mb-2">
              Expert product developers don't start with solutions. They start with understanding the problem, the people affected, and what success actually looks like.
            </p>
            <p className="text-gray-700 mb-1">Their mindset combines:</p>
            <ul className="list-disc list-inside text-gray-600 ml-3 space-y-1">
              <li>Curiosity (asking why)</li>
              <li>Discipline (thinking step by step)</li>
              <li>Empathy (caring about users)</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">The Expert Product Mindset</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-800 mb-2">1. Start With the "Why"</h4>
                <p className="text-gray-600 text-sm mb-1">Before building anything, ask:</p>
                <ul className="list-disc list-inside text-gray-600 ml-3 space-y-1 text-sm">
                  <li>Why is this a problem?</li>
                  <li>Who is affected by it?</li>
                  <li>Why does it matter now?</li>
                </ul>
                <p className="text-gray-600 text-sm mt-2">Jumping straight to solutions often leads to building the wrong thing. Good thinking starts with understanding the reason behind the problem.</p>
              </div>

              <div>
                <h4 className="font-medium text-gray-800 mb-2">2. Think in Systems, Not Just Features</h4>
                <p className="text-gray-600 text-sm mb-1">A product is not just a button or an app screen. It lives inside a bigger system that includes:</p>
                <ul className="list-disc list-inside text-gray-600 ml-3 space-y-1 text-sm">
                  <li>Users</li>
                  <li>Technology</li>
                  <li>Money and business goals</li>
                  <li>Time and effort to maintain it</li>
                </ul>
                <p className="text-gray-600 text-sm mt-2">Every decision affects something else — cost, speed, quality, or ease of use. Smart product developers think about how everything connects.</p>
              </div>

              <div>
                <h4 className="font-medium text-gray-800 mb-2">3. Balance Vision With Evidence</h4>
                <p className="text-gray-600 text-sm mb-1">Having a big idea is important. But believing in an idea without checking reality is risky.</p>
                <p className="text-gray-600 text-sm mb-1">Great product developers:</p>
                <ul className="list-disc list-inside text-gray-600 ml-3 space-y-1 text-sm">
                  <li>Have a clear vision of where the product could go</li>
                  <li>Test small ideas first</li>
                  <li>Use feedback, data, and real user behavior to guide decisions</li>
                </ul>
                <p className="text-gray-600 text-sm mt-2">Strong opinions + real evidence = smart decisions.</p>
              </div>

              <div>
                <h4 className="font-medium text-gray-800 mb-2">4. Be User-Obsessed</h4>
                <p className="text-gray-600 text-sm mb-1">Product developers care deeply about the people using the product. They ask:</p>
                <ul className="list-disc list-inside text-gray-600 ml-3 space-y-1 text-sm">
                  <li>What is the user trying to do?</li>
                  <li>What frustrates them?</li>
                  <li>What would make their life easier?</li>
                </ul>
                <p className="text-gray-600 text-sm mt-2">Instead of guessing, they try to see the problem from the user's point of view. Empathy beats assumptions every time.</p>
              </div>

              <div>
                <h4 className="font-medium text-gray-800 mb-2">5. Embrace Constraints</h4>
                <p className="text-gray-600 text-sm mb-1">Constraints are limits like:</p>
                <ul className="list-disc list-inside text-gray-600 ml-3 space-y-1 text-sm">
                  <li>Small budgets</li>
                  <li>Short timelines</li>
                  <li>Limited technology</li>
                  <li>Small teams</li>
                </ul>
                <p className="text-gray-600 text-sm mt-2">Instead of seeing limits as problems, expert product developers see them as creative challenges. Constraints help you focus on what really matters. Limits don't block creativity — they shape it.</p>
              </div>

              <div>
                <h4 className="font-medium text-gray-800 mb-2">6. Iterate Relentlessly</h4>
                <p className="text-gray-600 text-sm mb-1">No product is perfect the first time. Great products are built through cycles:</p>
                <ul className="list-disc list-inside text-gray-600 ml-3 space-y-1 text-sm">
                  <li>Build something small</li>
                  <li>Test it with real users</li>
                  <li>Learn what worked and what didn't</li>
                  <li>Improve it</li>
                </ul>
                <p className="text-gray-600 text-sm mt-2">Moving fast and learning quickly is better than waiting for perfection. Progress beats perfection.</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Habits of Expert Product Thinkers</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Ask Better Questions</h4>
                <p className="text-gray-600 text-sm mb-1">Instead of asking "How do we build this?" they ask:</p>
                <ul className="list-disc list-inside text-gray-600 ml-3 space-y-1 text-sm">
                  <li>"What's the riskiest assumption here?"</li>
                  <li>"What could fail first?"</li>
                  <li>"What do we need to learn before moving on?"</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-gray-800 mb-2">Zoom In and Zoom Out</h4>
                <p className="text-gray-600 text-sm mb-1">Product developers switch between:</p>
                <ul className="list-disc list-inside text-gray-600 ml-3 space-y-1 text-sm">
                  <li>Details → buttons, screens, steps</li>
                  <li>Big picture → goals, users, long-term direction</li>
                </ul>
                <p className="text-gray-600 text-sm mt-2">Both matter. Great thinkers know when to focus close and when to step back.</p>
              </div>

              <div>
                <h4 className="font-medium text-gray-800 mb-2">Prioritize Ruthlessly</h4>
                <p className="text-gray-600 text-sm mb-1">There are always more ideas than time. Expert product developers:</p>
                <ul className="list-disc list-inside text-gray-600 ml-3 space-y-1 text-sm">
                  <li>Focus on what creates the most impact</li>
                  <li>Say no to distractions</li>
                  <li>Build the most important thing first</li>
                </ul>
                <p className="text-gray-600 text-sm mt-2">Doing fewer things well is better than doing everything poorly.</p>
              </div>

              <div>
                <h4 className="font-medium text-gray-800 mb-2">Learn Continuously</h4>
                <p className="text-gray-600 text-sm mb-1">Markets change. Technology evolves. Users grow and adapt. Great product developers stay curious:</p>
                <ul className="list-disc list-inside text-gray-600 ml-3 space-y-1 text-sm">
                  <li>They learn from feedback</li>
                  <li>They study other products</li>
                  <li>They reflect on what worked and what didn't</li>
                </ul>
                <p className="text-gray-600 text-sm mt-2">Learning never stops.</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">In One Sentence</h3>
            <p className="text-gray-700">Thinking like a product developer means solving real problems for real people by asking the right questions, testing ideas, learning fast, and improving continuously.</p>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">© Smartware Advisors - 2026-27. All Rights Reserved.</p>
          </div>
        </div>
      )
    },
    basics: {
      title: "What is Product Development?",
      content: (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">A Beginner's Guide</h2>
            <h3 className="font-semibold text-gray-900 mb-3">What Is Product Development?</h3>
            <p className="text-gray-700 mb-2">
              Product development is the process of turning an idea into something real that people can actually use and find valuable. It covers everything from understanding a problem to designing, building, testing, and improving a product over time.
            </p>
            <p className="text-gray-700">
              Product development is not just about building things — it's about building the right thing.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Why Product Development Matters</h3>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-gray-800 mb-1">It Turns Ideas Into Real Impact</h4>
                <p className="text-gray-600 text-sm">Anyone can have an idea. Product development helps turn that idea into a product that solves a real problem for real people.</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-1">It Saves Time and Money</h4>
                <p className="text-gray-600 text-sm">A clear process helps teams avoid spending time and money on features that users don't want or need.</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-1">It Builds Confidence and Trust</h4>
                <p className="text-gray-600 text-sm">When you can clearly explain how your product was developed, it's easier to gain trust from investors, partners, and early customers.</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">The Key Stages of Product Development</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-800 mb-2">1. Discover the Problem</h4>
                <p className="text-gray-600 text-sm mb-1">The first step is understanding what problem exists and why it matters.</p>
                <p className="text-gray-600 text-sm mb-1">You ask: Who is struggling? What are they trying to do? What's getting in their way?</p>
                <p className="text-gray-600 text-sm italic">Example: People have very little time to order lunch during work breaks.</p>
              </div>

              <div>
                <h4 className="font-medium text-gray-800 mb-2">2. Define the Solution</h4>
                <p className="text-gray-600 text-sm mb-1">Next, you think about how your product could help solve that problem. This includes brainstorming ideas and designing how the product might work — without building it yet.</p>
                <p className="text-gray-600 text-sm italic">Example: A mobile app that lets users pre-order lunch for fast pickup.</p>
              </div>

              <div>
                <h4 className="font-medium text-gray-800 mb-2">3. Develop Requirements</h4>
                <p className="text-gray-600 text-sm mb-1">Here, you decide what the product must do versus what would be nice to have later. This helps keep the product focused and simple.</p>
                <p className="text-gray-600 text-sm mb-1 italic">Example: The app must:</p>
                <ul className="text-gray-600 text-sm list-disc list-inside ml-2">
                  <li>Show menus</li>
                  <li>Accept payment</li>
                  <li>Send pickup times</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-gray-800 mb-2">4. Build the MVP (Minimum Viable Product)</h4>
                <p className="text-gray-600 text-sm mb-1">An MVP is the simplest version of the product that still works. It's not perfect — it's just good enough to test with real users.</p>
                <p className="text-gray-600 text-sm italic">Example: A basic app that works with only 3 restaurants.</p>
              </div>

              <div>
                <h4 className="font-medium text-gray-800 mb-2">5. Test and Learn</h4>
                <p className="text-gray-600 text-sm mb-1">Once people use the product, you observe what happens. You look for: What users like, what confuses them, and what problems still exist.</p>
                <p className="text-gray-600 text-sm italic">Example: Are customers actually picking up food on time?</p>
              </div>

              <div>
                <h4 className="font-medium text-gray-800 mb-2">6. Launch and Scale</h4>
                <p className="text-gray-600 text-sm mb-1">After learning what works, you slowly add new features, improve the product, and reach more users. Growth happens after learning — not before.</p>
                <p className="text-gray-600 text-sm italic">Example: Add delivery only after pickup works well.</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">The Product Development Mindset for Beginners</h3>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-gray-800 mb-1">Start Small</h4>
                <p className="text-gray-600 text-sm">You don't need to build everything at once. Simple products are easier to test and improve.</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-1">Listen to Users</h4>
                <p className="text-gray-600 text-sm">Your users will tell you what matters — through feedback, behavior, and questions.</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-1">Iterate Fast</h4>
                <p className="text-gray-600 text-sm">Build something, test it, learn from it, and improve it. This cycle is more powerful than long planning.</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">In One Sentence</h3>
            <p className="text-gray-700">Product development is the step-by-step process of understanding a problem, building a simple solution, learning from real users, and improving over time.</p>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">© Smartware Advisors - 2026-27. All Rights Reserved.</p>
          </div>
        </div>
      )
    },
    terms: {
      title: "Key Terms Every Product Developer Should Know",
      content: (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">A Helpful Reference for Building Your MVP</h2>
            <h3 className="font-medium text-gray-800 mb-2">What This Guide Is For</h3>
            <p className="text-gray-600 text-sm mb-2">Product development comes with a lot of new words. This guide explains the most important product terms in plain language, so you can focus on building instead of memorizing jargon.</p>
            <p className="text-gray-600 text-sm">You don't need to know everything at once — just enough to make good decisions.</p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Market Sizing Terms</h3>
            <p className="text-gray-600 text-sm mb-3">Market sizing helps you understand how big the opportunity really is.</p>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-800 mb-2">TAM — Total Addressable Market</h4>
                <p className="text-gray-600 text-sm mb-1"><strong>What it means:</strong> TAM is the total number of people or businesses who could use your product if there were no limits at all.</p>
                <p className="text-gray-600 text-sm mb-1"><strong>Why it matters:</strong> It helps you understand the biggest possible opportunity your idea could reach.</p>
                <p className="text-gray-600 text-sm"><strong>Simple way to think about it:</strong> "If everyone who might need this product used it, how big would that be?"</p>
              </div>

              <div>
                <h4 className="font-medium text-gray-800 mb-2">SAM — Serviceable Available Market</h4>
                <p className="text-gray-600 text-sm mb-1"><strong>What it means:</strong> SAM is the part of the market you can realistically reach, based on things like location, focus, or resources.</p>
                <p className="text-gray-600 text-sm mb-1"><strong>Why it matters:</strong> It helps you set realistic goals, not just big dreams.</p>
                <p className="text-gray-600 text-sm"><strong>Simple way to think about it:</strong> "Who can I actually serve right now?"</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Problem-Solving Frameworks</h3>
            <p className="text-gray-600 text-sm mb-3">These tools help you understand why problems exist, not just what they look like.</p>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-800 mb-2">The 5 Whys Method</h4>
                <p className="text-gray-600 text-sm mb-1"><strong>What it means:</strong> You ask "why?" over and over (usually five times) to uncover the real cause of a problem.</p>
                <p className="text-gray-600 text-sm mb-1"><strong>Why it matters:</strong> It helps you avoid fixing symptoms and instead fix the real issue underneath.</p>
                <p className="text-gray-600 text-sm mb-1"><strong>Simple example:</strong></p>
                <ul className="text-gray-600 text-sm list-disc list-inside ml-2">
                  <li>Why are orders late? → Because decisions are delayed</li>
                  <li>Why are decisions delayed? → Because no one owns them</li>
                  <li>Why does no one own them? → Because roles aren't clear</li>
                </ul>
                <p className="text-gray-600 text-sm mt-1">Now you've found something you can actually fix.</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Prioritization Frameworks</h3>
            <p className="text-gray-600 text-sm mb-3">These help you decide what to build first when you have more ideas than time.</p>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-800 mb-2">RICE Method</h4>
                <p className="text-gray-600 text-sm mb-1"><strong>What it means:</strong> You score ideas based on:</p>
                <ul className="text-gray-600 text-sm list-disc list-inside ml-2 mb-1">
                  <li>Reach – How many people it affects</li>
                  <li>Impact – How much it helps them</li>
                  <li>Confidence – How sure you are</li>
                  <li>Effort – How much work it takes</li>
                </ul>
                <p className="text-gray-600 text-sm mb-1"><strong>Why it matters:</strong> It helps you compare ideas fairly and logically.</p>
                <p className="text-gray-600 text-sm"><strong>Simple way to think about it:</strong> "Which idea gives the most value for the least effort?"</p>
              </div>

              <div>
                <h4 className="font-medium text-gray-800 mb-2">ICE Method</h4>
                <p className="text-gray-600 text-sm mb-1"><strong>What it means:</strong> A simpler version of RICE:</p>
                <ul className="text-gray-600 text-sm list-disc list-inside ml-2 mb-1">
                  <li>Impact</li>
                  <li>Confidence</li>
                  <li>Ease</li>
                </ul>
                <p className="text-gray-600 text-sm mb-1"><strong>Why it matters:</strong> It's faster and useful when you need to make decisions quickly.</p>
                <p className="text-gray-600 text-sm"><strong>Simple way to think about it:</strong> "What's impactful, likely to work, and easy to try?"</p>
              </div>

              <div>
                <h4 className="font-medium text-gray-800 mb-2">MoSCoW Method</h4>
                <p className="text-gray-600 text-sm mb-1"><strong>What it means:</strong> You group ideas into:</p>
                <ul className="text-gray-600 text-sm list-disc list-inside ml-2 mb-1">
                  <li>Must Have – required for the product to work</li>
                  <li>Should Have – important but not critical</li>
                  <li>Could Have – nice extras</li>
                  <li>Won't Have (for now) – intentionally delayed</li>
                </ul>
                <p className="text-gray-600 text-sm mb-1"><strong>Why it matters:</strong> It prevents scope creep and keeps your MVP focused.</p>
                <p className="text-gray-600 text-sm"><strong>Simple way to think about it:</strong> "What do we need right now versus later?"</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Other Essential Product Terms</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-800 mb-2">MVP — Minimum Viable Product</h4>
                <p className="text-gray-600 text-sm mb-1"><strong>What it means:</strong> The simplest version of your product that still solves the main problem.</p>
                <p className="text-gray-600 text-sm mb-1"><strong>Why it matters:</strong> It lets you test ideas with real users before spending too much time or money.</p>
                <p className="text-gray-600 text-sm"><strong>Simple way to think about it:</strong> "The smallest thing I can build to start learning."</p>
              </div>

              <div>
                <h4 className="font-medium text-gray-800 mb-2">PRD — Product Requirements Document</h4>
                <p className="text-gray-600 text-sm mb-1"><strong>What it means:</strong> A document that explains what the product should do, who it's for, and why it matters.</p>
                <p className="text-gray-600 text-sm mb-1"><strong>Why it matters:</strong> It keeps everyone aligned and reduces confusion.</p>
                <p className="text-gray-600 text-sm"><strong>Simple way to think about it:</strong> "A shared plan so everyone builds the same thing."</p>
              </div>

              <div>
                <h4 className="font-medium text-gray-800 mb-2">Product-Market Fit</h4>
                <p className="text-gray-600 text-sm mb-1"><strong>What it means:</strong> When your product solves a real problem so well that users keep coming back and recommend it.</p>
                <p className="text-gray-600 text-sm mb-1"><strong>Why it matters:</strong> This is the sign that it's time to grow and invest more.</p>
                <p className="text-gray-600 text-sm"><strong>Simple way to think about it:</strong> "People would be disappointed if this product disappeared."</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Final Thought</h3>
            <p className="text-gray-600 text-sm mb-2">You don't need to memorize every term. What matters is using these ideas to think clearly, make better decisions, and learn faster.</p>
            <p className="text-gray-600 text-sm">Product development isn't about fancy language — it's about understanding problems and building smart solutions.</p>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">© Smartware Advisors - 2026-27. All Rights Reserved.</p>
          </div>
        </div>
      )
    }
  };

  return (
    <div className="space-y-6">
      {/* Pro Tip */}
      {currentStep === 1 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">Pro Tip</h3>
            <p className="text-sm text-blue-800">
              Think about problems you've personally experienced - these often make the best product ideas.
            </p>
          </CardContent>
        </Card>
      )}
      
      {/* Progress Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Steps Completed</span>
            <span className="text-sm font-medium text-gray-900">
              {completedSteps.length} / 10
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Time Invested</span>
            <span className="text-sm font-medium text-gray-900">{timeSpent} min</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Last Saved</span>
            <span className="text-sm font-medium text-gray-900">Just now</span>
          </div>
        </CardContent>
      </Card>

      {/* Helpful Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Lightbulb className="h-5 w-5 text-amber-500 mr-2" />
            Helpful Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentStep === 1 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <h4 className="text-sm font-medium text-amber-900">Problem Discovery</h4>
              <p className="text-sm text-amber-800 mt-1">
                Describe the specific problem you want to solve. AI will analyze and refine your statement with clarifying questions.
              </p>
            </div>
          )}
          
          {currentStep === 2 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <h4 className="text-sm font-medium text-green-900">Market Research</h4>
              <p className="text-sm text-green-700 mt-1">
                AI will search for market data, competitors, and trends. This helps validate your idea and understand the landscape.
              </p>
            </div>
          )}

          {currentStep >= 3 && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <h4 className="text-sm font-medium text-purple-900">Keep Going!</h4>
              <p className="text-sm text-purple-700 mt-1">
                You're making great progress. Each step builds on the previous one to create a comprehensive MVP plan.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <BookOpen className="h-5 w-5 text-green-600 mr-2" />
            Resources
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div 
            className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            onClick={() => setResourceDialog('mindset')}
          >
            <h4 className="text-sm font-medium text-gray-900">How to Think Like a Product Developer</h4>
            <p className="text-xs text-gray-600 mt-1">
              A beginner's guide to the product mindset
            </p>
          </div>
          <div 
            className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            onClick={() => setResourceDialog('basics')}
          >
            <h4 className="text-sm font-medium text-gray-900">What is Product Development?</h4>
            <p className="text-xs text-gray-600 mt-1">
              A beginner's guide to the product development process
            </p>
          </div>
          <div 
            className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            onClick={() => setResourceDialog('terms')}
          >
            <h4 className="text-sm font-medium text-gray-900">Key Terms Every Product Developer Should Know</h4>
            <p className="text-xs text-gray-600 mt-1">
              A quick reference for PDBuilder users
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Resource Dialog */}
      <Dialog open={!!resourceDialog} onOpenChange={() => setResourceDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {resourceDialog && resources[resourceDialog as keyof typeof resources]?.title}
            </DialogTitle>
            <DialogDescription>
              Helpful resource to guide your MVP development process
            </DialogDescription>
          </DialogHeader>
          <div className="text-sm text-gray-700 leading-relaxed max-h-96 overflow-y-auto">
            {resourceDialog && resources[resourceDialog as keyof typeof resources]?.content}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
