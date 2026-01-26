import type { WorkflowData } from "@shared/schema";
import fs from "fs";
import path from "path";

interface DocumentResult {
  url: string;
  filename: string;
}

export class DocumentService {
  async generateMVPDocument(data: WorkflowData, format: 'pdf' | 'docx' = 'pdf'): Promise<DocumentResult> {
    try {
      if (format === 'pdf') {
        return await this.generatePDF(data);
      } else {
        return await this.generateDOCX(data);
      }
    } catch (error) {
      console.error('Document generation failed:', error);
      throw new Error('Failed to generate document');
    }
  }

  private async generatePDF(data: WorkflowData): Promise<DocumentResult> {
    const PDFKit = await import('pdfkit');
    const PDFDocument = PDFKit.default;
    const doc = new PDFDocument();
    
    const filename = `mvp-configuration-${Date.now()}.pdf`;
    const filepath = path.join(process.cwd(), 'temp', filename);
    
    // Ensure temp directory exists
    await fs.promises.mkdir(path.dirname(filepath), { recursive: true });
    
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    // Document header
    doc.fontSize(24).text('MVP Configuration Document', { align: 'center' });
    doc.moveDown();
    
    // Problem Statement
    if (data.problemStatement) {
      doc.fontSize(18).text('Problem Statement');
      doc.fontSize(12).text(data.problemStatement.refined || data.problemStatement.original);
      doc.moveDown();
    }

    // Market Research
    if (data.marketResearch?.findings) {
      doc.fontSize(18).text('Market Research');
      doc.fontSize(14).text('Market Size:');
      doc.fontSize(12).text(data.marketResearch.findings.marketSize || 'Not available');
      
      if (data.marketResearch.findings.competitors?.length) {
        doc.fontSize(14).text('Competitors:');
        data.marketResearch.findings.competitors.forEach(competitor => {
          doc.fontSize(12).text(`• ${competitor}`);
        });
      }
      doc.moveDown();
    }

    // Root Cause
    if (data.rootCause) {
      doc.fontSize(18).text('Root Cause Analysis');
      doc.fontSize(14).text('Primary Cause:');
      doc.fontSize(12).text(data.rootCause.primaryCause);
      doc.moveDown();
    }

    // ICPs (All Customer Profiles)
    if (data.icp) {
      doc.fontSize(18).text('Ideal Customer Profiles');
      doc.fontSize(14).text(`Name: ${data.icp.name}`);
      doc.fontSize(12).text(data.icp.description);
      
      if (data.icp.demographics) {
        doc.fontSize(14).text('Demographics:');
        const demo = data.icp.demographics;
        doc.fontSize(12).text(`Age: ${demo.age}, Job Role: ${demo.jobRole}, Income: ${demo.income}`);
        if (demo.location) doc.fontSize(12).text(`Location: ${demo.location}`);
      }
      
      if (data.icp.psychographics?.frustrations?.length) {
        doc.fontSize(14).text('Pain Points:');
        data.icp.psychographics.frustrations.forEach((pain: any) => {
          doc.fontSize(12).text(`• ${pain}`);
        });
      }
      
      if (data.icp.psychographics?.goals?.length) {
        doc.fontSize(14).text('Goals:');
        data.icp.psychographics.goals.forEach((goal: any) => {
          doc.fontSize(12).text(`• ${goal}`);
        });
      }
      doc.moveDown();
    }

    // Use Cases
    if (data.useCase) {
      doc.fontSize(18).text('Use Cases');
      doc.fontSize(12).text(data.useCase.narrative);
      
      if (data.useCase.steps?.length) {
        doc.fontSize(14).text('User Journey Steps:');
        data.useCase.steps.forEach((step: any, index: number) => {
          doc.fontSize(12).text(`${index + 1}. ${step.action} - ${step.outcome}`);
        });
      }
      doc.moveDown();
    }

    // Product Requirements
    if (data.productRequirements) {
      doc.fontSize(18).text('Product Requirements');
      
      if (data.productRequirements.functionalRequirements?.length) {
        doc.fontSize(16).text('Functional Requirements');
        data.productRequirements.functionalRequirements.forEach((req, index) => {
          doc.fontSize(14).text(`${req.id || `FR-${index + 1}`}: ${req.name}`);
          doc.fontSize(12).text(req.description);
          if (req.acceptanceCriteria?.length) {
            doc.fontSize(12).text('Acceptance Criteria:');
            req.acceptanceCriteria.forEach(criteria => {
              doc.fontSize(11).text(`  • ${criteria}`);
            });
          }
          doc.moveDown(0.5);
        });
      }
      
      if (data.productRequirements.nonFunctionalRequirements?.length) {
        doc.fontSize(16).text('Non-Functional Requirements');
        data.productRequirements.nonFunctionalRequirements.forEach((req, index) => {
          doc.fontSize(14).text(`${req.id || `NFR-${index + 1}`}: ${req.name}`);
          doc.fontSize(12).text(req.description);
          if (req.acceptanceCriteria?.length) {
            doc.fontSize(12).text('Acceptance Criteria:');
            req.acceptanceCriteria.forEach(criteria => {
              doc.fontSize(11).text(`  • ${criteria}`);
            });
          }
          doc.moveDown(0.5);
        });
      }
      doc.moveDown();
    }

    // MVP Requirements (Prioritized Features)
    
    // Check if we have prioritization data OR product requirements that we can use as fallback
    if (data.prioritization?.features?.length || data.productRequirements?.functionalRequirements?.length) {
      doc.fontSize(18).text('MVP Requirements');
      
      if (data.prioritization?.features?.length) {
        doc.fontSize(14).text(`Prioritization Method: ${data.prioritization.method}`);
        doc.moveDown(0.5);
        
        // Group by priority categories
        const mustHave = data.prioritization.features.filter((f: any) => f.priority === 'must-have');
        const shouldHave = data.prioritization.features.filter((f: any) => f.priority === 'should-have');
        const couldHave = data.prioritization.features.filter((f: any) => f.priority === 'could-have');
        const wontHave = data.prioritization.features.filter((f: any) => f.priority === 'wont-have');
        
        // Display prioritized features
        if (mustHave.length > 0) {
          doc.fontSize(16).text('Must Have (Critical for MVP Launch)', { underline: true });
          mustHave.forEach((feature: any, index: number) => {
            doc.fontSize(12).text(`${index + 1}. ${feature.name}${feature.score ? ` (Score: ${feature.score.toFixed(1)})` : ''}`);
            doc.fontSize(11).text(`   ${feature.description}`);
            doc.moveDown(0.3);
          });
          doc.moveDown(0.5);
        }
        
        if (shouldHave.length > 0) {
          doc.fontSize(16).text('Should Have (Important but not critical)', { underline: true });
          shouldHave.forEach((feature: any, index: number) => {
            doc.fontSize(12).text(`${index + 1}. ${feature.name}${feature.score ? ` (Score: ${feature.score.toFixed(1)})` : ''}`);
            doc.fontSize(11).text(`   ${feature.description}`);
            doc.moveDown(0.3);
          });
          doc.moveDown(0.5);
        }
        
        if (couldHave.length > 0) {
          doc.fontSize(16).text('Could Have (Nice to have if time permits)', { underline: true });
          couldHave.forEach((feature: any, index: number) => {
            doc.fontSize(12).text(`${index + 1}. ${feature.name}${feature.score ? ` (Score: ${feature.score.toFixed(1)})` : ''}`);
            doc.fontSize(11).text(`   ${feature.description}`);
            doc.moveDown(0.3);
          });
          doc.moveDown(0.5);
        }
        
        if (wontHave.length > 0) {
          doc.fontSize(16).text("Won't Have (Not for this version)", { underline: true });
          wontHave.forEach((feature: any, index: number) => {
            doc.fontSize(12).text(`${index + 1}. ${feature.name}${feature.score ? ` (Score: ${feature.score.toFixed(1)})` : ''}`);
            doc.fontSize(11).text(`   ${feature.description}`);
            doc.moveDown(0.3);
          });
        }
        
      } else if (data.productRequirements?.functionalRequirements?.length) {
        // Fallback: Show functional requirements as MVP requirements when no prioritization exists
        doc.fontSize(14).text('Based on Product Requirements (Not yet prioritized)');
        doc.moveDown(0.5);
        
        doc.fontSize(16).text('Core MVP Features', { underline: true });
        data.productRequirements.functionalRequirements.forEach((req: any, index: number) => {
          doc.fontSize(12).text(`${index + 1}. ${req.name}`);
          doc.fontSize(11).text(`   ${req.description}`);
          doc.moveDown(0.3);
        });
      }
    }
      

    doc.end();

    return new Promise((resolve, reject) => {
      stream.on('finish', () => {
        resolve({
          url: `/temp/${filename}`,
          filename,
        });
      });
      stream.on('error', reject);
    });
  }

