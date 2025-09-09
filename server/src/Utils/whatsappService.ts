// src/services/whatsappService.ts
import axios from "axios";

const token = process.env.META_TOKEN!;
const phoneNumberId = process.env.PHONE_NUMBER_ID!;

export const sendTemplateMessage = async (
  to: string,
  templateName: string,
  languageCode: string,
  components: any[] = []
) => {
  try {
    const res = await axios.post(
      `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
      {
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: templateName,
          language: { code: languageCode },
          components,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return res.data;
  } catch (error: any) {
    console.error("Error enviando WhatsApp:", error.response?.data || error);
    throw error;
  }
};
