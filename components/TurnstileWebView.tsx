import React from "react";
import { View } from "react-native";
import WebView from "react-native-webview";

const SITE_KEY = "0x4AAAAAADFMqX22JvRQmAnj";

const HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:transparent;">
<div id="cf"></div>
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onLoad" async defer></script>
<script>
  function onLoad() {
    turnstile.render('#cf', {
      sitekey: '${SITE_KEY}',
      theme: 'light',
      size: 'invisible',
      callback: function(token) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'token', value: token }));
      },
      'error-callback': function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error' }));
      },
      'expired-callback': function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'expired' }));
      }
    });
  }
</script>
</body>
</html>`;

type Props = {
  turnstileKey?: number;
  onToken: (token: string) => void;
  onExpired?: () => void;
};

export default function TurnstileWebView({ turnstileKey, onToken, onExpired }: Props) {
  return (
    <View style={{ position: "absolute", top: -2000, left: -2000, height: 150, width: 150 }}>
      <WebView
        key={turnstileKey}
        source={{ html: HTML }}
        style={{ flex: 1 }}
        javaScriptEnabled
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === "token") onToken(data.value);
            else if (data.type === "expired") onExpired?.();
          } catch {}
        }}
      />
    </View>
  );
}