  private async generateDOCX(data: WorkflowData): Promise<DocumentResult> {
    const docx = await import('docx');
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = docx;

    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: "MVP Configuration Document",
            heading: HeadingLevel.TITLE,
          }),
          
          // Problem Statement
          ...(data.problemStatement ? [
            new Paragraph({
              text: "Problem Statement",
              heading: HeadingLevel.HEADING_1,
            }),
            new Paragraph({
              children: [
                new TextRun(data.problemStatement.refined || data.problemStatement.original),
              ],
            }),
          ] : []),

          // Market Research
          ...(data.marketResearch?.findings ? [
            new Paragraph({
              text: "Market Research",
              heading: HeadingLevel.HEADING_1,
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Market Size: ", bold: true }),
                new TextRun(data.marketResearch.findings.marketSize || 'Not available'),
              ],
            }),
            ...(data.marketResearch.findings.competitors?.map(competitor => 
              new Paragraph({
                children: [new TextRun(`• ${competitor}`)],
              })
            ) || []),
          ] : []),

          // Root Cause
          ...(data.rootCause ? [
            new Paragraph({
              text: "Root Cause Analysis",
              heading: HeadingLevel.HEADING_1,
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Primary Cause: ", bold: true }),
                new TextRun(data.rootCause.primaryCause),
              ],
            }),
          ] : []),

          // ICPs (All Customer Profiles)
          ...(data.icp ? [
            new Paragraph({
              text: "Ideal Customer Profiles",
              heading: HeadingLevel.HEADING_1,
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `Name: ${data.icp.name}`, bold: true }),
              ],
            }),
            new Paragraph({
              children: [new TextRun(data.icp.description)],
            }),
            ...(data.icp.demographics ? [
              new Paragraph({
                children: [
                  new TextRun({ text: "Demographics: ", bold: true }),
                  new TextRun(`Age: ${data.icp.demographics.age}, Job Role: ${data.icp.demographics.jobRole}, Income: ${data.icp.demographics.income}${data.icp.demographics.location ? `, Location: ${data.icp.demographics.location}` : ''}`),
                ],
              })
            ] : []),
            ...(data.icp.psychographics?.frustrations?.map((pain: any) => 
              new Paragraph({
                children: [new TextRun(`• ${pain}`)],
              })
            ) || []),
            ...(data.icp.psychographics?.goals?.map((goal: any) => 
              new Paragraph({
                children: [new TextRun(`• ${goal}`)],
              })
            ) || []),
          ] : []),

          // Use Cases
          ...(data.useCase ? [
            new Paragraph({
              text: "Use Cases",
              heading: HeadingLevel.HEADING_1,
            }),
            new Paragraph({
              children: [new TextRun(data.useCase.narrative)],
            }),
            ...(data.useCase.steps?.map((step: any, index: number) => 
              new Paragraph({
                children: [new TextRun(`${index + 1}. ${step.action} - ${step.outcome}`)],
              })
            ) || []),
          ] : []),

          // Product Requirements
          ...(data.productRequirements ? [
            new Paragraph({
              text: "Product Requirements",
              heading: HeadingLevel.HEADING_1,
            }),
            ...(data.productRequirements.functionalRequirements?.length ? [
              new Paragraph({
                text: "Functional Requirements",
                heading: HeadingLevel.HEADING_2,
              }),
              ...data.productRequirements.functionalRequirements.flatMap((req, index) => [
                new Paragraph({
                  children: [
                    new TextRun({ text: `${req.id || `FR-${index + 1}`}: ${req.name}`, bold: true }),
                  ],
                }),
                new Paragraph({
                  children: [new TextRun(req.description)],
                }),
                ...(req.acceptanceCriteria?.map(criteria => 
                  new Paragraph({
                    children: [new TextRun(`  • ${criteria}`)],
                  })
                ) || []),
              ]),
            ] : []),
            ...(data.productRequirements.nonFunctionalRequirements?.length ? [
              new Paragraph({
                text: "Non-Functional Requirements", 
                heading: HeadingLevel.HEADING_2,
              }),
              ...data.productRequirements.nonFunctionalRequirements.flatMap((req, index) => [
                new Paragraph({
                  children: [
                    new TextRun({ text: `${req.id || `NFR-${index + 1}`}: ${req.name}`, bold: true }),
                  ],
                }),
                new Paragraph({
                  children: [new TextRun(req.description)],
                }),
                ...(req.acceptanceCriteria?.map(criteria => 
                  new Paragraph({
                    children: [new TextRun(`  • ${criteria}`)],
                  })
                ) || []),
              ]),
            ] : []),
          ] : []),

          // MVP Requirements (Prioritized Features)
          ...(data.prioritization?.features?.length || data.productRequirements?.functionalRequirements?.length ? (() => {
            if (data.prioritization?.features?.length) {
              const mustHave = data.prioritization.features.filter(f => f.priority === 'must-have');
              const shouldHave = data.prioritization.features.filter(f => f.priority === 'should-have'); 
              const couldHave = data.prioritization.features.filter(f => f.priority === 'could-have');
              const wontHave = data.prioritization.features.filter(f => f.priority === 'wont-have');
              
              return [
                new Paragraph({
                  text: "MVP Requirements",
                  heading: HeadingLevel.HEADING_1,
                }),
                new Paragraph({
                  children: [
                    new TextRun({ text: `Prioritization Method: ${data.prioritization.method}`, bold: true }),
                  ],
                }),
              
              ...(mustHave.length > 0 ? [
                new Paragraph({
                  text: "Must Have (Critical for MVP Launch)",
                  heading: HeadingLevel.HEADING_2,
                }),
                ...mustHave.map((feature, index) => 
                  new Paragraph({
                    children: [
                      new TextRun({ text: `${index + 1}. ${feature.name}`, bold: true }),
                      new TextRun(feature.score ? ` (Score: ${feature.score.toFixed(1)})` : ''),
                    ],
                  })
                ),
                ...mustHave.map(feature => 
                  new Paragraph({
                    children: [new TextRun(`   ${feature.description}`)],
                  })
                ),
              ] : []),
              
              ...(shouldHave.length > 0 ? [
                new Paragraph({
                  text: "Should Have (Important but not critical)",
                  heading: HeadingLevel.HEADING_2,
                }),
                ...shouldHave.map((feature, index) => 
                  new Paragraph({
                    children: [
                      new TextRun({ text: `${index + 1}. ${feature.name}`, bold: true }),
                      new TextRun(feature.score ? ` (Score: ${feature.score.toFixed(1)})` : ''),
                    ],
                  })
                ),
                ...shouldHave.map(feature => 
                  new Paragraph({
                    children: [new TextRun(`   ${feature.description}`)],
                  })
                ),
              ] : []),
              
              ...(couldHave.length > 0 ? [
                new Paragraph({
                  text: "Could Have (Nice to have if time permits)",
                  heading: HeadingLevel.HEADING_2,
                }),
                ...couldHave.map((feature, index) => 
                  new Paragraph({
                    children: [
                      new TextRun({ text: `${index + 1}. ${feature.name}`, bold: true }),
                      new TextRun(feature.score ? ` (Score: ${feature.score.toFixed(1)})` : ''),
                    ],
                  })
                ),
                ...couldHave.map(feature => 
                  new Paragraph({
                    children: [new TextRun(`   ${feature.description}`)],
                  })
                ),
              ] : []),
              
              ...(wontHave.length > 0 ? [
                new Paragraph({
                  text: "Won't Have (Not for this version)",
                  heading: HeadingLevel.HEADING_2,
                }),
                ...wontHave.map((feature, index) => 
                  new Paragraph({
                    children: [
                      new TextRun({ text: `${index + 1}. ${feature.name}`, bold: true }),
                      new TextRun(feature.score ? ` (Score: ${feature.score.toFixed(1)})` : ''),
                    ],
                  })
                ),
                ...wontHave.map(feature => 
                  new Paragraph({
                    children: [new TextRun(`   ${feature.description}`)],
                  })
                ),
              ] : []),
              ];
            } else if (data.productRequirements?.functionalRequirements?.length) {
              // Fallback: Show functional requirements as MVP requirements when no prioritization exists
              return [
                new Paragraph({
                  text: "MVP Requirements",
                  heading: HeadingLevel.HEADING_1,
                }),
                new Paragraph({
                  children: [
                    new TextRun({ text: 'Based on Product Requirements (Not yet prioritized)', bold: true }),
                  ],
                }),
                new Paragraph({
                  text: "Core MVP Features",
                  heading: HeadingLevel.HEADING_2,
                }),
                ...data.productRequirements.functionalRequirements.map((req, index) => [
                  new Paragraph({
                    children: [
                      new TextRun({ text: `${index + 1}. ${req.name}`, bold: true }),
                    ],
                  }),
                  new Paragraph({
                    children: [new TextRun(`   ${req.description}`)],
                  }),
                ]).flat(),
              ];
            }
            return [];
          })() : []),
        ],
      }],
    });

    const filename = `mvp-configuration-${Date.now()}.docx`;
    const filepath = path.join(process.cwd(), 'temp', filename);
    
    // Ensure temp directory exists
    await fs.promises.mkdir(path.dirname(filepath), { recursive: true });

    const buffer = await Packer.toBuffer(doc);
    await fs.promises.writeFile(filepath, buffer);

    return {
      url: `/temp/${filename}`,
      filename,
    };
  }

  // Generate roadmap document with milestones
  async generateRoadmapDocument(roadmap: any, milestones: any[], format: 'pdf' | 'csv' = 'pdf'): Promise<DocumentResult> {
    try {
      if (format === 'pdf') {
        return await this.generateRoadmapPDF(roadmap, milestones);
      } else {
        return await this.generateRoadmapCSV(roadmap, milestones);
      }
    } catch (error) {
      console.error('Roadmap document generation failed:', error);
      throw new Error('Failed to generate roadmap document');
    }
  }

  private async generateRoadmapPDF(roadmap: any, milestones: any[]): Promise<DocumentResult> {
    const PDFKit = await import('pdfkit');
    const PDFDocument = PDFKit.default;
    const doc = new PDFDocument();
    
    // Use roadmap ID for secure filename to prevent path traversal
    const filename = `roadmap-${roadmap.id}-${Date.now()}.pdf`;
    const filepath = path.join(process.cwd(), 'temp', filename);
    
    // Ensure temp directory exists
    await fs.promises.mkdir(path.dirname(filepath), { recursive: true });
    
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    // Document header
    doc.fontSize(24).text('Product Roadmap', { align: 'center' });
    doc.fontSize(16).text(roadmap.name, { align: 'center' });
    doc.fontSize(12).text(`Layout: ${roadmap.layout}`, { align: 'center' });
    doc.moveDown(2);

    // Group milestones by bucket
    const groupedMilestones = milestones.reduce((acc, milestone) => {
      if (!acc[milestone.bucket]) {
        acc[milestone.bucket] = [];
      }
      acc[milestone.bucket].push(milestone);
      return acc;
    }, {} as Record<string, any[]>);

    // Define bucket order and labels
    const bucketOrder = roadmap.layout === 'now-next-later' 
      ? ['now', 'next', 'later']
      : ['q1', 'q2', 'q3', 'q4'];
    
    const bucketLabels = roadmap.layout === 'now-next-later'
      ? { now: 'Now', next: 'Next', later: 'Later' }
      : { q1: 'Q1', q2: 'Q2', q3: 'Q3', q4: 'Q4' };

    // Render each bucket
    bucketOrder.forEach((bucket, index) => {
      if (index > 0) doc.addPage();
      
      const bucketMilestones = groupedMilestones[bucket] || [];
      doc.fontSize(20).text(bucketLabels[bucket as keyof typeof bucketLabels] || bucket, { align: 'left' });
      doc.fontSize(12).text(`${bucketMilestones.length} milestone(s)`, { align: 'left' });
      doc.moveDown();

      if (bucketMilestones.length === 0) {
        doc.fontSize(12).text('No milestones planned for this period.');
        return;
      }

      // Sort milestones by sortIndex
      bucketMilestones.sort((a: any, b: any) => a.sortIndex - b.sortIndex);

      bucketMilestones.forEach((milestone: any, idx: number) => {
        // Milestone title and category
        doc.fontSize(16).text(`${idx + 1}. ${milestone.title}`, { continued: true });
        doc.fontSize(10).text(` [${milestone.category}]`);
        
        // Status badge
        const statusColors = {
          'Planned': '#6B7280',
          'In Progress': '#F59E0B', 
          'Done': '#10B981'
        };
        doc.fontSize(10).fillColor(statusColors[milestone.status as keyof typeof statusColors] || '#6B7280')
           .text(`Status: ${milestone.status}`);
        doc.fillColor('black');
        
        // Description
        doc.fontSize(12).text(milestone.description, { indent: 20 });
        
        // Dependencies
        if (milestone.dependencies && milestone.dependencies.length > 0) {
          doc.fontSize(10).text(`Dependencies: ${milestone.dependencies.join(', ')}`, { indent: 20 });
        }
        
        // Due date
        if (milestone.dueDate) {
          doc.fontSize(10).text(`Due: ${new Date(milestone.dueDate).toLocaleDateString()}`, { indent: 20 });
        }
        
        doc.moveDown();
      });
    });

    // Summary page
    doc.addPage();
    doc.fontSize(20).text('Roadmap Summary', { align: 'center' });
    doc.moveDown();

    const totalMilestones = milestones.length;
    const completedMilestones = milestones.filter(m => m.status === 'Done').length;
    const inProgressMilestones = milestones.filter(m => m.status === 'In Progress').length;
    const plannedMilestones = milestones.filter(m => m.status === 'Planned').length;

    doc.fontSize(14).text('Overall Progress:');
    doc.fontSize(12)
       .text(`• Total Milestones: ${totalMilestones}`)
       .text(`• Completed: ${completedMilestones}`)
       .text(`• In Progress: ${inProgressMilestones}`)
       .text(`• Planned: ${plannedMilestones}`);

    if (totalMilestones > 0) {
      const completionRate = Math.round((completedMilestones / totalMilestones) * 100);
      doc.text(`• Completion Rate: ${completionRate}%`);
    }

    doc.moveDown();

    // Breakdown by category
    const categoryCount = milestones.reduce((acc, milestone) => {
      acc[milestone.category] = (acc[milestone.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    if (Object.keys(categoryCount).length > 0) {
      doc.fontSize(14).text('Breakdown by Category:');
      Object.entries(categoryCount).forEach(([category, count]) => {
        doc.fontSize(12).text(`• ${category}: ${count} milestone(s)`);
      });
    }

    doc.end();

    return new Promise((resolve, reject) => {
      stream.on('finish', () => {
        resolve({
          url: `/temp/${filename}`,
          filename,
        });
      });
      stream.on('error', reject);
    });
  }

  private async generateRoadmapCSV(roadmap: any, milestones: any[]): Promise<DocumentResult> {
    // Use roadmap ID for secure filename to prevent path traversal
    const filename = `roadmap-${roadmap.id}-${Date.now()}.csv`;
    const filepath = path.join(process.cwd(), 'temp', filename);
    
    // Ensure temp directory exists
    await fs.promises.mkdir(path.dirname(filepath), { recursive: true });

    // Sort milestones by bucket and sortIndex (use copy to avoid mutation)
    const sortedMilestones = [...milestones].sort((a, b) => {
      if (a.bucket !== b.bucket) {
        const bucketOrder = roadmap.layout === 'now-next-later' 
          ? ['now', 'next', 'later']
          : ['q1', 'q2', 'q3', 'q4'];
        return bucketOrder.indexOf(a.bucket) - bucketOrder.indexOf(b.bucket);
      }
      return a.sortIndex - b.sortIndex;
    });

    // CSV header
    const csvHeaders = [
      'ID',
      'Title', 
      'Description',
      'Bucket',
      'Category',
      'Status',
      'Dependencies',
      'Due Date',
      'Sort Index'
    ];

    // Helper function to sanitize CSV cells and prevent injection
    const sanitizeCSVCell = (value: string): string => {
      if (!value) return '""';
      const str = value.toString();
      // Neutralize dangerous leading characters (=, +, -, @) by prefixing with '
      const dangerousChars = ['=', '+', '-', '@'];
      const sanitized = dangerousChars.some(char => str.startsWith(char)) ? `'${str}` : str;
      // Escape quotes and wrap in quotes
      return `"${sanitized.replace(/"/g, '""')}"`;
    };

    // Convert milestones to CSV rows
    const csvRows = sortedMilestones.map(milestone => [
      milestone.id.toString(),
      sanitizeCSVCell(milestone.title),
      sanitizeCSVCell(milestone.description),
      sanitizeCSVCell(milestone.bucket),
      sanitizeCSVCell(milestone.category),
      sanitizeCSVCell(milestone.status),
      sanitizeCSVCell(milestone.dependencies ? milestone.dependencies.join(', ') : ''),
      sanitizeCSVCell(milestone.dueDate || ''),
      milestone.sortIndex.toString()
    ]);

    // Build CSV content with RFC4180 CRLF line endings
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.join(','))
    ].join('\r\n');

    // Write to file
    await fs.promises.writeFile(filepath, csvContent, 'utf-8');

    return {
      url: `/temp/${filename}`,
      filename,
    };
  }

  async generateCompleteStrategyDocument(data: WorkflowData, format: 'pdf' | 'docx' = 'pdf'): Promise<DocumentResult> {
    try {
      if (format === 'pdf') {
        return await this.generateCompleteStrategyPDF(data);
      } else {
        return await this.generateCompleteStrategyDOCX(data);
      }
    } catch (error) {
      console.error('Complete strategy document generation failed:', error);
      throw new Error('Failed to generate complete strategy document');
    }
  }

  private async generateCompleteStrategyPDF(data: WorkflowData): Promise<DocumentResult> {
    const PDFKit = await import('pdfkit');
    const PDFDocument = PDFKit.default;
    const doc = new PDFDocument();
    
    const filename = `complete-strategy-${Date.now()}.pdf`;
    const filepath = path.join(process.cwd(), 'temp', filename);
    
    // Ensure temp directory exists
    await fs.promises.mkdir(path.dirname(filepath), { recursive: true });
    
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    // Document header
    doc.fontSize(24).text('Complete Strategy Document', { align: 'center' });
    doc.fontSize(16).text('MVP Configuration & Go-to-Market Strategy', { align: 'center' });
    doc.moveDown(2);
    
    // Table of Contents
    doc.fontSize(18).text('Table of Contents');
    doc.fontSize(12)
      .text('1. Executive Summary')
      .text('2. MVP Configuration')
      .text('3. Go-to-Market Strategy')
      .text('4. Implementation Roadmap');
    doc.moveDown(2);
    
    // Executive Summary
    doc.addPage();
    doc.fontSize(20).text('1. Executive Summary');
    doc.moveDown();
    
    if (data.problemStatement) {
      doc.fontSize(14).text('Problem Being Solved:');
      doc.fontSize(12).text(data.problemStatement.refined || data.problemStatement.original);
      doc.moveDown();
    }
    
    if (data.icp) {
      doc.fontSize(14).text('Target Customer:');
      doc.fontSize(12).text(`${data.icp.name} - ${data.icp.description}`);
      doc.moveDown();
    }
    
    if (data.goToMarketStrategy?.valueProposition) {
      doc.fontSize(14).text('Value Proposition:');
      doc.fontSize(12).text(data.goToMarketStrategy.valueProposition.promise);
      doc.moveDown();
    }
    
    // MVP Configuration Section
    doc.addPage();
    doc.fontSize(20).text('2. MVP Configuration');
    doc.moveDown();
    
    // Reuse the existing MVP generation logic
    if (data.problemStatement) {
      doc.fontSize(18).text('Problem Statement');
      doc.fontSize(12).text(data.problemStatement.refined || data.problemStatement.original);
      doc.moveDown();
    }

    if (data.marketResearch?.findings) {
      doc.fontSize(18).text('Market Research');
      doc.fontSize(14).text('Market Size:');
      doc.fontSize(12).text(data.marketResearch.findings.marketSize || 'Not available');
      doc.moveDown();
    }

    if (data.rootCause) {
      doc.fontSize(18).text('Root Cause Analysis');
      doc.fontSize(14).text('Primary Cause:');
      doc.fontSize(12).text(data.rootCause.primaryCause);
      doc.moveDown();
    }

    if (data.icp) {
      doc.fontSize(18).text('Ideal Customer Profile');
      doc.fontSize(14).text(`Name: ${data.icp.name}`);
      doc.fontSize(12).text(data.icp.description);
      doc.moveDown();
    }

    if (data.productRequirements?.functionalRequirements?.length) {
      doc.fontSize(18).text('MVP Features');
      data.productRequirements.functionalRequirements.forEach((req, index) => {
        doc.fontSize(14).text(`${index + 1}. ${req.name}`);
        doc.fontSize(12).text(req.description);
        doc.moveDown(0.5);
      });
      doc.moveDown();
    }
    
    // Go-to-Market Strategy Section
    if (data.goToMarketStrategy) {
      doc.addPage();
      doc.fontSize(20).text('3. Go-to-Market Strategy');
      doc.moveDown();
      
      const gtm = data.goToMarketStrategy;
      
      // Target Market
      if (gtm.targetMarket) {
        doc.fontSize(18).text('Target Market');
        doc.fontSize(14).text('Beachhead Market:');
        doc.fontSize(12).text(gtm.targetMarket.beachhead);
        
        if (gtm.targetMarket.marketSize) {
          doc.fontSize(14).text('Market Size:');
          doc.fontSize(12).text(gtm.targetMarket.marketSize.serviceableMarket);
        }
        doc.moveDown();
      }
      
      // Value Proposition
      if (gtm.valueProposition) {
        doc.fontSize(18).text('Value Proposition');
        doc.fontSize(12).text(gtm.valueProposition.promise);
        
        if (gtm.valueProposition.outcomes?.length) {
          doc.fontSize(14).text('Key Outcomes:');
          gtm.valueProposition.outcomes.forEach(outcome => {
            doc.fontSize(12).text(`• ${outcome}`);
          });
        }
        doc.moveDown();
      }
      
      // Positioning & Messaging
      if (gtm.positioning) {
        doc.fontSize(18).text('Positioning & Messaging');
        doc.fontSize(14).text('Position Statement:');
        doc.fontSize(12).text(gtm.positioning.statement);
        
        doc.fontSize(14).text('Hero Message:');
        doc.fontSize(12).text(gtm.positioning.heroMessage);
        doc.moveDown();
      }
      
      // Pricing
      if (gtm.pricing?.tiers?.length) {
        doc.fontSize(18).text('Pricing Strategy');
        gtm.pricing.tiers.forEach(tier => {
          doc.fontSize(14).text(`${tier.name}: ${tier.price}`);
          if (tier.features?.length) {
            tier.features.forEach(feature => {
              doc.fontSize(12).text(`• ${feature}`);
            });
          }
        });
        doc.moveDown();
      }
      
      // Channels
      if (gtm.channels) {
        doc.fontSize(18).text('Distribution Channels');
        
        if (gtm.channels.acquisition?.length) {
          doc.fontSize(14).text('Customer Acquisition:');
          gtm.channels.acquisition.forEach(channel => {
            doc.fontSize(12).text(`• ${channel}`);
          });
        }
        
        if (gtm.channels.distribution?.length) {
          doc.fontSize(14).text('Distribution:');
          gtm.channels.distribution.forEach(channel => {
            doc.fontSize(12).text(`• ${channel}`);
          });
        }
        doc.moveDown();
      }
      
      // Implementation Timeline
      if (gtm.timeline?.phases?.length) {
        doc.addPage();
        doc.fontSize(20).text('4. Implementation Timeline');
        doc.moveDown();
        
        gtm.timeline.phases.forEach((phase, index) => {
          doc.fontSize(16).text(`Phase ${index + 1}: ${phase.name} (${phase.duration})`);
          
          if (phase.activities?.length) {
            doc.fontSize(14).text('Activities:');
            phase.activities.forEach(activity => {
              doc.fontSize(12).text(`• ${activity}`);
            });
          }
          
          if (phase.milestones?.length) {
            doc.fontSize(14).text('Milestones:');
            phase.milestones.forEach(milestone => {
              doc.fontSize(12).text(`• ${milestone}`);
            });
          }
          doc.moveDown();
        });
      }
      
      // Metrics
      if (gtm.metrics) {
        doc.fontSize(18).text('Success Metrics (AARRR)');
        
        const metricsOrder = [
          { key: 'acquisition', label: 'Acquisition' },
          { key: 'activation', label: 'Activation' },
          { key: 'retention', label: 'Retention' },
          { key: 'revenue', label: 'Revenue' },
          { key: 'referral', label: 'Referral' }
        ];
        
        metricsOrder.forEach(({ key, label }) => {
          const metrics = gtm.metrics[key as keyof typeof gtm.metrics];
          if (metrics?.length) {
            doc.fontSize(14).text(`${label}:`);
            metrics.forEach((metric: string) => {
              doc.fontSize(12).text(`• ${metric}`);
            });
          }
        });
        doc.moveDown();
      }
    }

    doc.end();

    return new Promise((resolve, reject) => {
      stream.on('finish', () => {
        resolve({
          url: `/temp/${filename}`,
          filename,
        });
      });
      stream.on('error', reject);
    });
  }

  private async generateCompleteStrategyDOCX(data: WorkflowData): Promise<DocumentResult> {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx');
    
    const filename = `complete-strategy-${Date.now()}.docx`;
    const filepath = path.join(process.cwd(), 'temp', filename);
    
    // Ensure temp directory exists
    await fs.promises.mkdir(path.dirname(filepath), { recursive: true });

    const sections = [];

    // Title and TOC
    sections.push(
      new Paragraph({
        text: "Complete Strategy Document",
        heading: HeadingLevel.TITLE,
      }),
      new Paragraph({
        text: "MVP Configuration & Go-to-Market Strategy",
        heading: HeadingLevel.HEADING_2,
      }),
      new Paragraph({
        text: "Table of Contents",
        heading: HeadingLevel.HEADING_1,
      }),
      new Paragraph({
        children: [new TextRun("1. Executive Summary")],
      }),
      new Paragraph({
        children: [new TextRun("2. MVP Configuration")],
      }),
      new Paragraph({
        children: [new TextRun("3. Go-to-Market Strategy")],
      }),
      new Paragraph({
        children: [new TextRun("4. Implementation Roadmap")],
      })
    );

    // Executive Summary
    sections.push(
      new Paragraph({
        text: "1. Executive Summary",
        heading: HeadingLevel.HEADING_1,
      })
    );

    if (data.problemStatement) {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({ text: "Problem Being Solved: ", bold: true }),
            new TextRun(data.problemStatement.refined || data.problemStatement.original),
          ],
        })
      );
    }

    // MVP Configuration
    sections.push(
      new Paragraph({
        text: "2. MVP Configuration",
        heading: HeadingLevel.HEADING_1,
      })
    );

    if (data.productRequirements?.functionalRequirements?.length) {
      sections.push(
        new Paragraph({
          text: "MVP Features",
          heading: HeadingLevel.HEADING_2,
        })
      );
      
      data.productRequirements.functionalRequirements.forEach((req, index) => {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${index + 1}. ${req.name}: `, bold: true }),
              new TextRun(req.description),
            ],
          })
        );
      });
    }

    // Go-to-Market Strategy
    if (data.goToMarketStrategy) {
      sections.push(
        new Paragraph({
          text: "3. Go-to-Market Strategy",
          heading: HeadingLevel.HEADING_1,
        })
      );

      const gtm = data.goToMarketStrategy;

      if (gtm.valueProposition) {
        sections.push(
          new Paragraph({
            text: "Value Proposition",
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({
            children: [new TextRun(gtm.valueProposition.promise)],
          })
        );
      }

      if (gtm.positioning) {
        sections.push(
          new Paragraph({
            text: "Positioning & Messaging",
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Position Statement: ", bold: true }),
              new TextRun(gtm.positioning.statement),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Hero Message: ", bold: true }),
              new TextRun(gtm.positioning.heroMessage),
            ],
          })
        );
      }

      if (gtm.pricing?.tiers?.length) {
        sections.push(
          new Paragraph({
            text: "Pricing Strategy",
            heading: HeadingLevel.HEADING_2,
          })
        );
        
        gtm.pricing.tiers.forEach(tier => {
          sections.push(
            new Paragraph({
              children: [
                new TextRun({ text: `${tier.name}: `, bold: true }),
                new TextRun(tier.price),
              ],
            })
          );
        });
      }
    }

    const doc = new Document({
      sections: [{
        properties: {},
        children: sections,
      }],
    });

    const buffer = await Packer.toBuffer(doc);
    await fs.promises.writeFile(filepath, buffer);

    return {
      url: `/temp/${filename}`,
      filename,
    };
  }

  async generateValidationDocument(data: WorkflowData, format: 'pdf' | 'docx' = 'pdf'): Promise<DocumentResult> {
    try {
      if (format === 'pdf') {
        return await this.generateValidationPDF(data);
      } else {
        return await this.generateValidationDOCX(data);
      }
    } catch (error) {
      console.error('Validation document generation failed:', error);
      throw new Error('Failed to generate validation document');
    }
  }

  private async generateValidationPDF(data: WorkflowData): Promise<DocumentResult> {
    const PDFKit = await import('pdfkit');
    const PDFDocument = PDFKit.default;
    const doc = new PDFDocument();
    
    const filename = `problem-solution-validation-${Date.now()}.pdf`;
    const filepath = path.join(process.cwd(), 'temp', filename);
    
    // Ensure temp directory exists
    await fs.promises.mkdir(path.dirname(filepath), { recursive: true });
    
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    // Document header
    doc.fontSize(24).text('Problem-Solution Validation Analysis', { align: 'center' });
    doc.fontSize(16).text('Comprehensive Validation Framework', { align: 'center' });
    doc.moveDown(2);
    
    // Table of Contents
    doc.fontSize(18).text('Table of Contents');
    doc.fontSize(12)
      .text('1. Problem Definition & Validation')
      .text('2. Solution-Market Fit Analysis')
      .text('3. Customer Validation Summary')
      .text('4. Competitive Gap Analysis')
      .text('5. Risk Assessment & Mitigation')
      .text('6. Validation Conclusion & Next Steps');
    doc.moveDown(2);
    
    // Problem Definition & Validation
    doc.addPage();
    doc.fontSize(20).text('1. Problem Definition & Validation');
    doc.moveDown();
    
    if (data.problemStatement) {
      doc.fontSize(16).text('Problem Statement');
      doc.fontSize(12).text(data.problemStatement.refined || data.problemStatement.original);
      doc.moveDown();
    }

    if (data.rootCause) {
      doc.fontSize(16).text('Root Cause Analysis');
      doc.fontSize(14).text('Primary Cause:');
      doc.fontSize(12).text(data.rootCause.primaryCause);
      doc.moveDown();
    }

    // Solution-Market Fit Analysis
    doc.addPage();
    doc.fontSize(20).text('2. Solution-Market Fit Analysis');
    doc.moveDown();

    if (data.marketResearch?.findings) {
      doc.fontSize(16).text('Market Research Findings');
      if (data.marketResearch.findings.marketSize) {
        doc.fontSize(14).text('Market Size:');
        doc.fontSize(12).text(data.marketResearch.findings.marketSize);
        doc.moveDown();
      }
      
      if (data.marketResearch.findings.trends?.length) {
        doc.fontSize(14).text('Market Trends:');
        data.marketResearch.findings.trends.forEach(trend => {
          doc.fontSize(12).text(`• ${trend}`);
        });
        doc.moveDown();
      }
    }

    // Customer Validation Summary
    doc.addPage();
    doc.fontSize(20).text('3. Customer Validation Summary');
    doc.moveDown();

    if (data.icp) {
      doc.fontSize(16).text('Ideal Customer Profile');
      doc.fontSize(14).text(`Target Customer: ${data.icp.name}`);
      doc.fontSize(12).text(data.icp.description);
      doc.moveDown();

      if (data.icp.demographics) {
        doc.fontSize(14).text('Demographics:');
        const demo = data.icp.demographics;
        doc.fontSize(12).text(`Age: ${demo.age}`);
        doc.fontSize(12).text(`Job Role: ${demo.jobRole}`);
        doc.fontSize(12).text(`Income: ${demo.income}`);
        if (demo.location) doc.fontSize(12).text(`Location: ${demo.location}`);
        doc.moveDown();
      }

      if (data.icp.psychographics) {
        doc.fontSize(14).text('Goals & Motivations:');
        data.icp.psychographics.goals.forEach(goal => {
          doc.fontSize(12).text(`• ${goal}`);
        });
        doc.moveDown();

        doc.fontSize(14).text('Frustrations:');
        data.icp.psychographics.frustrations.forEach(frustration => {
          doc.fontSize(12).text(`• ${frustration}`);
        });
        doc.moveDown();
      }
    }

    // Competitive Gap Analysis
    doc.addPage();
    doc.fontSize(20).text('4. Competitive Gap Analysis');
    doc.moveDown();

    if (data.existingSolutions?.solutions?.length) {
      doc.fontSize(16).text('Existing Solutions Analysis');
      data.existingSolutions.solutions.forEach((solution, index) => {
        doc.fontSize(14).text(`${index + 1}. ${solution.name}`);
        doc.fontSize(12).text(solution.description);
        
        if (solution.pros?.length) {
          doc.fontSize(12).text('Strengths:');
          solution.pros.forEach(pro => {
            doc.fontSize(11).text(`  • ${pro}`);
          });
        }
        
        if (solution.cons?.length) {
          doc.fontSize(12).text('Weaknesses:');
          solution.cons.forEach(con => {
            doc.fontSize(11).text(`  • ${con}`);
          });
        }
        doc.moveDown();
      });

      if (data.existingSolutions.gaps?.length) {
        doc.fontSize(16).text('Market Gaps Identified');
        data.existingSolutions.gaps.forEach(gap => {
          doc.fontSize(12).text(`• ${gap}`);
        });
        doc.moveDown();
      }
    }

    // Risk Assessment & Mitigation
    doc.addPage();
    doc.fontSize(20).text('5. Risk Assessment & Mitigation');
    doc.moveDown();

    doc.fontSize(16).text('Market Risks');
    doc.fontSize(12).text('• Market timing and readiness for the solution');
    doc.fontSize(12).text('• Competitive response and market saturation');
    doc.fontSize(12).text('• Customer adoption barriers and change resistance');
    doc.moveDown();

    doc.fontSize(16).text('Technical Risks');
    doc.fontSize(12).text('• Solution feasibility and technical complexity');
    doc.fontSize(12).text('• Resource requirements and development timeline');
    doc.fontSize(12).text('• Scalability and performance considerations');
    doc.moveDown();

    // Validation Conclusion
    doc.addPage();
    doc.fontSize(20).text('6. Validation Conclusion & Next Steps');
    doc.moveDown();

    doc.fontSize(16).text('Validation Summary');
    doc.fontSize(12).text('Based on the comprehensive analysis of problem definition, market research, customer validation, and competitive landscape, the following conclusions can be drawn:');
    doc.moveDown();

    doc.fontSize(14).text('Key Findings:');
    doc.fontSize(12).text('• Problem validation confirms a genuine market need');
    doc.fontSize(12).text('• Target customer profile aligns with market opportunity');
    doc.fontSize(12).text('• Competitive gaps present differentiation opportunities');
    doc.fontSize(12).text('• Solution approach addresses core customer frustrations');
    doc.moveDown();

    doc.fontSize(14).text('Recommended Next Steps:');
    doc.fontSize(12).text('• Develop minimum viable product (MVP) prototype');
    doc.fontSize(12).text('• Conduct customer interviews and feedback sessions');
    doc.fontSize(12).text('• Validate pricing assumptions with target customers');
    doc.fontSize(12).text('• Create detailed go-to-market strategy');
    doc.fontSize(12).text('• Establish success metrics and validation criteria');

    doc.end();

    return new Promise((resolve, reject) => {
      stream.on('finish', () => {
        resolve({
          url: `/temp/${filename}`,
          filename,
        });
      });
      stream.on('error', reject);
    });
  }

  private async generateValidationDOCX(data: WorkflowData): Promise<DocumentResult> {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx');
    
    const filename = `problem-solution-validation-${Date.now()}.docx`;
    const filepath = path.join(process.cwd(), 'temp', filename);
    
    // Ensure temp directory exists
    await fs.promises.mkdir(path.dirname(filepath), { recursive: true });

    const sections = [
      new Paragraph({
        text: "Problem-Solution Validation Analysis",
        heading: HeadingLevel.TITLE,
      }),
      new Paragraph({
        text: "Comprehensive Validation Framework",
        heading: HeadingLevel.HEADING_1,
      }),
    ];

    // Problem Definition & Validation
    sections.push(
      new Paragraph({
        text: "Problem Definition & Validation",
        heading: HeadingLevel.HEADING_1,
      })
    );

    if (data.problemStatement) {
      sections.push(
        new Paragraph({
          text: "Problem Statement",
          heading: HeadingLevel.HEADING_2,
        }),
        new Paragraph({
          children: [new TextRun(data.problemStatement.refined || data.problemStatement.original)],
        })
      );
    }

    if (data.rootCause) {
      sections.push(
        new Paragraph({
          text: "Root Cause Analysis",
          heading: HeadingLevel.HEADING_2,
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Primary Cause: ", bold: true }),
            new TextRun(data.rootCause.primaryCause),
          ],
        })
      );
    }

    // Solution-Market Fit Analysis
    sections.push(
      new Paragraph({
        text: "Solution-Market Fit Analysis",
        heading: HeadingLevel.HEADING_1,
      })
    );

    if (data.marketResearch?.findings) {
      sections.push(
        new Paragraph({
          text: "Market Research Findings",
          heading: HeadingLevel.HEADING_2,
        })
      );

      if (data.marketResearch.findings.marketSize) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({ text: "Market Size: ", bold: true }),
              new TextRun(data.marketResearch.findings.marketSize),
            ],
          })
        );
      }
    }

    // Customer Validation Summary
    sections.push(
      new Paragraph({
        text: "Customer Validation Summary",
        heading: HeadingLevel.HEADING_1,
      })
    );

    if (data.icp) {
      sections.push(
        new Paragraph({
          text: "Ideal Customer Profile",
          heading: HeadingLevel.HEADING_2,
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Target Customer: ", bold: true }),
            new TextRun(`${data.icp.name} - ${data.icp.description}`),
          ],
        })
      );
    }

    // Competitive Gap Analysis
    sections.push(
      new Paragraph({
        text: "Competitive Gap Analysis",
        heading: HeadingLevel.HEADING_1,
      })
    );

    if (data.existingSolutions?.solutions?.length) {
      sections.push(
        new Paragraph({
          text: "Existing Solutions Analysis",
          heading: HeadingLevel.HEADING_2,
        })
      );

      data.existingSolutions.solutions.forEach((solution, index) => {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${index + 1}. ${solution.name}: `, bold: true }),
              new TextRun(solution.description),
            ],
          })
        );
      });
    }

    // Validation Conclusion
    sections.push(
      new Paragraph({
        text: "Validation Conclusion & Next Steps",
        heading: HeadingLevel.HEADING_1,
      }),
      new Paragraph({
        text: "Based on the comprehensive analysis, this validation framework provides a structured approach to evaluating problem-solution fit and market opportunity.",
      })
    );

    const doc = new Document({
      sections: [{
        properties: {},
        children: sections,
      }],
    });

    const buffer = await Packer.toBuffer(doc);
    await fs.promises.writeFile(filepath, buffer);

    return {
      url: `/temp/${filename}`,
      filename,
    };
  }
}

export const documentService = new DocumentService();
