const fs = require("fs");
const path = require("path");

const googleServicesFileRelativePath = "./GoogleService-Info.plist";
const googleServicesEnvPath = process.env.GOOGLE_SERVICE_INFO;

if (googleServicesEnvPath) {
	const destinationPath = path.resolve(
		__dirname,
		googleServicesFileRelativePath
	);
	try {
		fs.copyFileSync(googleServicesEnvPath, destinationPath);
	} catch (error) {
		console.warn(
			"Failed to copy GoogleService-Info.plist from environment variable:",
			error
		);
	}
}

module.exports = {
	expo: {
		name: "react-native-todo-app",
		slug: "react-native-todo-app",
		owner: "yucco-k",
		version: "1.0.0",
		orientation: "portrait",
		icon: "./assets/images/icon.png",
		scheme: "reactnativetodoapp",
		userInterfaceStyle: "automatic",
		splash: {
			image: "./assets/images/splash-icon.png",
			resizeMode: "contain",
			backgroundColor: "#ffffff",
		},
		ios: {
			supportsTablet: true,
			bundleIdentifier: "com.yuccok.reactnativetodoapp",
			googleServicesFile: googleServicesFileRelativePath,
			infoPlist: {
				ITSAppUsesNonExemptEncryption: false,
			},
		},
		android: {
			adaptiveIcon: {
				foregroundImage: "./assets/images/adaptive-icon.png",
				backgroundColor: "#ffffff",
			},
			package: "com.yuccok.reactnativetodoapp",
		},
		web: {
			bundler: "metro",
			output: "static",
			favicon: "./assets/images/favicon.png",
		},
		plugins: [
			"expo-router",
			"expo-font",
			[
				"expo-notifications",
				{
					icon: "./assets/images/icon.png",
					color: "#ffffff",
				},
			],
			"@react-native-google-signin/google-signin",
			"expo-apple-authentication",
		],
		experiments: {
			typedRoutes: true,
		},
		extra: {
			router: {},
			eas: {
				projectId: "d048ced0-6b74-42f6-ae81-9ba5a1aa2947",
			},
		},
		runtimeVersion: {
			policy: "appVersion",
		},
		updates: {
			url: "https://u.expo.dev/d048ced0-6b74-42f6-ae81-9ba5a1aa2947",
		},
	},
};
