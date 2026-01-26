import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FiveWhysGraph } from './FiveWhysGraph';
import { Plus, Trash2, BarChart3 } from 'lucide-react';

interface WhyItem {
  question: string;
  answer: string;
  level: number;
}

export function FiveWhysDemo() {
  const [problemStatement, setProblemStatement] = useState('');
  const [whys, setWhys] = useState<WhyItem[]>([
    { question: '', answer: '', level: 1 }
  ]);
  const [rootCause, setRootCause] = useState('');
  const [graphData, setGraphData] = useState<any>(null);

  const validateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/fivewhys-validator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Validation failed');
      }
      
      return response.json();
    },
    onSuccess: (response) => {
      setGraphData(response.graph_view);
    }
  });

  const addWhyLevel = () => {
    setWhys([...whys, { 
      question: '', 
      answer: '', 
      level: whys.length + 1 
    }]);
  };

  const removeWhyLevel = (index: number) => {
    if (whys.length > 1) {
      const newWhys = whys.filter((_, i) => i !== index);
      // Reindex levels
      setWhys(newWhys.map((why, i) => ({ ...why, level: i + 1 })));
    }
  };

  const updateWhy = (index: number, field: 'question' | 'answer', value: string) => {
    const newWhys = [...whys];
    newWhys[index][field] = value;
    setWhys(newWhys);
  };

  const handleAnalyze = () => {
    // Filter out empty whys
    const validWhys = whys.filter(why => why.question.trim() && why.answer.trim());
    
    if (!problemStatement.trim() || validWhys.length === 0 || !rootCause.trim()) {
      return;
    }

    validateMutation.mutate({
      problem_statement: problemStatement,
      whys: validWhys,
      root_cause: rootCause
    });
  };

  const loadSampleData = () => {
    setProblemStatement('Website loading is too slow');
    setWhys([
      { question: 'Why is the website loading slow?', answer: 'Server response time is high', level: 1 },
      { question: 'Why is server response time high?', answer: 'Database queries are inefficient', level: 2 },
      { question: 'Why are database queries inefficient?', answer: 'Missing database indexes', level: 3 }
    ]);
    setRootCause('Lack of database optimization and indexing strategy');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Five Whys Analysis Tool
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-2 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={loadSampleData}
            >
              Load Sample Data
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="problem">Problem Statement</Label>
            <Textarea
              id="problem"
              placeholder="Describe the problem you want to analyze..."
              value={problemStatement}
              onChange={(e) => setProblemStatement(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Why Questions & Answers</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={addWhyLevel}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Why
              </Button>
            </div>
            
            {whys.map((why, index) => (
              <div key={index} className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                <div className="space-y-2">
                  <Label>Why #{why.level} Question</Label>
                  <Input
                    placeholder={`Why question level ${why.level}...`}
                    value={why.question}
                    onChange={(e) => updateWhy(index, 'question', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Answer</Label>
                    {whys.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeWhyLevel(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <Input
                    placeholder="Answer..."
                    value={why.answer}
                    onChange={(e) => updateWhy(index, 'answer', e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="root-cause">Root Cause</Label>
            <Textarea
              id="root-cause"
              placeholder="What is the identified root cause?"
              value={rootCause}
              onChange={(e) => setRootCause(e.target.value)}
              rows={2}
            />
          </div>

          <Button 
            onClick={handleAnalyze}
            disabled={validateMutation.isPending || !problemStatement.trim() || !rootCause.trim()}
            className="w-full"
          >
            {validateMutation.isPending ? 'Analyzing...' : 'Generate Graph Analysis'}
          </Button>

          {validateMutation.error && (
            <Alert variant="destructive">
              <AlertDescription>
                Error: {validateMutation.error instanceof Error ? validateMutation.error.message : 'Analysis failed'}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {graphData && (
        <FiveWhysGraph data={graphData} />
      )}
    </div>
  );
}