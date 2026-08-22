import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as nexo from "./nexo-store";
import { buildMetaTemplatePayload, getMetaWhatsAppStatus, sendMetaTemplate } from "./meta-whatsapp";
import { analyzeBusiness, getGeminiStatus } from "./gemini";
import { respondWithSalesAgent } from "./sales-agent";
import { completeGoogleSheetsAuthorization, getGoogleSheetsStatus, readGoogleSheetValues, startGoogleSheetsAuthorization } from "./google-sheets";

const orderItemSchema = z.object({
  productId: z.string().min(1).optional(),
  name: z.string().min(1).max(120),
  quantity: z.number().positive().max(999),
  unitPrice: z.number().nonnegative().max(100000000),
  isFreeSale: z.boolean(),
});

const paymentSchema = z.object({
  method: z.enum(["CASH", "CARD", "TRANSFER", "DIGITAL_WALLET"]),
  amount: z.number().positive().max(100000000),
});

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  pos: router({
    openCashSession: publicProcedure.input(z.object({
      businessId: z.string().min(1),
      employeeId: z.string().min(1),
      openingBalance: z.number().nonnegative().max(100000000),
    })).mutation(({ input }) => nexo.openCashSession(input)),
    checkout: publicProcedure.input(z.object({
      businessId: z.string().min(1),
      sessionId: z.string().min(1),
      employeeId: z.string().min(1),
      items: z.array(orderItemSchema).min(1),
      payments: z.array(paymentSchema).min(1),
      tip: z.number().nonnegative().max(100000000).default(0),
    })).mutation(({ input }) => nexo.createPosSale(input)),
  }),
  orders: router({
    list: publicProcedure.input(z.object({ businessId: z.string().min(1) })).query(({ input }) => nexo.listOrders(input.businessId)),
    create: publicProcedure.input(z.object({
      businessId: z.string().min(1),
      customerName: z.string().min(2).max(120),
      customerPhone: z.string().min(7).max(30),
      deliveryMethod: z.enum(["PICKUP", "DELIVERY"]),
      items: z.array(orderItemSchema).min(1),
      tip: z.number().nonnegative().max(100000000).optional(),
    })).mutation(({ input }) => nexo.createCatalogOrder(input)),
    updateStatus: publicProcedure.input(z.object({
      orderId: z.string().min(1),
      status: z.enum(["PENDING", "PROCESSING", "PAID", "ARCHIVED"]),
    })).mutation(({ input }) => nexo.updateOrderStatus(input)),
  }),
  crm: router({
    metaStatus: publicProcedure.query(() => getMetaWhatsAppStatus()),
    previewTemplate: publicProcedure.input(z.object({
      to: z.string().min(8).max(30),
      templateName: z.string().min(1).max(512),
      parameters: z.array(z.string().max(1024)).max(10),
    })).query(({ input }) => buildMetaTemplatePayload(input)),
    sendTemplate: publicProcedure.input(z.object({
      to: z.string().min(8).max(30),
      templateName: z.string().min(1).max(512),
      parameters: z.array(z.string().max(1024)).max(10),
      language: z.string().regex(/^[a-z]{2}_[A-Z]{2}$/).default("es_CO"),
    })).mutation(({ input }) => sendMetaTemplate(input)),
  }),
  gemini: router({
    status: publicProcedure.input(z.object({ modelPreference: z.string().trim().min(1).max(120).default("AUTO") })).query(({ input }) => getGeminiStatus(input.modelPreference)),
    analyze: publicProcedure.input(z.object({
      summary: z.object({ sales: z.number().nonnegative(), expenses: z.number().nonnegative(), profit: z.number(), orders: z.number().nonnegative() }),
      products: z.array(z.object({ name: z.string().min(1).max(120), category: z.string().min(1).max(80), stock: z.number().nonnegative(), minStock: z.number().nonnegative(), price: z.number().nonnegative(), cost: z.number().nonnegative() })).max(500),
      opportunities: z.array(z.object({ stageId: z.string().min(1).max(80), source: z.string().min(1).max(80), value: z.number().nonnegative(), deliveryStatus: z.string().max(80).optional() })).max(500),
      modelPreference: z.string().trim().min(1).max(120).default("AUTO"),
    })).mutation(({ input }) => analyzeBusiness(input, input.modelPreference)),
  }),
  salesAgent: router({
    respond: publicProcedure.input(z.object({
      businessName: z.string().min(1).max(120),
      profileId: z.enum(["RESTAURANT", "FAST_FOOD", "SUPERMARKET", "GROCERY", "WAREHOUSE", "LIQUOR_STORE"]),
      features: z.object({ recipes: z.boolean(), tables: z.boolean(), barcode: z.boolean(), wholesalePricing: z.boolean(), delivery: z.boolean(), catalog: z.boolean(), ageCheck: z.boolean(), weightedProducts: z.boolean() }),
      products: z.array(z.object({ id: z.string().min(1), name: z.string().min(1).max(120), category: z.string().min(1).max(80), description: z.string().max(500), price: z.number().nonnegative(), stock: z.number().nonnegative(), code: z.string().min(1).max(40) })).max(500),
      customerMessage: z.string().trim().min(1).max(2000),
    })).mutation(({ input }) => respondWithSalesAgent(input)),
  }),
  googleSheets: router({
    status: publicProcedure.query(() => getGoogleSheetsStatus()),
    startAuthorization: publicProcedure.input(z.object({ redirectUri: z.string().url().max(500) })).mutation(({ input }) => startGoogleSheetsAuthorization(input.redirectUri)),
    completeAuthorization: publicProcedure.input(z.object({ code: z.string().min(1).max(4000), state: z.string().uuid(), redirectUri: z.string().url().max(500) })).mutation(({ input }) => completeGoogleSheetsAuthorization(input)),
    readValues: publicProcedure.input(z.object({ connectionId: z.string().uuid(), spreadsheetId: z.string().trim().min(10).max(200), sheetName: z.string().trim().min(1).max(120) })).mutation(({ input }) => readGoogleSheetValues(input)),
  }),
});

export type AppRouter = typeof appRouter;
