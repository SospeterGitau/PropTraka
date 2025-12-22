import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.proptraka.app',
    appName: 'PropTraka',
    webDir: 'public',
    server: {
        url: 'http://10.0.2.2:3000',
        cleartext: true,
    },
};

export default config;
