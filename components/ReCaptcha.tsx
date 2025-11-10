import { useRef, useState } from "react";
import { Modal, StyleSheet, View } from "react-native";
import WebView, { type WebViewMessageEvent } from "react-native-webview";

interface ReCaptchaProps {
	siteKey: string;
	onVerify: (token: string) => void;
	onError?: (error: string) => void;
	visible: boolean;
	onClose: () => void;
}

export function ReCaptcha({ siteKey, onVerify, onError, visible, onClose }: ReCaptchaProps) {
	const webViewRef = useRef<WebView>(null);
	const [key, setKey] = useState(0);

	const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://www.google.com/recaptcha/api.js?render=explicit" async defer></script>
        <style>
          body {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-color: #f5f5f5;
          }
          #recaptcha-container {
            transform: scale(0.9);
            transform-origin: center center;
          }
        </style>
      </head>
      <body>
        <div id="recaptcha-container"></div>
        <script>
          let widgetId;
          
          function onRecaptchaLoad() {
            try {
              widgetId = grecaptcha.render('recaptcha-container', {
                'sitekey': '${siteKey}',
                'callback': onRecaptchaSuccess,
                'error-callback': onRecaptchaError,
                'expired-callback': onRecaptchaExpired,
                'theme': 'light',
                'size': 'normal'
              });
            } catch (error) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'error',
                message: error.message
              }));
            }
          }
          
          function onRecaptchaSuccess(token) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'success',
              token: token
            }));
          }
          
          function onRecaptchaError() {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'error',
              message: 'reCAPTCHA verification failed'
            }));
          }
          
          function onRecaptchaExpired() {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'expired',
              message: 'reCAPTCHA expired'
            }));
          }
          
          // Wait for reCAPTCHA to load
          if (typeof grecaptcha !== 'undefined') {
            grecaptcha.ready(onRecaptchaLoad);
          } else {
            window.addEventListener('load', function() {
              if (typeof grecaptcha !== 'undefined') {
                grecaptcha.ready(onRecaptchaLoad);
              }
            });
          }
        </script>
      </body>
    </html>
  `;

	const handleMessage = (event: WebViewMessageEvent) => {
		try {
			const data = JSON.parse(event.nativeEvent.data);

			switch (data.type) {
				case "success":
					onVerify(data.token);
					onClose();
					break;
				case "error":
					onError?.(data.message);
					break;
				case "expired":
					onError?.("reCAPTCHA has expired. Please try again.");
					// Reset the reCAPTCHA
					setKey((prev) => prev + 1);
					break;
			}
		} catch (error) {
			onError?.("Failed to process reCAPTCHA response");
		}
	};

	return (
		<Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
			<View style={styles.container}>
				<View style={styles.webviewContainer}>
					<WebView
						key={key}
						ref={webViewRef}
						source={{ html }}
						onMessage={handleMessage}
						style={styles.webview}
						javaScriptEnabled={true}
						domStorageEnabled={true}
						startInLoadingState={true}
					/>
				</View>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "rgba(0, 0, 0, 0.5)",
		justifyContent: "center",
		alignItems: "center",
	},
	webviewContainer: {
		width: "90%",
		height: 400,
		backgroundColor: "#f5f5f5",
		borderRadius: 10,
		overflow: "hidden",
	},
	webview: {
		flex: 1,
		backgroundColor: "#f5f5f5",
	},
});

