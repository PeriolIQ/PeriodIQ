/**
 * authService.js
 * Wrapper tất cả thao tác xác thực với Amazon Cognito
 */
import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
} from 'amazon-cognito-identity-js';

const poolData = {
  UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
  ClientId:   import.meta.env.VITE_COGNITO_CLIENT_ID,
};

const userPool = new CognitoUserPool(poolData);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getCognitoUser(email) {
  return new CognitoUser({ Username: email, Pool: userPool });
}

// ─── Auth Operations ─────────────────────────────────────────────────────────

/**
 * Đăng ký tài khoản mới. Cognito sẽ gửi OTP code về email.
 */
export function signUp(email, password, fullName) {
  return new Promise((resolve, reject) => {
    const attributes = [
      new CognitoUserAttribute({ Name: 'email', Value: email }),
      new CognitoUserAttribute({ Name: 'name',  Value: fullName }),
    ];

    userPool.signUp(email, password, attributes, null, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

/**
 * Xác nhận OTP code gửi về email sau khi đăng ký.
 */
export function confirmSignUp(email, code) {
  return new Promise((resolve, reject) => {
    getCognitoUser(email).confirmRegistration(code, true, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

/**
 * Gửi lại OTP code (nếu user không nhận được).
 */
export function resendConfirmationCode(email) {
  return new Promise((resolve, reject) => {
    getCognitoUser(email).resendConfirmationCode((err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

/**
 * Đăng nhập. Trả về CognitoUserSession chứa idToken, accessToken, refreshToken.
 */
export function signIn(email, password) {
  return new Promise((resolve, reject) => {
    const authDetails = new AuthenticationDetails({
      Username: email,
      Password: password,
    });

    const cognitoUser = getCognitoUser(email);
    cognitoUser.authenticateUser(authDetails, {
      onSuccess: (session) => resolve({ user: cognitoUser, session }),
      onFailure: (err) => reject(err),
      newPasswordRequired: () =>
        reject({ code: 'NewPasswordRequired', message: 'Cần đổi mật khẩu lần đầu.' }),
    });
  });
}

/**
 * Đăng xuất — xóa session khỏi localStorage.
 */
export function signOut() {
  const user = userPool.getCurrentUser();
  if (user) user.signOut();
}

/**
 * Lấy user đang đăng nhập và session hợp lệ.
 * Trả về null nếu chưa đăng nhập hoặc token hết hạn.
 */
export function getCurrentSession() {
  return new Promise((resolve) => {
    const user = userPool.getCurrentUser();
    if (!user) return resolve(null);

    user.getSession((err, session) => {
      if (err || !session?.isValid()) return resolve(null);
      resolve({ user, session });
    });
  });
}

/**
 * Lấy JWT Id Token để gắn vào API calls.
 */
export function getIdToken() {
  return new Promise((resolve) => {
    const user = userPool.getCurrentUser();
    if (!user) return resolve(null);
    user.getSession((err, session) => {
      if (err || !session?.isValid()) return resolve(null);
      resolve(session.getIdToken().getJwtToken());
    });
  });
}

/**
 * Lấy danh sách Cognito Group (vd: "Admins") từ claim "cognito:groups"
 * trong Id Token. Dùng để phân quyền trang /admin/*.
 */
export function getUserGroups() {
  return new Promise((resolve) => {
    const user = userPool.getCurrentUser();
    if (!user) return resolve([]);
    user.getSession((err, session) => {
      if (err || !session?.isValid()) return resolve([]);
      const payload = session.getIdToken().decodePayload();
      resolve(payload['cognito:groups'] || []);
    });
  });
}

/**
 * Lấy thông tin user attributes (email, name, sub...) từ Cognito.
 */
export function getUserAttributes() {
  return new Promise((resolve, reject) => {
    const user = userPool.getCurrentUser();
    if (!user) return reject(new Error('Chưa đăng nhập'));

    user.getSession((err) => {
      if (err) return reject(err);
      user.getUserAttributes((attrErr, attrs) => {
        if (attrErr) return reject(attrErr);
        const result = {};
        attrs.forEach((attr) => { result[attr.getName()] = attr.getValue(); });
        resolve(result);
      });
    });
  });
}

/**
 * Bước 1 Quên mật khẩu: Gửi code reset về email.
 */
export function forgotPassword(email) {
  return new Promise((resolve, reject) => {
    getCognitoUser(email).forgotPassword({
      onSuccess: (data) => resolve(data),
      onFailure: (err) => reject(err),
    });
  });
}

/**
 * Bước 2 Quên mật khẩu: Xác nhận code và đặt mật khẩu mới.
 */
export function confirmForgotPassword(email, code, newPassword) {
  return new Promise((resolve, reject) => {
    getCognitoUser(email).confirmPassword(code, newPassword, {
      onSuccess: () => resolve(),
      onFailure: (err) => reject(err),
    });
  });
}

// ─── Error Messages ───────────────────────────────────────────────────────────

export function getCognitoErrorMessage(err) {
  const messages = {
    NotAuthorizedException:       'Email hoặc mật khẩu không đúng.',
    UserNotFoundException:        'Tài khoản không tồn tại.',
    UserNotConfirmedException:    'Tài khoản chưa được xác nhận. Kiểm tra email để lấy OTP.',
    UsernameExistsException:      'Email này đã được đăng ký.',
    CodeMismatchException:        'Mã OTP không hợp lệ.',
    ExpiredCodeException:         'Mã OTP đã hết hạn. Vui lòng gửi lại.',
    LimitExceededException:       'Quá nhiều yêu cầu. Vui lòng thử lại sau.',
    InvalidPasswordException:     'Mật khẩu phải có ít nhất 8 ký tự, gồm chữ hoa, số.',
    InvalidParameterException:    'Thông tin không hợp lệ. Kiểm tra lại email/mật khẩu.',
    NetworkError:                 'Lỗi kết nối mạng. Vui lòng thử lại.',
  };
  return messages[err?.code] || err?.message || 'Đã xảy ra lỗi. Vui lòng thử lại.';
}
