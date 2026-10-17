import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { buildSwapInpaintingPrompt, parseBase64DataUrl } from './src/utils/swap-logic.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ extended: true, limit: '60mb' }));

// Server-side Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Endpoint: Intelligent Object Detection & Multimodal Vision Matching
app.post('/api/analyze-objects', async (req: Request, res: Response) => {
  try {
    const { imageA, imageB } = req.body;

    if (!imageA || !imageB) {
      return res.status(400).json({ error: 'Both Image A (original) and Image B (replacement) are required.' });
    }

    const parsedA = parseBase64DataUrl(imageA);
    const parsedB = parseBase64DataUrl(imageB);

    if (!parsedA || !parsedB) {
      return res.status(400).json({ error: 'Invalid base64 image data URL provided.' });
    }

    const systemPrompt = `You are a world-class multimodal AI vision specialist for image editing and object inpainting.
Analyze both images:
- Image 1: The original photo (Image A) containing objects in a real environment.
- Image 2: The replacement reference (Image B) showing a new object to use.

Perform deep semantic and spatial analysis:
1. Examine Image 2: Identify the specific product/object, its category, primary color, materials, texture, shape, and key features.
2. Examine Image 1: Identify all visible objects, human interactions, and environment context.
3. Match the object in Image 2 to the most semantically, functionally, and physically compatible object in Image 1 to replace (e.g. grips to grips, shoes to shoes, chair to chair, watch to watch).
4. Identify the precise bounding box coordinates for each instance of this object in Image 1.
   CRITICAL SPATIAL COORDINATE INSTRUCTIONS (DO NOT INVERT):
   - VERTICAL AXIS (Y): 0 is the TOP of Image 1, 1000 is the BOTTOM of Image 1.
     ymin is the top edge of the object, ymax is the bottom edge of the object (always ymin < ymax).
     (For example, motorcycle handlebars, footwear, or chairs in the lower half of the scene have ymin and ymax between 500 and 950!).
   - HORIZONTAL AXIS (X): 0 is the LEFT of Image 1, 1000 is the RIGHT of Image 1.
     xmin is the left edge of the object, xmax is the right edge of the object (always xmin < xmax).
   - Format: Each box MUST be strictly [ymin, xmin, ymax, xmax] as integers between 0 and 1000.
5. Determine if there is 1 instance or multiple separate instances (e.g. left grip and right grip; left shoe and right shoe).
6. List 2 to 3 alternative candidate objects detected in Image 1 in case the user wants to substitute a different item.
7. Provide a clear justification for why this target was selected, along with perspective & lighting advice.

Respond strictly with valid JSON conforming to this structure:
{
  "targetObjectName": "string (clear name of target object in Image 1)",
  "targetCategory": "string",
  "confidenceScore": number (between 0.0 and 1.0),
  "explanation": "string (why this object in Image 1 matches the replacement in Image 2)",
  "targetDescription": "string (visual details of existing target object in Image 1)",
  "replacementDescription": "string (visual details of replacement object in Image 2)",
  "instances": [
    {
      "id": "inst-1",
      "name": "string (e.g. Left Handlebar Grip)",
      "confidence": number (between 0.0 and 1.0),
      "box2d": [number, number, number, number],
      "spatialContext": "string (e.g. mounted on outer left handlebar tube at y=690-780, x=115-260)"
    }
  ],
  "alternativeObjects": [
    {
      "name": "string",
      "category": "string",
      "box2d": [number, number, number, number],
      "confidence": number
    }
  ],
  "editingPromptAdvice": "string"
}`;

    const parts = [
      {
        inlineData: {
          mimeType: parsedA.mimeType,
          data: parsedA.base64,
        },
      },
      {
        inlineData: {
          mimeType: parsedB.mimeType,
          data: parsedB.base64,
        },
      },
      {
        text: systemPrompt,
      },
    ];

    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: { parts },
        config: {
          responseMimeType: 'application/json',
        },
      });
    } catch (primaryErr: any) {
      console.warn('Primary vision model error, trying gemini-flash-latest:', primaryErr.message);
      response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: { parts },
        config: {
          responseMimeType: 'application/json',
        },
      });
    }

    const text = response.text?.trim() || '{}';
    let analysis;
    try {
      analysis = JSON.parse(text);
    } catch {
      // Fallback regex extraction if raw markdown fence was attached
      const match = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
      if (match) {
        analysis = JSON.parse(match[1] || match[0]);
      } else {
        throw new Error('Could not parse JSON analysis from model output.');
      }
    }

    return res.json({ success: true, analysis });
  } catch (error: any) {
    console.error('Error during /api/analyze-objects:', error);
    return res.status(500).json({
      error: error.message || 'Vision analysis failed. Please try again.',
    });
  }
});

