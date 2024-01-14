import { LoginRequest, LoginResponse } from './types/authTypes';
import { request } from '@/utils';

export default {
  login: (data: LoginRequest) => request.post<LoginRequest, LoginResponse>('auth/login', data)
}
