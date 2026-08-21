import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as nexo from "./nexo-store";

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
});

export type AppRouter = typeof appRouter;
