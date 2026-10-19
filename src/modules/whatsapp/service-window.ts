type ServiceWindowInput = {
  serviceWindowExpiresAt: Date | null;
  isTemplateMessage: boolean;
};

export function validateOutboundMessageWindow({
  serviceWindowExpiresAt,
  isTemplateMessage,
}: ServiceWindowInput) {
  if (isTemplateMessage) {
    return {
      allowed: true,
      reason: "Approved template messages can be sent outside the service window.",
    };
  }

  if (!serviceWindowExpiresAt || serviceWindowExpiresAt.getTime() < Date.now()) {
    return {
      allowed: false,
      reason: "Free-form messaging is blocked because the service window is closed.",
    };
  }

  return {
    allowed: true,
    reason: "Free-form messaging is allowed inside the current service window.",
  };
}
