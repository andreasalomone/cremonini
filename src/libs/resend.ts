import { Resend } from 'resend';

import { Env } from './Env';

export const resend = new Resend(Env.RESEND_API_KEY);
