import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import createRazorpayOrder from "./routes/payments/razorpay/create-order";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  payments: createTRPCRouter({
    razorpay: createTRPCRouter({
      createOrder: createRazorpayOrder,
    }),
  }),
});

export type AppRouter = typeof appRouter;