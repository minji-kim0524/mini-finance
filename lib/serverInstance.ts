import { randomUUID } from "crypto";

// 서버 프로세스 시작 시 한 번만 생성 — 재시작하면 값이 바뀜
export const SERVER_INSTANCE_ID = randomUUID();
