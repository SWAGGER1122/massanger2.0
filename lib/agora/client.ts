export const agoraConfig = {
  appId: process.env.NEXT_PUBLIC_AGORA_APP_ID ?? "",
  tokenServerUrl: process.env.NEXT_PUBLIC_AGORA_TOKEN_URL ?? "",
  defaultChannelPrefix: "chat-call"
};

export async function getAgoraRtc() {
  const agoraModule = await import("agora-rtc-sdk-ng");
  return agoraModule.default;
}
