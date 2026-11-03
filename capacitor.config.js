const config = {
  appId: 'com.laundrysuarni.kasir',
  appName: 'Laundry Suarni Kasir',
  webDir: 'public',
  server: {
    // Ubah ke IP/server tempat aplikasi Node.js dijalankan
    // Contoh: 'http://192.168.1.10:3000'
    url: 'http://localhost:3000',
    cleartext: true,
    allowNavigation: ['*']
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined
    }
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0f172a'
    }
  }
};

module.exports = config;
