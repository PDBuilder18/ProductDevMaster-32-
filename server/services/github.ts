import { Octokit } from '@octokit/rest';
import type { WorkflowData } from '@shared/schema';

export interface GitHubConfig {
  accessToken: string;
  owner: string;
  repo: string;
}

export interface GitHubExportResult {
  url: string;
  sha: string;
  filename: string;
}

export class GitHubService {
  private octokit: Octokit;

  constructor(accessToken: string) {
    this.octokit = new Octokit({
      auth: accessToken,
    });
  }

  async exportToRepository(
    config: GitHubConfig,
    data: WorkflowData,
    filename?: string
  ): Promise<GitHubExportResult> {
    try {
      const content = this.generateMarkdownContent(data);
      const fileName = filename || `mvp-requirements-${Date.now()}.md`;
      const path = `docs/${fileName}`;

      // Check if file exists
      let sha: string | undefined;
      try {
        const { data: existingFile } = await this.octokit.rest.repos.getContent({
          owner: config.owner,
          repo: config.repo,
          path,
        });
        
        if ('sha' in existingFile) {
          sha = existingFile.sha;
        }
      } catch (error: any) {
        // File doesn't exist, which is fine for new files
        if (error.status !== 404) {
          throw error;
        }
      }

      // Create or update the file
      const response = await this.octokit.rest.repos.createOrUpdateFileContents({
        owner: config.owner,
        repo: config.repo,
        path,
        message: sha ? `Update MVP requirements: ${fileName}` : `Add MVP requirements: ${fileName}`,
        content: Buffer.from(content).toString('base64'),
        sha,
      });

      return {
        url: response.data.content?.html_url || '',
        sha: response.data.content?.sha || '',
        filename: fileName,
      };
    } catch (error) {
      console.error('GitHub export failed:', error);
      throw new Error('Failed to export to GitHub repository');
    }
  }

  async createIssuesFromFeatures(
    config: GitHubConfig,
    features: Array<{ name: string; description: string; priority: string }>
  ): Promise<Array<{ number: number; url: string; title: string }>> {
    const issues = [];

    for (const feature of features) {
      try {
        const response = await this.octokit.rest.issues.create({
          owner: config.owner,
          repo: config.repo,
          title: `[${feature.priority.toUpperCase()}] ${feature.name}`,
          body: feature.description,
          labels: ['mvp', feature.priority],
        });

        issues.push({
          number: response.data.number,
          url: response.data.html_url,
          title: response.data.title,
        });
      } catch (error) {
        console.error(`Failed to create issue for feature: ${feature.name}`, error);
      }
    }

    return issues;
  }

  async getUserRepositories(accessToken: string): Promise<Array<{ name: string; full_name: string; private: boolean }>> {
    try {
      const tempOctokit = new Octokit({ auth: accessToken });
      
      const response = await tempOctokit.rest.repos.listForAuthenticatedUser({
        visibility: 'all',
        sort: 'updated',
        per_page: 100,
      });

      return response.data.map(repo => ({
        name: repo.name,
        full_name: repo.full_name,
        private: repo.private,
      }));
    } catch (error) {
      console.error('Failed to fetch user repositories:', error);
      throw new Error('Failed to fetch repositories');
    }
  }

