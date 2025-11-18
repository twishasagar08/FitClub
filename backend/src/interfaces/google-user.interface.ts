export interface GoogleUser {
  profile: {
    id: string;
    displayName: string;
    emails: { value: string; verified: boolean }[];
    photos?: { value: string }[];
  };
  accessToken: string;
  refreshToken: string;
}
