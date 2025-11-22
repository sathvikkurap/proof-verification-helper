import fs from 'fs';
import path from 'path';
import { Proof, ParsedProof } from '../utils/leanParser';
import { logger } from '../utils/logger';

export interface ExportFormat {
  version: string;
  metadata: {
    exportedAt: string;
    exporter: string;
    format: 'proof-v1';
  };
  proof: Proof;
  parsed: ParsedProof;
  dependencies: Array<{
    id: string;
    name: string;
    code: string;
  }>;
}

export interface ImportResult {
  success: boolean;
  proof?: Proof;
  errors: string[];
  warnings: string[];
}

export class ExportService {
  /**
   * Export a proof with its dependencies to a JSON format
   */
  static exportProof(proof: Proof, parsed: ParsedProof): ExportFormat {
    const exportData: ExportFormat = {
      version: '1.0.0',
      metadata: {
        exportedAt: new Date().toISOString(),
        exporter: 'Proof Verification Helper',
        format: 'proof-v1',
      },
      proof,
      parsed,
      dependencies: [], // TODO: Implement dependency resolution
    };

    logger.info('Proof exported', { proofId: proof.id, name: proof.name });
    return exportData;
  }

  /**
   * Export proof to Lean 4 file format
   */
  static exportToLean(proof: Proof, parsed: ParsedProof): string {
    let leanCode = `-- Proof: ${proof.name}\n`;
    leanCode += `-- Exported from Proof Verification Helper\n`;
    leanCode += `-- Generated: ${new Date().toISOString()}\n\n`;

    // Add definitions first
    parsed.definitions.forEach(def => {
      leanCode += `${def.type} ${def.name} := ${def.value}\n`;
    });

    if (parsed.definitions.length > 0) leanCode += '\n';

    // Add theorems
    parsed.theorems.forEach(theorem => {
      leanCode += `${theorem.proof}\n`;
    });

    if (parsed.theorems.length > 0) leanCode += '\n';

    // Add lemmas
    parsed.lemmas.forEach(lemma => {
      leanCode += `${lemma.proof}\n`;
    });

    return leanCode;
  }

  /**
   * Export proof to Markdown format with explanations
   */
  static exportToMarkdown(proof: Proof, parsed: ParsedProof): string {
    let markdown = `# ${proof.name}\n\n`;
    markdown += `**Status:** ${proof.status}\n\n`;
    markdown += `**Created:** ${new Date(proof.created_at).toLocaleDateString()}\n\n`;

    if (parsed.definitions.length > 0) {
      markdown += '## Definitions\n\n';
      parsed.definitions.forEach(def => {
        markdown += `### \`${def.name}\`\n\n`;
        markdown += `\`\`\`lean\n${def.type} ${def.name} := ${def.value}\n\`\`\`\n\n`;
      });
    }

    if (parsed.theorems.length > 0) {
      markdown += '## Theorems\n\n';
      parsed.theorems.forEach(theorem => {
        markdown += `### ${theorem.name}\n\n`;
        markdown += `**Statement:** ${theorem.statement}\n\n`;
        markdown += `\`\`\`lean\n${theorem.proof}\n\`\`\`\n\n`;
      });
    }

    if (parsed.lemmas.length > 0) {
      markdown += '## Lemmas\n\n';
      parsed.lemmas.forEach(lemma => {
        markdown += `### ${lemma.name}\n\n`;
        markdown += `**Statement:** ${lemma.statement}\n\n`;
        markdown += `\`\`\`lean\n${lemma.proof}\n\`\`\`\n\n`;
      });
    }

    if (parsed.dependencies.length > 0) {
      markdown += '## Dependencies\n\n';
      parsed.dependencies.forEach(dep => {
        markdown += `- \`${dep}\`\n`;
      });
      markdown += '\n';
    }

    return markdown;
  }

  /**
   * Import proof from JSON export format
   */
  static importProof(exportData: ExportFormat): ImportResult {
    const result: ImportResult = {
      success: false,
      errors: [],
      warnings: [],
    };

    try {
      // Validate format
      if (!exportData.version || !exportData.metadata || !exportData.proof) {
        result.errors.push('Invalid export format');
        return result;
      }

      if (exportData.metadata.format !== 'proof-v1') {
        result.warnings.push(`Unsupported format version: ${exportData.metadata.format}`);
      }

      // Create proof object
      const proof: Proof = {
        id: exportData.proof.id,
        name: exportData.proof.name,
        code: exportData.proof.code,
        status: exportData.proof.status,
        user_id: null, // Imported proofs are public
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        parsed: exportData.parsed,
      };

      result.success = true;
      result.proof = proof;

      logger.info('Proof imported', { proofId: proof.id, name: proof.name });

    } catch (error) {
      result.errors.push(`Import failed: ${error.message}`);
      logger.error('Proof import failed', { error: error.message });
    }

    return result;
  }

  /**
   * Import proof from Lean 4 code string
   */
  static importFromLean(code: string, name?: string): ImportResult {
    const result: ImportResult = {
      success: false,
      errors: [],
      warnings: [],
    };

    try {
      // Basic validation
      if (!code || typeof code !== 'string') {
        result.errors.push('Invalid Lean code provided');
        return result;
      }

      if (code.length > 10000) {
        result.errors.push('Code exceeds maximum length');
        return result;
      }

      // Import the parser
      const { parseLeanCode } = require('../utils/leanParser');
      const parsed = parseLeanCode(code);

      if (parsed.errors.length > 0) {
        result.warnings.push(...parsed.errors);
      }

      // Generate proof name if not provided
      const proofName = name || this.generateProofName(parsed);

      // Create proof object
      const proof: Proof = {
        id: `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: proofName,
        code,
        status: parsed.errors.length > 0 ? 'error' : parsed.theorems.length > 0 ? 'complete' : 'incomplete',
        user_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        parsed,
      };

      result.success = true;
      result.proof = proof;

    } catch (error) {
      result.errors.push(`Lean import failed: ${error.message}`);
      logger.error('Lean import failed', { error: error.message });
    }

    return result;
  }

  /**
   * Generate a proof name from parsed content
   */
  private static generateProofName(parsed: ParsedProof): string {
    if (parsed.theorems.length > 0) {
      return parsed.theorems[0].name;
    }
    if (parsed.lemmas.length > 0) {
      return parsed.lemmas[0].name;
    }
    if (parsed.definitions.length > 0) {
      return parsed.definitions[0].name;
    }
    return `Imported Proof ${new Date().toLocaleDateString()}`;
  }

  /**
   * Share proof via public URL
   */
  static generateShareLink(proofId: string): string {
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    return `${baseUrl}/shared/${proofId}`;
  }

  /**
   * Create a shareable proof (public access)
   */
  static createSharedProof(proof: Proof): Proof {
    return {
      ...proof,
      id: `shared-${proof.id}`,
      user_id: null, // Public proof
    };
  }
}
