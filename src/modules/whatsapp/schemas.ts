import { MessageType } from "@prisma/client";
import { z } from "zod";

export const mockIncomingMessageSchema = z
  .object({
    businessId: z.string().optional(),
    phoneNumber: z.string().min(5),
    customerName: z.string().optional(),
    text: z.string().trim().optional(),
    messageType: z
      .enum([MessageType.TEXT, MessageType.IMAGE, MessageType.DOCUMENT])
      .default(MessageType.TEXT),
    mediaUrl: z.string().url().optional(),
    mediaMimeType: z.string().optional(),
    providerMessageId: z.string().optional(),
    referral: z
      .object({
        source: z.string().optional(),
        campaignId: z.string().optional(),
        adSetId: z.string().optional(),
        adId: z.string().optional(),
        headline: z.string().optional(),
      })
      .optional(),
  })
  .refine((value) => value.text || value.mediaUrl, {
    message: "Either text or mediaUrl is required.",
    path: ["text"],
  });

const whatsappInboundMessageSchema = z.object({
  id: z.string().optional(),
  from: z.string(),
  type: z.string(),
  text: z.object({ body: z.string() }).optional(),
  image: z
    .object({
      id: z.string().optional(),
      mime_type: z.string().optional(),
      caption: z.string().optional(),
      url: z.string().optional(),
    })
    .optional(),
  document: z
    .object({
      id: z.string().optional(),
      filename: z.string().optional(),
      mime_type: z.string().optional(),
      caption: z.string().optional(),
      url: z.string().optional(),
    })
    .optional(),
  referral: z.record(z.string(), z.any()).optional(),
});

const whatsappStatusSchema = z.object({
  id: z.string(),
  status: z.enum(["sent", "delivered", "read", "failed"]),
  errors: z.array(z.object({ code: z.number().or(z.string()), title: z.string() })).optional(),
  timestamp: z.string().optional(),
});

export const whatsappWebhookSchema = z.object({
  entry: z.array(
    z.object({
      changes: z.array(
        z.object({
          field: z.string(),
          value: z.object({
            messages: z.array(whatsappInboundMessageSchema).optional(),
            statuses: z.array(whatsappStatusSchema).optional(),
            contacts: z
              .array(
                z.object({
                  wa_id: z.string().optional(),
                  profile: z.object({ name: z.string().optional() }).optional(),
                }),
              )
              .optional(),
          }),
        }),
      ),
    }),
  ),
});

export const sendMessageSchema = z.object({
  conversationId: z.string().min(1),
  body: z.string().trim().min(1).max(2000),
  templateName: z.string().trim().optional(),
});

export const humanTakeoverSchema = z.object({
  conversationId: z.string().min(1),
  humanTakeover: z.boolean(),
});

export type MockIncomingMessageInput = z.infer<typeof mockIncomingMessageSchema>;
