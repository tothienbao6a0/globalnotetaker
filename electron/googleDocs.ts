import { google } from 'googleapis';
import { GoogleAuthService, AuthTokens } from './googleAuth';

export interface GoogleDocInfo {
  id: string;
  title: string;
  url: string;
  lastModified: string;
}

export class GoogleDocsService {
  private docs: any;
  private drive: any;
  private authService: GoogleAuthService;

  constructor(authService: GoogleAuthService) {
    this.authService = authService;
    const authClient = authService.getAuthClient();
    
    this.docs = google.docs({ version: 'v1', auth: authClient });
    this.drive = google.drive({ version: 'v3', auth: authClient });
  }

  /**
   * Create a new Google Doc with the given content
   */
  async createDocument(title: string, content: string): Promise<GoogleDocInfo> {
    try {
      // Create the document
      const createResponse = await this.docs.documents.create({
        requestBody: {
          title: title,
        },
      });

      const documentId = createResponse.data.documentId;

      // Add content to the document
      if (content.trim()) {
        await this.updateDocumentContent(documentId, content);
      }

      // Get document metadata
      const doc = await this.getDocumentInfo(documentId);
      return doc;
    } catch (error) {
      console.error('Error creating document:', error);
      throw new Error('Failed to create Google Doc');
    }
  }

  /**
   * Update existing document content
   */
  async updateDocument(documentId: string, content: string): Promise<void> {
    try {
      // Get current document to find content length
      const doc = await this.docs.documents.get({ documentId });
      const bodyContent = doc.data.body.content;
      
      // Calculate the length of existing content
      let endIndex = 1; // Start after the first element (usually a paragraph)
      if (bodyContent && bodyContent.length > 1) {
        const lastElement = bodyContent[bodyContent.length - 1];
        endIndex = lastElement.endIndex - 1; // Subtract 1 to avoid the final newline
      }

      const requests: any[] = [];

      // Delete existing content if any
      if (endIndex > 1) {
        requests.push({
          deleteContentRange: {
            range: {
              startIndex: 1,
              endIndex: endIndex,
            },
          },
        });
      }

      // Insert new content
      if (content.trim()) {
        requests.push({
          insertText: {
            location: {
              index: 1,
            },
            text: content,
          },
        });
      }

      if (requests.length > 0) {
        await this.docs.documents.batchUpdate({
          documentId,
          requestBody: {
            requests,
          },
        });
      }
    } catch (error) {
      console.error('Error updating document:', error);
      throw new Error('Failed to update Google Doc');
    }
  }

  /**
   * Append content to existing document
   */
  async appendToDocument(documentId: string, content: string): Promise<void> {
    try {
      // Get current document to find where to append
      const doc = await this.docs.documents.get({ documentId });
      const bodyContent = doc.data.body.content;
      
      // Find the end index
      let endIndex = 1;
      if (bodyContent && bodyContent.length > 0) {
        const lastElement = bodyContent[bodyContent.length - 1];
        endIndex = lastElement.endIndex - 1;
      }

      // Append new content
      await this.docs.documents.batchUpdate({
        documentId,
        requestBody: {
          requests: [
            {
              insertText: {
                location: {
                  index: endIndex,
                },
                text: `\n\n--- ${new Date().toLocaleString()} ---\n${content}`,
              },
            },
          ],
        },
      });
    } catch (error) {
      console.error('Error appending to document:', error);
      throw new Error('Failed to append to Google Doc');
    }
  }

  /**
   * Get document information
   */
  async getDocumentInfo(documentId: string): Promise<GoogleDocInfo> {
    try {
      const [docResponse, driveResponse] = await Promise.all([
        this.docs.documents.get({ documentId }),
        this.drive.files.get({ fileId: documentId, fields: 'modifiedTime,webViewLink' }),
      ]);

      return {
        id: documentId,
        title: docResponse.data.title || 'Untitled',
        url: driveResponse.data.webViewLink || '',
        lastModified: driveResponse.data.modifiedTime || new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error getting document info:', error);
      throw new Error('Failed to get document information');
    }
  }

  /**
   * Search for existing notes documents
   */
  async findNotesDocuments(query: string = 'Global Notes'): Promise<GoogleDocInfo[]> {
    try {
      const response = await this.drive.files.list({
        q: `name contains "${query}" and mimeType="application/vnd.google-apps.document" and trashed=false`,
        fields: 'files(id,name,modifiedTime,webViewLink)',
        orderBy: 'modifiedTime desc',
      });

      return response.data.files.map((file: any) => ({
        id: file.id,
        title: file.name,
        url: file.webViewLink,
        lastModified: file.modifiedTime,
      }));
    } catch (error) {
      console.error('Error searching documents:', error);
      throw new Error('Failed to search for documents');
    }
  }

  /**
   * Get or create a daily notes document
   */
  async getOrCreateDailyDoc(): Promise<GoogleDocInfo> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const title = `Global Notes - ${today}`;

    try {
      // Search for today's document
      const existingDocs = await this.findNotesDocuments(title);
      
      if (existingDocs.length > 0) {
        return existingDocs[0];
      }

      // Create new daily document
      return await this.createDocument(title, `# Notes for ${today}\n\n`);
    } catch (error) {
      console.error('Error getting/creating daily doc:', error);
      throw new Error('Failed to get or create daily document');
    }
  }

  private async updateDocumentContent(documentId: string, content: string): Promise<void> {
    await this.docs.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [
          {
            insertText: {
              location: {
                index: 1,
              },
              text: content,
            },
          },
        ],
      },
    });
  }

  /**
   * Add content as a new section with section break
   */
  async addSectionToDocument(documentId: string, content: string): Promise<void> {
    try {
      // Get document to find the end index
      const doc = await this.docs.documents.get({ documentId });
      const bodyContent = doc.data.body?.content || [];
      
      // Find the last element's end index
      let endIndex = 1;
      if (bodyContent.length > 0) {
        const lastElement = bodyContent[bodyContent.length - 1];
        endIndex = lastElement.endIndex || 1;
      }

      // Simply append the content with separators (no section breaks for now)
      await this.docs.documents.batchUpdate({
        documentId,
        requestBody: {
          requests: [
            {
              insertText: {
                location: {
                  index: endIndex - 1,
                },
                text: `\n\n${content}`,
              },
            },
          ] as any,
        },
      });
    } catch (error) {
      console.error('Error adding section to document:', error);
      throw new Error(`Failed to add section: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 