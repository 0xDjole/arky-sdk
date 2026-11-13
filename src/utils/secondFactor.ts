export interface SecondFactorOtpauthParams {
  issuer: string;
  label: string;
  secret: string;
}

export function secondFactorOtpauthUrl(params: SecondFactorOtpauthParams): string {
  const issuer = encodeURIComponent(params.issuer);
  const label = encodeURIComponent(params.label);
  const secret = encodeURIComponent(params.secret);
  return `otpauth://totp/${issuer}:${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
}
