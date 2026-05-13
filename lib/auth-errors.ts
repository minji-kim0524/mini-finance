export function toKoreanAuthError(message: string): string {
  if (/invalid login credentials/i.test(message)) return "이메일 또는 비밀번호가 올바르지 않습니다.";
  if (/email not confirmed/i.test(message)) return "이메일 인증이 완료되지 않았습니다. 받은 편지함을 확인해 주세요.";
  if (/user already registered/i.test(message)) return "이미 사용 중인 이메일입니다.";
  if (/user not found/i.test(message)) return "등록되지 않은 이메일입니다.";
  if (/password should be at least/i.test(message)) return "비밀번호는 최소 6자 이상이어야 합니다.";
  if (/new password should be different/i.test(message)) return "새 비밀번호는 기존 비밀번호와 달라야 합니다.";
  if (/unable to validate email/i.test(message)) return "올바른 이메일 형식이 아닙니다.";
  if (/email.*invalid/i.test(message)) return "올바른 이메일 형식이 아닙니다.";
  if (/too many requests/i.test(message)) return "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.";
  if (/rate limit/i.test(message)) return "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.";
  if (/network/i.test(message)) return "네트워크 오류가 발생했습니다. 인터넷 연결을 확인해 주세요.";
  return "오류가 발생했습니다. 다시 시도해 주세요.";
}
