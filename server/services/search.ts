interface MarketResearchFindings {
  marketSize: string;
  competitors: string[];
  trends: string[];
  references?: Array<{
    source: string;
    title: string;
    relevance: string;
    url?: string;
  }>;
  confidence: number;
  dataSource: 'search-api' | 'ai-generated' | 'fallback';
}

interface ExistingSolution {
  name: string;
  description: string;
  pros: string[];
  cons: string[];
  pricing?: string;
  targetAudience?: string;
  sourceUrl?: string;
}

export class SearchService {
  private async searchWeb(query: string): Promise<any[]> {
    // If SERP_API_KEY is available, use SerpAPI
    const serpApiKey = process.env.SERP_API_KEY || process.env.SERPAPI_KEY;
    
    if (serpApiKey) {
      try {
        const response = await fetch(`https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&api_key=${serpApiKey}`);
        const data = await response.json();
        return data.organic_results || [];
      } catch (error) {
        console.warn('SerpAPI search failed:', error);
      }
    }

    // Fallback to Bing Search API
    const bingApiKey = process.env.BING_SEARCH_API_KEY || process.env.AZURE_SEARCH_API_KEY;
    
    if (bingApiKey) {
      try {
        const response = await fetch(`https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(query)}`, {
          headers: {
            'Ocp-Apim-Subscription-Key': bingApiKey,
          },
        });
        const data = await response.json();
        return data.webPages?.value || [];
      } catch (error) {
        console.warn('Bing Search API failed:', error);
      }
    }

    // Return empty array if no API keys available
    console.warn('No search API keys available. Market research will be limited.');
    return [];
  }

  async conductMarketResearch(problemStatement: string): Promise<MarketResearchFindings> {
    try {
      // Try to search with available APIs
      const marketSizeResults = await this.searchWeb(`"${problemStatement}" market size statistics 2024`);
      const competitorResults = await this.searchWeb(`"${problemStatement}" solutions tools companies`);
      const trendsResults = await this.searchWeb(`"${problemStatement}" trends 2024 industry report`);

      if (marketSizeResults.length > 0 || competitorResults.length > 0 || trendsResults.length > 0) {
        const marketSize = this.extractMarketSize(marketSizeResults);
        const competitors = this.extractCompetitors(competitorResults);
        const trends = this.extractTrends(trendsResults);
        const references = this.extractCitations([...marketSizeResults, ...competitorResults, ...trendsResults]);

        const confidence = Math.min(
          (marketSizeResults.length + competitorResults.length + trendsResults.length) / 30,
          1
        );

        return {
          marketSize,
          competitors,
          trends,
          references,
          confidence,
          dataSource: 'search-api' as const,
        };
      }
    } catch (searchError) {
      console.log("Search API failed, using AI-powered market research:", searchError);
    }

    try {
      const { openaiService } = await import('./openai.js');
      console.log("Using AI-powered detailed market research");
      const aiResult = await openaiService.conductDetailedMarketResearch(problemStatement);
      return { ...aiResult, dataSource: 'ai-generated' as const };
    } catch (error) {
      console.log("AI market research failed, providing research framework:", error);
      return {
        marketSize: "Research recommended: Use industry reports (IBISWorld, Statista), government data, and competitor analysis to determine Total Addressable Market (TAM), Serviceable Addressable Market (SAM), and Serviceable Obtainable Market (SOM).",
        competitors: [
          "Direct competitors: Companies solving the exact same problem with similar solutions",
          "Indirect competitors: Companies solving the same problem with different approaches",
          "Substitute solutions: Alternative ways customers currently address this need"
        ],
        trends: [
          "Industry growth rates and market dynamics",
          "Technology adoption patterns affecting customer behavior", 
          "Regulatory changes that could impact the market",
          "Investment and funding trends in this sector"
        ],
        references: [
          {
            source: "IBISWorld",
            title: "Industry Market Research Reports",
            relevance: "Comprehensive industry analysis and market size data"
          },
          {
            source: "Statista",
            title: "Market and Consumer Data",
            relevance: "Market statistics, trends, and consumer insights"
          },
          {
            source: "Government Trade Data",
            title: "Industry Statistics and Economic Reports",
            relevance: "Official government data on market size and industry trends"
          }
        ],
        confidence: 0.4,
        dataSource: 'fallback' as const,
      };
    }
  }

