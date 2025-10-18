import { Redirect } from "expo-router";

export default function Index() {
	// タブレイアウトにリダイレクト
	return <Redirect href="/(tabs)/mylist" />;
}
