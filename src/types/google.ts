// Google Calendar API 관련 타입 정의
export interface GoogleCalendarEvent {
  id?: string;
  summary: string;
  start: {
    date: string;
  };
  end: {
    date: string;
  };
  error?: string;
}

export interface GoogleTokenResponse {
  access_token: string;
  error?: string;
}

export interface GoogleCalendarRequest {
  execute: (callback: (response: GoogleCalendarEvent) => void) => void;
}

export interface GoogleAuthResponse {
  error?: string;
  access_token?: string;
}