  async verifyRepositoryAccess(config: GitHubConfig): Promise<boolean> {
    try {
      await this.octokit.rest.repos.get({
        owner: config.owner,
        repo: config.repo,
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  private generateMarkdownContent(data: WorkflowData): string {
    let content = '# MVP Requirements Document\n\n';
    content += `Generated on: ${new Date().toISOString()}\n\n`;

    if (data.problemStatement) {
      content += '## Problem Statement\n\n';
      content += `${data.problemStatement.refined || data.problemStatement.original}\n\n`;
      
      if (data.problemStatement.aiSuggestions?.length) {
        content += '### AI Suggestions\n\n';
        data.problemStatement.aiSuggestions.forEach(suggestion => {
          content += `- ${suggestion}\n`;
        });
        content += '\n';
      }
    }

    if (data.marketResearch?.findings) {
      content += '## Market Research\n\n';
      
      if (data.marketResearch.findings.marketSize) {
        content += `**Market Size:** ${data.marketResearch.findings.marketSize}\n\n`;
      }
      
      if (data.marketResearch.findings.competitors?.length) {
        content += '### Competitors\n\n';
        data.marketResearch.findings.competitors.forEach(competitor => {
          content += `- ${competitor}\n`;
        });
        content += '\n';
      }
      
      if (data.marketResearch.findings.trends?.length) {
        content += '### Market Trends\n\n';
        data.marketResearch.findings.trends.forEach(trend => {
          content += `- ${trend}\n`;
        });
        content += '\n';
      }
    }

    if (data.rootCause) {
      content += '## Root Cause Analysis\n\n';
      content += `**Primary Cause:** ${data.rootCause.primaryCause}\n\n`;
      
      if (data.rootCause.causes?.length) {
        content += '### Analysis Chain\n\n';
        data.rootCause.causes.forEach(cause => {
          content += `${cause.level}. **${cause.question}**\n`;
          content += `   ${cause.answer}\n\n`;
        });
      }
    }

    if (data.icp) {
      content += '## Ideal Customer Profile\n\n';
      content += `**Name:** ${data.icp.name}\n\n`;
      content += `**Description:** ${data.icp.description}\n\n`;
      
      content += '### Demographics\n\n';
      content += `- **Age:** ${data.icp.demographics.age}\n`;
      content += `- **Job Role:** ${data.icp.demographics.jobRole}\n`;
      content += `- **Income:** ${data.icp.demographics.income}\n`;
      if (data.icp.demographics.location) {
        content += `- **Location:** ${data.icp.demographics.location}\n`;
      }
      content += '\n';
      
      content += '### Psychographics\n\n';
      content += '**Goals:**\n';
      data.icp.psychographics.goals.forEach(goal => {
        content += `- ${goal}\n`;
      });
      content += '\n**Frustrations:**\n';
      data.icp.psychographics.frustrations.forEach(frustration => {
        content += `- ${frustration}\n`;
      });
      content += '\n**Values:**\n';
      data.icp.psychographics.values.forEach(value => {
        content += `- ${value}\n`;
      });
      content += '\n';
    }

    if (data.useCase) {
      content += '## Use Case\n\n';
      content += `${data.useCase.narrative}\n\n`;
      
      if (data.useCase.steps?.length) {
        content += '### Step-by-Step Process\n\n';
        data.useCase.steps.forEach(step => {
          content += `${step.step}. **${step.action}**\n`;
          content += `   *Outcome:* ${step.outcome}\n\n`;
        });
      }
    }

    if (data.productRequirements?.features?.length) {
      content += '## Product Requirements\n\n';
      
      const priorities = ['must-have', 'should-have', 'could-have', 'wont-have'];
      priorities.forEach(priority => {
        const featuresOfPriority = data.productRequirements!.features.filter(f => f.priority === priority);
        if (featuresOfPriority.length > 0) {
          content += `### ${priority.toUpperCase().replace('-', ' ')} Features\n\n`;
          featuresOfPriority.forEach(feature => {
            content += `- **${feature.name}**: ${feature.description}\n`;
          });
          content += '\n';
        }
      });
      
      if (data.productRequirements.functions?.length) {
        content += '### Core Functions\n\n';
        data.productRequirements.functions.forEach(func => {
          content += `- ${func}\n`;
        });
        content += '\n';
      }
      
      if (data.productRequirements.constraints?.length) {
        content += '### Constraints\n\n';
        data.productRequirements.constraints.forEach(constraint => {
          content += `- ${constraint}\n`;
        });
        content += '\n';
      }
    }

    if (data.prioritization?.features?.length) {
      content += '## Feature Prioritization\n\n';
      content += `**Method:** ${data.prioritization.method}\n\n`;
      
      content += '| Feature | Priority | Score |\n';
      content += '|---------|----------|-------|\n';
      data.prioritization.features.forEach(feature => {
        content += `| ${feature.name} | ${feature.priority} | ${feature.score || 'N/A'} |\n`;
      });
      content += '\n';
    }

    content += '---\n\n';
    content += '*This document was generated by PDBuilder - AI-Powered MVP Development Tool*\n';

    return content;
  }
}

export const createGitHubService = (accessToken: string) => new GitHubService(accessToken);