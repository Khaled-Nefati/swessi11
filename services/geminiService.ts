
import { GoogleGenAI } from "@google/genai";

export class AIService {
  private ai: GoogleGenAI;

  constructor() {
    // Fix: Using process.env.API_KEY directly as required by the latest @google/genai guidelines.
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async generateReportAnalysis(data: any, type: string): Promise<string> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `قم بتحليل البيانات التالية المتعلقة بـ ${type} في منظومة الشهداء والمبتورين وقدم تقريراً ملخصاً باللغة العربية يتضمن أهم الإحصائيات والتوصيات: ${JSON.stringify(data)}`,
        config: {
          systemInstruction: "أنت خبير في تحليل البيانات الحكومية والاجتماعية. قدم تقارير دقيقة ومحترفة باللغة العربية.",
        }
      });
      return response.text || "لا يمكن إنشاء التحليل في الوقت الحالي.";
    } catch (error) {
      console.error("AI Analysis Error:", error);
      return "حدث خطأ أثناء تحليل البيانات ذكياً.";
    }
  }
}

export const aiService = new AIService();
