// Minimal ambient typings for the Google Identity Services + Picker globals
// that we load dynamically at runtime (no npm package needed).

interface GoogleTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface GoogleTokenClient {
  callback: (resp: GoogleTokenResponse) => void;
  requestAccessToken: (options?: { prompt?: string }) => void;
}

interface GoogleTokenClientConfig {
  client_id: string;
  scope: string;
  callback: (resp: GoogleTokenResponse) => void;
}

interface Window {
  gapi?: {
    load: (name: string, cb: () => void) => void;
  };
  google?: {
    accounts: {
      oauth2: {
        initTokenClient: (config: GoogleTokenClientConfig) => GoogleTokenClient;
        revoke: (token: string, done?: () => void) => void;
      };
    };
    // The Picker namespace is loaded via gapi.load('picker'). We type it loosely
    // because its surface is large and only lightly used here.
    picker: Record<string, unknown> & {
      PickerBuilder: new () => GooglePickerBuilder;
      DocsView: new (viewId?: unknown) => GoogleDocsView;
      ViewId: { SPREADSHEETS: unknown; FOLDERS: unknown };
      Action: { PICKED: string; CANCEL: string };
      Response: { ACTION: string; DOCUMENTS: string };
      Document: { ID: string; NAME: string; URL: string };
      Feature: { NAV_HIDDEN: unknown; MINE_ONLY: unknown };
    };
  };
}

interface GoogleDocsView {
  setIncludeFolders: (v: boolean) => GoogleDocsView;
  setSelectFolderEnabled: (v: boolean) => GoogleDocsView;
  setMimeTypes: (v: string) => GoogleDocsView;
}

interface GooglePickerCallbackData {
  [key: string]: unknown;
}

interface GooglePickerBuilder {
  addView: (view: unknown) => GooglePickerBuilder;
  setOAuthToken: (token: string) => GooglePickerBuilder;
  setDeveloperKey: (key: string) => GooglePickerBuilder;
  setAppId: (id: string) => GooglePickerBuilder;
  enableFeature: (feature: unknown) => GooglePickerBuilder;
  setCallback: (cb: (data: GooglePickerCallbackData) => void) => GooglePickerBuilder;
  setTitle: (title: string) => GooglePickerBuilder;
  build: () => { setVisible: (v: boolean) => void };
}
