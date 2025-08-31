import { gapi } from 'gapi-script';

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCOPES = 'https://www.googleapis.com/auth/calendar.events';

let tokenClient: google.accounts.oauth2.TokenClient;
let gapiInited = false;
let gisInited = false;
let isGoogleSignedIn = false;

/**
 * 현재 Google 로그인 상태를 반환합니다.
 */
export const getIsGoogleSignedIn = () => isGoogleSignedIn;

/**
 * GIS(Google Identity Services) 클라이언트를 초기화합니다.
 */
const initializeGis = () => {
  return new Promise<void>((resolve, reject) => {
    try {
      if (typeof google === 'undefined') {
        reject(new Error("Google Identity Services script not loaded."));
        return;
      }
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: () => {}, // 콜백은 요청 시 동적으로 처리
      });
      gisInited = true;
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * GAPI(Google API) 클라이언트를 초기화합니다.
 */
const initializeGapi = () => {
  return new Promise<void>((resolve, reject) => {
    gapi.load('client', async () => {
      try {
        await gapi.client.init({
          apiKey: API_KEY,
          discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
        });
        gapiInited = true;
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });
};

/**
 * Google Calendar 서비스 초기화를 담당합니다.
 */
export const initClient = async (onAuthChange: (isSignedIn: boolean) => void) => {
  await initializeGapi();
  await initializeGis();
  
  // GIS 스크립트가 로드되면 gapi.client의 토큰을 설정합니다.
  tokenClient.callback = (resp) => {
    if (resp.error !== undefined) {
      // Handle errors during silent token retrieval or user interaction
      console.error("Google token retrieval error:", resp.error);
      onAuthChange(false); // Ensure signed out state
      return;
    }
    gapi.client.setToken({ access_token: resp.access_token });
    isGoogleSignedIn = true;
    onAuthChange(true);
  };
  
  // 앱 로드 시 기존 세션이 있는지 확인하고 토큰을 자동으로 가져옵니다.
  tokenClient.requestAccessToken({ prompt: '' });
};

/**
 * Google 인증을 요청합니다.
 */
export const handleAuthClick = () => {
  if (!tokenClient) {
    console.error('Google API client is not ready yet.');
    return;
  }
  if (gapi.client.getToken() === null) {
    tokenClient.requestAccessToken({ prompt: 'consent' });
  } else {
    tokenClient.requestAccessToken({ prompt: '' });
  }
};

/**
 * Google 인증 세션을 종료합니다.
 */
export const handleSignoutClick = () => {
  if (typeof google === 'undefined') {
    console.error('Google Identity Services script not loaded yet.');
    return;
  }
  const token = gapi.client.getToken();
  if (token !== null) {
    google.accounts.oauth2.revoke(token.access_token, () => {
      gapi.client.setToken(null);
      isGoogleSignedIn = false;
    });
  }
};

const createEventResource = (summary: string, dueDate?: Date) => ({
  'summary': summary,
  'start': {
    'date': dueDate ? dueDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  },
  'end': {
    'date': dueDate ? dueDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  },
});

/**
 * Google Calendar에 이벤트를 생성합니다.
 */
export const createEvent = async (summary: string, dueDate?: Date) => {
  const event = createEventResource(summary, dueDate);
  const request = gapi.client.calendar.events.insert({
    'calendarId': 'primary',
    'resource': event,
  });

  return new Promise((resolve, reject) => {
    request.execute(event => event.error ? reject(event.error) : resolve(event));
  });
};

/**
 * Google Calendar의 이벤트를 수정합니다.
 */
export const updateEvent = async (eventId: string, summary: string, dueDate?: Date) => {
  const event = createEventResource(summary, dueDate);
  const request = gapi.client.calendar.events.update({
    'calendarId': 'primary',
    'eventId': eventId,
    'resource': event,
  });

  return new Promise((resolve, reject) => {
    request.execute(event => event.error ? reject(event.error) : resolve(event));
  });
};

/**
 * Google Calendar의 이벤트를 삭제합니다.
 */
export const deleteEvent = async (eventId: string) => {
  const request = gapi.client.calendar.events.delete({
    'calendarId': 'primary',
    'eventId': eventId,
  });

  return new Promise((resolve, reject) => {
    request.execute(result => result.error ? reject(result.error) : resolve(result));
  });
};