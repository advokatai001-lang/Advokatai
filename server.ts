import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import {
  generateExpertLegalAnalysis,
  generateLegalDocumentTemplate,
  generateContractRiskAudit,
  isOutOfDomainQuery,
  getOutOfDomainRefusal,
} from './src/services/legalKnowledgeBase.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Helper to check if GEMINI_API_KEY is available
const hasApiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 5);

let ai: GoogleGenAI | null = null;
if (hasApiKey) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// 1. Legal Brain Q&A & Analysis Endpoint
app.post('/api/legal/analyze', async (req, res) => {
  try {
    const {
      query,
      language = 'uz',
      mode = 'standard',
      caseContext = '',
      jurisdiction = 'uz',
      messages = [],
    } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Auto-detect language dynamically from query content
    const cyrillicCount = (query.match(/[а-яА-ЯёЁ]/g) || []).length;
    let targetLang = language;
    if (
      cyrillicCount >= 2 ||
      /^(привет|здравствуйте|добрый|как|что|где|почему|закон|суд|полиция|алименты|статья|прошу)\b/i.test(
        query.trim()
      )
    ) {
      targetLang = 'ru';
    } else if (
      /^(hello|hi|how|what|why|where|can|please|lawyer|court|attorney)\b/i.test(
        query.trim()
      )
    ) {
      targetLang = 'en';
    }

    // STRICT OUT-OF-DOMAIN GUARDRAIL:
    if (isOutOfDomainQuery(query)) {
      const refusal = getOutOfDomainRefusal(targetLang as any);
      return res.json({
        success: true,
        result: refusal,
        detectedLanguage: targetLang,
        source: 'domain-guardrail',
        timestamp: new Date().toISOString(),
      });
    }

    // DEDICATED 51-MODDA HANDLER:
    const cleanLower = query.trim().toLowerCase();
    const is51Article =
      /(^|\s)(51[- ]?modda|modda\s*51|стать[яеи]\s*51|51[- ]?стать[яеи]|article\s*51)($|\s|[?!.,])/i.test(
        cleanLower
      ) ||
      cleanLower === '51' ||
      cleanLower === '51-modda' ||
      cleanLower === '51 modda' ||
      cleanLower === '51 moddani ayt' ||
      cleanLower === '51-modda nima' ||
      cleanLower === '51-modda nima?' ||
      cleanLower === 'статья 51';

    if (is51Article) {
      const directAnalysis = generateExpertLegalAnalysis(
        query,
        targetLang as any,
        mode,
        jurisdiction
      );
      return res.json({
        success: true,
        result: directAnalysis,
        detectedLanguage: targetLang,
        source: 'statutory-article-registry',
        timestamp: new Date().toISOString(),
      });
    }

    // Format conversation history for multi-turn awareness
    let conversationHistoryText = '';
    if (Array.isArray(messages) && messages.length > 0) {
      const recentTurns = messages.slice(-6);
      conversationHistoryText =
        '\nSUHBAT TARIXI (Kontekst):\n' +
        recentTurns
          .map((m: any) => {
            const role =
              m.sender === 'user' || m.role === 'user'
                ? 'Foydalanuvchi'
                : 'AI Advokat';
            const text = m.text || m.content || '';
            return `${role}: ${text.slice(0, 300)}`;
          })
          .join('\n') +
        '\n';
    }

    // If Gemini client is available, try it with a fast timeout fallback
    if (ai) {
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Gemini timeout')), 18000)
        );

        const geminiPromise = ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `Siz O'zbekiston Respublikasi, Rossiya Federatsiyasi va xalqaro huquq bo'yicha eng oliy toifali advokatsiz (IELTS Band 9 darajasidagi yuksak tahliliy intellekt va professional yuridik notiqlik).

QAT'IY CHEKLOV (MAVZUDAN TASHQARI SAVOLLAR):
Agar foydalanuvchi huquq va qonunlarga aloqasi bo'lmagan mavzuda (masalan: taom tayyorlash, tort pishirish, retseptlar, o'yinlar, sport, futbol, she'r to'qish, ob-havo, dasturlash yoki umumiy uy vazifasi) so'rasa, HECH QANDAY boshqa ma'lumot bermasdan, darhol quyidagicha javob bering:
"${getOutOfDomainRefusal(targetLang as any)}"

MUHIM QOIDA: Siz faqat ayrim qonunlar bilan cheklanmaysiz! Siz O'zbekiston Respublikasining BARCHA kodekslari (Fuqarolik, Jinoyat, JPK, FPK, MJtK, Mehnat, Oila, Soliq, Bojxona, Uy-joy, Yer, Shaharsozlik, Byudjet, Saylov, JIK), Oliy Majlis Qonunlari, O'zbekiston Respublikasi Prezidenti Farmon va Qarorlari, Vazirlar Mahkamasi qarorlari, Oliy sud Plenumi qarorlari, shuningdek Rossiya Federatsiyasining barcha qonunlari (УПК РФ, ГПК РФ, 63-ФЗ, 3-ФЗ, 2202-1, 144-ФЗ, 229-ФЗ va boshqalar) hamda Xalqaro huquq normalarini mukammal bilasiz.

TIL TALABI (QAT'IY VA MAJBURIY):
Foydalanuvchi qaysi tilda murojaat qilsa, 100% SHU TILDA (${targetLang.toUpperCase()}) javob bering!
- Agar savol rus tilida bo'lsa -> faqat professional, tabiiy rus tilida javob bering.
- Agar savol o'zbek tilida bo'lsa -> faqat ravon, professional o'zbek tilida javob bering.
- Agar savol ingliz tilida bo'lsa -> faqat ingliz tilida javob bering.

Foydalanuvchi qaysi soha yoki nizo haqida so'rasa, hatto qonun nomini aytmagan bo'lsa ham:
1. O'zingiz mustaqil ravishda tegishli amaldagi qonun hujjati va aniq moddalarni qidirib topib ko'rsating.
2. Har bir xulosangizni qonun moddasi, Oliy sud sharhi yoki rasmiy Lex.uz / Consultant.ru manbalari bilan asoslang.
3. Advokat kabi shaxsning qonuniy manfaatlarini qat'iy himoya qiluvchi strategiya va qadam-baqadam harakatlar rejasini bering.
4. Agar foydalanuvchi shunchaki salomlashsa yoki hol-ahvol so'rasa, tabiiy, samimiy va insondek javob bering, qonun moddalarini tiqishtirmang.
${conversationHistoryText}
Joriy foydalanuvchi so'rovi: "${query}"
Qo'shimcha kontekst: "${caseContext}"
Yurisdiksiya: ${jurisdiction}
Rejim: ${mode}
Aniqlangan til: ${targetLang}

To'liq, chuqur, asoslangan va 100% ishonchli yuridik javob bering.`,
        });

        const geminiRes: any = await Promise.race([geminiPromise, timeoutPromise]);
        if (geminiRes && geminiRes.text) {
          return res.json({
            success: true,
            result: geminiRes.text,
            detectedLanguage: targetLang,
            source: 'gemini-3.8-flash',
            timestamp: new Date().toISOString(),
          });
        }
      } catch (err: any) {
        console.warn('Gemini API call bypassed or timed out, using expert statutory engine:', err?.message);
      }
    }

    // Expert Legal Knowledge Engine response with strict target language
    const expertResult = generateExpertLegalAnalysis(query, targetLang as any, mode, jurisdiction);
    return res.json({
      success: true,
      result: expertResult,
      detectedLanguage: targetLang,
      source: 'expert-legal-engine',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in /api/legal/analyze:', error);
    res.status(500).json({ error: error?.message || 'Tahlil jarayonida xatolik yuz berdi' });
  }
});

