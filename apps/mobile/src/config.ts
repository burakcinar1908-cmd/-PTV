import Constants from "expo-constants";

// Telefondan localhost'a erişilemez; bilgisayarın LAN IP'sini app.json > extra.apiBase'e yaz.
export const API_BASE: string =
  (Constants.expoConfig?.extra?.apiBase as string | undefined) ?? "http://192.168.1.10:4000";