// Endpoint: Generative Inpainting & Object Swap
app.post('/api/swap-object', async (req: Request, res: Response) => {
  try {
    const {
      imageA,
      imageB,
      targetObjectName,
      targetCategory,
      instances,
      replacementDescription,
      userNotes,
      maskDataUrl,
      model = 'gemini-nano-banana-2.1',
      imageSize = '2K',
    } = req.body;

    if (!imageA || !imageB) {
      return res.status(400).json({ error: 'Both original and replacement images are required.' });
    }

    const parsedA = parseBase64DataUrl(imageA);
    const parsedB = parseBase64DataUrl(imageB);

    if (!parsedA || !parsedB) {
      return res.status(400).json({ error: 'Invalid image format provided.' });
    }

    const instancesDetails = Array.isArray(instances)
      ? instances.map((inst: any, idx: number) => `${inst.name || `Instance ${idx + 1}`}: ${inst.spatialContext || 'target region'}`)
      : [];

    const promptText = buildSwapInpaintingPrompt({
      targetObjectName: targetObjectName || 'target object',
      targetCategory: targetCategory || 'object',
      replacementObjectName: 'replacement object',
      replacementDescription: replacementDescription || '',
      instancesCount: instances?.length || 1,
      instancesDetails,
      userNotes: userNotes || '',
    });

    const parts: any[] = [
      {
        inlineData: {
          mimeType: parsedA.mimeType,
          data: parsedA.base64,
        },
      },
      {
        inlineData: {
          mimeType: parsedB.mimeType,
          data: parsedB.base64,
        },
      },
    ];

    if (maskDataUrl) {
      const parsedMask = parseBase64DataUrl(maskDataUrl);
      if (parsedMask) {
        parts.push({
          inlineData: {
            mimeType: parsedMask.mimeType,
            data: parsedMask.base64,
          },
        });
      }
    }

    parts.push({ text: promptText });

    // Call generative image editing model
    let generatedImageBase64: string | null = null;
    let modelUsed = model;

    // Build configuration - nano banana series supports high-resolution 1K, 2K, 4K
    const isNanoBanana = model.includes('nano-banana') || model.includes('gemini-3-pro-image');
    const config: any = {};
    if (isNanoBanana) {
      config.imageConfig = {
        imageSize: ['1K', '2K', '4K'].includes(imageSize) ? imageSize : '2K',
      };
    }

    try {
      console.log(`Calling primary image model: ${modelUsed} (Resolution: ${imageSize})`);
      const response = await ai.models.generateContent({
        model: modelUsed,
        contents: { parts },
        ...(isNanoBanana ? { config } : {}),
      });

      if (response.candidates && response.candidates[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData?.data) {
            generatedImageBase64 = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
            break;
          }
        }
      }
    } catch (modelErr: any) {
      console.warn(`Primary model ${modelUsed} encountered error:`, modelErr.message);

      // Attempt alternative model
      const fallbackModel = isNanoBanana ? 'gemini-3.1-flash-lite-image' : 'gemini-nano-banana-2.1';
      try {
        modelUsed = fallbackModel;
        console.log(`Attempting fallback model: ${modelUsed}`);
        const fallbackRes = await ai.models.generateContent({
          model: modelUsed,
          contents: { parts },
        });

        if (fallbackRes.candidates && fallbackRes.candidates[0]?.content?.parts) {
          for (const part of fallbackRes.candidates[0].content.parts) {
            if (part.inlineData?.data) {
              generatedImageBase64 = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
              break;
            }
          }
        }
      } catch (fallbackErr: any) {
        console.error('Fallback image model error:', fallbackErr.message);
        throw new Error(`Generative image editing error: ${modelErr.message || fallbackErr.message}`);
      }
    }

    if (!generatedImageBase64) {
      throw new Error('Model finished execution but did not produce an image part in response.');
    }

    return res.json({
      success: true,
      resultImage: generatedImageBase64,
      modelUsed,
      promptUsed: promptText,
    });
  } catch (error: any) {
    console.error('Error during /api/swap-object:', error);
    return res.status(500).json({
      error: error.message || 'Image generation failed. Please verify API key permissions.',
    });
  }
});

// Mount Vite or static dist
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SwapCraft server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