  async findExistingSolutions(problemStatement: string): Promise<ExistingSolution[]> {
    try {
      const solutionsQuery = `"${problemStatement}" software tools solutions platforms`;
      const results = await this.searchWeb(solutionsQuery);

      if (results.length > 0) {
        return this.extractSolutions(results);
      }

      // Fall back to AI-powered solutions analysis
      try {
        const { openaiService } = await import('./openai.js');
        console.log("No search API keys available. Market research will be limited.");
        return await openaiService.findExistingSolutions(problemStatement);
      } catch (error) {
        console.log("AI solutions analysis failed, providing competitor examples:", error);
        // Provide specific competitor examples for MVP development tools
        return [
          {
            name: "LivePlan (by Palo Alto Software)",
            description: "Comprehensive business planning software with step-by-step guidance, financial forecasting, and investor-ready business plan templates",
            pros: [
              "500+ sample business plans and templates",
              "Built-in financial forecasting tools",
              "Guided business plan creation process"
            ],
            cons: [
              "Monthly subscription required ($20/month)",
              "Focuses mainly on traditional business plans",
              "Limited MVP-specific guidance"
            ],
            pricing: "Starting at $20/month, with Premium at $40/month",
            targetAudience: "Small business owners and traditional entrepreneurs"
          },
          {
            name: "Lean Canvas (LeanStack)",
            description: "Digital lean canvas tool for creating one-page business models, focusing on problem-solution fit and lean startup methodology",
            pros: [
              "Simple one-page business model format",
              "Built for lean startup methodology",
              "Collaborative team features"
            ],
            cons: [
              "Limited to canvas format only",
              "No detailed market research features",
              "Requires lean startup knowledge"
            ],
            pricing: "Free tier available, Pro plans from $12/month",
            targetAudience: "Lean startup practitioners and agile entrepreneurs"
          },
          {
            name: "Aha! (Product Management)",
            description: "Product management platform with roadmapping, feature prioritization, and requirements documentation for product teams",
            pros: [
              "Advanced roadmapping and prioritization",
              "Integration with development tools",
              "Comprehensive feature management"
            ],
            cons: [
              "Complex for first-time founders",
              "Expensive for small teams ($74/month)",
              "Focused on existing products, not MVP planning"
            ],
            pricing: "Starting at $74/month per user",
            targetAudience: "Established product teams and larger companies"
          }
        ];
      }
    } catch (error) {
      console.error('Finding existing solutions failed:', error);
      return [
        {
          name: "Manual Research Required",
          description: "Conduct thorough competitive analysis using available resources",
          pros: [
            "Complete control over research depth",
            "Can access latest market information",
            "Direct competitor interaction possible"
          ],
          cons: [
            "Time-intensive process",
            "Requires multiple data sources",
            "May have information gaps"
          ],
          pricing: "Free with manual effort, paid tools available for automation",
          targetAudience: "Startups with limited research budget"
        }
      ];
    }
  }

  private extractMarketSize(results: any[]): string {
    // Look for market size indicators in search results
    const sizeIndicators = ['billion', 'million', 'market size', 'revenue', 'worth'];
    
    for (const result of results.slice(0, 5)) {
      const content = (result.snippet || result.description || '').toLowerCase();
      if (sizeIndicators.some(indicator => content.includes(indicator))) {
        // Extract the first sentence that mentions size
        const sentences = content.split('.');
        for (const sentence of sentences) {
          if (sizeIndicators.some(indicator => sentence.includes(indicator))) {
            return sentence.trim();
          }
        }
      }
    }
    
    return 'Market size data not readily available';
  }

  private extractCompetitors(results: any[]): string[] {
    const competitors: string[] = [];
    
    for (const result of results.slice(0, 10)) {
      const title = result.title || result.name || '';
      const content = result.snippet || result.description || '';
      
      // Look for company/product names in titles
      if (title.toLowerCase().includes('best ') || title.toLowerCase().includes('top ')) {
        const words = title.split(' ');
        competitors.push(...words.filter((word: string) => 
          word.length > 3 && 
          !['best', 'top', 'for', 'the', 'and', 'with'].includes(word.toLowerCase())
        ));
      }
      
      // Extract domain names as potential competitors
      if (result.link || result.url) {
        const url = result.link || result.url;
        const domain = url.replace(/^https?:\/\//, '').split('/')[0].replace('www.', '');
        if (!domain.includes('google') && !domain.includes('bing')) {
          competitors.push(domain);
        }
      }
    }
    
    return Array.from(new Set(competitors)).slice(0, 5);
  }

  private extractTrends(results: any[]): string[] {
    const trends: string[] = [];
    const trendKeywords = ['trend', 'growing', 'increasing', 'rising', 'emerging', 'future'];
    
    for (const result of results.slice(0, 5)) {
      const content = (result.snippet || result.description || '').toLowerCase();
      const sentences = content.split('.');
      
      for (const sentence of sentences) {
        if (trendKeywords.some(keyword => sentence.includes(keyword))) {
          trends.push(sentence.trim());
        }
      }
    }
    
    return trends.slice(0, 3);
  }

  private extractSolutions(results: any[]): ExistingSolution[] {
    const solutions: ExistingSolution[] = [];
    
    for (const result of results.slice(0, 5)) {
      const title = result.title || result.name || '';
      const description = result.snippet || result.description || '';
      const url = result.link || result.url || '';
      
      if (title && description) {
        const domain = url.replace(/^https?:\/\//, '').split('/')[0].replace('www.', '');
        
        solutions.push({
          name: title.split('-')[0].trim() || domain,
          description: description,
          pros: ['Available solution'],
          cons: ['May not fit exact needs'],
          targetAudience: 'General users',
          sourceUrl: url || undefined,
        });
      }
    }
    
    return solutions;
  }

  private extractCitations(results: any[]): Array<{ source: string; title: string; relevance: string; url?: string }> {
    const seen = new Set<string>();
    const citations: Array<{ source: string; title: string; relevance: string; url?: string }> = [];

    for (const result of results.slice(0, 10)) {
      const url = result.link || result.url || '';
      const title = result.title || result.name || '';
      if (!url || seen.has(url)) continue;
      seen.add(url);

      const domain = url.replace(/^https?:\/\//, '').split('/')[0].replace('www.', '');
      citations.push({
        source: domain,
        title: title,
        relevance: (result.snippet || result.description || '').slice(0, 150),
        url: url,
      });

      if (citations.length >= 5) break;
    }

    return citations;
  }
}

export const searchService = new SearchService();
