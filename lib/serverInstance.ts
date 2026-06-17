import { randomUUID } from "crypto";

// 프로덕션: VERCEL_DEPLOYMENT_ID (배포마다 새 값, 같은 배포 내 고정)
// 개발: randomUUID() (서버 재시작마다 새 값)
export const SERVER_INSTANCE_ID = process.env.VERCEL_DEPLOYMENT_ID ?? randomUUID();
