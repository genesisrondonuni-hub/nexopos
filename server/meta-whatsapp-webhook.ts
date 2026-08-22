import express, { type Express } from "express";

import { captureMetaWebhookPayload, isValidMetaWebhookSignature, verifyMetaWebhookChallenge } from "./meta-whatsapp";

export function registerMetaWhatsAppWebhookRoutes(app: Express) {
  app.get("/api/webhooks/meta-whatsapp", (req, res) => {
    const challenge = verifyMetaWebhookChallenge({ mode: typeof req.query["hub.mode"] === "string" ? req.query["hub.mode"] : undefined, verifyToken: typeof req.query["hub.verify_token"] === "string" ? req.query["hub.verify_token"] : undefined, challenge: typeof req.query["hub.challenge"] === "string" ? req.query["hub.challenge"] : undefined });
    if (!challenge) { res.sendStatus(403); return; }
    res.status(200).send(challenge);
  });

  app.post("/api/webhooks/meta-whatsapp", express.raw({ type: "application/json", limit: "3mb" }), (req, res) => {
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from("");
    if (!isValidMetaWebhookSignature(rawBody, req.header("x-hub-signature-256"))) { res.sendStatus(401); return; }
    try {
      const records = captureMetaWebhookPayload(JSON.parse(rawBody.toString("utf8")));
      console.log(`[meta-webhook] accepted ${records.length} events`);
      res.sendStatus(200);
    } catch {
      res.sendStatus(400);
    }
  });
}
