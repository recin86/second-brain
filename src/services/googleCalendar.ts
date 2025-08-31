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
 * GAPI와 GIS 스크립트를 로드하고 초기화합니다.
 */
export const initClient = async (onAuthChange: (isSignedIn: boolean) => void) => {
  await initializeGapi();
  await initializeGis();
  
  // GIS 스크립트가 로드되면 gapi.client의 토큰을 설정합니다.
  tokenClient.callback = (resp) => {
    if (resp.error !== undefined) {
      throw(resp);
    }
    gapi.client.setToken({ access_token: resp.access_token });
    isGoogleSignedIn = true;
    onAuthChange(true);
  };
};


/**
 * Google 인증을 요청하고 토큰을 가져옵니다.
 */
export const handleAuthClick = () => {
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
  const token = gapi.client.getToken();
  if (token !== null) {
    google.accounts.oauth2.revoke(token.access_token, () => {
      gapi.client.setToken(null);
      isGoogleSignedIn = false;
    });
  }
};

/**
 * Google Calendar에 이벤트를 생성합니다.
 * @param summary 이벤트 제목
 * @returns 생성된 이벤트 정보
 */
export const createEvent = async (summary: string) => {
  const event = {
    'summary': summary,
    'start': {
      'dateTime': new Date().toISOString(),
      'timeZone': 'Asia/Seoul'
    },
    'end': {
      'dateTime': new Date(Date.now() + 3600 * 1000).toISOString(), // 1시간 후
      'timeZone': 'Asia/Seoul'
    },
  };

  const request = gapi.client.calendar.events.insert({
    'calendarId': 'primary',
    'resource': event,
  });

  return new Promise((resolve, reject) => {
    request.execute(event => {
      if (event.error) {
        reject(event.error);
      } else {
        resolve(event);
      }
    });
  });
};