// 2. AI Document Analyzer (Contracts, Indictments, Court Decisions)
app.post('/api/legal/analyze-document', async (req, res) => {
  try {
    const { documentText, documentType = 'shartnoma', language = 'uz' } = req.body;

    if (!documentText) {
      return res.status(400).json({ error: 'Hujjat matni kiritilmadi' });
    }

    if (ai) {
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 8000)
        );
        const geminiPromise = ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `Hujjat turi: ${documentType}\nHujjat matni:\n"""${documentText}"""\nUshbu hujjatni O'zbekiston Respublikasi qonunlari (FK, JK, JPK, MK) bo'yicha yuridik ekspertizadan o'tkazing: xavfli bandlar, asossiz majburiyatlar, protsessual xatolar va tahrir tavsiyalarini bering. Til: ${language}.`,
        });
        const geminiRes: any = await Promise.race([geminiPromise, timeoutPromise]);
        if (geminiRes && geminiRes.text) {
          return res.json({
            success: true,
            analysis: geminiRes.text,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.warn('Gemini doc analysis fallback:', err);
      }
    }

    const report = generateContractRiskAudit(documentText, language);
    return res.json({
      success: true,
      analysis: report,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in /api/legal/analyze-document:', error);
    res.status(500).json({ error: error?.message || 'Hujjat tahlilida xatolik' });
  }
});

