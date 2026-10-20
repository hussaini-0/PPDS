import bcrypt from "bcryptjs";
import {
  LeadStage,
  LeadTemperature,
  MessageDirection,
  MessageSenderType,
  MessageStatus,
  MessageType,
  PaymentStatus,
  Prisma,
  SubscriptionStatus,
  TemplateStatus,
} from "@prisma/client";
import { faker } from "@faker-js/faker";
import { addDays, subDays } from "date-fns";

import { prisma } from "../src/lib/prisma";
import {
  DEFAULT_PAYMENT_SETTINGS,
  PAYMENT_SETTINGS_PROVIDER,
} from "../src/modules/settings/constants";

async function main() {
  await prisma.storeCredential.deleteMany();
  await prisma.storeOrder.deleteMany();
  await prisma.storePaymentMethod.deleteMany();
  await prisma.customerAccount.deleteMany();
  await prisma.projectInquiry.deleteMany();
  await prisma.newsletterSubscriber.deleteMany();
  await prisma.product.deleteMany();
  await prisma.productCategory.deleteMany();
  await prisma.developmentPackage.deleteMany();
  await prisma.cmsPage.deleteMany();
  await prisma.testimonial.deleteMany();
  await prisma.faq.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.webhookEvent.deleteMany();
  await prisma.broadcastRecipient.deleteMany();
  await prisma.broadcastCampaign.deleteMany();
  await prisma.whatsAppTemplate.deleteMany();
  await prisma.followUpJob.deleteMany();
  await prisma.automationRule.deleteMany();
  await prisma.botConversationState.deleteMany();
  await prisma.message.deleteMany();
  await prisma.ownerAttentionItem.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.uploadedFile.deleteMany();
  await prisma.attributionEvent.deleteMany();
  await prisma.knowledgeBaseEntry.deleteMany();
  await prisma.qualificationQuestion.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.subscriptionPlan.deleteMany();
  await prisma.integrationSetting.deleteMany();
  await prisma.metaDailyInsight.deleteMany();
  await prisma.metaAd.deleteMany();
  await prisma.metaAdSet.deleteMany();
  await prisma.metaCampaign.deleteMany();
  await prisma.metaAdAccount.deleteMany();
  await prisma.user.deleteMany();
  await prisma.business.deleteMany();

  const business = await prisma.business.create({
    data: {
      name: "Prime Plus Digital Services",
      timezone: "Asia/Karachi",
      currency: "PKR",
      defaultLanguage: "en",
    },
  });

  const owner = await prisma.user.create({
    data: {
      businessId: business.id,
      name: "Owner",
      email: "owner@example.com",
      passwordHash: await bcrypt.hash("OwnerPass123!", 10),
      role: "OWNER",
      isActive: true,
    },
  });

  await prisma.storePaymentMethod.create({
    data: {
      businessId: business.id,
      name: "Demo bank transfer",
      instructions: "Demo only: replace this method with your real bank, Easypaisa, or JazzCash details before accepting orders.",
    },
  });

  const categories = await Promise.all(
    [
      ["AI Tools", "ai-tools", "AI", "Assistants, research, writing, and automation tools."],
      ["Business Tools", "business-tools", "BI", "Tools for operations, communication, and growth."],
      ["Design & Video", "design-video", "DV", "Creative software for visual and video production."],
      ["Learning", "learning", "ED", "Courses and learning platforms for professional growth."],
      ["Productivity", "productivity", "PX", "Utilities that reduce repetitive work."],
      ["Plugins & Themes", "plugins-themes", "PL", "Website extensions and presentation systems."],
      ["VPN & Security", "vpn-security", "VS", "Privacy and security services."],
    ].map(([name, slug, icon, description], index) =>
      prisma.productCategory.create({
        data: {
          businessId: business.id,
          name,
          slug,
          icon,
          description,
          sortOrder: index,
          status: "PUBLISHED",
        },
      }),
    ),
  );

  await prisma.product.createMany({
    data: [
      {
        businessId: business.id,
        categoryId: categories[0].id,
        name: "ChatGPT Plus",
        slug: "chatgpt-plus",
        shortDescription: "Premium ChatGPT access for writing, research, analysis, and everyday AI work.",
        description: "Preview catalogue content. Confirm supplier, account type, duration, delivery terms, and final price before accepting payment.",
        price: new Prisma.Decimal(1499),
        compareAtPrice: new Prisma.Decimal(1999),
        imageUrl: "/products/chatgpt.svg",
        logoUrl: "/products/chatgpt.svg",
        features: ["AI assistance", "Writing and research", "Terms confirmed before payment"],
        badge: "Preview",
        isFeatured: true,
        sortOrder: 0,
        status: "PUBLISHED",
      },
      {
        businessId: business.id,
        categoryId: categories[0].id,
        name: "Grok Premium",
        slug: "grok-premium",
        shortDescription: "Premium Grok access for current information, research, and AI-assisted tasks.",
        description: "Preview catalogue content. Confirm supplier, account type, duration, delivery terms, and final price before accepting payment.",
        price: new Prisma.Decimal(2299),
        compareAtPrice: new Prisma.Decimal(2999),
        imageUrl: "/products/grok.svg",
        logoUrl: "/products/grok.svg",
        features: ["AI research", "Assisted workflows", "Terms confirmed before payment"],
        badge: "Preview",
        isFeatured: true,
        sortOrder: 1,
        status: "PUBLISHED",
      },
      {
        businessId: business.id,
        categoryId: categories[0].id,
        name: "Claude Pro",
        slug: "claude-pro",
        shortDescription: "Premium Claude access for writing, documents, reasoning, and focused AI work.",
        description: "Preview catalogue content. Confirm supplier, account type, duration, delivery terms, and final price before accepting payment.",
        price: new Prisma.Decimal(1899),
        compareAtPrice: new Prisma.Decimal(2499),
        imageUrl: "/products/claude.svg",
        logoUrl: "/products/claude.svg",
        features: ["Document workflows", "Writing and reasoning", "Terms confirmed before payment"],
        badge: "Preview",
        isFeatured: true,
        sortOrder: 2,
        status: "PUBLISHED",
      },
      {
        businessId: business.id,
        categoryId: categories[2].id,
        name: "Adobe Creative Cloud",
        slug: "adobe-creative-cloud",
        shortDescription: "Creative access for design, photography, video, and professional content production.",
        description: "Preview catalogue content. Confirm supplier, account type, duration, delivery terms, and final price before accepting payment.",
        price: new Prisma.Decimal(999),
        compareAtPrice: new Prisma.Decimal(1499),
        imageUrl: "/products/adobe.svg",
        logoUrl: "/products/adobe.svg",
        features: ["Creative applications", "Design and video workflows", "Terms confirmed before payment"],
        badge: "Preview",
        isFeatured: true,
        sortOrder: 3,
        status: "PUBLISHED",
      },
      {
        businessId: business.id,
        categoryId: categories[1].id,
        name: "LinkedIn Premium",
        slug: "linkedin-premium",
        shortDescription: "Premium LinkedIn access for career growth, networking, recruiting, and business research.",
        description: "Preview catalogue content. Confirm supplier, account type, duration, delivery terms, and final price before accepting payment.",
        price: new Prisma.Decimal(1199),
        compareAtPrice: new Prisma.Decimal(1599),
        imageUrl: "/products/linkedin.svg",
        logoUrl: "/products/linkedin.svg",
        features: ["Professional networking", "Career and business tools", "Terms confirmed before payment"],
        badge: "Preview",
        isFeatured: true,
        sortOrder: 4,
        status: "PUBLISHED",
      },
      {
        businessId: business.id,
        categoryId: categories[5].id,
        name: "Theme & Plugin Bundle",
        slug: "theme-plugin-bundle",
        shortDescription: "A website starter bundle for faster design, publishing, and customization.",
        description: "Preview catalogue content. Confirm supplier, license, compatibility, delivery terms, and final price before accepting payment.",
        price: new Prisma.Decimal(1699),
        compareAtPrice: new Prisma.Decimal(2299),
        imageUrl: "/products/plugin-bundle.svg",
        features: ["Website themes", "Plugin utilities", "Terms confirmed before payment"],
        badge: "Preview",
        status: "PUBLISHED",
      },
      {
        businessId: business.id,
        categoryId: categories[6].id,
        name: "Secure VPN Access",
        slug: "secure-vpn-access",
        shortDescription: "Privacy-focused access for safer browsing across everyday devices.",
        description: "Preview catalogue content. Confirm supplier, supported devices, duration, delivery terms, and final price before accepting payment.",
        price: new Prisma.Decimal(1299),
        compareAtPrice: new Prisma.Decimal(1799),
        imageUrl: "/products/secure-vpn.svg",
        features: ["Multi-device access", "Privacy tools", "Terms confirmed before payment"],
        badge: "Preview",
        status: "PUBLISHED",
      },
      {
        businessId: business.id,
        categoryId: categories[2].id,
        name: "Video Creator Toolkit",
        slug: "video-creator-toolkit",
        shortDescription: "Creative resources for editing, motion, and polished video production.",
        description: "Preview catalogue content. Confirm supplier, account type, duration, delivery terms, and final price before accepting payment.",
        price: new Prisma.Decimal(2099),
        compareAtPrice: new Prisma.Decimal(2799),
        imageUrl: "/products/video-suite.svg",
        features: ["Video workflows", "Motion resources", "Terms confirmed before payment"],
        badge: "Preview",
        status: "PUBLISHED",
      },
    ],
  });

  const packageSeed = [
    ["Website Starter", "website-starter", "Website Development", "small businesses that need a credible online presence", "A focused five-page website with essential conversion and tracking setup.", ["Up to 5 pages", "Responsive design", "Contact and WhatsApp forms", "Basic SEO", "Analytics setup", "2 revision rounds", "Deployment support"], "2-3 weeks", "2 rounds", "14 days"],
    ["Website Business", "website-business", "Website Development", "growing businesses that need content control and stronger acquisition", "A larger CMS-powered website with technical SEO and conversion tracking.", ["Up to 12 pages", "CMS and blog or portfolio", "Advanced forms", "Speed optimization", "Technical SEO", "3 revision rounds", "Deployment support"], "4-6 weeks", "3 rounds", "30 days"],
    ["Web App MVP", "web-app-mvp", "Web Application Development", "teams validating one primary digital workflow", "A production-oriented MVP with authentication, data, administration, and deployment.", ["Requirements workshop", "Custom UI/UX", "Authentication", "Database", "Admin dashboard", "One primary workflow", "API integration", "Testing and deployment"], "8-12 weeks", "Milestone reviews", "45 days"],
    ["AI Automation", "ai-automation", "AI Automation Development", "businesses losing time to repetitive communication or data work", "One controlled automation workflow with monitoring and human handoff.", ["Workflow discovery", "AI or rules-based processing", "WhatsApp, email, or CRM integration", "Logs and monitoring", "Human handoff", "Documentation"], "3-6 weeks", "2 workflow reviews", "30 days"],
    ["Mobile App MVP", "mobile-app-mvp", "Mobile Application Development", "businesses launching a focused Android and iOS experience", "A cross-platform mobile MVP connected to secure backend services.", ["Android and iOS", "Authentication", "API integration", "Core workflow", "Push notifications", "Analytics", "Testing", "Store submission assistance"], "10-16 weeks", "Milestone reviews", "45 days"],
    ["Custom Enterprise", "custom-enterprise", "Custom Software", "organizations with complex workflows, integrations, or security needs", "Tailored architecture, delivery plan, integrations, and support agreement.", ["Tailored scope", "Complex integrations", "Multiple roles", "Advanced security", "Scalable infrastructure", "Maintenance agreement", "Priority support"], "After discovery", "Defined in scope", "Custom"],
  ] as const;

  await prisma.developmentPackage.createMany({
    data: packageSeed.map(([name, slug, serviceType, audience, summary, features, timeline, revisions, supportPeriod], index) => ({
      businessId: business.id,
      name,
      slug,
      serviceType,
      audience,
      summary,
      features: [...features],
      startingPrice: null,
      timeline,
      revisions,
      supportPeriod,
      isFeatured: slug === "web-app-mvp",
      status: "PUBLISHED" as const,
      sortOrder: index,
    })),
  });

  await prisma.faq.createMany({
    data: [
      { businessId: business.id, category: "Software", question: "How does a software project start?", answer: "PPDS reviews your project brief, clarifies requirements, and provides a written scope, timeline, and quotation before development begins.", keywords: ["software", "project", "start", "quotation"], status: "PUBLISHED" },
      { businessId: business.id, category: "AI Automation", question: "Can AI automation take sensitive actions automatically?", answer: "Sensitive actions can be configured to require validation or human approval. Difficult or low-confidence cases can be escalated to the owner.", keywords: ["ai", "automation", "approval", "human", "security"], status: "PUBLISHED" },
      { businessId: business.id, category: "Products", question: "How are digital products delivered?", answer: "Place the order on the website, submit payment proof, and access approved credentials securely from your PPDS customer account.", keywords: ["product", "delivery", "account", "payment"], status: "PUBLISHED" },
    ],
  });

  await prisma.testimonial.create({
    data: {
      businessId: business.id,
      customerName: "Sample Customer",
      customerRole: "Sample content — replace after verification",
      quote: "This is demonstration content for layout review and must not be published as a real customer statement.",
      rating: 5,
      isVerified: false,
      status: "DRAFT",
    },
  });

  await prisma.cmsPage.createMany({
    data: [
      { businessId: business.id, key: "homepage-intro", title: "Premium digital subscriptions.", summary: "Buy premium access to the digital tools you already use and receive credentials securely in your account.", content: { body: "Use this CMS record for future homepage copy revisions." }, status: "PUBLISHED" },
      { businessId: business.id, key: "software-intro", title: "Software designed around your business", summary: "Websites, applications, AI automation, and mobile products.", content: { body: "Use this CMS record for future software page copy revisions." }, status: "PUBLISHED" },
    ],
  });

  const plans = await Promise.all([
    prisma.subscriptionPlan.create({
      data: {
        businessId: business.id,
        name: "Starter Growth",
        description: "Entry plan for basic monthly access",
        price: new Prisma.Decimal(4500),
        billingInterval: "MONTHLY",
        durationDays: 30,
        features: ["Monthly access", "Email support"],
        qualificationRules: { budgetMin: 3000 },
        recommendationPriority: 10,
      },
    }),
    prisma.subscriptionPlan.create({
      data: {
        businessId: business.id,
        name: "Pro Momentum",
        description: "Best fit for active buyers from Meta campaigns",
        price: new Prisma.Decimal(9500),
        billingInterval: "QUARTERLY",
        durationDays: 90,
        features: ["Quarterly access", "Priority support", "Renewal reminders"],
        qualificationRules: { budgetMin: 7000 },
        recommendationPriority: 20,
      },
    }),
    prisma.subscriptionPlan.create({
      data: {
        businessId: business.id,
        name: "Elite Annual",
        description: "Highest-LTV plan for committed customers",
        price: new Prisma.Decimal(32000),
        billingInterval: "YEARLY",
        durationDays: 365,
        features: ["Annual access", "Priority support", "Dedicated onboarding"],
        qualificationRules: { budgetMin: 20000 },
        recommendationPriority: 30,
      },
    }),
  ]);

  const template = await prisma.whatsAppTemplate.create({
    data: {
      businessId: business.id,
      providerTemplateId: "mock-template-001",
      name: "renewal_reminder",
      category: "UTILITY",
      language: "en",
      status: TemplateStatus.APPROVED,
      components: { body: "Your subscription is due for renewal." },
      variables: { customerName: "string" },
    },
  });

  const adAccount = await prisma.metaAdAccount.create({
    data: {
      businessId: business.id,
      externalAccountId: "act_1234567890",
      name: "PPDS Meta Account",
      currency: "PKR",
      timezone: "Asia/Karachi",
    },
  });

  const campaign = await prisma.metaCampaign.create({
    data: {
      businessId: business.id,
      adAccountId: adAccount.id,
      externalCampaignId: "cmp_001",
      name: "July WhatsApp Leads",
      status: "ACTIVE",
    },
  });

  const adSet = await prisma.metaAdSet.create({
    data: {
      businessId: business.id,
      campaignId: campaign.id,
      externalAdSetId: "aset_001",
      name: "Karachi Audience",
      status: "ACTIVE",
    },
  });

  const ad = await prisma.metaAd.create({
    data: {
      businessId: business.id,
      adSetId: adSet.id,
      externalAdId: "ad_001",
      name: "CTA Lead Ad",
      status: "ACTIVE",
    },
  });

  for (let offset = 0; offset < 30; offset += 1) {
    const date = subDays(new Date(), offset);
    await prisma.metaDailyInsight.create({
      data: {
        businessId: business.id,
        accountId: adAccount.id,
        campaignId: campaign.id,
        adSetId: adSet.id,
        adId: ad.id,
        date,
        spend: new Prisma.Decimal(1200 + offset * 15),
        impressions: 1000 + offset * 17,
        reach: 700 + offset * 13,
        clicks: 80 + offset,
        outboundClicks: 42 + offset,
        conversationsStarted: 12 + (offset % 4),
        leads: 9 + (offset % 3),
        conversions: 2 + (offset % 2),
        costPerResult: new Prisma.Decimal(110),
        cpc: new Prisma.Decimal(20),
        cpm: new Prisma.Decimal(95),
        ctr: new Prisma.Decimal(4.5),
        rawPayload: { mock: true, offset },
      },
    });
  }

  await prisma.integrationSetting.createMany({
    data: [
      {
        businessId: business.id,
        provider: "whatsapp",
        mode: "MOCK",
        settings: { verifyTokenConfigured: true },
        isConnected: true,
      },
      {
        businessId: business.id,
        provider: "meta_ads",
        mode: "MOCK",
        settings: { adAccountId: adAccount.externalAccountId },
        isConnected: true,
      },
      {
        businessId: business.id,
        provider: "ai_provider",
        mode: "MOCK",
        settings: { provider: "mock" },
        isConnected: true,
      },
      {
        businessId: business.id,
        provider: PAYMENT_SETTINGS_PROVIDER,
        mode: "MOCK",
        settings: DEFAULT_PAYMENT_SETTINGS,
        isConnected: true,
      },
    ],
  });

  await prisma.qualificationQuestion.createMany({
    data: [
      {
        businessId: business.id,
        label: "budget",
        prompt: "What monthly budget are you comfortable with?",
        answerType: "NUMBER",
        qualificationWeight: 4,
        sortOrder: 1,
      },
      {
        businessId: business.id,
        label: "urgency",
        prompt: "How soon do you want to get started?",
        answerType: "SINGLE_SELECT",
        options: ["Today", "This week", "This month"],
        qualificationWeight: 3,
        sortOrder: 2,
      },
      {
        businessId: business.id,
        label: "goal",
        prompt: "What outcome matters most to you?",
        answerType: "TEXT",
        qualificationWeight: 2,
        sortOrder: 3,
      },
    ],
  });

  await prisma.automationRule.createMany({
    data: [
      {
        businessId: business.id,
        name: "Qualification No Reply",
        triggerType: "QUALIFICATION_NO_REPLY",
        conditions: {
          expectedStage: "QUALIFYING",
          maxFollowUps: 3,
        },
        actions: {
          message: "I still need your answer to recommend the right subscription plan.",
        },
        delayMinutes: 360,
      },
      {
        businessId: business.id,
        name: "Plan Recommended No Reply",
        triggerType: "PLAN_RECOMMENDED_NO_REPLY",
        conditions: {
          expectedStage: "PLAN_RECOMMENDED",
          maxFollowUps: 3,
        },
        actions: {
          message:
            "Do you want to proceed with the recommended plan? Reply with pay and I will resend the payment instructions.",
        },
        delayMinutes: 720,
      },
      {
        businessId: business.id,
        name: "Payment Proof Missing",
        triggerType: "PAYMENT_PROOF_MISSING",
        conditions: {
          expectedStage: "PAYMENT_INSTRUCTIONS_SENT",
          maxFollowUps: 3,
        },
        actions: {
          message:
            "Just checking in. If you have made the payment, please send the proof here so the owner can verify it.",
        },
        delayMinutes: 1440,
      },
    ],
  });

  const knowledgeEntries = [
    {
      category: "PRICING" as const,
      title: "Pricing policy",
      content: "Prices are fixed to approved plans and cannot be changed by the bot.",
      keywords: ["price", "discount", "cost"],
    },
    {
      category: "PAYMENT" as const,
      title: "Payment instructions",
      content: "Customers receive manual payment instructions and must send proof.",
      keywords: ["payment", "bank transfer", "easypaisa"],
    },
    {
      category: "OBJECTION" as const,
      title: "Trust objection",
      content: "Offer approved proof points and escalate if the customer remains unsure.",
      keywords: ["trust", "real", "legit"],
    },
  ];

  for (const entry of knowledgeEntries) {
    await prisma.knowledgeBaseEntry.create({
      data: {
        businessId: business.id,
        ...entry,
        status: "APPROVED",
        createdByUserId: owner.id,
        approvedByUserId: owner.id,
      },
    });
  }

  const stages: LeadStage[] = [
    LeadStage.NEW,
    LeadStage.BOT_ENGAGED,
    LeadStage.QUALIFIED,
    LeadStage.PLAN_RECOMMENDED,
    LeadStage.INTERESTED,
    LeadStage.PAYMENT_INSTRUCTIONS_SENT,
    LeadStage.PAYMENT_PROOF_RECEIVED,
    LeadStage.CONVERTED,
    LeadStage.LOST,
  ];
  const broadcastRecipients: { customerId: string; customerName: string }[] = [];

  for (let index = 0; index < 30; index += 1) {
    const customer = await prisma.customer.create({
      data: {
        businessId: business.id,
        fullName: faker.person.fullName(),
        phoneNumber: `03${faker.string.numeric(9)}`,
        normalizedPhoneNumber: `+923${faker.string.numeric(9)}`,
        email: faker.internet.email().toLowerCase(),
        city: faker.location.city(),
        notes: faker.helpers.arrayElement([
          "Responds quickly in the evening.",
          "Asked about family plan pricing.",
          "Came from click-to-message ad.",
        ]),
        tags: faker.helpers.arrayElements(
          ["meta", "renewal", "vip", "warm", "trial"],
          { min: 1, max: 2 },
        ),
        marketingOptIn: index % 5 !== 0,
        marketingOptInAt: index % 5 !== 0 ? subDays(new Date(), 15) : null,
        source: "META_CLICK_TO_WHATSAPP",
        lastContactAt: subDays(new Date(), index % 7),
      },
    });

    const stage = stages[index % stages.length];
    const selectedPlan = plans[index % plans.length];

    if (index % 5 !== 0 && broadcastRecipients.length < 12) {
      broadcastRecipients.push({
        customerId: customer.id,
        customerName: customer.fullName,
      });
    }

    const lead = await prisma.lead.create({
      data: {
        businessId: business.id,
        customerId: customer.id,
        stage,
        intentScore: 35 + index * 2,
        leadTemperature:
          index % 3 === 0
            ? LeadTemperature.HOT
            : index % 2 === 0
              ? LeadTemperature.WARM
              : LeadTemperature.COLD,
        source: "META_CLICK_TO_WHATSAPP",
        metaCampaignId: campaign.id,
        metaAdSetId: adSet.id,
        metaAdId: ad.id,
        referralMetadata: { source: "meta_ad", campaign: campaign.name },
        selectedPlanId: selectedPlan.id,
        assignedToUserId: owner.id,
        humanAttentionRequired: stage === LeadStage.PAYMENT_PROOF_RECEIVED,
        humanAttentionReason:
          stage === LeadStage.PAYMENT_PROOF_RECEIVED
            ? "Payment proof awaiting review"
            : null,
        structuredData: { qualificationScore: 4 + (index % 6) },
        nextFollowUpAt:
          stage === LeadStage.CONVERTED ? null : addDays(new Date(), (index % 4) + 1),
        convertedAt: stage === LeadStage.CONVERTED ? subDays(new Date(), 2) : null,
        lostAt: stage === LeadStage.LOST ? subDays(new Date(), 1) : null,
        lostReason: stage === LeadStage.LOST ? "No response after reminders" : null,
      },
    });

    const conversation = await prisma.conversation.create({
      data: {
        businessId: business.id,
        customerId: customer.id,
        leadId: lead.id,
        channel: "WHATSAPP",
        status:
          stage === LeadStage.PAYMENT_PROOF_RECEIVED
            ? "WAITING_FOR_OWNER"
            : "WAITING_FOR_CUSTOMER",
        botEnabled: true,
        humanTakeover: false,
        lastMessageAt: subDays(new Date(), index % 3),
        unreadCount: index % 4,
        serviceWindowExpiresAt: addDays(new Date(), 1),
      },
    });

    await prisma.message.createMany({
      data: [
        {
          conversationId: conversation.id,
          direction: MessageDirection.INBOUND,
          senderType: MessageSenderType.CUSTOMER,
          messageType: MessageType.TEXT,
          body: "I saw your ad and want details.",
          status: MessageStatus.READ,
        },
        {
          conversationId: conversation.id,
          direction: MessageDirection.OUTBOUND,
          senderType: MessageSenderType.BOT,
          messageType: MessageType.TEXT,
          body: "Sure. Let me ask a few quick questions to recommend the right plan.",
          status: MessageStatus.DELIVERED,
        },
      ],
    });

    await prisma.botConversationState.create({
      data: {
        conversationId: conversation.id,
        currentStep:
          stage === LeadStage.PAYMENT_INSTRUCTIONS_SENT
            ? "awaiting_payment_proof"
            : "qualification",
        collectedData: { mockSeed: true },
        recommendedPlanId: selectedPlan.id,
        confidence: new Prisma.Decimal(0.88),
        lastIntent: "pricing_inquiry",
      },
    });

    if (
      stage === LeadStage.CONVERTED ||
      stage === LeadStage.PAYMENT_PROOF_RECEIVED ||
      stage === LeadStage.PAYMENT_INSTRUCTIONS_SENT
    ) {
      const payment = await prisma.payment.create({
        data: {
          businessId: business.id,
          customerId: customer.id,
          leadId: lead.id,
          amount: selectedPlan.price,
          currency: business.currency,
          paymentMethod: faker.helpers.arrayElement([
            "Bank transfer",
            "Easypaisa",
            "JazzCash",
          ]),
          referenceNumber: faker.string.alphanumeric(10).toUpperCase(),
          status:
            stage === LeadStage.CONVERTED
              ? PaymentStatus.VERIFIED
              : stage === LeadStage.PAYMENT_PROOF_RECEIVED
                ? PaymentStatus.PROOF_RECEIVED
                : PaymentStatus.AWAITING_PAYMENT,
          submittedAt: subDays(new Date(), 1),
          verifiedAt: stage === LeadStage.CONVERTED ? new Date() : null,
          verifiedByUserId: stage === LeadStage.CONVERTED ? owner.id : null,
        },
      });

      if (stage === LeadStage.CONVERTED) {
        const subscription = await prisma.subscription.create({
          data: {
            businessId: business.id,
            customerId: customer.id,
            planId: selectedPlan.id,
            leadId: lead.id,
            status:
              index % 2 === 0 ? SubscriptionStatus.ACTIVE : SubscriptionStatus.EXPIRING,
            startDate: subDays(new Date(), 20),
            expiryDate: addDays(new Date(), index % 2 === 0 ? 25 : 6),
            amount: selectedPlan.price,
            billingInterval: selectedPlan.billingInterval,
            activatedByUserId: owner.id,
            activatedAt: subDays(new Date(), 20),
          },
        });

        await prisma.payment.update({
          where: { id: payment.id },
          data: { subscriptionId: subscription.id },
        });
      }
    }

    if (index < 8) {
      await prisma.ownerAttentionItem.create({
        data: {
          businessId: business.id,
          customerId: customer.id,
          leadId: lead.id,
          conversationId: conversation.id,
          priority: index < 3 ? "URGENT" : index < 5 ? "HIGH" : "MEDIUM",
          reason: faker.helpers.arrayElement([
            "Payment proof awaiting review",
            "Low-confidence bot answer",
            "Customer requested a human",
            "High-intent lead needs owner intervention",
          ]),
          recommendedAction: "Open the conversation and resolve the blocker.",
        },
      });
    }

    if (stage !== LeadStage.CONVERTED && stage !== LeadStage.LOST) {
      await prisma.followUpJob.create({
        data: {
          businessId: business.id,
          leadId: lead.id,
          conversationId: conversation.id,
          scheduledFor: addDays(new Date(), 1),
          status: "SCHEDULED",
        },
      });
    }
  }

  await prisma.broadcastCampaign.create({
    data: {
      businessId: business.id,
      name: "August renewal reminder",
      templateId: template.id,
      status: "SCHEDULED",
      audienceFilter: {
        segment: "EXPIRING_SUBSCRIBERS",
        requireMarketingConsent: true,
      },
      scheduledAt: addDays(new Date(), 2),
      createdByUserId: owner.id,
      totalRecipients: broadcastRecipients.length,
      recipients: {
        create: broadcastRecipients.map((recipient) => ({
          customerId: recipient.customerId,
          personalizedVariables: { customerName: recipient.customerName },
          status: "PENDING",
        })),
      },
    },
  });

  console.log("Seed complete");
  console.log("Owner email: owner@example.com");
  console.log("Owner password: OwnerPass123!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
