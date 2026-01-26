import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, AlertTriangle, Shield, Brain, Database, Sparkles, CreditCard } from "lucide-react";

export default function TermsOfUse() {
  const [, setLocation] = useLocation();
  const [accepted, setAccepted] = useState(false);

  const handleAccept = () => {
    localStorage.setItem('pdbuilder_terms_accepted', 'true');
    setLocation('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="max-w-3xl w-full">
        <CardHeader className="text-center border-b">
          <div className="flex items-center justify-center gap-2 mb-2">
            <FileText className="h-8 w-8 text-purple-600" />
            <CardTitle className="text-2xl">Terms of Use</CardTitle>
          </div>
          <p className="text-muted-foreground">Please review and accept the terms before using PDBuilder</p>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px] p-6">
            <div className="space-y-6">
              <section>
                <h3 className="font-semibold text-lg flex items-center gap-2 mb-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  What PDBuilder Is
                </h3>
                <p className="text-gray-600 text-sm">
                  PDBuilder is an educational learning tool that helps founders and teams understand product development concepts, frameworks, and best practices. It is not a professional service and does not replace expert judgment.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-lg flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  What PDBuilder Is Not
                </h3>
                <p className="text-gray-600 text-sm mb-2">PDBuilder does not:</p>
                <ul className="list-disc list-inside text-gray-600 text-sm space-y-1 ml-2">
                  <li>Design or engineer products for you</li>
                  <li>Validate, test, certify, or approve products</li>
                  <li>Provide legal, regulatory, safety, medical, or financial advice</li>
                  <li>Guarantee accuracy, completeness, or real-world success</li>
                </ul>
                <p className="text-gray-600 text-sm mt-2 font-medium">All outputs are for learning and guidance only.</p>
              </section>

              <section>
                <h3 className="font-semibold text-lg flex items-center gap-2 mb-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  Your Responsibility as a Founder
                </h3>
                <p className="text-gray-600 text-sm mb-2">You are fully responsible for:</p>
                <ul className="list-disc list-inside text-gray-600 text-sm space-y-1 ml-2">
                  <li>How you interpret and use PDBuilder outputs</li>
                  <li>Any product, system, or service you build</li>
                  <li>Testing, validation, safety, and compliance</li>
                  <li>Meeting all applicable laws and regulations</li>
                </ul>
                <p className="text-gray-600 text-sm mt-2 font-medium">PDBuilder supports learning, not decision-making for deployment.</p>
              </section>

              <section>
                <h3 className="font-semibold text-lg flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  High-Risk & Regulated Products
                </h3>
                <p className="text-gray-600 text-sm mb-2">
                  If you're working in areas like healthcare, automotive, robotics, aerospace, energy, or other safety-critical fields:
                </p>
                <ul className="text-gray-600 text-sm space-y-1 ml-2">
                  <li>PDBuilder helps you learn, not ship</li>
                  <li>You must involve qualified professionals before real-world use</li>
                </ul>
                <p className="text-gray-600 text-sm mt-2 font-medium">Use at your own risk.</p>
              </section>

              <section>
                <h3 className="font-semibold text-lg flex items-center gap-2 mb-2">
                  <Database className="h-5 w-5 text-green-600" />
                  Your Data & Ideas
                </h3>
                <ul className="list-disc list-inside text-gray-600 text-sm space-y-1 ml-2">
                  <li>You own your ideas and content</li>
                  <li>PDBuilder does not sell your data</li>
                  <li>Your information is used only to run the platform</li>
                  <li>You control what you upload</li>
                </ul>
                <p className="text-gray-600 text-sm mt-2 font-medium">No one at PDBuilder claims ownership of your work.</p>
              </section>

              <section>
                <h3 className="font-semibold text-lg flex items-center gap-2 mb-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  AI-Generated Content
                </h3>
                <p className="text-gray-600 text-sm mb-2">PDBuilder uses AI to generate educational outputs. AI can be:</p>
                <ul className="list-disc list-inside text-gray-600 text-sm space-y-1 ml-2">
                  <li>Incomplete</li>
                  <li>Inaccurate</li>
                  <li>Based on assumptions or limited inputs</li>
                </ul>
                <p className="text-gray-600 text-sm mt-2 font-medium">Always validate outputs before acting on them.</p>
              </section>

              <section>
                <h3 className="font-semibold text-lg flex items-center gap-2 mb-2">
                  <CreditCard className="h-5 w-5 text-indigo-600" />
                  Free & Paid Access
                </h3>
                <ul className="list-disc list-inside text-gray-600 text-sm space-y-1 ml-2">
                  <li>PDBuilder offers free learning features</li>
                  <li>Paid upgrades unlock additional tools</li>
                  <li>Paid access does not change the educational nature of the platform</li>
                </ul>
                <p className="text-gray-600 text-sm mt-2 font-medium">No advisory or fiduciary relationship is created.</p>
              </section>

              <section className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">In Short</h3>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  PDBuilder helps you learn faster — not skip responsibility. You bring judgment, testing, and accountability. We provide structure, guidance, and education.
                </p>
              </section>
            </div>
          </ScrollArea>

          <div className="p-6 border-t space-y-4">
            <div className="flex items-start gap-3">
              <Checkbox 
                id="accept-terms" 
                checked={accepted}
                onCheckedChange={(checked) => setAccepted(checked === true)}
              />
              <label 
                htmlFor="accept-terms" 
                className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer leading-relaxed"
              >
                I have read and understand the Terms of Use. I acknowledge that PDBuilder is an educational tool and that I am responsible for how I use its outputs.
              </label>
            </div>

            <Button 
              onClick={handleAccept}
              disabled={!accepted}
              className="w-full"
              size="lg"
            >
              Accept & Continue to PDBuilder
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
