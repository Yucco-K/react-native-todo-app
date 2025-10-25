// Mock AsyncStorage
import "@react-native-async-storage/async-storage/jest/async-storage-mock";

// Mock expo-router
jest.mock("expo-router", () => ({
	useRouter: () => ({
		push: jest.fn(),
		replace: jest.fn(),
		back: jest.fn(),
	}),
	usePathname: () => "/",
	useLocalSearchParams: () => ({}),
	Link: "Link",
	Stack: "Stack",
	Tabs: "Tabs",
}));

// Mock Firebase
jest.mock("./config/firebase", () => ({
	auth: {},
	db: {},
}));

// Mock expo-notifications
jest.mock("expo-notifications", () => ({
	setNotificationHandler: jest.fn(),
	getExpoPushTokenAsync: jest.fn(() => Promise.resolve({ data: "test-token" })),
	getPermissionsAsync: jest.fn(() => Promise.resolve({ status: "granted" })),
	requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: "granted" })),
}));

// Silence console warnings during tests
global.console = {
	...console,
	warn: jest.fn(),
	error: jest.fn(),
};