// 3. AI Legal Document Generator (Da'vo, Shikoyat, Iltimosnoma, Advokat so'rovi)
app.post('/api/legal/generate-document', async (req, res) => {
  try {
    const {
      docCategory = 'davo',
      courtOrOrg = 'Fuqarolik ishlari bo‘yicha sudga',
      parties = { claimant: '', defendant: '' },
      facts = '',
      claims = '',
      language = 'uz',
    } = req.body;

    if (ai) {
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 8000)
        );
        const prompt = `O'zbekiston Respublikasi protsessual qonunchiligi (FPK, JPK, IPK) bo'yicha rasmiy ${docCategory} hujjat loyihasini tayyorlang.\nSud/Organ: ${courtOrOrg}\nDa'vogar/Himoyachi: ${parties.claimant}\nJavobgar/Qarshi taraf: ${parties.defendant}\nFaktlar: ${facts}\nTalablar: ${claims}\nTil: ${language}`;
        const geminiPromise = ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
        });
        const geminiRes: any = await Promise.race([geminiPromise, timeoutPromise]);
        if (geminiRes && geminiRes.text) {
          return res.json({
            success: true,
            documentContent: geminiRes.text,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.warn('Gemini doc generation fallback:', err);
      }
    }

    const doc = generateLegalDocumentTemplate(
      docCategory,
      courtOrOrg,
      parties.claimant || '[F.I.SH.]',
      parties.defendant || '[Tashkilot / Shaxs]',
      facts,
      claims
    );

    return res.json({
      success: true,
      documentContent: doc,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in /api/legal/generate-document:', error);
    res.status(500).json({ error: error?.message || 'Hujjat yaratishda xatolik' });
  }
});

// 4. TTS Endpoint (VoiceLab / Aisha AI Integration with Fallback)
app.post('/api/legal/tts', async (req, res) => {
  try {
    const { text, voice = 'voicelab-jasur', language = 'uz', apiKey } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Matn kiritilmadi' });
    }

    const cleanText = text.replace(/[*#`_\[\]()]/g, ' ').substring(0, 1000).trim();
    const effectiveKey = apiKey || process.env.VOICELAB_API_KEY || process.env.AISHA_API_KEY;

    // 1. Try VoiceLab / Aisha AI if API key is provided
    if (effectiveKey) {
      try {
        const aishaModel =
          voice.includes('dilnoza') || voice.includes('ayol') || voice.includes('female')
            ? 'Gulnoza'
            : 'Jasur';

        const aishaRes = await fetch('https://back.aisha.group/api/v1/tts/post/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': effectiveKey,
          },
          body: JSON.stringify({
            transcript: cleanText,
            model: aishaModel,
          }),
        });

        if (aishaRes.ok) {
          const contentType = aishaRes.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const data: any = await aishaRes.json();
            const audioLink = data.url || data.file_url || data.audio_url || data.link;
            if (audioLink) {
              const fileRes = await fetch(audioLink);
              const arrayBuf = await fileRes.arrayBuffer();
              const base64Audio = Buffer.from(arrayBuf).toString('base64');
              return res.json({
                success: true,
                audioBase64: base64Audio,
                mimeType: 'audio/wav',
                provider: 'voicelab-aisha',
              });
            } else if (data.audio_base64 || data.base64) {
              return res.json({
                success: true,
                audioBase64: data.audio_base64 || data.base64,
                mimeType: 'audio/wav',
                provider: 'voicelab-aisha',
              });
            }
          } else {
            // Direct audio binary stream
            const arrayBuf = await aishaRes.arrayBuffer();
            const base64Audio = Buffer.from(arrayBuf).toString('base64');
            return res.json({
              success: true,
              audioBase64: base64Audio,
              mimeType: contentType.includes('mpeg') || contentType.includes('mp3') ? 'audio/mpeg' : 'audio/wav',
              provider: 'voicelab-aisha',
            });
          }
        } else {
          console.warn('VoiceLab / Aisha API returned status:', aishaRes.status);
        }
      } catch (voiceLabErr) {
        console.warn('VoiceLab / Aisha API connection error:', voiceLabErr);
      }
    }

    // 2. Try Gemini TTS if available
    if (ai) {
      try {
        const geminiVoice = voice.includes('dilnoza') || voice.includes('ayol') ? 'Aoede' : 'Puck';
        const ttsRes = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [{ role: 'user', parts: [{ text: cleanText.substring(0, 500) }] }],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: geminiVoice as any } },
            },
          },
        });
        const audio = ttsRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (audio) {
          return res.json({
            success: true,
            audioBase64: audio,
            mimeType: 'audio/wav',
            provider: 'gemini-tts',
          });
        }
      } catch {
        // Fall back gracefully
      }
    }

    return res.json({ success: false, fallbackToWebSpeech: true });
  } catch (err: any) {
    return res.json({ success: false, fallbackToWebSpeech: true, error: err?.message });
  }
});

// Mount Vite or static files
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await import('vite');
    const viteServer = await vite.createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(viteServer.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`HUQUQ AI Server running on port ${port}`);
  });
}

startServer();
