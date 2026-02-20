const fs = require('fs');
const path = require('path');

const files = [
    'src/services/apiService.ts',
    'src/store/sessionStore.ts',
    'src/store/authStore.ts',
    'src/services/websocketService.ts',
    'src/services/surveyApiService.ts',
    'src/services/studentSessionService.ts',
    'src/services/emailApiService.ts',
    'src/pages/LoginPage.tsx',
    'src/pages/InstructorDashboard.tsx',
    'src/components/LocationStatistics.tsx'
];

files.forEach(file => {
    try {
        const fullPath = path.join(process.cwd(), file);
        let content = fs.readFileSync(fullPath, 'utf8');
        
        let modified = false;
        
        // For apiService.ts etc where it's '/api'
        if (content.includes(import.meta.env.PROD\r\n  ? '/api')) {
            content = content.replace(
                const API_BASE_URL = import.meta.env.PROD\r\n  ? '/api'  // 生產環境：相對路徑\r\n  : 'http://localhost:8080/api'; // 開發環境：完整 URL,
                const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ? \\/api\ : (import.meta.env.PROD ? '/api' : 'http://localhost:8080/api');
            );
            modified = true;
        } else if (content.includes(import.meta.env.PROD\n  ? '/api')) {
            content = content.replace(
                /const API_BASE_URL = import\.meta\.env\.PROD[\s\S]*?\/\/ 開發環境：完整 URL/,
                const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ? \\/api\ : (import.meta.env.PROD ? '/api' : 'http://localhost:8080/api');
            );
            modified = true;
        }

        // For LoginPage.tsx etc where it's ''
        if (content.includes(import.meta.env.PROD\r\n  ? '')) {
            content = content.replace(
                const API_BASE_URL = import.meta.env.PROD\r\n  ? ''  // 生產環境：相對路徑\r\n  : 'http://localhost:8080'; // 開發環境：完整 URL,
                const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '' : 'http://localhost:8080');
            );
            modified = true;
        } else if (content.includes(import.meta.env.PROD\n  ? '')) {
            content = content.replace(
                /const API_BASE_URL = import\.meta\.env\.PROD[\s\S]*?\/\/ 開發環境：完整 URL/,
                const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '' : 'http://localhost:8080');
            );
            modified = true;
        }

        // For websocketService.ts
        if (content.includes(import.meta.env.PROD\n  ? '')) {
            content = content.replace(
                /const WS_ENDPOINT = import\.meta\.env\.PROD[\s\S]*?\/\/ 開發環境：完整 URL(\)|;)/,
                const WS_ENDPOINT = import.meta.env.VITE_WS_ENDPOINT || (import.meta.env.PROD ? '' : 'ws://localhost:8080/ws');
            );
            modified = true;
        } else if (content.includes(import.meta.env.PROD\r\n  ? '') && file.includes('websocket')) {
             content = content.replace(
                /const WS_ENDPOINT = import\.meta\.env\.PROD[\s\S]*?'ws:\/\/localhost:8080\/ws'\);/,
                const WS_ENDPOINT = import.meta.env.VITE_WS_ENDPOINT || (import.meta.env.PROD ? '' : 'ws://localhost:8080/ws');
            );
            modified = true;
        }

        if (modified) {
            fs.writeFileSync(fullPath, content, 'utf8');
            console.log('Modified ' + file);
        }
    } catch(e) { console.error('Error with ' + file, e); }
});
