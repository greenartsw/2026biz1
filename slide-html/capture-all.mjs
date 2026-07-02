import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const edgeCandidates = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe'
];
const browser = edgeCandidates.find(existsSync);
if (!browser) throw new Error('Edge/Chrome 실행 파일을 찾지 못했습니다.');

const baseUrl = process.env.DASHBOARD_URL || 'http://127.0.0.1:4173/';
const width = Number(process.env.CAPTURE_WIDTH || 1600);
const height = Number(process.env.CAPTURE_HEIGHT || 900);
const outDir = join(process.cwd(), 'captures');
mkdirSync(outDir, { recursive: true });

for (let i = 1; i <= 39; i += 1) {
  const file = join(outDir, 'slide-' + String(i).padStart(2, '0') + '.png');
  const url = baseUrl + '?slide=' + i + '&clean=1';
  const result = spawnSync(browser, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--window-size=' + width + ',' + height,
    '--virtual-time-budget=12000',
    '--screenshot=' + file,
    url
  ], { stdio: 'inherit' });
  if (result.status !== 0) throw new Error('캡처 실패: slide ' + i);
}
console.log('captures 폴더에 39장 생성 완료: ' + width + 'x' + height);
